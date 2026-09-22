import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, X, RotateCcw, Award, Volume2, Medal } from 'lucide-react';

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
}

// 1st Prize Royal Brass Trumpet Fanfare
export const playFirstPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // Royal Brass Trumpet Fanfare: C5 -> E5 -> G5 -> E5 -> G5 -> C6 Climax & Harmonics
      const brassNotes = [
        { f: 523.25, t: 0.00, d: 0.16, v: 0.35, wave: 'sawtooth' as OscillatorType },
        { f: 659.25, t: 0.14, d: 0.16, v: 0.35, wave: 'sawtooth' as OscillatorType },
        { f: 783.99, t: 0.28, d: 0.22, v: 0.40, wave: 'sawtooth' as OscillatorType },
        { f: 659.25, t: 0.48, d: 0.14, v: 0.30, wave: 'triangle' as OscillatorType },
        { f: 783.99, t: 0.60, d: 0.18, v: 0.38, wave: 'sawtooth' as OscillatorType },
        { f: 1046.50, t: 0.78, d: 0.95, v: 0.45, wave: 'sawtooth' as OscillatorType }, // High C Climax
        { f: 1318.51, t: 0.88, d: 0.85, v: 0.30, wave: 'triangle' as OscillatorType }, // High E Harmony
        { f: 1567.98, t: 0.98, d: 0.75, v: 0.25, wave: 'triangle' as OscillatorType }, // High G Flourish
      ];

      brassNotes.forEach(({ f, t, d, v, wave }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now + t);

        if (d > 0.4) {
          osc.frequency.setTargetAtTime(f * 1.008, now + t + 0.15, 0.08); // Brass vibrato
        }

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(v, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });

      // Celebratory Magical Bell Chimes
      const sparkles = [
        { f: 1760.00, t: 0.85 },
        { f: 2093.00, t: 0.98 },
        { f: 2637.02, t: 1.10 },
        { f: 3135.96, t: 1.22 },
        { f: 4186.01, t: 1.35 }
      ];

      sparkles.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.22, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.5);
      });

      // Grand Timpani Victory Boom
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(160, now + 0.78);
      bassOsc.frequency.exponentialRampToValueAtTime(40, now + 1.5);

      bassGain.gain.setValueAtTime(0.40, now + 0.78);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now + 0.78);
      bassOsc.stop(now + 1.55);
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

// 2nd Prize Crisp Silver Chimes & Trumpet Triumph Fanfare
export const playSecondPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // Bright Silver Trumpet: D5 -> F#5 -> A5 -> F#5 -> A5 -> D6 Climax
      const silverBrass = [
        { f: 587.33, t: 0.00, d: 0.15, v: 0.32, wave: 'sawtooth' as OscillatorType },
        { f: 739.99, t: 0.13, d: 0.15, v: 0.32, wave: 'sawtooth' as OscillatorType },
        { f: 880.00, t: 0.26, d: 0.20, v: 0.36, wave: 'sawtooth' as OscillatorType },
        { f: 739.99, t: 0.44, d: 0.13, v: 0.28, wave: 'triangle' as OscillatorType },
        { f: 880.00, t: 0.55, d: 0.16, v: 0.34, wave: 'sawtooth' as OscillatorType },
        { f: 1174.66, t: 0.72, d: 0.88, v: 0.42, wave: 'sawtooth' as OscillatorType }, // High D6 Climax
        { f: 1479.98, t: 0.82, d: 0.78, v: 0.28, wave: 'triangle' as OscillatorType }, // High F#6 Harmony
        { f: 1760.00, t: 0.92, d: 0.70, v: 0.22, wave: 'sine' as OscillatorType },     // High A6 Flourish
      ];

      silverBrass.forEach(({ f, t, d, v, wave }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now + t);

        if (d > 0.4) {
          osc.frequency.setTargetAtTime(f * 1.006, now + t + 0.15, 0.07);
        }

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(v, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });

      // Crystal Silver Windchimes
      const chimes = [
        { f: 2200.00, t: 0.78 },
        { f: 2637.00, t: 0.90 },
        { f: 3135.00, t: 1.02 },
        { f: 3520.00, t: 1.15 }
      ];

      chimes.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.20, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.40);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.45);
      });

      // Resonant Snare & Kick Punch
      const drumOsc = ctx.createOscillator();
      const drumGain = ctx.createGain();
      drumOsc.type = 'sine';
      drumOsc.frequency.setValueAtTime(180, now + 0.72);
      drumOsc.frequency.exponentialRampToValueAtTime(50, now + 1.2);

      drumGain.gain.setValueAtTime(0.35, now + 0.72);
      drumGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      drumOsc.connect(drumGain);
      drumGain.connect(ctx.destination);
      drumOsc.start(now + 0.72);
      drumOsc.stop(now + 1.25);
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

// 3rd Prize Warm Bronze Victory Cadence Fanfare
export const playThirdPrizeFanfare = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const startSynth = () => {
      const now = ctx.currentTime;

      // Warm Bronze Brass: G4 -> B4 -> D5 -> B4 -> D5 -> G5 Climax
      const bronzeBrass = [
        { f: 392.00, t: 0.00, d: 0.16, v: 0.30, wave: 'sawtooth' as OscillatorType },
        { f: 493.88, t: 0.14, d: 0.16, v: 0.30, wave: 'sawtooth' as OscillatorType },
        { f: 587.33, t: 0.28, d: 0.20, v: 0.35, wave: 'sawtooth' as OscillatorType },
        { f: 493.88, t: 0.46, d: 0.14, v: 0.26, wave: 'triangle' as OscillatorType },
        { f: 587.33, t: 0.58, d: 0.18, v: 0.32, wave: 'sawtooth' as OscillatorType },
        { f: 783.99, t: 0.75, d: 0.85, v: 0.40, wave: 'sawtooth' as OscillatorType }, // Warm G5 Climax
        { f: 987.77, t: 0.85, d: 0.75, v: 0.26, wave: 'triangle' as OscillatorType }, // High B5 Harmony
        { f: 1174.66, t: 0.95, d: 0.65, v: 0.20, wave: 'sine' as OscillatorType },     // High D6 Flourish
      ];

      bronzeBrass.forEach(({ f, t, d, v, wave }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now + t);

        if (d > 0.4) {
          osc.frequency.setTargetAtTime(f * 1.005, now + t + 0.15, 0.07);
        }

        gain.gain.setValueAtTime(0.001, now + t);
        gain.gain.exponentialRampToValueAtTime(v, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });

      // Warm Cathedral Bells
      const bells = [
        { f: 1567.98, t: 0.80 },
        { f: 1975.53, t: 0.92 },
        { f: 2349.32, t: 1.05 }
      ];

      bells.forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.5);
      });

      // Warm Timpani Resonance
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(140, now + 0.75);
      bassOsc.frequency.exponentialRampToValueAtTime(45, now + 1.3);

      bassGain.gain.setValueAtTime(0.32, now + 0.75);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now + 0.75);
      bassOsc.stop(now + 1.35);
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

// Universal Podium Fanfare Helper
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
  totalParticipants = 1
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
    playVictoryAudio();

    setTimeout(() => {
      setBurstState('REVEALED');
      triggerConfettiCannons();
    }, 450);
  }, [playVictoryAudio, triggerConfettiCannons]);

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
                <Volume2 className="w-4 h-4" />
                <span>
                  {podiumRank === 1 ? 'Play Winner Fanfare 🎺' : podiumRank === 2 ? 'Play Silver Fanfare 🎵' : 'Play Bronze Fanfare 🔔'}
                </span>
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
