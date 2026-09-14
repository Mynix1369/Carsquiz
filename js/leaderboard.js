// Pantalla de clasificación diaria: exige sesión iniciada y muestra el top de hoy
// por modo de juego (y dificultad, cuando aplica).

let lbMode = "identify";
let lbDiff = "general";
let lbPeriod = "day";  // 'day' | 'week' | 'month'
let pendingScoreSave = false;  // true mientras se espera a que inicies sesión para guardar la ronda que acabas de jugar

// la dificultad solo tiene sentido si estamos viendo "hoy": en semana/mes se suma el
// mejor resultado de cada día jugado, cruzando dificultades, para no complicar la
// clasificación con "¿sumo solo los días que jugué en difícil?" — igual que Por sonido,
// que tampoco tiene dificultad, en semana/mes las pestañas de dificultad se ocultan.
function updateDiffTabsVisibility(){
  document.getElementById("leaderboard-diff-tabs").classList.toggle("hidden", lbMode === "sound" || lbPeriod !== "day");
}

function openLeaderboard(){
  if(!isLoggedIn()){
    openAuthModal();
    return;
  }
  showScreen("screen-leaderboard");
  updateDiffTabsVisibility();
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
  lbPeriod = "day"; // la ronda que acabas de jugar es de hoy, así que se abre en "Hoy"
  document.querySelectorAll(".lb-tab").forEach(b => b.classList.toggle("active", b.dataset.lbMode === lbMode));
  document.querySelectorAll(".lb-diff").forEach(b => b.classList.toggle("active", b.dataset.lbDiff === lbDiff));
  document.querySelectorAll(".lb-period").forEach(b => b.classList.toggle("active", b.dataset.lbPeriod === lbPeriod));

  if(!isLoggedIn()){
    pendingScoreSave = true;
    savePendingScoreForLater();
    openAuthModal();
    return;
  }
  await saveScoreIfLoggedIn();
  openLeaderboard();
}

// se guarda en localStorage (no solo en la variable pendingScoreSave, que vive en
// memoria) porque si te registras de cero, el enlace de confirmación del email abre una
// página completamente nueva sin ningún rastro de la ronda que acabas de jugar — antes
// eso hacía que la puntuación se perdiera sin más. Con esto, la página nueva la recupera
// sola en cuanto detecta que ya iniciaste sesión (ver resumePendingScoreSave en auth.js).
function savePendingScoreForLater(){
  try {
    localStorage.setItem("qc_pending_score", JSON.stringify({
      mode: state.mode, difficulty: state.difficulty, score: state.score, date: todayKey(),
    }));
  } catch(e){}
}

// se llama al cargar la app (ver refreshAuthUI en auth.js) por si veníamos de confirmar
// el email tras intentar guardar una puntuación: si hay algo pendiente, ya hay sesión y
// es de hoy, se guarda y se abre la clasificación directamente con el resultado puesto.
// De un solo uso: se borra de localStorage se consiga guardar o no, para no arrastrar
// una puntuación vieja a un futuro inicio de sesión que no tenga nada que ver.
async function resumePendingScoreSave(){
  let pending;
  try {
    const raw = localStorage.getItem("qc_pending_score");
    if(!raw) return;
    localStorage.removeItem("qc_pending_score");
    pending = JSON.parse(raw);
  } catch(e){ return; }

  if(!pending || pending.date !== todayKey() || !isLoggedIn()) return;

  state.mode = pending.mode;
  state.difficulty = pending.difficulty;
  state.score = pending.score;
  state.scoreSaved = false;
  await saveScoreIfLoggedIn();

  lbMode = pending.mode;
  if(pending.mode !== "sound" && pending.difficulty) lbDiff = pending.difficulty;
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
  const isDay = lbPeriod === "day";
  // la pestaña "General" solo existe para los modos con dificultad (Identifica el
  // coche, Logos) — Por sonido no tiene dificultad, así que sus pestañas de
  // dificultad están ocultas y siempre se trata como una única categoría. En
  // semana/mes las pestañas de dificultad están ocultas también (ver
  // updateDiffTabsVisibility), así que ahí se trata siempre como "general".
  const isGeneral = lbMode !== "sound" && (lbDiff === "general" || !isDay);

  let query = sb.from("scores")
    .select("user_id, score, difficulty, played_on, profiles(display_name)")
    .eq("mode", lbMode);

  if(isDay){
    query = query.eq("played_on", today);
    query = isGeneral
      ? query.limit(1000) // vamos a agrupar/ordenar nosotros, no la base de datos
      : query.eq("difficulty", lbMode === "sound" ? "none" : lbDiff).order("score", { ascending: false }).limit(10);
  } else {
    // semana = últimos 7 días (incluido hoy), mes = últimos 30 — periodo móvil, no
    // semana/mes de calendario, así no hay que gestionar ningún "reinicio" especial.
    const days = lbPeriod === "week" ? 7 : 30;
    const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    query = query.gte("played_on", cutoff).limit(3000); // siempre se agrupa en el cliente
  }

  const { data, error } = await query;

  if(error){
    console.error(error);
    list.innerHTML = `<p class="lb-status">${t("lbError")}</p>`;
    return;
  }
  if(!data || data.length === 0){
    list.innerHTML = `<p class="lb-status">${t(isDay ? "lbEmpty" : "lbEmptyPeriod")}</p>`;
    return;
  }

  let rows;
  if(isDay && !isGeneral){
    rows = data;
  } else if(isDay && isGeneral){
    // "General" (solo hoy) = la mejor puntuación en bruto de cada jugador entre
    // fácil/medio/difícil, sin ningún cálculo — si jugó varias dificultades hoy,
    // se queda la más alta.
    const bestByUser = new Map();
    data.forEach(row => {
      const prev = bestByUser.get(row.user_id);
      if(!prev || row.score > prev.score) bestByUser.set(row.user_id, row);
    });
    rows = [...bestByUser.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  } else {
    // Semana/mes = para cada jugador, la suma de su mejor puntuación de cada día que
    // jugó dentro del periodo (cruzando dificultades si hizo falta, quedándose con la
    // mejor de ese día). Suma a propósito, no máximo: así premia tanto jugar bien como
    // volver varios días, que es justo el objetivo de tener una clasificación semanal.
    const bestPerUserDay = new Map();
    data.forEach(row => {
      const key = row.user_id + "|" + row.played_on;
      const prev = bestPerUserDay.get(key);
      if(!prev || row.score > prev.score) bestPerUserDay.set(key, row);
    });
    const totals = new Map();
    bestPerUserDay.forEach(row => {
      const prev = totals.get(row.user_id);
      if(prev){ prev.score += row.score; prev.daysPlayed++; }
      else totals.set(row.user_id, { user_id: row.user_id, score: row.score, profiles: row.profiles, daysPlayed: 1 });
    });
    rows = [...totals.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  }

  list.innerHTML = rows.map((row, i) => {
    const rank = i + 1;
    const isMe = row.user_id === currentUser?.id;
    const podiumClass = rank <= 3 ? `podium-${rank}` : "";
    const scoreLabel = `${row.score} pts`;
    const diffTag = (isDay && isGeneral && row.difficulty)
      ? `<span class="lb-diff-tag">${t("diff" + row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1))}</span>` : "";
    const daysTag = row.daysPlayed
      ? `<span class="lb-diff-tag">${t(row.daysPlayed === 1 ? "lbDayPlayed" : "lbDaysPlayed", { n: row.daysPlayed })}</span>` : "";
    return `
    <div class="lb-row ${podiumClass} ${isMe ? "me" : ""}">
      <span class="lb-rank">${rank}</span>
      <span class="lb-name">${row.profiles?.display_name || "?"}${isMe ? `<span class="lb-me-tag">${t("lbYouTag")}</span>` : ""}${diffTag}${daysTag}</span>
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
      updateDiffTabsVisibility();
      loadLeaderboard();
    });
  });

  document.querySelectorAll(".lb-period").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lb-period").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      lbPeriod = btn.dataset.lbPeriod;
      updateDiffTabsVisibility();
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
