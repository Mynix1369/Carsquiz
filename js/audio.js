// Reproduce el sonido de motor real (grabación de Wikimedia Commons) del "sonido del día".

let currentAudioEl = null;

function playCarSound(car){
  if(!car.sound) return;
  if(currentAudioEl){ currentAudioEl.pause(); currentAudioEl.currentTime = 0; }
  currentAudioEl = new Audio(car.sound);
  currentAudioEl.play().catch(() => {}); // en iOS el autoplay inicial puede requerir un toque manual
}
