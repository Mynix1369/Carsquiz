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
    // "General" = la mejor puntuación en bruto de cada jugador entre fácil/medio/difícil,
    // sin ningún cálculo — si jugó varias dificultades hoy, se queda la más alta.
    const bestByUser = new Map();
    data.forEach(row => {
      const prev = bestByUser.get(row.user_id);
      if(!prev || row.score > prev.score) bestByUser.set(row.user_id, row);
    });
    rows = [...bestByUser.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  } else {
    rows = data;
  }

  list.innerHTML = rows.map((row, i) => {
    const rank = i + 1;
    const isMe = row.user_id === currentUser?.id;
    const podiumClass = rank <= 3 ? `podium-${rank}` : "";
    const scoreLabel = `${row.score} pts`;
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
