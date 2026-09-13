// Autenticación y perfil de usuario con Supabase. La clasificación es la única parte
// de la app que requiere sesión iniciada; el resto del juego funciona igual sin login.

let currentUser = null;
let currentProfile = null;
let authMode = "login"; // 'login' | 'signup'

// si js/supabase-config.js todavía tiene los valores de ejemplo, createClient() lanza
// un error; lo capturamos para que el resto del juego (sin login) siga funcionando
// mientras se configura Supabase.
let sb = null;
try {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn("Supabase no está configurado todavía (rellena js/supabase-config.js):", err.message);
}

function isLoggedIn(){ return !!currentUser; }

// crea la fila de perfil (nombre público) la primera vez que alguien inicia sesión
async function ensureProfile(user){
  const { data: existing } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if(existing) return existing;

  const defaultName = user.user_metadata?.display_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || (user.email ? user.email.split("@")[0] : "Jugador");

  const { data: created, error } = await sb.from("profiles")
    .insert({ id: user.id, display_name: defaultName })
    .select()
    .single();
  if(error){ console.error("No se pudo crear el perfil:", error); return null; }
  return created;
}

async function refreshAuthUI(){
  if(!sb){ applyAccountBadge(); return; }
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user || null;
  currentProfile = currentUser ? await ensureProfile(currentUser) : null;
  applyAccountBadge();
  if(typeof resumePendingScoreSave === "function") await resumePendingScoreSave();
}

function applyAccountBadge(){
  const badge = document.getElementById("account-badge");
  const nameEl = document.getElementById("account-name");
  if(!badge || !nameEl) return;
  if(currentUser && currentProfile){
    badge.classList.remove("hidden");
    nameEl.textContent = currentProfile.display_name;
  } else {
    badge.classList.add("hidden");
  }
}

// ---------- modal de login ----------
function openAuthModal(){
  const modal = document.getElementById("auth-modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("auth-error").classList.add("hidden", "info");
}

function closeAuthModal(){
  const modal = document.getElementById("auth-modal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  // si cierras el modal sin llegar a iniciar sesión, no arrastramos el "guardar
  // puntuación pendiente" a la próxima vez que abras el login desde otro sitio
  if(typeof pendingScoreSave !== "undefined") pendingScoreSave = false;
}

function updateAuthFormMode(){
  const titleEl = document.getElementById("auth-title");
  const submitBtn = document.getElementById("btn-email-submit");
  const switchText = document.getElementById("auth-switch-text");
  const toggleBtn = document.getElementById("btn-auth-toggle");
  const usernameInput = document.getElementById("auth-username");
  // el título del modal es el único texto que no se puede fijar con data-i18n:
  // depende de si estás en login o en registro, así que se pone aquí a mano.
  if(titleEl) titleEl.textContent = t(authMode === "login" ? "authTitle" : "btnSignUp");
  submitBtn.textContent = t(authMode === "login" ? "btnLogIn" : "btnSignUp");
  switchText.textContent = t(authMode === "login" ? "authNoAccount" : "authHaveAccount");
  toggleBtn.textContent = t(authMode === "login" ? "btnSwitchToSignup" : "btnSwitchToLogin");
  usernameInput.classList.toggle("hidden", authMode !== "signup");
  usernameInput.required = authMode === "signup";
}

async function signInWithGoogle(){
  if(!sb) return;
  await sb.auth.signInWithOAuth({ provider: "google" });
}

// convierte el nombre de la cabecera en un campo editable al pulsar el lápiz;
// al confirmar (Enter o quitar el foco) lo guarda en el perfil
function startEditName(){
  if(!currentProfile) return;
  const nameEl = document.getElementById("account-name");
  const current = currentProfile.display_name;

  const input = document.createElement("input");
  input.type = "text";
  input.id = "account-name";
  input.className = "account-name-input";
  input.maxLength = 30;
  input.value = current;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  let done = false;
  async function commit(){
    if(done) return;
    done = true;
    const newName = input.value.trim().slice(0, 30) || current;
    const span = document.createElement("span");
    span.id = "account-name";
    span.className = "account-name";
    span.textContent = newName;
    input.replaceWith(span);

    if(newName !== current && sb){
      const { error } = await sb.from("profiles").update({ display_name: newName }).eq("id", currentUser.id);
      if(!error) currentProfile.display_name = newName;
      else span.textContent = current;
    }
  }
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if(e.key === "Enter") input.blur();
    if(e.key === "Escape"){ input.value = current; input.blur(); }
  });
}

async function signOut(){
  if(!sb) return;
  await sb.auth.signOut();
  currentUser = null;
  currentProfile = null;
  applyAccountBadge();
  showScreen("screen-menu");
}

document.addEventListener("DOMContentLoaded", () => {
  refreshAuthUI();
  updateAuthFormMode();

  if(sb){
    sb.auth.onAuthStateChange((_event, session) => {
      refreshAuthUI().then(async () => {
        const modalOpen = !document.getElementById("auth-modal").classList.contains("hidden");
        if(session && modalOpen){
          const hadPendingScoreSave = pendingScoreSave;
          closeAuthModal();
          if(hadPendingScoreSave){
            await saveScoreIfLoggedIn();
            openLeaderboardForRound();
          } else {
            openLeaderboard();
          }
        }
      });
    });
  }

  document.getElementById("btn-google-signin").addEventListener("click", signInWithGoogle);
  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", closeAuthModal);
  });

  document.getElementById("btn-auth-toggle").addEventListener("click", () => {
    authMode = authMode === "login" ? "signup" : "login";
    updateAuthFormMode();
  });

  document.getElementById("auth-email-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const username = document.getElementById("auth-username").value.trim();
    const errorEl = document.getElementById("auth-error");
    const submitBtn = document.getElementById("btn-email-submit");
    errorEl.classList.add("hidden");
    errorEl.classList.remove("info");

    if(!sb){
      errorEl.textContent = "Supabase no está configurado todavía (js/supabase-config.js).";
      errorEl.classList.remove("hidden");
      return;
    }

    submitBtn.disabled = true;

    const { data, error } = authMode === "login"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { data: { display_name: username } } });

    submitBtn.disabled = false;

    if(error){
      errorEl.textContent = error.message;
      errorEl.classList.remove("hidden");
      return;
    }
    if(authMode === "signup" && !data.session){
      errorEl.textContent = t("authCheckEmail");
      errorEl.classList.remove("hidden");
      errorEl.classList.add("info");
    }
  });

  document.getElementById("account-logout").addEventListener("click", signOut);
  document.getElementById("account-edit-name").addEventListener("click", startEditName);
});
