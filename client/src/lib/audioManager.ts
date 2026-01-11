let audioContext: AudioContext | null = null;
let isUnlocked = false;
let unlockListenersAdded = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isUnlocked = true;
      console.log('[AudioManager] Audio context unlocked');
    }).catch(err => {
      console.warn('[AudioManager] Failed to unlock audio:', err);
    });
  } else {
    isUnlocked = true;
  }
}

export function initAudioManager() {
  if (unlockListenersAdded) return;
  unlockListenersAdded = true;

  const handleInteraction = () => {
    unlockAudio();
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
    document.removeEventListener('keydown', handleInteraction);
  };

  document.addEventListener('click', handleInteraction, { passive: true });
  document.addEventListener('touchstart', handleInteraction, { passive: true });
  document.addEventListener('keydown', handleInteraction, { passive: true });

  getAudioContext();
}

export function isAudioUnlocked(): boolean {
  return isUnlocked;
}

export function playRingtone(): { stop: () => void } {
  const ctx = getAudioContext();
  let oscillator1: OscillatorNode | null = null;
  let oscillator2: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let intervalId: number | null = null;
  let stopped = false;

  const playTone = () => {
    if (stopped || !ctx || ctx.state === 'closed') return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);
      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        if (!stopped) {
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
            } catch (e) {}
          }, 100);
        }
      }, 800);
    } catch (e) {
      console.warn('[AudioManager] Error playing tone:', e);
    }
  };

  playTone();
  intervalId = window.setInterval(playTone, 3000);

  return {
    stop: () => {
      stopped = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
}
