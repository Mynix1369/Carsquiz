// Reproduce el sonido de motor real (grabación de Wikimedia Commons) del "sonido del día".

let currentAudioEl = null;

function playCarSound(car){
  if(!car.sound) return;
  stopCarSound();
  currentAudioEl = new Audio(car.sound);
  currentAudioEl.play().catch(() => {}); // en iOS el autoplay inicial puede requerir un toque manual
}

// corta el sonido en curso (al salir de la pantalla de juego, por ejemplo) para que no
// se quede sonando de fondo cuando ya no se está viendo esa pregunta.
function stopCarSound(){
  if(currentAudioEl){ currentAudioEl.pause(); currentAudioEl.currentTime = 0; }
}
