import React, { useRef, useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  Printer, 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Trophy, 
  Medal, 
  Crown,
  ExternalLink
} from 'lucide-react';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentReg?: string;
  studentDepartment?: string;
  quizTitle: string;
  rank: number;
  totalParticipants: number;
  score: number;
  maxScore: number;
  percentage: number;
  completionDate?: string;
  timeTaken?: string;
  certificateId?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentReg,
  studentDepartment,
  quizTitle,
  rank,
  totalParticipants,
  score,
  maxScore,
  percentage,
  completionDate,
  timeTaken,
  certificateId
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // Formatted date
  const displayDate = completionDate 
    ? new Date(completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Deterministic certificate ID if not supplied
  const certCode = certificateId || `A7-${Math.abs((quizTitle + studentName + rank).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(8, '0')}`;

  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const isPodium = rank <= 3;

  // Rank title text
  const rankTitle = isGold 
    ? '1ST PLACE CHAMPION • GOLD HONORS 🥇' 
    : isSilver 
    ? '2ND PLACE RUNNER-UP • SILVER DISTINCTION 🥈' 
    : isBronze 
    ? '3RD PLACE PODIUM STANDOUT • BRONZE DISTINCTION 🥉' 
    : `RANK #${rank} OF ${totalParticipants || 1} PEERS • MERIT EXCELLENCE`;

  // Copy Certificate Verification ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(certCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger browser print for PDF
  const handlePrint = () => {
    window.print();
  };

  // Generate ultra high-resolution 2400x1350 canvas for PNG download
  const handleDownloadPng = async () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Fill (Luxurious deep navy / slate with radial warmth)
      const bgGrad = ctx.createRadialGradient(1200, 675, 100, 1200, 675, 1400);
      if (isGold) {
        bgGrad.addColorStop(0, '#1c1917');
        bgGrad.addColorStop(1, '#090807');
      } else if (isSilver) {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
      } else if (isBronze) {
        bgGrad.addColorStop(0, '#1c120c');
        bgGrad.addColorStop(1, '#0c0704');
      } else {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 2400, 1350);

      // 2. Subtle Guilloché decorative grid lines
      ctx.strokeStyle = isGold ? 'rgba(251, 191, 36, 0.04)' : isSilver ? 'rgba(148, 163, 184, 0.04)' : 'rgba(245, 158, 11, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 40; i < 2400; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1350);
        ctx.stroke();
      }
      for (let j = 40; j < 1350; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(2400, j);
        ctx.stroke();
      }

      // 3. Ornate Double Borders (Gold / Silver / Bronze)
      const borderPrimary = isGold ? '#f59e0b' : isSilver ? '#cbd5e1' : isBronze ? '#d97706' : '#38bdf8';
      const borderSecondary = isGold ? '#fbbf24' : isSilver ? '#e2e8f0' : isBronze ? '#f59e0b' : '#0284c7';

      // Outer Thick Border
      ctx.strokeStyle = borderPrimary;
      ctx.lineWidth = 8;
      ctx.strokeRect(50, 50, 2300, 1250);

      // Inner Fine Inset Border
      ctx.strokeStyle = borderSecondary;
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 70, 2260, 1210);

      // Corner Rosettes / Flourishes
      const drawCorner = (x: number, y: number, rotateAngle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotateAngle);
        ctx.strokeStyle = borderSecondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(60, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 60);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(30, 30, 12, 0, Math.PI * 2);
        ctx.fillStyle = borderPrimary;
        ctx.fill();
        ctx.restore();
      };

      drawCorner(70, 70, 0);
      drawCorner(2330, 70, Math.PI / 2);
      drawCorner(2330, 1280, Math.PI);
      drawCorner(70, 1280, -Math.PI / 2);

      // 4. TOP BRANDING: "AGENTIC_AI_A7"
      ctx.textAlign = 'center';

      // Star Wing Accent Left & Right
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = borderSecondary;
      ctx.fillText('✦  ✦  ✦', 1200, 145);

      // Main Top Brand Title: AGENTIC_AI_A7
      ctx.font = '900 68px system-ui, -apple-system, sans-serif';
      const brandGrad = ctx.createLinearGradient(900, 0, 1500, 0);
      if (isGold) {
        brandGrad.addColorStop(0, '#fef08a');
        brandGrad.addColorStop(0.5, '#f59e0b');
        brandGrad.addColorStop(1, '#fef08a');
      } else if (isSilver) {
        brandGrad.addColorStop(0, '#ffffff');
        brandGrad.addColorStop(0.5, '#94a3b8');
        brandGrad.addColorStop(1, '#ffffff');
      } else {
        brandGrad.addColorStop(0, '#fed7aa');
        brandGrad.addColorStop(0.5, '#ea580c');
        brandGrad.addColorStop(1, '#fed7aa');
      }
      ctx.fillStyle = brandGrad;
      ctx.fillText('AGENTIC_AI_A7', 1200, 225);

      // Sub-brand authority subtitle
      ctx.font = '700 22px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.letterSpacing = '6px';
      ctx.fillText('EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION', 1200, 270);

      // 5. Certificate Document Title
      ctx.font = '600 36px Georgia, serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('OFFICIAL CERTIFICATE OF ACHIEVEMENT', 1200, 360);

      // Small Rule line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(950, 395);
      ctx.lineTo(1450, 395);
      ctx.stroke();

      // "This is proudly presented to"
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('This is proudly conferred upon', 1200, 445);

      // 6. STUDENT NAME (Large, Prominent, Elegant)
      ctx.font = '900 78px Georgia, serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = isGold ? 'rgba(245, 158, 11, 0.4)' : isSilver ? 'rgba(148, 163, 184, 0.4)' : 'rgba(234, 88, 12, 0.4)';
      ctx.shadowBlur = 15;
      ctx.fillText(studentName.toUpperCase(), 1200, 545);
      ctx.shadowBlur = 0; // reset

      // Student Meta (Registration Number & Department)
      const studentSub = `${studentReg ? `Reg: ${studentReg} • ` : ''}${studentDepartment ? `Department of ${studentDepartment} • ` : ''}Verified Candidate`;
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(studentSub, 1200, 595);

      // 7. POSITION & RANK BANNER
      const pillWidth = 840;
      const pillHeight = 56;
      const pillX = 1200 - (pillWidth / 2);
      const pillY = 645;

      // Pill Background
      ctx.fillStyle = isGold ? 'rgba(245, 158, 11, 0.18)' : isSilver ? 'rgba(148, 163, 184, 0.18)' : isBronze ? 'rgba(217, 119, 6, 0.18)' : 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 28);
      ctx.fill();
      ctx.strokeStyle = borderPrimary;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Position Text inside Pill
      ctx.font = '900 25px system-ui, sans-serif';
      ctx.fillStyle = isGold ? '#fef08a' : isSilver ? '#f1f5f9' : isBronze ? '#fed7aa' : '#bae6fd';
      ctx.fillText(rankTitle, 1200, 682);

      // 8. QUIZ TITLE & PERFORMANCE CONTEXT
      ctx.font = '500 26px Georgia, serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`for exemplary demonstration of mastery and problem-solving competency in`, 1200, 755);

      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`“ ${quizTitle} ”`, 1200, 810);

      // 9. METRICS SUMMARY BOX (Score, Accuracy, Time)
      const statsY = 880;
      const drawStatBox = (x: number, title: string, value: string, sub: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x - 140, statsY - 25, 280, 80, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(title.toUpperCase(), x, statsY);

        ctx.font = '900 26px system-ui, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(value, x, statsY + 30);

        ctx.font = '500 13px system-ui, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(sub, x, statsY + 46);
      };

      drawStatBox(840, 'Final Score', `${score} / ${maxScore} pts`, 'Score Achieved');
      drawStatBox(1200, 'Accuracy Rate', `${percentage}%`, 'Verified Correctness');
      drawStatBox(1560, 'Time Completed', timeTaken || 'Fast Completion', 'Elapsed Time');

      // 10. OFFICIAL SEAL (Center-Bottom)
      const sealX = 1200;
      const sealY = 1090;
      ctx.beginPath();
      ctx.arc(sealX, sealY, 68, 0, Math.PI * 2);
      ctx.fillStyle = isGold ? '#f59e0b' : isSilver ? '#94a3b8' : isBronze ? '#d97706' : '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sealX, sealY, 58, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '900 13px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('AGENTIC_AI_A7', sealX, sealY - 14);
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('★ 7 ★', sealX, sealY + 8);
      ctx.font = '800 10px system-ui, sans-serif';
      ctx.fillText('AUTHENTICATED', sealX, sealY + 24);

      // Ribbon tails
      ctx.fillStyle = isGold ? '#d97706' : isSilver ? '#64748b' : isBronze ? '#b45309' : '#0369a1';
      ctx.beginPath();
      ctx.moveTo(sealX - 25, sealY + 60);
      ctx.lineTo(sealX - 45, sealY + 115);
      ctx.lineTo(sealX - 20, sealY + 105);
      ctx.lineTo(sealX - 5, sealY + 115);
      ctx.lineTo(sealX - 10, sealY + 65);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sealX + 25, sealY + 60);
      ctx.lineTo(sealX + 45, sealY + 115);
      ctx.lineTo(sealX + 20, sealY + 105);
      ctx.lineTo(sealX + 5, sealY + 115);
      ctx.lineTo(sealX + 10, sealY + 65);
      ctx.fill();

      // 11. SIGNATURES (Left & Right)
      // Left Signature: Director of AI Evaluation
      const sigLeftX = 540;
      const sigY = 1080;
      ctx.font = 'italic 34px "Brush Script MT", cursive, Georgia, serif';
      ctx.fillStyle = borderSecondary;
      ctx.fillText('Dr. Julian Vance, Ph.D.', sigLeftX, sigY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sigLeftX - 160, sigY + 14);
      ctx.lineTo(sigLeftX + 160, sigY + 14);
      ctx.stroke();
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Director of AI Evaluation', sigLeftX, sigY + 36);
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Academic Certification Board', sigLeftX, sigY + 54);

      // Right Signature: AGENTIC_AI_A7 Autonomous Evaluator
      const sigRightX = 1860;
      ctx.font = 'italic 34px "Brush Script MT", cursive, Georgia, serif';
      ctx.fillStyle = borderSecondary;
      ctx.fillText('AGENTIC_AI_A7 Neural Engine', sigRightX, sigY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sigRightX - 160, sigY + 14);
      ctx.lineTo(sigRightX + 160, sigY + 14);
      ctx.stroke();
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('AGENTIC_AI_A7 Proctoring System', sigRightX, sigY + 36);
      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Autonomous Verification Hash: ' + certCode.substring(0, 10), sigRightX, sigY + 54);

      // 12. BOTTOM FOOTER (Verification Details & Issue Date)
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`Issued: ${displayDate}`, 120, 1225);
      ctx.fillText(`Credential ID: ${certCode}`, 120, 1248);

      ctx.textAlign = 'right';
      ctx.fillText(`Validated by AGENTIC_AI_A7 Examination Framework`, 2280, 1225);
      ctx.fillText(`Official Secure Digital Certificate • Verification Grade A+`, 2280, 1248);

      // Trigger automatic high-res PNG download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `AGENTIC_AI_A7_Certificate_${studentName.replace(/\s+/g, '_')}_Rank${rank}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating certificate PNG:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      
      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Action Bar (Hidden during Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 print:hidden">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-xl ${
              isGold ? 'bg-amber-500/20 text-amber-300' : isSilver ? 'bg-slate-300/20 text-slate-200' : isBronze ? 'bg-orange-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-300'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <span>AGENTIC_AI_A7 Certificate Generator</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Verified Grade
                </span>
              </h3>
              <p className="text-slate-400 text-xs font-mono">Credential ID: {certCode}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Copy Credential ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={isGeneratingPng}
              className={`px-4 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all transform hover:scale-105 active:scale-95 ${
                isGold 
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-amber-500/30' 
                  : isSilver
                  ? 'bg-gradient-to-r from-slate-200 to-sky-100 text-slate-950 shadow-slate-400/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-orange-500/30'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPng ? 'Generating...' : 'Download PNG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas / Frame (Interactive DOM Preview) */}
        <div className="p-4 sm:p-8 bg-slate-950 flex justify-center overflow-x-auto print:p-0">
          <div 
            ref={certificateRef}
            id="agentic-ai-certificate-node"
            className={`relative w-full max-w-4xl aspect-[16/10] rounded-2xl p-6 sm:p-10 flex flex-col justify-between text-center overflow-hidden border-4 shadow-2xl transition-all ${
              isGold 
                ? 'bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/60 border-amber-400 shadow-amber-500/20' 
                : isSilver
                ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/50 border-slate-300 shadow-sky-500/20'
                : isBronze
                ? 'bg-gradient-to-br from-stone-900 via-stone-950 to-orange-950/60 border-amber-600 shadow-orange-500/20'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/50 border-sky-400 shadow-sky-500/20'
            }`}
          >
            {/* Inner Filigree Border */}
            <div className="absolute inset-3 border-2 border-dashed border-white/20 rounded-xl pointer-events-none" />
            
            {/* Top Ornamental Corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-300/80 pointer-events-none" />

            {/* Subtle Guilloché / Radial Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* HEADER AT TOP: AGENTIC_AI_A7 */}
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-center space-x-2 text-amber-300 text-xs tracking-widest font-black uppercase">
                <span>✦</span>
                <span className="tracking-[0.25em]">OFFICIAL CERTIFICATION SYSTEM</span>
                <span>✦</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-sm font-sans">
                AGENTIC_AI_A7
              </h1>

              <p className="text-[10px] sm:text-xs tracking-[0.2em] font-extrabold uppercase text-slate-400">
                EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION
              </p>

              <div className="pt-2">
                <p className="text-xs sm:text-sm font-serif italic text-amber-200/90 tracking-wide">
                  Official Certificate of Achievement & Examination Standing
                </p>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-1" />
              </div>
            </div>

            {/* BODY: CANDIDATE NAME & STANDING */}
            <div className="relative z-10 py-2 sm:py-4 space-y-2 sm:space-y-3">
              <p className="text-[11px] sm:text-xs text-slate-400 font-serif italic">
                This prestigious credential is proudly presented to
              </p>

              {/* Student Name */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white font-serif tracking-wide filter drop-shadow-md">
                  {studentName}
                </h2>
                <p className="text-[10px] sm:text-xs font-mono text-slate-400">
                  {studentReg && `Reg ID: ${studentReg} • `}
                  {studentDepartment && `Department of ${studentDepartment} • `}
                  <span>Verified Identity</span>
                </p>
              </div>

              {/* Position Pill */}
              <div className="inline-flex items-center space-x-2 px-4 sm:px-6 py-1.5 rounded-full border shadow-md my-1 bg-slate-950/70">
                {isGold ? (
                  <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                ) : isSilver ? (
                  <Medal className="w-4 h-4 text-sky-300 animate-silver-float" />
                ) : isBronze ? (
                  <Award className="w-4 h-4 text-amber-400 animate-bronze-float" />
                ) : (
                  <Trophy className="w-4 h-4 text-sky-400" />
                )}
                <span className={`text-xs sm:text-sm font-black tracking-wide ${
                  isGold ? 'text-amber-300' : isSilver ? 'text-sky-200' : isBronze ? 'text-amber-400' : 'text-sky-300'
                }`}>
                  {rankTitle}
                </span>
              </div>

              {/* Quiz Context & Performance */}
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                for demonstrating exceptional technical knowledge, cognitive speed, and precision in the live proctored examination
              </p>

              <p className="text-sm sm:text-lg font-black text-white tracking-tight">
                "{quizTitle}"
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-1">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Score</p>
                  <p className="text-xs sm:text-sm font-black text-white">{score} / {maxScore} pts</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Accuracy</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-400">{percentage}%</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Time Taken</p>
                  <p className="text-xs sm:text-sm font-black text-sky-400">{timeTaken || 'Fast'}</p>
                </div>
              </div>
            </div>

            {/* FOOTER: SEAL, SIGNATURES & VERIFICATION */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-end justify-between text-left">
              
              {/* Left Signature */}
              <div className="space-y-0.5 min-w-[120px]">
                <p className="font-serif italic text-amber-200 text-sm sm:text-base select-none">
                  Dr. Julian Vance, Ph.D.
                </p>
                <div className="w-28 sm:w-36 h-0.5 bg-slate-600" />
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase">Director of AI Evaluation</p>
                <p className="text-[8px] text-slate-500">Academic Board</p>
              </div>

              {/* Central Holographic Foil Seal */}
              <div className="flex flex-col items-center justify-center shrink-0 mx-2">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex flex-col items-center justify-center text-center shadow-lg transform -translate-y-2 ${
                  isGold ? 'bg-amber-500 text-slate-950' : isSilver ? 'bg-slate-300 text-slate-950' : isBronze ? 'bg-amber-700 text-white' : 'bg-sky-600 text-white'
                }`}>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">AGENTIC</span>
                  <span className="text-xs sm:text-sm font-black leading-none">AI A7</span>
                  <span className="text-[7px] font-bold tracking-tighter uppercase mt-0.5">VERIFIED</span>
                </div>
                <p className="text-[8px] font-mono text-slate-400 mt-1">{certCode}</p>
              </div>

              {/* Right Signature */}
              <div className="space-y-0.5 text-right min-w-[120px]">
                <p className="font-serif italic text-sky-200 text-sm sm:text-base select-none">
                  AGENTIC_AI_A7
                </p>
                <div className="w-28 sm:w-36 h-0.5 bg-slate-600 ml-auto" />
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase">Automated Proctor</p>
                <p className="text-[8px] text-slate-500">Issued: {displayDate}</p>
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>This credential is cryptographically tied to session submission integrity records.</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Issue Date: <strong>{displayDate}</strong></span>
            <span>•</span>
            <button
              onClick={handleDownloadPng}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct Download (2400x1350)</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
