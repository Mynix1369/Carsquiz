// Sistema de idiomas: se detecta el idioma del navegador la primera vez que se entra
// (español si es de un país/idioma hispanohablante, inglés para cualquier otro) y a
// partir de ahí se guarda en localStorage para que se recuerde entre visitas, aunque
// el usuario cambie el idioma del navegador más adelante. Los datos "de verdad"
// (marcas, modelos, países) se guardan siempre en español en data.js como valor
// canónico; aquí solo se traducen para mostrar en pantalla y para validar la
// respuesta cuando el idioma activo es inglés.

function detectBrowserLang(){
  const primary = navigator.language || navigator.userLanguage || "";
  return primary.toLowerCase().startsWith("es") ? "es" : "en";
}

let currentLang = localStorage.getItem("qc_lang") || detectBrowserLang();

const STRINGS = {
  en: {
    pageTitle: "CarQuiz — Guess the car by photo, sound or logo",
    titleMain: "Car",
    titleAccent: "Quiz",
    subtitle: "Guess the car before you run out of tries",

    modeIdentifyTitle: "Identify the car",
    modeIdentifyDesc: "Brand, model, country and year from a cropped photo",
    modeSoundTitle: "By sound",
    modeSoundDesc: "One real engine sound a day. Guess brand, model, country and year",
    modeLogoTitle: "Logos",
    modeLogoDesc: "Just the badge. Guess the brand on sight",

    diffGeneral: "Overall",
    diffEasy: "Easy",
    diffMedium: "Medium",
    diffHard: "Hard",
    yearsTolerance: "±{n} years",
    btnStart: "Start",

    quitLabel: "Quit",
    progressText: "Question {current}/{total}",

    identifyHint: "Which car is this part from?",
    soundHint: "Tap to hear today's sound and guess the car",
    soundAlreadyPlayed: "You've already played today's sound. Come back tomorrow for a new one!",
    playLabel: "Play",
    pauseLabel: "Pause",
    replayLabel: "Replay",
    logoHint: "Which brand does this logo belong to?",
    scanCropLabel: "Crop",

    fieldBrand: "Brand",
    fieldModel: "Model",
    fieldCountry: "Country",
    fieldYear: "Year",
    placeholderBrand: "Type a brand...",
    placeholderModel: "Type a model...",
    placeholderCountry: "Type a country...",
    placeholderYear: "E.g. 1975",
    attemptLabel: "Attempt {n}/{max}",
    legendCorrect: "Correct",
    legendIncorrect: "Incorrect",

    msgPerfect: "Perfect! You got it on attempt {attempt}. +{points} pts",
    msgOutOfAttempts: "Out of attempts. It was a {brand} {model} ({country}, {year}). +{points} pts",
    msgTryAgain: "Not yet. Here's a bit more of the image — try again.",
    msgTryAgainSound: "Not yet. Listen to the sound again and try again.",
    msgSimpleCorrect: "Correct! It's a {brand}. +{points} pts",
    msgSimpleWrong: "Not quite. It was a {brand}.",

    btnCheck: "Check",
    btnNext: "Next",
    btnReplay: "Play again",
    btnViewLeaderboard: "Save score & view leaderboard",
    btnMenu: "Main menu",

    resultsTag: "Round over",
    resultsMax: "Maximum possible score: {max} pts",

    modeLeaderboardTitle: "Leaderboard",
    modeLeaderboardDesc: "Compete with other players today. You need to sign in",
    accountLogoutLabel: "Sign out",
    accountEditNameLabel: "Change name",
    placeholderUsername: "Choose a username",

    authTitle: "Sign in",
    authSubtitle: "To see and appear in today's leaderboard",
    btnGoogleSignIn: "Continue with Google",
    orDivider: "or",
    placeholderEmail: "Email address",
    placeholderPassword: "Password",
    btnLogIn: "Log in",
    btnSignUp: "Sign up",
    authNoAccount: "Don't have an account?",
    authHaveAccount: "Already have an account?",
    btnSwitchToSignup: "Sign up",
    btnSwitchToLogin: "Log in",
    authCheckEmail: "Check your email to confirm your account.",

    leaderboardTitle: "Today's leaderboard",
    lbLoading: "Loading...",
    lbError: "Couldn't load the leaderboard.",
    lbEmpty: "Nobody's played today yet. Be the first!",
    lbYouTag: "YOU",
    supportLink: "Support the project",
    kofiButtonLabel: "Support us",
  },
  es: {
    pageTitle: "CarQuiz — Adivina el coche por foto, sonido o logo",
    titleMain: "Quiz",
    titleAccent: "Coches",
    subtitle: "Adivina el coche antes de quedarte sin intentos",

    modeIdentifyTitle: "Identifica el coche",
    modeIdentifyDesc: "Marca, modelo, país y año a partir de un recorte de la imagen",
    modeSoundTitle: "Por sonido",
    modeSoundDesc: "Un sonido real de motor al día. Adivina marca, modelo, país y año",
    modeLogoTitle: "Logos",
    modeLogoDesc: "Solo el emblema. Adivina la marca a la primera",

    diffGeneral: "General",
    diffEasy: "Fácil",
    diffMedium: "Medio",
    diffHard: "Difícil",
    yearsTolerance: "±{n} años",
    btnStart: "Comenzar",

    quitLabel: "Salir",
    progressText: "Pregunta {current}/{total}",

    identifyHint: "¿De qué coche es esta parte?",
    soundHint: "Pulsa para escuchar el sonido de hoy y adivina el coche",
    soundAlreadyPlayed: "Ya has jugado el sonido de hoy. ¡Vuelve mañana a por uno nuevo!",
    playLabel: "Reproducir",
    pauseLabel: "Pausar",
    replayLabel: "Repetir",
    logoHint: "¿De qué marca es este logo de muestra?",
    scanCropLabel: "Recorte",

    fieldBrand: "Marca",
    fieldModel: "Modelo",
    fieldCountry: "País",
    fieldYear: "Año",
    placeholderBrand: "Escribe una marca...",
    placeholderModel: "Escribe un modelo...",
    placeholderCountry: "Escribe un país...",
    placeholderYear: "Ej: 1975",
    attemptLabel: "Intento {n}/{max}",
    legendCorrect: "Correcto",
    legendIncorrect: "Incorrecto",

    msgPerfect: "¡Perfecto! Lo has adivinado en el intento {attempt}. +{points} pts",
    msgOutOfAttempts: "Se acabaron los intentos. Era un {brand} {model} ({country}, {year}). +{points} pts",
    msgTryAgain: "Todavía no. Aquí tienes un poco más de imagen — inténtalo de nuevo.",
    msgTryAgainSound: "Todavía no. Vuelve a escuchar el sonido e inténtalo de nuevo.",
    msgSimpleCorrect: "¡Correcto! Es de la marca {brand}. +{points} pts",
    msgSimpleWrong: "No exactamente. Era de la marca {brand}.",

    btnCheck: "Comprobar",
    btnNext: "Siguiente",
    btnReplay: "Jugar otra vez",
    btnViewLeaderboard: "Guardar y ver clasificación",
    btnMenu: "Menú principal",

    resultsTag: "Ronda terminada",
    resultsMax: "Puntuación máxima posible: {max} pts",

    modeLeaderboardTitle: "Clasificación",
    modeLeaderboardDesc: "Compite hoy con otros jugadores. Necesitas iniciar sesión",
    accountLogoutLabel: "Cerrar sesión",
    accountEditNameLabel: "Cambiar nombre",
    placeholderUsername: "Elige un nombre de usuario",

    authTitle: "Inicia sesión",
    authSubtitle: "Para ver y aparecer en la clasificación de hoy",
    btnGoogleSignIn: "Continuar con Google",
    orDivider: "o",
    placeholderEmail: "Correo electrónico",
    placeholderPassword: "Contraseña",
    btnLogIn: "Entrar",
    btnSignUp: "Registrarse",
    authNoAccount: "¿No tienes cuenta?",
    authHaveAccount: "¿Ya tienes cuenta?",
    btnSwitchToSignup: "Regístrate",
    btnSwitchToLogin: "Inicia sesión",
    authCheckEmail: "Revisa tu correo para confirmar la cuenta.",

    leaderboardTitle: "Clasificación de hoy",
    lbLoading: "Cargando...",
    lbError: "No se pudo cargar la clasificación.",
    lbEmpty: "Todavía no ha jugado nadie hoy. ¡Sé el primero!",
    lbYouTag: "TÚ",
    supportLink: "Apoya el proyecto",
    kofiButtonLabel: "Apóyanos",
  },
};

// traducciones de datos "de contenido" (el valor en español es el canónico que se
// guarda en data.js; aquí solo mapeamos a inglés para mostrar/validar)
const COUNTRY_EN = {
  "Japón": "Japan",
  "Estados Unidos": "United States",
  "Alemania": "Germany",
  "Italia": "Italy",
  "Francia": "France",
  "España": "Spain",
  "Reino Unido": "United Kingdom",
  "Suecia": "Sweden",
  "República Checa": "Czech Republic",
  "Corea del Sur": "South Korea",
};

const MODEL_EN = {
  "Escarabajo": "Beetle",
  "Serie 1": "1 Series",
  "Serie 3": "3 Series",
  "Serie 5": "5 Series",
  "Clase A": "A-Class",
  "Clase C": "C-Class",
  "Clase E": "E-Class",
  "Clase S": "S-Class",
  "Clase G": "G-Class",
  "León": "Leon",
};

const PART_EN = {
  faro: "headlight",
  parrilla: "grille",
  espejo: "mirror",
  rueda: "wheel",
};

function t(key, vars){
  let str = (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS.en[key] || key;
  if(vars){
    Object.keys(vars).forEach(k => { str = str.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]); });
  }
  return str;
}

function translateCountry(country){
  return currentLang === "en" ? (COUNTRY_EN[country] || country) : country;
}

function translateModel(model){
  return currentLang === "en" ? (MODEL_EN[model] || model) : model;
}

// los créditos de foto/sonido (data.js) se guardan siempre como "Foto: ..." / "Sonido: ...",
// igual que el resto de datos canónicos (ver cabecera del archivo) — solo se traduce la
// palabra inicial para mostrar, el nombre del autor y la licencia se dejan igual en los dos idiomas.
function translateCredit(credit){
  if(!credit || currentLang !== "en") return credit;
  return credit.replace(/^Foto:/, "Photo:").replace(/^Sonido:/, "Sound:");
}

function translatePart(part){
  return currentLang === "en" ? (PART_EN[part] || part) : PART_LABELS[part];
}

// listas traducidas, usadas para el autocompletado (se piden en caliente en cada
// tecleo, así que siempre reflejan el idioma activo en ese momento)
function countryOptions(){
  return COUNTRIES.map(translateCountry);
}
function modelOptions(list){
  return list.map(translateModel);
}

function applyStaticI18n(){
  document.documentElement.lang = currentLang;
  document.title = t("pageTitle");

  const h1 = document.querySelector(".app-header h1");
  if(h1) h1.innerHTML = `${t("titleMain")} <span>${t("titleAccent")}</span>`;

  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-diff-years]").forEach(el => {
    el.textContent = t("yearsTolerance", { n: YEAR_TOLERANCE[el.dataset.diffYears] });
  });

  const quitBtn = document.getElementById("btn-quit");
  if(quitBtn){ quitBtn.title = t("quitLabel"); quitBtn.setAttribute("aria-label", t("quitLabel")); }

  document.querySelectorAll("#account-logout, #btn-leaderboard-logout").forEach(btn => {
    btn.title = t("accountLogoutLabel");
    btn.setAttribute("aria-label", t("accountLogoutLabel"));
  });

  const editNameBtn = document.getElementById("account-edit-name");
  if(editNameBtn){ editNameBtn.title = t("accountEditNameLabel"); editNameBtn.setAttribute("aria-label", t("accountEditNameLabel")); }

  if(typeof updateAuthFormMode === "function") updateAuthFormMode();

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  // el widget flotante de Ko-fi no tiene idiomas propios — se le vuelve a pedir que se
  // dibuje (sin quitar el suyo del DOM) cada vez que cambia el idioma, así su texto
  // sigue al del resto de la app en vez de quedarse fijo en el que hubiera al cargar.
  if(typeof window.drawKofiWidget === "function") window.drawKofiWidget();
}

function setLanguage(lang){
  if(lang !== "en" && lang !== "es") return;
  currentLang = lang;
  localStorage.setItem("qc_lang", lang);
  applyStaticI18n();
}

document.addEventListener("DOMContentLoaded", () => {
  applyStaticI18n();
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
});
