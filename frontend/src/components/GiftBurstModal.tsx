import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, X, RotateCcw, Award, Volume2, Medal, Zap, Music } from 'lucide-react';

export interface GiftBurstModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  rank?: number; // 1 | 2 | 3 (defaults to 1)
  score?: number | string;
  maxScore?: number | string;
  accuracy?: number | string;
  timeTaken?: string;
  totalParticipants?: number;
  onViewCertificate?: () => void;
}

/* =========================================================================
   PRIZE 1: 🥇 IMPERIAL GOLD FANFARE & GRAND VICTORY FIREWORKS
   - Instrument: Royal Orchestral Brass Trumpets + Grand Timpani + Celestial Star Cascade
   - Character: Majestic, Regal, Explosive, Grand Champion
   ========================================================================= */
export const playFirstPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // 1. Royal Brass Trumpet Heraldic Fanfare (C-Major)
      const brassNotes = [
        { f: 523.25, t: 0.00, d: 0.16, v: 0.38, wave: 'sawtooth' as OscillatorType }, // C5
        { f: 659.25, t: 0.14, d: 0.16, v: 0.38, wave: 'sawtooth' as OscillatorType }, // E5
        { f: 783.99, t: 0.28, d: 0.22, v: 0.42, wave: 'sawtooth' as OscillatorType }, // G5
        { f: 659.25, t: 0.48, d: 0.14, v: 0.32, wave: 'triangle' as OscillatorType }, // E5
        { f: 783.99, t: 0.60, d: 0.18, v: 0.40, wave: 'sawtooth' as OscillatorType }, // G5
        { f: 1046.50, t: 0.78, d: 1.10, v: 0.50, wave: 'sawtooth' as OscillatorType }, // High C6 Climax
        { f: 1318.51, t: 0.88, d: 0.95, v: 0.35, wave: 'triangle' as OscillatorType }, // High E6 Harmony
        { f: 1567.98, t: 0.98, d: 0.85, v: 0.30, wave: 'triangle' as OscillatorType }, // High G6 Flourish
      ];

      brassNotes.forEach(({ f, t, d, v, wave }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now + t);

        // Rich brass low-pass filter with attack sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now + t);
        filter.frequency.exponentialRampToValueAtTime(4500, now + t + 0.06);

        if (d > 0.4) {
          osc.frequency.setTargetAtTime(f * 1.009, now + t + 0.18, 0.08); // Brass vibrato
        }

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(v, now + t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });

      // 2. Grand Orchestral Timpani Drum Roll & Sub-Bass Victory Boom
      const timpaniRoll = [
        { f: 120, t: 0.50, v: 0.20 },
        { f: 135, t: 0.58, v: 0.25 },
        { f: 150, t: 0.66, v: 0.30 },
      ];
      timpaniRoll.forEach(({ f, t, v }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        osc.frequency.exponentialRampToValueAtTime(50, now + t + 0.12);
        gain.gain.setValueAtTime(v, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.15);
      });

      // Heavy Climax Timpani Boom
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(180, now + 0.78);
      bassOsc.frequency.exponentialRampToValueAtTime(38, now + 1.8);
      bassGain.gain.setValueAtTime(0.55, now + 0.78);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now + 0.78);
      bassOsc.stop(now + 1.85);

      // 3. Cascading Golden Star Chimes (5 octaves)
      const starChimes = [
        { f: 1760.00, t: 0.85 }, // A6
        { f: 2093.00, t: 0.98 }, // C7
        { f: 2637.02, t: 1.10 }, // E7
        { f: 3135.96, t: 1.22 }, // G7
        { f: 4186.01, t: 1.35 }  // C8 (Golden Sparkle)
      ];

      starChimes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.24, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.5);
      });

      // 4. Lush Golden Major 9th Polyphonic Chord Climax
      const chordNotes = [261.63, 392.00, 523.25, 659.25, 987.77]; // C4, G4, C5, E5, B5
      chordNotes.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + 0.80);
        gain.gain.setValueAtTime(0.001, now + 0.80);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.88);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.80);
        osc.stop(now + 1.95);
      });
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => startSynth()).catch(() => startSynth());
    } else {
      startSynth();
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
};

/* =========================================================================
   PRIZE 2: 🥈 CRYSTALLINE CYBER-SILVER GLISSANDO & HIGH-TECH HARP SWEEP
   - Instrument: FM Metallic Silver Bells + Ascending Crystal Harp + Crisp Snappy Snare
   - Character: High-Tech, Crisp, Crystalline, Electric, Precision Silver
   ========================================================================= */
export const playSecondPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // 1. Rapid Ascending Crystalline Harp Glissando (High-speed silver streak)
      const harpPitches = [
        587.33,  // D5
        659.25,  // E5
        739.99,  // F#5
        880.00,  // A5
        987.77,  // B5
        1174.66, // D6
        1318.51, // E6
        1479.98, // F#6
        1760.00  // A6
      ];

      harpPitches.forEach((pitch, i) => {
        const t = i * 0.055; // Fast rolling cascade
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now + t);

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(0.28, now + t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.40);
      });

      // 2. FM Synthesis Metallic Silver Bell (Authentic chrome/glass clang)
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const masterGain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(1174.66, now + 0.52); // D6 fundamental

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(1174.66 * 2.76, now + 0.52); // Metallic inharmonic ratio

      modGain.gain.setValueAtTime(800, now + 0.52);
      modGain.gain.exponentialRampToValueAtTime(20, now + 1.4);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      masterGain.gain.setValueAtTime(0.001, now + 0.52);
      masterGain.gain.exponentialRampToValueAtTime(0.40, now + 0.54);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      carrier.connect(masterGain);
      masterGain.connect(ctx.destination);

      carrier.start(now + 0.52);
      modulator.start(now + 0.52);
      carrier.stop(now + 1.65);
      modulator.stop(now + 1.65);

      // 3. High-Velocity Shimmering Ice Chimes (Cascading silver frost)
      const silverChimes = [2349.32, 2793.83, 3520.00, 4186.01];
      silverChimes.forEach((f, idx) => {
        const t = 0.58 + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.22, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.40);
      });

      // 4. Snappy High-Tech Snare Flam & Laser Accent
      // Noise burst for crisp snare
      const bufferSize = ctx.sampleRate * 0.12;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1200, now + 0.52);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now + 0.52);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.64);
      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now + 0.52);

      // Electro kick punch
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      punchOsc.type = 'sine';
      punchOsc.frequency.setValueAtTime(240, now + 0.52);
      punchOsc.frequency.exponentialRampToValueAtTime(65, now + 0.85);
      punchGain.gain.setValueAtTime(0.38, now + 0.52);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      punchOsc.connect(punchGain);
      punchGain.connect(ctx.destination);
      punchOsc.start(now + 0.52);
      punchOsc.stop(now + 0.90);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => startSynth()).catch(() => startSynth());
    } else {
      startSynth();
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
};

/* =========================================================================
   PRIZE 3: 🥉 FESTIVE ISLAND MARIMBA & CELEBRATORY BRONZE GONG
   - Instrument: Warm Wooden Marimba Riff + Tibetan Bronze Singing Bowl + Percussion Claves
   - Character: Warm, Cheerful, Rhythmic, Playful & Uplifting
   ========================================================================= */
export const playThirdPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // 1. Warm Bouncy Wooden Marimba Victory Riff
      // Melodic motif: G4 -> C5 -> E5 -> D5 -> G5 -> High C6 (syncopated joyful cadence)
      const marimbaNotes = [
        { f: 392.00, t: 0.00, v: 0.35 }, // G4
        { f: 523.25, t: 0.12, v: 0.38 }, // C5
        { f: 659.25, t: 0.24, v: 0.40 }, // E5
        { f: 587.33, t: 0.36, v: 0.36 }, // D5
        { f: 783.99, t: 0.48, v: 0.44 }, // G5
        { f: 1046.50, t: 0.62, v: 0.50 }, // High C6 double bounce
        { f: 1046.50, t: 0.74, v: 0.46 }  // High C6 accent
      ];

      marimbaNotes.forEach(({ f, t, v }) => {
        // Fundamental
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        // Subtle mallet frequency drop on attack
        osc.frequency.exponentialRampToValueAtTime(f * 0.99, now + t + 0.15);

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(v, now + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.26);

        // Wooden harmonic overtone
        const overtoneOsc = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtoneOsc.type = 'sine';
        overtoneOsc.frequency.setValueAtTime(f * 3.8, now + t);
        overtoneGain.gain.setValueAtTime(v * 0.28, now + t);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        osc.start(now + t);
        overtoneOsc.start(now + t);
        osc.stop(now + t + 0.30);
        overtoneOsc.stop(now + t + 0.09);
      });

      // 2. Deep Resonant Bronze Singing Bowl / Gong (Sub-bass warmth & metallic sustain)
      const gongFundamentals = [110, 220, 330]; // Rich bronze harmonic series
      gongFundamentals.forEach((freq, idx) => {
        const gongOsc = ctx.createOscillator();
        const gongGain = ctx.createGain();
        gongOsc.type = 'sine';
        gongOsc.frequency.setValueAtTime(freq, now + 0.62);

        // Slight gong pitch fluctuation
        gongOsc.frequency.setTargetAtTime(freq * 1.003, now + 0.8, 0.2);

        const vol = idx === 0 ? 0.35 : 0.18;
        gongGain.gain.setValueAtTime(0.001, now + 0.62);
        gongGain.gain.exponentialRampToValueAtTime(vol, now + 0.66);
        gongGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

        gongOsc.connect(gongGain);
        gongGain.connect(ctx.destination);
        gongOsc.start(now + 0.62);
        gongOsc.stop(now + 2.15);
      });

      // 3. Wooden Clave Percussion Clicks (Festive island pulse)
      const claveTimes = [0.00, 0.24, 0.48, 0.62, 0.74];
      claveTimes.forEach((t) => {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(2400, now + t);
        clickOsc.frequency.exponentialRampToValueAtTime(1400, now + t + 0.04);
        clickGain.gain.setValueAtTime(0.18, now + t);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.045);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now + t);
        clickOsc.stop(now + t + 0.05);
      });

      // 4. Warm Celebratory Major 6th Harmonic Pad Swell
      const warmChord = [261.63, 329.63, 392.00, 440.00]; // C4, E4, G4, A4 (Joyful C6 chord)
      warmChord.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + 0.75);
        gain.gain.setValueAtTime(0.001, now + 0.75);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.85);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.75);
        osc.stop(now + 1.85);
      });
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => startSynth()).catch(() => startSynth());
    } else {
      startSynth();
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
};

/* =========================================================================
   POP / BURST ACCENT SOUND EFFECT
   - Tailored blast sound right when the gift box pops open!
   ========================================================================= */
export const playGiftBurstBlast = (rank: number = 1) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;
      const isGold = rank === 1;
      const isSilver = rank === 2;

      // Cannon pop frequency
      const startFreq = isGold ? 320 : isSilver ? 480 : 260;
      const endFreq = isGold ? 45 : isSilver ? 80 : 35;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSilver ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.20);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => startSynth()).catch(() => startSynth());
    } else {
      startSynth();
    }
  } catch (e) {
    console.warn('Pop audio error:', e);
  }
};

// Universal Helper that plays the exact signature sound effect for each rank
export const playPodiumFanfare = (rank: number = 1) => {
  if (rank === 2) {
    playSecondPrizeFanfare();
  } else if (rank === 3) {
    playThirdPrizeFanfare();
  } else {
    playFirstPrizeFanfare();
  }
};

export const GiftBurstModal: React.FC<GiftBurstModalProps> = ({
  isOpen,
  onClose,
  quizTitle,
  rank = 1,
  score,
  maxScore,
  accuracy,
  timeTaken,
  totalParticipants = 1,
  onViewCertificate
}) => {
  const [burstState, setBurstState] = useState<'WOBBLE' | 'BURSTING' | 'REVEALED'>('WOBBLE');
  const timerRef = useRef<any>(null);

  const podiumRank: 1 | 2 | 3 = rank === 2 ? 2 : rank === 3 ? 3 : 1;

  // Play appropriate podium audio fanfare
  const playVictoryAudio = useCallback(() => {
    playPodiumFanfare(podiumRank);
  }, [podiumRank]);

  // Fire multi-stage celebratory confetti matching the prize metallic palette
  const triggerConfettiCannons = useCallback(() => {
    const isGold = podiumRank === 1;
    const isSilver = podiumRank === 2;

    const mainColors = isGold
      ? ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#ffffff', '#8b5cf6']
      : isSilver
      ? ['#e2e8f0', '#94a3b8', '#38bdf8', '#0284c7', '#ffffff', '#64748b', '#cbd5e1']
      : ['#d97706', '#b45309', '#f59e0b', '#10b981', '#ffffff', '#ea580c', '#fbbf24'];

    const sideLeftColors = isGold
      ? ['#fbbf24', '#f59e0b', '#d97706', '#ffffff']
      : isSilver
      ? ['#e2e8f0', '#38bdf8', '#ffffff', '#94a3b8']
      : ['#d97706', '#f59e0b', '#ffffff', '#b45309'];

    const sideRightColors = isGold
      ? ['#a855f7', '#ec4899', '#3b82f6', '#fbbf24']
      : isSilver
      ? ['#0284c7', '#38bdf8', '#cbd5e1', '#ffffff']
      : ['#10b981', '#f59e0b', '#ea580c', '#ffffff'];

    // 1. Center burst
    confetti({
      particleCount: isGold ? 95 : 85,
      spread: 75,
      origin: { y: 0.55 },
      colors: mainColors
    });

    // 2. Left and Right cannon angles
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors: sideLeftColors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors: sideRightColors
      });
    }, 250);

    // 3. Shimmering star / shape shower
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ['star'],
        colors: mainColors
      });
    }, 500);
  }, [podiumRank]);

  const triggerBurst = useCallback(() => {
    setBurstState('BURSTING');
    playGiftBurstBlast(podiumRank);
    playVictoryAudio();

    setTimeout(() => {
      setBurstState('REVEALED');
      triggerConfettiCannons();
    }, 450);
  }, [podiumRank, playVictoryAudio, triggerConfettiCannons]);

  // Reset and auto-burst when modal opens
  useEffect(() => {
    if (isOpen) {
      setBurstState('WOBBLE');
      // Auto trigger gift burst after 1.2 seconds of wobbling anticipation
      timerRef.current = setTimeout(() => {
        triggerBurst();
      }, 1200);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, triggerBurst]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-300">
      
      {/* Celebration Card */}
      <div 
        className={`relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl overflow-hidden ${
          podiumRank === 1
            ? 'border-2 border-amber-400/50 animate-champion-glow'
            : podiumRank === 2
            ? 'border-2 border-slate-300/60 animate-silver-glow'
            : 'border-2 border-amber-500/50 animate-bronze-glow'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer z-20"
          title="Close celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Decorative Glow Circles */}
        <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
          podiumRank === 1 ? 'bg-amber-500/25' : podiumRank === 2 ? 'bg-sky-400/25' : 'bg-orange-500/25'
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
          podiumRank === 1 ? 'bg-purple-500/20' : podiumRank === 2 ? 'bg-indigo-500/20' : 'bg-amber-600/20'
        }`} />

        {/* STATE 1: WOBBLING GIFT BOX */}
        {burstState === 'WOBBLE' && (
          <div className="py-8 space-y-6 flex flex-col items-center justify-center">
            
            {/* Top Pill */}
            {podiumRank === 1 && (
              <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>1st Place Champion Reward! 🥇</span>
              </div>
            )}
            {podiumRank === 2 && (
              <div className="inline-flex items-center space-x-2 bg-sky-400/20 border border-sky-400/40 text-sky-200 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                <Medal className="w-4 h-4 text-sky-300 animate-silver-float" />
                <span>2nd Place Silver Podium Reward! 🥈</span>
              </div>
            )}
            {podiumRank === 3 && (
              <div className="inline-flex items-center space-x-2 bg-amber-600/20 border border-amber-500/40 text-amber-300 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                <Award className="w-4 h-4 text-amber-400 animate-bronze-float" />
                <span>3rd Place Bronze Podium Reward! 🥉</span>
              </div>
            )}

            {/* Interactive Wobbling Gift Box */}
            <div 
              onClick={triggerBurst}
              className="cursor-pointer transform hover:scale-105 transition-transform"
              title="Click to burst open now!"
            >
              <div className="relative animate-gift-wobble">
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center shadow-2xl relative ${
                  podiumRank === 1
                    ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border-4 border-amber-200/80 shadow-amber-500/30'
                    : podiumRank === 2
                    ? 'bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 border-4 border-slate-200/90 shadow-slate-500/30'
                    : 'bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800 border-4 border-amber-400/80 shadow-amber-900/30'
                }`}>
                  {/* Decorative Ribbons */}
                  <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 shadow-sm ${
                    podiumRank === 1 ? 'bg-rose-600/90' : podiumRank === 2 ? 'bg-sky-500/90' : 'bg-emerald-600/90'
                  }`} />
                  <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 shadow-sm ${
                    podiumRank === 1 ? 'bg-rose-600/90' : podiumRank === 2 ? 'bg-sky-500/90' : 'bg-emerald-600/90'
                  }`} />
                  
                  {/* Gift Bow */}
                  <div className="absolute -top-4 text-4xl select-none filter drop-shadow-md">
                    {podiumRank === 1 ? '🎀' : podiumRank === 2 ? '⚡' : '✨'}
                  </div>
                  <span className="text-5xl select-none z-10 filter drop-shadow-lg">
                    🎁
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${
                podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-slate-100' : 'text-amber-300'
              }`}>
                {podiumRank === 1 && 'Unwrapping Your 1st Place Gift...'}
                {podiumRank === 2 && 'Unwrapping Your 2nd Place Silver Award...'}
                {podiumRank === 3 && 'Unwrapping Your 3rd Place Bronze Award...'}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                You competed in <strong className="text-white">{quizTitle}</strong> and secured a prestigious podium finish! Tap the gift box to reveal!
              </p>
            </div>

            <button
              onClick={triggerBurst}
              className={`px-6 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all ${
                podiumRank === 1
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-500/30'
                  : podiumRank === 2
                  ? 'bg-gradient-to-r from-slate-200 to-sky-300 hover:from-slate-300 hover:to-sky-400 text-slate-950 shadow-sky-400/30'
                  : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white shadow-orange-500/30'
              }`}
            >
              {podiumRank === 1 ? 'Burst Open Now! 💥' : podiumRank === 2 ? 'Reveal Silver Award! ⚡' : 'Reveal Bronze Award! ✨'}
            </button>
          </div>
        )}

        {/* STATE 2: BURSTING FLASH */}
        {burstState === 'BURSTING' && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="animate-gift-burst text-7xl select-none">
              {podiumRank === 1 ? '💥' : podiumRank === 2 ? '⚡' : '✨'}
            </div>
            <p className={`font-black text-lg animate-pulse tracking-widest uppercase ${
              podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-sky-200' : 'text-amber-300'
            }`}>
              {podiumRank === 1 && 'B U R S T !'}
              {podiumRank === 2 && 'S I L V E R  B U R S T !'}
              {podiumRank === 3 && 'B R O N Z E  B U R S T !'}
            </p>
          </div>
        )}

        {/* STATE 3: REVEALED TROPHY & CELEBRATION */}
        {burstState === 'REVEALED' && (
          <div className="space-y-6 pt-2 animate-trophy-entrance">
            
            {/* Top Winner Badge */}
            {podiumRank === 1 && (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-400/60 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-amber-300 shimmer-badge">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                <span>Official 1st Place Winner 🥇</span>
              </div>
            )}
            {podiumRank === 2 && (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-slate-200/20 via-sky-300/25 to-slate-200/20 border border-slate-300/60 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-100 shimmer-silver-badge">
                <Medal className="w-4 h-4 text-slate-200 fill-slate-300 animate-silver-float" />
                <span>Official 2nd Place Winner 🥈</span>
              </div>
            )}
            {podiumRank === 3 && (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600/20 via-orange-400/25 to-amber-600/20 border border-amber-500/60 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-amber-300 shimmer-bronze-badge">
                <Award className="w-4 h-4 text-amber-400 fill-amber-500 animate-bronze-float" />
                <span>Official 3rd Place Winner 🥉</span>
              </div>
            )}

            {/* Glowing Trophy / Medal Graphic */}
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              {/* Rotating background sparkle halo */}
              <div className={`absolute inset-0 rounded-full pointer-events-none blur-lg animate-sparkle-spin ${
                podiumRank === 1
                  ? 'bg-gradient-to-tr from-amber-500/30 via-yellow-300/20 to-transparent'
                  : podiumRank === 2
                  ? 'bg-gradient-to-tr from-sky-400/30 via-slate-200/25 to-transparent'
                  : 'bg-gradient-to-tr from-amber-600/30 via-orange-400/25 to-transparent'
              }`} />
              
              <div className={`w-24 h-24 rounded-3xl p-0.5 shadow-2xl flex items-center justify-center border-2 ${
                podiumRank === 1
                  ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-amber-500/50 border-yellow-200'
                  : podiumRank === 2
                  ? 'bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 shadow-slate-300/50 border-slate-100'
                  : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-700 shadow-amber-600/50 border-amber-300'
              }`}>
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                  {podiumRank === 1 && (
                    <Trophy className="w-14 h-14 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                  )}
                  {podiumRank === 2 && (
                    <Medal className="w-14 h-14 text-slate-200 fill-slate-300 filter drop-shadow-[0_0_12px_rgba(226,232,240,0.9)] animate-silver-float" />
                  )}
                  {podiumRank === 3 && (
                    <Award className="w-14 h-14 text-amber-500 fill-amber-600 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-bronze-float" />
                  )}
                </div>
              </div>

              {/* Floating Mini Stars / Medals */}
              <Sparkles className={`w-6 h-6 absolute -top-1 -right-1 animate-pulse ${
                podiumRank === 1 ? 'text-yellow-300' : podiumRank === 2 ? 'text-sky-200' : 'text-amber-400'
              }`} />
              {podiumRank === 1 ? (
                <Crown className="w-5 h-5 text-amber-300 absolute -top-3 left-4 animate-bounce" />
              ) : podiumRank === 2 ? (
                <Medal className="w-5 h-5 text-slate-200 absolute -top-3 left-4 animate-silver-float" />
              ) : (
                <Award className="w-5 h-5 text-amber-400 absolute -top-3 left-4 animate-bronze-float" />
              )}
            </div>

            {/* Podium Title */}
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text ${
                podiumRank === 1
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400'
                  : podiumRank === 2
                  ? 'bg-gradient-to-r from-slate-100 via-sky-200 to-slate-200'
                  : 'bg-gradient-to-r from-amber-300 via-orange-200 to-amber-400'
              }`}>
                {podiumRank === 1 && 'CHAMPION OF THE ROOM! 🥇'}
                {podiumRank === 2 && 'SILVER PODIUM RUNNER-UP! 🥈'}
                {podiumRank === 3 && 'BRONZE PODIUM STANDOUT! 🥉'}
              </h2>
              <p className="text-sm font-semibold text-slate-200 mt-1 max-w-sm mx-auto break-words">
                {quizTitle}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {podiumRank === 1 && 'You outperformed all competitors and seized rank #1!'}
                {podiumRank === 2 && 'Outstanding speed and accuracy earned you a top 2 podium finish!'}
                {podiumRank === 3 && 'Exceptional subject mastery secured your spot on the winners podium!'}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto pt-1">
              {score !== undefined && (
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                  <p className={`text-[10px] uppercase font-bold ${
                    podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-sky-300' : 'text-amber-300'
                  }`}>Score</p>
                  <p className="text-base font-black mt-0.5">{score} {maxScore ? `/ ${maxScore}` : ''}</p>
                </div>
              )}

              {accuracy !== undefined && (
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                  <p className={`text-[10px] uppercase font-bold ${
                    podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-sky-300' : 'text-amber-300'
                  }`}>Accuracy</p>
                  <p className="text-base font-black mt-0.5">{accuracy}%</p>
                </div>
              )}

              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                <p className={`text-[10px] uppercase font-bold ${
                  podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-sky-300' : 'text-amber-300'
                }`}>Rank</p>
                <p className={`text-base font-black mt-0.5 ${
                  podiumRank === 1 ? 'text-amber-300' : podiumRank === 2 ? 'text-slate-200' : 'text-amber-400'
                }`}>
                  {podiumRank === 1 ? '#1 🥇' : podiumRank === 2 ? '#2 🥈' : '#3 🥉'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playVictoryAudio();
                  triggerConfettiCannons();
                }}
                className={`px-4 py-2.5 font-extrabold text-xs rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shadow-md ${
                  podiumRank === 1
                    ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border-amber-400/40'
                    : podiumRank === 2
                    ? 'bg-sky-400/20 hover:bg-sky-400/30 text-sky-200 border-sky-400/40'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                }`}
              >
                {podiumRank === 1 ? (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-300" />
                    <span>Play Imperial Trumpets 🎺</span>
                  </>
                ) : podiumRank === 2 ? (
                  <>
                    <Zap className="w-4 h-4 text-sky-300" />
                    <span>Play Silver Chimes ⚡</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Play Bronze Marimba 🥁</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerConfettiCannons();
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl border border-white/20 flex items-center space-x-1.5 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Burst Confetti 🎊</span>
              </button>

              {onViewCertificate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewCertificate();
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl border border-yellow-200 flex items-center space-x-1.5 shadow-md cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                  title="Generate Official AGENTIC_AI_A7 Certificate"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>View Certificate 📜</span>
                </button>
              )}

              <button
                onClick={onClose}
                className={`px-6 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                  podiumRank === 1
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-500/30'
                    : podiumRank === 2
                    ? 'bg-gradient-to-r from-slate-200 to-sky-300 hover:from-slate-300 hover:to-sky-400 text-slate-950 shadow-sky-400/30'
                    : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white shadow-orange-500/30'
                }`}
              >
                {podiumRank === 1 ? 'Claim Victory 🌟' : podiumRank === 2 ? 'Claim Silver 🥈' : 'Claim Bronze 🥉'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
