import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Loader2, 
  Clock, 
  Camera, 
  QrCode, 
  RotateCcw, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { extractNumericOtp, playSuccessChime } from '../utils/qrUtils';

export const StudentAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'otp' ? 'otp' : 'camera';
  
  const [mode, setMode] = useState<'camera' | 'otp'>(initialMode);
  const [code, setCode] = useState<string>(searchParams.get('code') || '');
  const [stats, setStats] = useState<any>({ total: 0, present: 0, percentage: 100, records: [] });
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStarting, setCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [fileScanning, setFileScanning] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoSubmittedRef = useRef<boolean>(false);

  const fetchAttendance = () => {
    api.get('/attendance')
      .then(res => setStats(res.data))
      .catch(err => console.error('Error fetching attendance stats:', err));
  };

  const fetchActiveSession = () => {
    api.get('/attendance/active-session')
      .then(res => {
        if (res.data.hasActive) {
          setActiveSession(res.data.session);
          setAlreadyMarked(res.data.alreadyMarked);
        } else {
          setActiveSession(null);
          setAlreadyMarked(false);
        }
      })
      .catch(err => console.error('Error checking active session:', err));
  };

  useEffect(() => {
    fetchAttendance();
    fetchActiveSession();
  }, []);

  // Handle URL deep link (e.g. /attendance?code=748291)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !autoSubmittedRef.current) {
      const clean = extractNumericOtp(urlCode);
      if (clean) {
        autoSubmittedRef.current = true;
        setCode(clean);
        submitAttendance(clean);
      }
    }
  }, [searchParams]);

  // Scanner lifecycle: start when mode === 'camera', stop when unmounting or switching to 'otp'
  useEffect(() => {
    if (mode === 'camera' && !alreadyMarked) {
      startScanner(cameraFacing);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [mode, cameraFacing, alreadyMarked]);

  const startScanner = async (facing: 'environment' | 'user') => {
    // Wait for DOM element to mount
    await new Promise(r => setTimeout(r, 150));
    const container = document.getElementById('qr-camera-viewport');
    if (!container) return;

    setCameraStarting(true);
    setCameraError(null);

    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const qrScanner = scannerRef.current || new Html5Qrcode('qr-camera-viewport');
      scannerRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: facing },
        {
          fps: 15,
          qrbox: (w, h) => {
            const min = Math.min(w, h);
            const size = Math.max(180, Math.floor(min * 0.72));
            return { width: size, height: size };
          },
          aspectRatio: 1.0
        },
        (decodedText) => {
          onQrCodeDetected(decodedText);
        },
        () => {} // Ignore continuous search frames
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not found on this device.');
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error clearing scanner:', err);
      }
    }
    setCameraActive(false);
  };

  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  const onQrCodeDetected = async (decodedText: string) => {
    const otp = extractNumericOtp(decodedText);
    if (!otp) return;

    // Immediately stop scanner to avoid duplicate submissions
    await stopScanner();
    submitAttendance(otp);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setMessage(null);

    try {
      // Create dedicated scanner for file decode
      const qrScanner = new Html5Qrcode('qr-camera-viewport');
      const text = await qrScanner.scanFile(file, true);
      qrScanner.clear();
      
      const otp = extractNumericOtp(text);
      if (otp) {
        submitAttendance(otp);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'No attendance OTP found in this QR image. Please enter the 6-digit code manually.' 
        });
      }
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: 'Could not detect a QR code in the uploaded image. Try taking a clearer photo or enter the 6-digit OTP.' 
      });
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitAttendance = (codeToSubmit: string) => {
    const cleanCode = codeToSubmit.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit numeric OTP (e.g. 748291).' });
      return;
    }

    setLoading(true);
    setMessage(null);

    api.post('/attendance/mark', { code: cleanCode })
      .then(res => {
        // Trigger celebratory audio chime and confetti burst!
        playSuccessChime();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}

        if (navigator.vibrate) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {}
        }

        setMessage({ 
          type: 'success', 
          text: '✓ Attendance Marked Successfully!',
          details: `Session OTP ${cleanCode} verified at ${new Date().toLocaleTimeString()}`
        });

        setCode('');
        setAlreadyMarked(true);
        fetchAttendance();
        fetchActiveSession();
      })
      .catch(err => {
        const text = err.response?.data?.message || 'Invalid or expired attendance OTP.';
        setMessage({ type: 'error', text });
      })
      .finally(() => setLoading(false));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAttendance(code);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Top Header Card */}
      <div className="apple-glass-card p-4 sm:p-7 rounded-2xl sm:rounded-[26px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Smart Attendance Hub</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            <span>Mark Attendance</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Scan the attendance QR code displayed by your faculty with your camera or enter the 6-digit numeric OTP.
          </p>
        </div>

        {/* Live Active Session Indicator Badge */}
        {activeSession && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl flex items-center space-x-2.5 w-full sm:w-auto shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="text-left text-xs min-w-0">
              <span className="font-extrabold text-emerald-800 block truncate">Faculty Session Active</span>
              <span className="text-[10px] text-emerald-600 font-medium truncate">Expires: {new Date(activeSession.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Already Marked Alert */}
      {alreadyMarked && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/30">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:space-x-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 block">
                Status: PRESENT
              </span>
              <h3 className="text-sm sm:text-lg font-bold text-white">
                You're all set! Attendance marked for this session.
              </h3>
              <p className="text-xs text-slate-300">
                Your presence has been recorded in the cohort ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                setAlreadyMarked(false);
                setMessage(null);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors cursor-pointer text-center"
            >
              Scan Another Session
            </button>
          </div>
        </div>
      )}

      {/* Main Dual Attendance Card */}
      {!alreadyMarked && (
        <div className="apple-glass-card rounded-2xl sm:rounded-[28px] p-4 sm:p-8 space-y-5 sm:space-y-6">
          
          {/* Mode Switcher Tabs (Segmented Control) */}
          <div className="flex items-center justify-center p-1 bg-slate-100/80 rounded-2xl max-w-sm mx-auto border border-slate-200 w-full">
            <button
              type="button"
              onClick={() => {
                setMode('camera');
                setMessage(null);
              }}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer ${
                mode === 'camera'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Camera QR Scanner</span>
              <span className="sm:hidden text-[11px]">QR Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setMessage(null);
              }}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer ${
                mode === 'otp'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Enter 6-Digit OTP</span>
              <span className="sm:hidden text-[11px]">Enter OTP</span>
            </button>
          </div>

          {/* MODE 1: CAMERA QR CODE SCANNER */}
          {mode === 'camera' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Camera Viewport Container */}
              <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                
                {/* Real HTML5 QR Scanner Target Element */}
                <div id="qr-camera-viewport" className="w-full h-full" />

                {/* Sweeping Laser Line when scanning */}
                {cameraActive && (
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-laser-sweep pointer-events-none z-20" />
                )}

                {/* Reticle Focus Corners */}
                {cameraActive && (
                  <div className="absolute inset-8 pointer-events-none z-10 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-sm" />
                      <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-sm" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-sm" />
                      <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-sm" />
                    </div>
                  </div>
                )}

                {/* Camera Starting / Loading State */}
                {cameraStarting && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 text-white z-30">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    <span className="text-xs font-bold">Initializing camera...</span>
                  </div>
                )}

                {/* Camera Error State */}
                {cameraError && !cameraActive && !cameraStarting && (
                  <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30 text-white">
                    <AlertCircle className="w-10 h-10 text-rose-400" />
                    <span className="text-xs font-bold text-rose-300">{cameraError}</span>
                    <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                      <button
                        onClick={() => startScanner(cameraFacing)}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setMode('otp')}
                        className="py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Switch to Manual OTP
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Camera Scanner Controls */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={!cameraActive}
                  className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  title="Switch between front and back camera"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Flip Camera</span>
                </button>

                {cameraActive ? (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="px-3 sm:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Pause Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startScanner(cameraFacing)}
                    className="px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span>Start Camera</span>
                  </button>
                )}

                {/* Upload QR Image File Fallback */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileScanning}
                  className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  title="Upload a photo or screenshot of the QR code"
                >
                  {fileScanning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>Upload QR Photo</span>
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 px-2 leading-relaxed">
                Point your device camera at the attendance QR code displayed on the screen. It will scan and mark automatically.
              </p>

            </div>
          )}

          {/* MODE 2: 6-DIGIT NUMERIC OTP INPUT */}
          {mode === 'otp' && (
            <div className="max-w-md mx-auto space-y-6 text-center animate-in fade-in duration-200">
              
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-indigo-100">
                <KeyRound className="w-7 h-7" />
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter 6-Digit Numeric OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="e.g. 748291"
                    value={code}
                    onChange={e => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(numericOnly);
                      setMessage(null);
                    }}
                    className="w-full tracking-widest text-center text-3xl sm:text-4xl font-mono font-extrabold py-3.5 px-4 liquid-glass-input rounded-2xl placeholder:text-slate-400 select-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Only numbers are accepted. Ask your faculty for the 6-digit code.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3.5 apple-btn-primary disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer flex items-center justify-center space-x-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Numeric OTP...</span>
                    </>
                  ) : (
                    <span>Submit Attendance OTP</span>
                  )}
                </button>
              </form>

            </div>
          )}

          {/* Status Feedback Message Banner */}
          {message && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-2 animate-in fade-in ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-xs' 
                : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-xs'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-extrabold">{message.text}</span>
              </div>
              {message.details && (
                <span className="text-slate-500 font-mono text-[11px] font-normal">
                  ({message.details})
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* Attendance Stats & History Log */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-[26px] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/80 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>My Attendance Summary</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {stats.present || 0} / {stats.total || 0} Sessions
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="liquid-glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center bg-white/60">
            <div className="text-xl sm:text-3xl font-black text-slate-900">{stats.total || 0}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              <span className="hidden sm:inline">Total Sessions</span>
              <span className="sm:hidden">Total</span>
            </div>
          </div>
          <div className="liquid-glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center bg-emerald-50/50">
            <div className="text-xl sm:text-3xl font-black text-emerald-700">{stats.present || 0}</div>
            <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-0.5 truncate">
              <span className="hidden sm:inline">Attended Sessions</span>
              <span className="sm:hidden">Attended</span>
            </div>
          </div>
          <div className="liquid-glass-card-hover p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center bg-purple-50/50">
            <div className="text-xl sm:text-3xl font-black text-purple-700">{stats.percentage || 100}%</div>
            <div className="text-[10px] sm:text-[11px] text-purple-600 font-semibold mt-0.5 truncate">
              <span className="hidden sm:inline">Attendance Rate</span>
              <span className="sm:hidden">Rate</span>
            </div>
          </div>
        </div>

        {/* Attended Sessions Log */}
        {stats.records && stats.records.length > 0 ? (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Verified Attendance Records</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {stats.records.map((r: any) => (
                <div key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex items-center space-x-1.5 flex-wrap min-w-0">
                      <span className="font-bold text-slate-800 text-xs">Verified</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md truncate max-w-[150px] sm:max-w-none">{r.session_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-500 font-mono text-[11px] pl-6 sm:pl-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(r.marked_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No session attendance records logged yet.
          </div>
        )}
      </div>

    </div>
  );
};
