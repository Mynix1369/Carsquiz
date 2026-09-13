// Lógica del juego: estados de pantalla, generación de preguntas, comprobación de respuestas.

const IDENTIFY_ROUND_LENGTH = 6;
const SIMPLE_ROUND_LENGTH = 8;

const state = {
  mode: null,        // 'identify' | 'sound' | 'logo'
  difficulty: null,  // 'easy' | 'medium' | 'hard' (solo modo identify)
  questions: [],
  index: 0,
  score: 0,
  rawScore: 0,  // acumulado sin escalar por dificultad (solo modo identify), 50 pts máx. por pregunta
  attempt: 1,
  attemptStartTime: 0,  // performance.now() de cuando empezó el intento actual, para el bono de velocidad
  history: [],
  resolved: false,
  selectedBrand: null,
  scoreSaved: false,  // evita guardar dos veces la puntuación de la misma ronda
};

// ---------- utilidades ----------
// escapa texto antes de insertarlo con innerHTML: lo que escribes en marca/modelo/país/año
// (h.vals[f] en renderAttemptsTable) es texto libre del usuario, así que sin esto alguien
// podría escribir código HTML/script en un campo y que el navegador lo ejecutara.
function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ---------- construir ronda ----------
async function buildQuestions(mode, difficulty){
  if(mode === "sound") return [{ car: await getTodaysSoundCar() }];

  const n = mode === "identify" ? IDENTIFY_ROUND_LENGTH : SIMPLE_ROUND_LENGTH;
  if(mode === "logo"){
    const pool = LOGO_BRANDS.filter(b => LOGO_DIFFICULTY[b] === difficulty);
    return shuffle(pool).slice(0, n).map(brand => ({ car: { brand } }));
  }

  // mientras vayamos sustituyendo placeholders por fotos reales, priorizamos
  // los coches que ya tienen foto real para que aparezcan siempre primero.
  const withPhoto = shuffle(CARS.filter(c => c.image));
  const withoutPhoto = shuffle(CARS.filter(c => !c.image));
  return [...withPhoto, ...withoutPhoto].slice(0, n).map(car => ({ car }));
}

// el "sonido del día": se guarda en Supabase (tabla "daily_sound") la primera vez que
// alguien lo pide cada día, así que es de verdad aleatorio entre los que no hayan salido
// en los últimos 30 días según el historial real — no un patrón fijo que se repite cada
// 60 días. Si dos personas lo piden a la vez el mismo día, la clave única de la tabla
// hace que solo una inserción gane; la otra recibe un error de duplicado y simplemente
// lee la fila que ya existe, así que todo el mundo acaba viendo el mismo sonido ese día.
async function getTodaysSoundCar(){
  const today = new Date().toISOString().slice(0, 10);

  if(sb){
    try {
      const { data: existing } = await sb.from("daily_sound").select("sound_id").eq("played_on", today).maybeSingle();
      if(existing) return SOUND_CARS.find(c => c.id === existing.sound_id) || SOUND_CARS[0];

      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const { data: recent } = await sb.from("daily_sound").select("sound_id").gte("played_on", cutoff);
      const recentIds = new Set((recent || []).map(r => r.sound_id));
      let pool = SOUND_CARS.filter(c => !recentIds.has(c.id));
      if(pool.length === 0) pool = SOUND_CARS; // red de seguridad, no debería pasar con 60 sonidos y 30 días

      const picked = pool[Math.floor(Math.random() * pool.length)];
      const { error: insertError } = await sb.from("daily_sound").insert({ played_on: today, sound_id: picked.id });

      if(insertError){
        // alguien más lo insertó justo antes (choque de clave única en "played_on"):
        // usamos el sonido que ya quedó guardado, para que todos vean el mismo hoy.
        const { data: raceWinner } = await sb.from("daily_sound").select("sound_id").eq("played_on", today).maybeSingle();
        if(raceWinner) return SOUND_CARS.find(c => c.id === raceWinner.sound_id) || picked;
      }
      return picked;
    } catch(e){
      console.error("No se pudo determinar el sonido del día desde Supabase, usando reparto de reserva:", e);
    }
  }

  // sin conexión a Supabase (todavía sin configurar, o falló la consulta): reparto
  // determinista de toda la vida, para que el modo sonido nunca se quede sin jugar.
  const epochDay = Math.floor(Date.now() / 86400000);
  return SOUND_CARS[epochDay % SOUND_CARS.length];
}

// ---------- "ya has jugado el sonido de hoy" (localStorage, un intento real al día) ----------
function todayKey(){ return new Date().toISOString().slice(0, 10); }

function getSoundPlayState(){
  try {
    const raw = localStorage.getItem("qc_sound_state");
    if(!raw) return null;
    const state = JSON.parse(raw);
    return state.date === todayKey() ? state : null;
  } catch(e){ return null; }
}

function saveSoundPlayState(result){
  try {
    localStorage.setItem("qc_sound_state", JSON.stringify({ date: todayKey(), ...result }));
  } catch(e){}
}

// si hay sesión iniciada, el localStorage de cada aparato no sirve para saber si ya se
// jugó hoy (un mismo usuario en el móvil y en el ordenador tiene dos localStorage
// distintos) — se comprueba en su lugar la tabla "scores", que es la misma para todos
// los aparatos donde ese usuario inicie sesión. Si no hay sesión, no hay forma de saber
// quién es el jugador entre aparatos, así que se usa el localStorage como antes (mejor
// esfuerzo, solo vale por aparato).
async function alreadyPlayedSoundToday(){
  const local = getSoundPlayState();
  if(typeof isLoggedIn === "function" && isLoggedIn() && sb){
    try {
      const { data } = await sb.from("scores")
        .select("score")
        .eq("user_id", currentUser.id)
        .eq("mode", "sound")
        .eq("difficulty", "none")
        .eq("played_on", todayKey())
        .maybeSingle();
      if(data) return { score: data.score };
    } catch(e){
      console.error("No se pudo comprobar si ya se jugó el sonido de hoy:", e);
    }
  }
  return local;
}

// ---------- bono de velocidad ----------
function speedBonusConfig(){
  if(state.mode === "identify") return SPEED_BONUS.identify[state.difficulty];
  if(state.mode === "logo") return SPEED_BONUS.logo[state.difficulty];
  return SPEED_BONUS.sound;
}

function speedMultiplier(elapsedSeconds, cfg){
  if(elapsedSeconds <= cfg.full) return 1;
  if(elapsedSeconds >= cfg.zero) return SPEED_BONUS_FLOOR;
  const p = (elapsedSeconds - cfg.full) / (cfg.zero - cfg.full);
  return 1 - p * (1 - SPEED_BONUS_FLOOR);
}

function elapsedSpeedSeconds(){
  return (performance.now() - state.attemptStartTime) / 1000;
}

// arranca el cronómetro del intento actual y reinicia la barra visual: se queda llena
// mientras dura la ventana de bono máximo ("full") y se vacía con una transición CSS lineal.
function startSpeedTimer(){
  state.attemptStartTime = performance.now();
  const bar = document.getElementById("speed-bar");
  if(!bar) return;
  bar.style.transition = "none";
  bar.style.width = "100%";
  void bar.offsetWidth;
  const cfg = speedBonusConfig();
  bar.style.transition = `width ${cfg.full}s linear`;
  bar.style.width = "0%";
}

// ---------- pantallas ----------
function showScreen(id){
  // si el sonido del día está sonando y cambiamos de pantalla (salir, pasar a
  // resultados...), lo cortamos para que no se quede de fondo sin verse la pregunta.
  if(id !== "screen-game" && typeof stopCarSound === "function") stopCarSound();
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  // el widget flotante de Ko-fi vive fuera de .screen (lo añade su propio script en
  // <body>) y queda fijo en la esquina inferior izquierda — en móvil esa esquina es
  // justo donde cae el botón "Comprobar"/"Siguiente" de la partida, y llegaba a tapar
  // el botón de verdad (comprobado: un toque ahí abría Ko-fi en vez de responder). Se
  // oculta mientras se juega; el botón del menú principal sigue disponible para donar.
  document.body.classList.toggle("in-game", id === "screen-game");
}

async function startRound(mode, difficulty){
  if(mode === "sound"){
    const prev = await alreadyPlayedSoundToday();
    if(prev){ showAlreadyPlayedSound(prev); return; }
  }
  state.mode = mode;
  state.difficulty = difficulty || null;
  state.questions = await buildQuestions(mode, difficulty);
  state.index = 0;
  state.score = 0;
  state.rawScore = 0;
  state.scoreSaved = false;
  showScreen("screen-game");
  renderQuestion();
}

// el sonido del día solo se puede jugar una vez de verdad (como un reto diario): si ya
// hay un resultado guardado de hoy, se muestra directamente en vez de dejar jugar otra vez.
function showAlreadyPlayedSound(prev){
  state.mode = "sound";
  state.difficulty = null;
  state.score = prev.score;
  state.scoreSaved = false; // por si no estabas logueado cuando jugaste, se puede guardar ahora
  document.getElementById("progress-fill").style.width = "100%";
  document.getElementById("results-score").textContent = `${prev.score} pts`;
  document.getElementById("results-detail").textContent = t("soundAlreadyPlayed");
  document.getElementById("btn-replay").classList.add("hidden");
  showScreen("screen-results");
}

function currentQuestion(){ return state.questions[state.index]; }

// ---------- render pregunta ----------
function renderQuestion(){
  state.attempt = 1;
  state.history = [];
  state.resolved = false;
  state.selectedBrand = null;

  const q = currentQuestion();
  document.getElementById("progress-fill").style.width = `${((state.index)/state.questions.length)*100}%`;
  document.getElementById("progress-text").textContent = t("progressText", { current: state.index+1, total: state.questions.length });
  document.getElementById("score-display").textContent = `${state.score} pts`;

  document.getElementById("feedback-banner").className = "feedback-banner hidden";
  document.getElementById("btn-next").classList.add("hidden");
  const checkBtn = document.getElementById("btn-check");
  checkBtn.classList.remove("hidden");
  checkBtn.disabled = false;

  renderStimulus(q);
  if(state.mode === "identify" || state.mode === "sound") renderIdentifyForm(q);
  else renderSimpleForm(q);
  startSpeedTimer();
}

function renderStimulus(q){
  const area = document.getElementById("stimulus-area");
  area.innerHTML = "";

  if(state.mode === "identify"){
    const focus = q.car.focus || PART_FOCUS[q.car.part];
    const src = q.car.image || buildCarImageUri(q.car);
    const frame = document.createElement("div");
    frame.className = "scan-frame";
    frame.innerHTML = `
      <div class="scan-view">
        <img id="quiz-img" src="${src}" style="transform-origin:${focus.x}% ${focus.y}%;" />
        <div class="corner tl"></div><div class="corner tr"></div>
        <div class="corner bl"></div><div class="corner br"></div>
      </div>
      <div class="scan-meta">
        <span>${t("scanCropLabel")} <span id="scan-zoom" class="scan-part"></span> &middot; <span id="scan-part-label"></span></span>
        <div id="scan-dots" class="attempt-dots"></div>
      </div>`;
    area.appendChild(frame);
    const p = document.createElement("p");
    p.className = "hint-text";
    p.textContent = t("identifyHint");
    area.appendChild(p);
    if(q.car.credit){
      const credit = document.createElement("p");
      credit.className = "photo-credit";
      credit.textContent = translateCredit(q.car.credit);
      area.appendChild(credit);
    }
    updateScanMeta(q);
    return;
  }

  if(state.mode === "sound"){
    const box = document.createElement("div");
    box.className = "sound-box";
    box.innerHTML = `
      <div class="sound-controls">
        <button id="play-pause-btn" class="play-btn" title="${t("playLabel")}" aria-label="${t("playLabel")}">
          <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <svg class="icon-pause hidden" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
        </button>
        <button id="replay-btn" class="replay-btn" title="${t("replayLabel")}" aria-label="${t("replayLabel")}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
      <p class="hint-text">${t("soundHint")}</p>`;
    area.appendChild(box);

    loadCarSound(q.car);
    onAudioStateChange = updatePlayPauseIcon;
    updatePlayPauseIcon("paused");
    document.getElementById("play-pause-btn").addEventListener("click", togglePlayPauseCarSound);
    document.getElementById("replay-btn").addEventListener("click", replayCarSound);

    if(q.car.credit){
      const credit = document.createElement("p");
      credit.className = "photo-credit";
      credit.textContent = translateCredit(q.car.credit);
      area.appendChild(credit);
    }
    return;
  }

  // logo
  const box = document.createElement("div");
  box.className = "logo-box";
  box.innerHTML = `<img src="${buildLogoUri(q.car.brand)}" />`;
  area.appendChild(box);
  const p = document.createElement("p");
  p.className = "hint-text";
  p.textContent = t("logoHint");
  area.appendChild(p);
}

// alterna el icono del botón grande entre play/pausa según lo que esté haciendo el audio
// ("paused"/"ended" -> mostrar play; "playing" -> mostrar pausa)
function updatePlayPauseIcon(state){
  const btn = document.getElementById("play-pause-btn");
  if(!btn) return;
  const playing = state === "playing";
  btn.querySelector(".icon-play").classList.toggle("hidden", playing);
  btn.querySelector(".icon-pause").classList.toggle("hidden", !playing);
  const label = t(playing ? "pauseLabel" : "playLabel");
  btn.title = label;
  btn.setAttribute("aria-label", label);
}

function updateScanMeta(q){
  const zoom = ZOOM_SCHEDULE[state.difficulty][state.attempt-1];
  const zoomEl = document.getElementById("scan-zoom");
  if(zoomEl) zoomEl.textContent = `${zoom.toFixed(1)}×`;
  const partEl = document.getElementById("scan-part-label");
  if(partEl) partEl.textContent = translatePart(q.car.part);
  const dotsEl = document.getElementById("scan-dots");
  if(dotsEl){
    dotsEl.innerHTML = Array.from({length: MAX_ATTEMPTS}).map((_, i) =>
      `<span class="${i < state.attempt-1 ? "used" : ""}"></span>`).join("");
  }
  const img = document.getElementById("quiz-img");
  if(img) img.style.transform = `scale(${zoom})`;
}

// tolerancia de año: por dificultad en "identify", fija en "sound" (no tiene niveles)
function currentYearTolerance(){
  return state.mode === "sound" ? SOUND_YEAR_TOLERANCE : YEAR_TOLERANCE[state.difficulty];
}

// ---------- formulario modo "identify" (marca / modelo / país / año) ----------
function renderIdentifyForm(q){
  const area = document.getElementById("answer-area");
  area.innerHTML = `
    <div class="attempts-info">
      <span>${t("attemptLabel", { n: `<strong id="attempt-num">1</strong>`, max: MAX_ATTEMPTS })}</span>
      <span class="legend"><span class="dot ok"></span>${t("legendCorrect")} <span class="dot no"></span>${t("legendIncorrect")}</span>
    </div>
    <div id="attempts-table" class="attempts-table"></div>
    <div class="field-group">
      <div class="field ac-field" data-field="brand">
        <label>${t("fieldBrand")}</label>
        <div class="autocomplete"><input type="text" id="f-brand" autocomplete="off" placeholder="${t("placeholderBrand")}" /><div class="ac-list hidden"></div></div>
      </div>
      <div class="field ac-field" data-field="model">
        <label>${t("fieldModel")}</label>
        <div class="autocomplete"><input type="text" id="f-model" autocomplete="off" placeholder="${t("placeholderModel")}" /><div class="ac-list hidden"></div></div>
      </div>
      <div class="field ac-field" data-field="country">
        <label>${t("fieldCountry")}</label>
        <div class="autocomplete"><input type="text" id="f-country" autocomplete="off" placeholder="${t("placeholderCountry")}" /><div class="ac-list hidden"></div></div>
      </div>
      <div class="field" data-field="year">
        <label>${t("fieldYear")} <span class="field-hint">(${t("yearsTolerance", { n: currentYearTolerance() })})</span></label>
        <input type="text" id="f-year" inputmode="numeric" autocomplete="off" placeholder="${t("placeholderYear")}" />
      </div>
    </div>`;

  attachAutocomplete(
    area.querySelector('[data-field="brand"] .autocomplete'),
    () => (state.mode === "sound" ? LOGO_BRANDS : BRANDS),
    (val) => { state.selectedBrand = val; }
  );
  attachAutocomplete(
    area.querySelector('[data-field="model"] .autocomplete'),
    () => modelOptions((state.selectedBrand && BRAND_MODELS[state.selectedBrand]) ? BRAND_MODELS[state.selectedBrand] : ALL_MODELS),
    null
  );
  attachAutocomplete(
    area.querySelector('[data-field="country"] .autocomplete'),
    () => countryOptions(),
    null
  );

  renderAttemptsTable();
}

function renderAttemptsTable(){
  const el = document.getElementById("attempts-table");
  if(!el) return;
  const fields = ["brand","model","country","year"];
  el.innerHTML = `
    <div class="attempt-row attempt-header">
      <div class="attempt-cell">${t("fieldBrand")}</div>
      <div class="attempt-cell">${t("fieldModel")}</div>
      <div class="attempt-cell">${t("fieldCountry")}</div>
      <div class="attempt-cell">${t("fieldYear")}</div>
    </div>
    ${Array.from({length: MAX_ATTEMPTS}).map((_, i) => {
      const h = state.history[i];
      return `<div class="attempt-row">
        ${fields.map(f => h ? `
          <div class="attempt-cell">
            <span class="attempt-val ${h.correct[f] ? "ok" : "no"}"><span class="dot"></span>${escapeHtml(h.vals[f]) || "—"}</span>
          </div>` : `
          <div class="attempt-cell">
            <span class="dot pending"></span>
          </div>`).join("")}
      </div>`;
    }).join("")}`;
}

function checkIdentifyAttempt(q){
  const vals = {
    brand: document.getElementById("f-brand").value,
    model: document.getElementById("f-model").value,
    country: document.getElementById("f-country").value,
    year: document.getElementById("f-year").value,
  };
  const yearGuess = parseInt(vals.year.trim(), 10);
  const correct = {
    brand: vals.brand.trim() !== "" && normalize(vals.brand) === normalize(q.car.brand),
    model: vals.model.trim() !== "" && normalize(vals.model) === normalize(translateModel(q.car.model)),
    country: vals.country.trim() !== "" && normalize(vals.country) === normalize(translateCountry(q.car.country)),
    year: !isNaN(yearGuess) && Math.abs(yearGuess - q.car.year) <= currentYearTolerance(),
  };

  state.history.push({ vals, correct });
  renderAttemptsTable();

  const allCorrect = correct.brand && correct.model && correct.country && correct.year;
  const banner = document.getElementById("feedback-banner");
  banner.classList.remove("hidden","ok","no");

  // la puntuación se acumula sin escalar (máx. 50 pts/pregunta) y solo al final se convierte
  // a la escala de la dificultad; así una ronda perfecta siempre cae justo en el tope
  // (100/200/300 en identificar, 100 en el sonido del día) sin que el redondeo por
  // pregunta lo deje corto o se pase. El sonido del día es una sola "pregunta" (raw máx 50).
  const roundMaxRaw = state.mode === "sound" ? 50 : IDENTIFY_ROUND_LENGTH * 50;
  const targetMaxScore = state.mode === "sound" ? SOUND_MAX_SCORE : DIFFICULTY_MAX_SCORE[state.difficulty];
  const scoreScale = targetMaxScore / roundMaxRaw;
  const speed = speedMultiplier(elapsedSpeedSeconds(), speedBonusConfig());

  if(allCorrect){
    const rawPoints = Math.max(50 - (state.attempt-1)*10, 10) * speed;
    state.rawScore += rawPoints;
    const points = Math.round(state.rawScore * scoreScale) - state.score;
    state.score += points;
    banner.classList.add("ok");
    banner.textContent = t("msgPerfect", { attempt: state.attempt, points });
    finishIdentifyQuestion(true);
    return;
  }

  triggerFailFeedback();
  scrollToStimulus();

  if(state.attempt >= MAX_ATTEMPTS){
    const fieldsOk = Object.values(correct).filter(Boolean).length;
    const rawPoints = fieldsOk * 5 * speed;
    state.rawScore += rawPoints;
    const points = Math.round(state.rawScore * scoreScale) - state.score;
    state.score += points;
    banner.classList.add("no");
    banner.textContent = t("msgOutOfAttempts", { brand: q.car.brand, model: translateModel(q.car.model), country: translateCountry(q.car.country), year: q.car.year, points });
    finishIdentifyQuestion(false);
    return;
  }

  state.attempt++;
  banner.classList.add("no");
  banner.textContent = t(state.mode === "sound" ? "msgTryAgainSound" : "msgTryAgain");
  document.getElementById("score-display").textContent = `${state.score} pts`;
  const attemptNumEl = document.getElementById("attempt-num");
  if(attemptNumEl) attemptNumEl.textContent = state.attempt;
  if(state.mode === "identify") updateScanMeta(q);
  startSpeedTimer();
}

// sacude la pantalla y destella un aviso rojo cuando fallas una respuesta, en cualquier modo.
// se sacude .screen.active (no #app): si el transform se aplicara a #app, ese elemento
// pasaría a ser el contenedor de posicionamiento de .app-bg/.fail-flash (fixed) y se
// quedarían encajonados en la columna de contenido en vez de cubrir toda la ventana.
function triggerFailFeedback(){
  const screen = document.querySelector(".screen.active");
  if(screen){
    screen.classList.remove("shake");
    void screen.offsetWidth;
    screen.classList.add("shake");
  }

  const flash = document.getElementById("fail-flash");
  flash.classList.remove("active");
  void flash.offsetWidth;
  flash.classList.add("active");
}

// al fallar en modo "identify", sube la pantalla sola hasta la imagen para que se vea
// el recorte actualizado (o el coche entero, si era el último intento) sin tener que
// bajar el teclado o desplazarse a mano. Se anima a mano con requestAnimationFrame en vez
// de scrollIntoView({behavior:"smooth"}) porque ese modo nativo no es fiable en todos los
// navegadores/WebViews (p. ej. algunas versiones de WebView de Android al empaquetar con Capacitor).
function scrollToStimulus(){
  const el = document.getElementById("stimulus-area");
  if(!el) return;
  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 12);
  const start = window.scrollY;
  const dist = target - start;
  if(Math.abs(dist) < 2) return;
  const duration = 450;
  const startTime = performance.now();
  function step(now){
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, start + dist * eased);
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function finishIdentifyQuestion(success){
  state.resolved = true;
  document.getElementById("score-display").textContent = `${state.score} pts`;
  document.getElementById("btn-check").classList.add("hidden");
  document.getElementById("btn-next").classList.remove("hidden");
  document.querySelectorAll("#answer-area input").forEach(i => i.disabled = true);
  // si aciertas, la imagen se queda en el tope de zoom de la dificultad (en difícil nunca
  // llega a verse el coche entero); si fallas los 5 intentos, la cámara retrocede del todo
  // y se revela el coche completo como consuelo.
  const img = document.getElementById("quiz-img");
  if(img) img.style.transform = success
    ? `scale(${ZOOM_SCHEDULE[state.difficulty][MAX_ATTEMPTS-1]})`
    : "scale(1)";
  const dotsEl = document.getElementById("scan-dots");
  if(dotsEl) dotsEl.innerHTML = Array.from({length: MAX_ATTEMPTS}).map(() => `<span class="used"></span>`).join("");
}

// ---------- formulario simple (modo sonido / logo: solo marca) ----------
function renderSimpleForm(q){
  const area = document.getElementById("answer-area");
  area.innerHTML = `
    <div class="field ac-field" data-field="brand">
      <label>${t("fieldBrand")}</label>
      <div class="autocomplete"><input type="text" id="f-brand" autocomplete="off" placeholder="${t("placeholderBrand")}" /><div class="ac-list hidden"></div></div>
    </div>`;
  attachAutocomplete(area.querySelector('[data-field="brand"] .autocomplete'), () => (state.mode === "logo" ? LOGO_BRANDS : BRANDS), null);
}

function checkSimpleAnswer(q){
  const val = document.getElementById("f-brand").value;
  const isCorrect = val.trim() !== "" && normalize(val) === normalize(q.car.brand);

  const banner = document.getElementById("feedback-banner");
  banner.classList.remove("hidden","ok","no");

  if(isCorrect){
    // igual que en "Identifica el coche": el máximo de la ronda depende de la dificultad
    // (100/200/300, DIFFICULTY_MAX_SCORE) y también hay bono de velocidad. Se acumula sin
    // redondear en state.rawScore y se redondea solo al restar del total ya mostrado, para
    // que una ronda perfecta y rápida caiga siempre justo en el máximo de esa dificultad.
    const perQuestion = DIFFICULTY_MAX_SCORE[state.difficulty] / SIMPLE_ROUND_LENGTH;
    const speed = speedMultiplier(elapsedSpeedSeconds(), speedBonusConfig());
    state.rawScore += perQuestion * speed;
    const points = Math.round(state.rawScore) - state.score;
    state.score += points;
    banner.classList.add("ok");
    banner.textContent = t("msgSimpleCorrect", { brand: q.car.brand, points });
  } else {
    triggerFailFeedback();
    banner.classList.add("no");
    banner.textContent = t("msgSimpleWrong", { brand: q.car.brand });
  }

  document.getElementById("score-display").textContent = `${state.score} pts`;
  document.getElementById("f-brand").disabled = true;
  document.getElementById("btn-check").classList.add("hidden");
  document.getElementById("btn-next").classList.remove("hidden");
}

// ---------- comprobar / avanzar ----------
function checkAnswer(){
  const q = currentQuestion();
  if(state.mode === "identify" || state.mode === "sound") checkIdentifyAttempt(q);
  else checkSimpleAnswer(q);
}

function nextQuestion(){
  state.index++;
  if(state.index >= state.questions.length){
    endRound();
    return;
  }
  renderQuestion();
}

function endRound(){
  document.getElementById("progress-fill").style.width = "100%";
  let max;
  if(state.mode === "identify" || state.mode === "logo") max = DIFFICULTY_MAX_SCORE[state.difficulty];
  else max = SOUND_MAX_SCORE;
  document.getElementById("results-score").textContent = `${state.score} pts`;
  document.getElementById("results-detail").textContent = t("resultsMax", { max });
  document.getElementById("btn-replay").classList.toggle("hidden", state.mode === "sound");
  showScreen("screen-results");
  if(state.mode === "sound") saveSoundPlayState({ score: state.score });
  saveScoreIfLoggedIn();
}

// si hay sesión iniciada, sube la puntuación de la ronda a la clasificación diaria,
// pero solo se guarda un récord por modo+dificultad+día: si ya tenías uno hoy, se
// sustituye únicamente si la nueva puntuación es mejor. No hay validación en servidor
// (a propósito, por ahora): es para jugar con amigos, no hay premio real de por medio.
async function saveScoreIfLoggedIn(){
  if(typeof isLoggedIn !== "function" || !isLoggedIn()) return;
  if(state.scoreSaved) return;

  const difficulty = state.mode === "sound" ? "none" : state.difficulty;
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await sb.from("scores")
    .select("id, score")
    .eq("user_id", currentUser.id)
    .eq("mode", state.mode)
    .eq("difficulty", difficulty)
    .eq("played_on", today)
    .maybeSingle();

  if(existing && existing.score >= state.score){
    state.scoreSaved = true; // ya tenías un récord igual o mejor hoy, no hace falta tocar nada
    return;
  }

  const { error } = await sb.from("scores").upsert({
    user_id: currentUser.id,
    mode: state.mode,
    difficulty,
    score: state.score,
    played_on: today,
  }, { onConflict: "user_id,mode,difficulty,played_on" });

  if(error){ console.error("No se pudo guardar la puntuación:", error); return; }
  state.scoreSaved = true;
}

// ---------- wiring UI ----------
document.addEventListener("DOMContentLoaded", () => {

  // acordeón de modos: al pulsar la cabecera, se abre ese modo y se cierran los demás
  // (la tarjeta de clasificación no tiene panel desplegable, así que se excluye)
  document.querySelectorAll(".mode-card:not(.mode-card-leaderboard) .mode-head").forEach(head => {
    head.addEventListener("click", () => {
      const card = head.closest(".mode-card");
      const wasOpen = card.classList.contains("open");
      document.querySelectorAll(".mode-card.open").forEach(c => {
        c.classList.remove("open");
        c.querySelector(".mode-head").setAttribute("aria-expanded", "false");
      });
      if(!wasOpen){
        card.classList.add("open");
        head.setAttribute("aria-expanded", "true");
      }
    });
  });

  // selector de dificultad (solo modo identificar)
  document.querySelectorAll(".dial-card").forEach(dial => {
    dial.addEventListener("click", (e) => {
      e.stopPropagation();
      const group = dial.closest(".dials");
      group.querySelectorAll(".dial-card").forEach(d => d.classList.remove("active"));
      dial.classList.add("active");
    });
  });

  // botón "Arrancar" de cada modo
  document.querySelectorAll(".ignition[data-start]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const mode = btn.dataset.start;
      let difficulty = null;
      if(mode === "identify" || mode === "logo"){
        const panel = btn.closest(".mode-panel");
        const active = panel.querySelector(".dial-card.active") || panel.querySelector(".dial-card");
        difficulty = active.dataset.diff;
      }
      startRound(mode, difficulty);
    });
  });

  document.getElementById("btn-check").addEventListener("click", checkAnswer);
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-quit").addEventListener("click", () => showScreen("screen-menu"));
  document.getElementById("btn-replay").addEventListener("click", () => startRound(state.mode, state.difficulty));
  document.getElementById("btn-menu").addEventListener("click", () => showScreen("screen-menu"));
});
