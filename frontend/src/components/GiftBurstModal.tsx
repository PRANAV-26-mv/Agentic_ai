import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, X, RotateCcw, Award, CheckCircle2, Zap } from 'lucide-react';

export interface GiftBurstModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  score?: number | string;
  maxScore?: number | string;
  accuracy?: number | string;
  timeTaken?: string;
  totalParticipants?: number;
}

export const GiftBurstModal: React.FC<GiftBurstModalProps> = ({
  isOpen,
  onClose,
  quizTitle,
  score,
  maxScore,
  accuracy,
  timeTaken,
  totalParticipants = 1
}) => {
  const [burstState, setBurstState] = useState<'WOBBLE' | 'BURSTING' | 'REVEALED'>('WOBBLE');
  const timerRef = useRef<any>(null);

  // Play synthesized joyful fanfare without external audio assets
  const playVictoryAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Fanfare arpeggio chord: C5, E5, G5, C6, E6
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.35 },
        { freq: 659.25, time: 0.12, dur: 0.35 },
        { freq: 783.99, time: 0.24, dur: 0.35 },
        { freq: 1046.50, time: 0.38, dur: 0.75 },
        { freq: 1318.51, time: 0.52, dur: 0.9 }
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur);
      });
    } catch (e) {
      // Graceful fallback for audio restrictions
    }
  }, []);

  // Fire multi-stage celebratory confetti
  const triggerConfettiCannons = useCallback(() => {
    // 1. Center burst
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#ffffff', '#8b5cf6']
    });

    // 2. Left and Right cannon angles
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#fbbf24']
      });
    }, 250);

    // 3. Golden star shower
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ['star'],
        colors: ['#fbbf24', '#f59e0b', '#ffffff']
      });
    }, 500);
  }, []);

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
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border-2 border-amber-400/40 p-6 sm:p-8 text-center shadow-2xl overflow-hidden animate-champion-glow"
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
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* STATE 1: WOBBLING GIFT BOX */}
        {burstState === 'WOBBLE' && (
          <div className="py-8 space-y-6 flex flex-col items-center justify-center">
            
            <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>1st Place Champion Reward!</span>
            </div>

            {/* Interactive Wobbling Gift Box */}
            <div 
              onClick={triggerBurst}
              className="cursor-pointer transform hover:scale-105 transition-transform"
              title="Click to burst open now!"
            >
              <div className="relative animate-gift-wobble">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-amber-200/80 relative">
                  {/* Decorative Ribbons */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6 bg-rose-600/90 shadow-sm" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-rose-600/90 shadow-sm" />
                  
                  {/* Gift Bow */}
                  <div className="absolute -top-4 text-4xl select-none filter drop-shadow-md">
                    🎀
                  </div>
                  <span className="text-5xl select-none z-10 filter drop-shadow-lg">
                    🎁
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                Unwrapping Your 1st Place Gift...
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                You attended and won <strong className="text-white">{quizTitle}</strong>! Tap the gift box to burst open!
              </p>
            </div>

            <button
              onClick={triggerBurst}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/30 cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
            >
              Burst Open Now! 💥
            </button>
          </div>
        )}

        {/* STATE 2: BURSTING FLASH */}
        {burstState === 'BURSTING' && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="animate-gift-burst text-7xl select-none">
              💥
            </div>
            <p className="text-amber-300 font-black text-lg animate-pulse tracking-widest uppercase">
              B U R S T !
            </p>
          </div>
        )}

        {/* STATE 3: REVEALED 1ST PLACE TROPHY & CELEBRATION */}
        {burstState === 'REVEALED' && (
          <div className="space-y-6 pt-2 animate-trophy-entrance">
            
            {/* Top Winner Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-400/60 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-amber-300 shimmer-badge">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
              <span>Official 1st Place Winner 🥇</span>
            </div>

            {/* Glowing Trophy Graphic */}
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              {/* Rotating background sparkle halo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-300/20 to-transparent animate-sparkle-spin pointer-events-none blur-lg" />
              
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-0.5 shadow-2xl shadow-amber-500/50 flex items-center justify-center border-2 border-yellow-200">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                  <Trophy className="w-14 h-14 text-amber-400 fill-amber-400 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                </div>
              </div>

              {/* Floating Mini Stars */}
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              <Crown className="w-5 h-5 text-amber-300 absolute -top-3 left-4 animate-bounce" />
            </div>

            {/* Champion Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                CHAMPION OF THE ROOM!
              </h2>
              <p className="text-sm font-semibold text-amber-100/90 mt-1 max-w-sm mx-auto break-words">
                {quizTitle}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                You outperformed all competitors and seized rank #1!
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto pt-1">
              {score !== undefined && (
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                  <p className="text-[10px] uppercase font-bold text-amber-300">Score</p>
                  <p className="text-base font-black mt-0.5">{score} {maxScore ? `/ ${maxScore}` : ''}</p>
                </div>
              )}

              {accuracy !== undefined && (
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                  <p className="text-[10px] uppercase font-bold text-amber-300">Accuracy</p>
                  <p className="text-base font-black mt-0.5">{accuracy}%</p>
                </div>
              )}

              <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
                <p className="text-[10px] uppercase font-bold text-amber-300">Rank</p>
                <p className="text-base font-black text-amber-300 mt-0.5">#1 🥇</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => {
                  triggerConfettiCannons();
                  playVictoryAudio();
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-400/30 flex items-center space-x-1.5 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Burst Confetti 🎊</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                Claim Victory 🌟
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
