import React, { useState, useEffect } from 'react';
import { AttendanceSession } from '../types';
import { generateAttendanceQr, downloadQrImage } from '../utils/qrUtils';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Minimize2, 
  Users, 
  Clock, 
  Sparkles, 
  QrCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface AttendanceQrModalProps {
  session: AttendanceSession | null;
  onClose: () => void;
  onOpenRoster?: (session: AttendanceSession) => void;
  initialProjectorMode?: boolean;
}

export const AttendanceQrModal: React.FC<AttendanceQrModalProps> = ({
  session,
  onClose,
  onOpenRoster,
  initialProjectorMode = false
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProjector, setIsProjector] = useState<boolean>(initialProjectorMode);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!session) return;
    generateAttendanceQr(session.code, 450).then(setQrDataUrl);
  }, [session?.code]);

  // Expiration countdown
  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const diff = new Date(session.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  // Keyboard shortcut: ESC to exit projector or close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isProjector) {
          setIsProjector(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProjector, onClose]);

  if (!session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(session.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      downloadQrImage(session.code, qrDataUrl);
    }
  };

  // -------------------------------------------------------------
  // CINEMA PROJECTOR MODE (FULL SCREEN CLASSROOM PRESENTATION)
  // -------------------------------------------------------------
  if (isProjector) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-6 sm:p-10 backdrop-blur-3xl animate-in fade-in duration-300">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Classroom Projector Mode • Live Attendance</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {session.community} <span className="text-slate-400 text-sm font-normal">({session.department})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsProjector(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center space-x-2 transition-all cursor-pointer"
              title="Exit Projector Mode (ESC)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Projector</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Center Stage: Giant High-Definition QR Code + Giant 6-Digit OTP */}
        <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6">
          <div className="relative group">
            {/* Ambient neon backglow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
            
            <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-white/30 flex items-center justify-center">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`Attendance QR for session ${session.code}`} 
                  className="w-72 h-72 sm:w-96 sm:h-96 object-contain rounded-xl select-none"
                />
              ) : (
                <div className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center text-slate-400 text-sm">
                  Generating QR Code...
                </div>
              )}
            </div>
          </div>

          {/* 6-Digit Numeric OTP */}
          <div className="text-center space-y-2">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
              Or Enter 6-Digit Numeric OTP on Student Portal
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-6xl sm:text-7xl font-mono font-black tracking-widest text-amber-300 bg-white/10 px-8 py-3 rounded-2xl border border-white/20 shadow-2xl select-all">
                {session.code}
              </div>
              <button
                onClick={handleCopy}
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
                title="Copy Code"
              >
                {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-slate-300">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
              <Users className="w-4 h-4" />
              <span>{session.attendee_count || 0} Students Marked</span>
            </span>

            <span className="flex items-center space-x-1.5 text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-400/30">
              <Clock className="w-4 h-4" />
              <span>Remaining: <strong>{timeLeft}</strong></span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>
            {onOpenRoster && (
              <button
                onClick={() => onOpenRoster(session)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>View Attendees</span>
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD POPUP MODAL (SHOWN RIGHT AFTER GENERATION & ON DEMAND)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 border border-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Live Active Attendance Session</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                OTP & QR Code Ready
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Display Card: QR Code & 6-Digit OTP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          
          {/* QR Code Column */}
          <div className="flex flex-col items-center text-center space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for OTP ${session.code}`} 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl select-none"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Instant Camera Scan QR
              </span>
              <p className="text-[10px] text-slate-400">
                Scan via Student Portal camera or any phone camera
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                title="Download QR code PNG image"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={() => setIsProjector(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                title="Open Projector Mode for big screen / classroom projection"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Projector</span>
              </button>
            </div>
          </div>

          {/* 6-Digit Numeric OTP Column */}
          <div className="space-y-4">
            
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md text-center space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                6-Digit Numeric OTP
              </span>

              <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-amber-300 bg-white/10 py-3 px-4 rounded-xl border border-white/20 select-all">
                {session.code}
              </div>

              <button
                onClick={handleCopy}
                className="w-full py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-200" />
                    <span>Copy Numeric OTP</span>
                  </>
                )}
              </button>
            </div>

            {/* Session Info Badges */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Target Community:</span>
                <span className="font-bold text-slate-900 text-right">{session.community}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-bold text-slate-900">{session.department}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Time Remaining:</span>
                <span className="font-mono font-bold text-amber-600 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-800 font-semibold flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marked Attendees:</span>
                </span>
                <span className="font-black text-emerald-700">{session.attendee_count || 0} students</span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={() => setIsProjector(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-slate-600" />
            <span>Launch Projector View</span>
          </button>

          <div className="flex items-center space-x-2">
            {onOpenRoster && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRoster(session);
                }}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>View Attendees</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 apple-btn-primary text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
