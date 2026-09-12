// Pantalla de clasificación diaria: exige sesión iniciada y muestra el top de hoy
// por modo de juego (y dificultad, cuando aplica).

let lbMode = "identify";
let lbDiff = "general";
let pendingScoreSave = false;  // true mientras se espera a que inicies sesión para guardar la ronda que acabas de jugar

function openLeaderboard(){
  if(!isLoggedIn()){
    openAuthModal();
    return;
  }
  showScreen("screen-leaderboard");
  document.getElementById("leaderboard-diff-tabs").classList.toggle("hidden", lbMode === "sound");
  loadLeaderboard();
}

// se usa desde el botón "Guardar y ver clasificación" de la pantalla de resultados:
// si no has iniciado sesión, te la pide y en cuanto entras guarda la puntuación que
// acabas de conseguir (aunque la ronda ya hubiera terminado sin sesión); si ya estabas
// logueado, la puntuación ya se guardó sola al terminar la ronda. En ambos casos abre
// la clasificación directamente en el modo y dificultad que se acaba de jugar.
async function openLeaderboardForRound(){
  if(state.mode){
    lbMode = state.mode;
    if(state.mode !== "sound" && state.difficulty) lbDiff = state.difficulty;
  }
  document.querySelectorAll(".lb-tab").forEach(b => b.classList.toggle("active", b.dataset.lbMode === lbMode));
  document.querySelectorAll(".lb-diff").forEach(b => b.classList.toggle("active", b.dataset.lbDiff === lbDiff));

  if(!isLoggedIn()){
    pendingScoreSave = true;
    openAuthModal();
    return;
  }
  await saveScoreIfLoggedIn();
  openLeaderboard();
}

// puntuación máxima posible para un modo+dificultad: en "Identifica el coche" la
// dificultad cambia el máximo (100/200/300, ver DIFFICULTY_MAX_SCORE), así que un
// mismo desempeño vale más puntos en difícil que en fácil. En "Logos" el máximo es
// fijo pase lo que pase (misma puntuación por acierto en las tres dificultades), y en
// "Por sonido" no hay dificultad. Se usa para pasar la puntuación de cada dificultad
// a puntos "equivalentes en difícil" en la clasificación general (ver abajo).
function maxScoreForModeDifficulty(mode, difficulty){
  if(mode === "identify") return DIFFICULTY_MAX_SCORE[difficulty];
  if(mode === "logo") return SIMPLE_ROUND_LENGTH * POINTS_SIMPLE;
  return SOUND_MAX_SCORE;
}

// escala de referencia de la clasificación general: el máximo de la dificultad más
// alta (300 en Identificar). Una puntuación de fácil o medio se reescala a "cuántos
// puntos habría valido con esa misma precisión jugando en difícil", así que se siguen
// mostrando puntos normales (no un porcentaje) y la comparación entre dificultades es
// justa. En Logos el máximo ya es el mismo en las tres dificultades, así que esta
// reescala no cambia nada — los puntos en bruto ya eran justos ahí.
function generalScaleMax(mode){
  if(mode === "identify") return DIFFICULTY_MAX_SCORE.hard;
  return SIMPLE_ROUND_LENGTH * POINTS_SIMPLE;
}

async function loadLeaderboard(){
  const list = document.getElementById("leaderboard-list");

  if(!sb){
    list.innerHTML = `<p class="lb-status">Supabase no está configurado todavía (js/supabase-config.js).</p>`;
    return;
  }

  list.innerHTML = `<p class="lb-status">${t("lbLoading")}</p>`;

  const today = new Date().toISOString().slice(0, 10);
  // la pestaña "General" solo existe para los modos con dificultad (Identifica el
  // coche, Logos) — Por sonido no tiene dificultad, así que sus pestañas de
  // dificultad están ocultas y siempre se trata como una única categoría.
  const isGeneral = lbMode !== "sound" && lbDiff === "general";

  let query = sb.from("scores")
    .select("user_id, score, difficulty, profiles(display_name)")
    .eq("mode", lbMode)
    .eq("played_on", today);

  if(isGeneral){
    query = query.limit(1000); // vamos a agrupar/ordenar nosotros, no la base de datos
  } else {
    query = query
      .eq("difficulty", lbMode === "sound" ? "none" : lbDiff)
      .order("score", { ascending: false })
      .limit(10);
  }

  const { data, error } = await query;

  if(error){
    console.error(error);
    list.innerHTML = `<p class="lb-status">${t("lbError")}</p>`;
    return;
  }
  if(!data || data.length === 0){
    list.innerHTML = `<p class="lb-status">${t("lbEmpty")}</p>`;
    return;
  }

  let rows;
  if(isGeneral){
    // como el máximo posible depende de la dificultad, comparar puntos en bruto
    // entre dificultades sería injusto (difícil da hasta 3x más puntos por el mismo
    // acierto en Identifica el coche) — cada fila se reescala a "puntos equivalentes
    // en difícil" (ver generalScaleMax) y, si un jugador jugó varias dificultades
    // hoy, nos quedamos con su mejor resultado ya reescalado.
    const bestByUser = new Map();
    const scaleMax = generalScaleMax(lbMode);
    data.forEach(row => {
      const scaledScore = (row.score / maxScoreForModeDifficulty(lbMode, row.difficulty)) * scaleMax;
      const prev = bestByUser.get(row.user_id);
      if(!prev || scaledScore > prev.scaledScore) bestByUser.set(row.user_id, { ...row, scaledScore });
    });
    rows = [...bestByUser.values()].sort((a, b) => b.scaledScore - a.scaledScore).slice(0, 10);
  } else {
    rows = data;
  }

  list.innerHTML = rows.map((row, i) => {
    const rank = i + 1;
    const isMe = row.user_id === currentUser?.id;
    const podiumClass = rank <= 3 ? `podium-${rank}` : "";
    const scoreLabel = `${Math.round(isGeneral ? row.scaledScore : row.score)} pts`;
    const diffKey = "diff" + row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1);
    const diffTag = isGeneral ? `<span class="lb-diff-tag">${t(diffKey)}</span>` : "";
    return `
    <div class="lb-row ${podiumClass} ${isMe ? "me" : ""}">
      <span class="lb-rank">${rank}</span>
      <span class="lb-name">${row.profiles?.display_name || "?"}${isMe ? `<span class="lb-me-tag">${t("lbYouTag")}</span>` : ""}${diffTag}</span>
      <span class="lb-score">${scoreLabel}</span>
    </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-open-leaderboard").addEventListener("click", openLeaderboard);
  document.getElementById("btn-view-leaderboard").addEventListener("click", openLeaderboardForRound);
  document.getElementById("btn-leaderboard-back").addEventListener("click", () => showScreen("screen-menu"));
  document.getElementById("btn-leaderboard-logout").addEventListener("click", signOut);

  document.querySelectorAll(".lb-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lb-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      lbMode = btn.dataset.lbMode;
      document.getElementById("leaderboard-diff-tabs").classList.toggle("hidden", lbMode === "sound");
      loadLeaderboard();
    });
  });

  document.querySelectorAll(".lb-diff").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lb-diff").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      lbDiff = btn.dataset.lbDiff;
      loadLeaderboard();
    });
  });
});
