// Generador de "sonidos" de muestra (placeholder) usando Web Audio API.
// Cada coche suena distinto (patrón de tonos derivado de su id) para poder probar el modo Sonido
// sin depender todavía de grabaciones reales de motores.

let audioCtx = null;
function getAudioCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function hashString(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h;
}

function playCarSound(car){
  const ctx = getAudioCtx();
  if(ctx.state === "suspended") ctx.resume();

  const seed = hashString(car.id + car.brand);
  const baseFreq = 90 + (seed % 60);          // tono grave de "motor"
  const rhythmSteps = 4 + (seed % 3);         // 4-6 pulsos
  const stepDur = 0.16;
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  for(let i=0;i<rhythmSteps;i++){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = (seed + i) % 5 === 0 ? "sawtooth" : "square";
    const freq = baseFreq + ((seed >> (i%8)) % 40) + i*3;
    osc.frequency.value = freq;

    const t0 = now + i*stepDur;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(1, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + stepDur*0.9);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + stepDur);
  }
}
