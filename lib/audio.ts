let audioCtx: AudioContext | null = null;

export function initAudioContext() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playTerminalBlip() {
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Sci-fi UI blip sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
    
    // Very short, quiet pop
    gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    // Ignore audio errors during rapid typing
  }
}
