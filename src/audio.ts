let context: AudioContext | null = null;
export function unlockAudio() {
  try { context ??= new AudioContext(); if (context.state === 'suspended') void context.resume().catch(() => {}); } catch { /* Sound is optional. */ }
}
export function bell() {
  try {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    [1174.66, 1760, 2349.32].forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035 / (index + 1), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(now); oscillator.stop(now + 0.7);
    });
  } catch { /* Browsers may block audio; gameplay remains available. */ }
}
