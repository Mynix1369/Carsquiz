// Reproduce el sonido de motor real (grabación de Wikimedia Commons) del "sonido del día".
// El jugador controla la reproducción a mano (play/pausa/repetir) — no suena solo al
// entrar en la pregunta, hay que darle al play.

let currentAudioEl = null;
let onAudioStateChange = null; // callback opcional (lo usa game.js para el icono play/pausa)

// prepara el clip del coche actual sin reproducirlo todavía
function loadCarSound(car){
  stopCarSound();
  currentAudioEl = car.sound ? new Audio(car.sound) : null;
  if(!currentAudioEl) return;
  currentAudioEl.addEventListener("play", () => onAudioStateChange && onAudioStateChange("playing"));
  currentAudioEl.addEventListener("pause", () => onAudioStateChange && onAudioStateChange("paused"));
  currentAudioEl.addEventListener("ended", () => onAudioStateChange && onAudioStateChange("ended"));
}

function togglePlayPauseCarSound(){
  if(!currentAudioEl) return;
  if(currentAudioEl.paused) currentAudioEl.play().catch(() => {});
  else currentAudioEl.pause();
}

function replayCarSound(){
  if(!currentAudioEl) return;
  currentAudioEl.currentTime = 0;
  currentAudioEl.play().catch(() => {});
}

// corta el sonido en curso (al salir de la pantalla de juego, por ejemplo) para que no
// se quede sonando de fondo cuando ya no se está viendo esa pregunta.
function stopCarSound(){
  if(currentAudioEl){ currentAudioEl.pause(); currentAudioEl.currentTime = 0; }
}
