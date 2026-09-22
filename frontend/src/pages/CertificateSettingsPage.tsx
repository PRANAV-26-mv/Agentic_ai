import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Award, 
  Save, 
  RotateCcw, 
  Check, 
  Download, 
  Printer, 
  Sparkles, 
  Sliders, 
  Type, 
  Layers, 
  ShieldCheck, 
  FileText, 
  Eye, 
  EyeOff, 
  Trophy, 
  Medal, 
  Crown,
  HelpCircle,
  Building,
  UserCheck
} from 'lucide-react';

export interface CertificateConfig {
  id?: string;
  header_brand_name: string;
  header_subtitle: string;
  document_title: string;
  presentation_line: string;
  rank_1_title: string;
  rank_2_title: string;
  rank_3_title: string;
  rank_participant_title: string;
  signatory_1_name: string;
  signatory_1_title: string;
  signatory_1_subtitle: string;
  signatory_2_name: string;
  signatory_2_title: string;
  signatory_2_subtitle: string;
  seal_text: string;
  seal_subtext: string;
  footer_verification_text: string;
  show_score: boolean;
  show_accuracy: boolean;
  show_time_taken: boolean;
  show_rank: boolean;
  show_signatures: boolean;
  show_seal: boolean;
  show_registration_id: boolean;
  show_department: boolean;
  custom_remarks?: string;
}

export const DEFAULT_CONFIG: CertificateConfig = {
  header_brand_name: 'AGENTIC_AI_A7',
  header_subtitle: 'EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION',
  document_title: 'OFFICIAL CERTIFICATE OF ACHIEVEMENT',
  presentation_line: 'This prestigious credential is proudly presented to',
  rank_1_title: '1ST PLACE CHAMPION • GOLD HONORS 🥇',
  rank_2_title: '2ND PLACE RUNNER-UP • SILVER DISTINCTION 🥈',
  rank_3_title: '3RD PLACE PODIUM STANDOUT • BRONZE DISTINCTION 🥉',
  rank_participant_title: 'RANK #{rank} OF {total} PEERS • MERIT EXCELLENCE',
  signatory_1_name: 'Dr. Julian Vance, Ph.D.',
  signatory_1_title: 'Director of AI Evaluation',
  signatory_1_subtitle: 'Academic Certification Board',
  signatory_2_name: 'AGENTIC_AI_A7 Neural Engine',
  signatory_2_title: 'AGENTIC_AI_A7 Proctoring System',
  signatory_2_subtitle: 'Autonomous Evaluation System',
  seal_text: 'AGENTIC_AI_A7',
  seal_subtext: 'AUTHENTICATED',
  footer_verification_text: 'Validated by AGENTIC_AI_A7 Examination Framework',
  show_score: true,
  show_accuracy: true,
  show_time_taken: true,
  show_rank: true,
  show_signatures: true,
  show_seal: true,
  show_registration_id: true,
  show_department: true,
  custom_remarks: 'Awarded for demonstrating verified technical mastery and proctored assessment excellence.'
};

export const CertificateSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<CertificateConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'BRANDING' | 'RANKS' | 'VISIBILITY' | 'SIGNATURES' | 'VERIFICATION'>('BRANDING');

  // Preview interactive controls
  const [previewRank, setPreviewRank] = useState<1 | 2 | 3 | 4>(1);
  const [previewName, setPreviewName] = useState<string>('PRANAV M V');
  const [previewQuiz, setPreviewQuiz] = useState<string>('Full-Stack Autonomous Systems & AI Architecture');

  // Fetch current settings from backend
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificate-settings');
      if (res.data) {
        setConfig(res.data);
        localStorage.setItem('portal_cert_config', JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to load certificate settings, using defaults or local cache:', e);
      const cached = localStorage.getItem('portal_cert_config');
      if (cached) {
        try {
          setConfig(JSON.parse(cached));
        } catch (_) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save updated settings to backend
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.put('/certificate-settings', config);
      setConfig(res.data.settings);
      localStorage.setItem('portal_cert_config', JSON.stringify(res.data.settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save certificate settings:', e);
      alert('Error saving certificate settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to factory defaults
  const handleReset = async () => {
    if (!window.confirm('Reset all certificate settings back to default AGENTIC_AI_A7 configuration?')) return;
    setSaving(true);
    try {
      const res = await api.post('/certificate-settings/reset');
      setConfig(res.data.settings);
      localStorage.setItem('portal_cert_config', JSON.stringify(res.data.settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to reset settings:', e);
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem('portal_cert_config', JSON.stringify(DEFAULT_CONFIG));
    } finally {
      setSaving(false);
    }
  };

  // Preset Theme Appliers
  const applyPreset = (presetName: string) => {
    if (presetName === 'DEFAULT') {
      setConfig(DEFAULT_CONFIG);
    } else if (presetName === 'UNIVERSITY') {
      setConfig({
        ...config,
        header_brand_name: 'NATIONAL INSTITUTE OF ARTIFICIAL INTELLIGENCE',
        header_subtitle: 'BOARD OF HIGHER TECHNICAL EDUCATION & RESEARCH',
        document_title: 'CERTIFICATE OF SCHOLASTIC MERIT',
        presentation_line: 'Having successfully met all examination criteria, this honour is conferred upon',
        signatory_1_name: 'Prof. Eleanor Wright, Dean',
        signatory_1_title: 'Faculty of Computer Engineering',
        signatory_1_subtitle: 'University Academic Senate',
        signatory_2_name: 'Dr. Marcus Thorne',
        signatory_2_title: 'Controller of Examinations',
        signatory_2_subtitle: 'Office of Academic Assessment',
        seal_text: 'NIAI • SENATE SEAL',
        seal_subtext: 'OFFICIAL RECORD',
        footer_verification_text: 'Verified by University Examination Registrar • Grade A+'
      });
    } else if (presetName === 'OLYMPIAD') {
      setConfig({
        ...config,
        header_brand_name: 'GLOBAL AI & ALGORITHMIC OLYMPIAD',
        header_subtitle: 'INTERNATIONAL COMPUTATIONAL INTELLIGENCE FEDERATION',
        document_title: 'CERTIFICATE OF PODIUM DISTINCTION',
        presentation_line: 'For extraordinary cognitive speed and technical excellence awarded to',
        rank_1_title: 'GRAND GOLD LAUREATE 🥇',
        rank_2_title: 'SILVER MEDALIST DISTINCTION 🥈',
        rank_3_title: 'BRONZE PODIUM EXCELLENCE 🥉',
        signatory_1_name: 'Olympiad Steering Committee',
        signatory_1_title: 'Chairperson of Evaluation',
        signatory_1_subtitle: 'International Jury Board',
        signatory_2_name: 'Autonomous Proctoring AI',
        signatory_2_title: 'Official Benchmark Authority',
        signatory_2_subtitle: 'Deterministic Evaluation Engine',
        seal_text: 'OLYMPIAD AI',
        seal_subtext: 'CHAMPION SEAL',
        footer_verification_text: 'Certified Global Competition Standing'
      });
    }
  };

  // Rank banner formatting for live preview
  const previewRankTitle = previewRank === 1
    ? config.rank_1_title
    : previewRank === 2
    ? config.rank_2_title
    : previewRank === 3
    ? config.rank_3_title
    : config.rank_participant_title.replace('{rank}', '4').replace('{total}', '48');

  const isGold = previewRank === 1;
  const isSilver = previewRank === 2;
  const isBronze = previewRank === 3;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[600px] bg-slate-800 rounded-3xl" />
          <div className="h-[600px] bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Certificate Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Certificate Customizer & Template Editor</span>
          </h1>
          <p className="text-slate-300 text-xs max-w-2xl">
            Control what appears on certificates across all quizzes. Customize branding, header titles, presentation phrases, signatory names, seal text, and metric visibility toggles with instant live preview.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 font-black text-xs rounded-xl flex items-center space-x-2 shadow-lg cursor-pointer transition-all transform hover:scale-105 active:scale-95 ${
              saveSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-amber-500/30'
            }`}
          >
            {saving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = Form Controls, Right = Real-Time Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =========================================================================
            LEFT COLUMN: CONFIGURATION CONTROLS (TABS & FORM INPUTS)
            ========================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Quick Preset Theme Pills */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Template Presets</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset('DEFAULT')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                ★ AGENTIC_AI_A7 Standard
              </button>
              <button
                onClick={() => applyPreset('UNIVERSITY')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                🎓 Academic University
              </button>
              <button
                onClick={() => applyPreset('OLYMPIAD')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                🏆 Global AI Olympiad
              </button>
            </div>
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('BRANDING')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'BRANDING' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Branding & Header</span>
            </button>
            <button
              onClick={() => setActiveTab('RANKS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'RANKS' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Position & Honours</span>
            </button>
            <button
              onClick={() => setActiveTab('VISIBILITY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'VISIBILITY' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Field Visibility</span>
            </button>
            <button
              onClick={() => setActiveTab('SIGNATURES')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'SIGNATURES' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Signatures & Seal</span>
            </button>
            <button
              onClick={() => setActiveTab('VERIFICATION')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'VERIFICATION' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Footer & Notes</span>
            </button>
          </div>

          {/* TAB 1: BRANDING & HEADERS */}
          {activeTab === 'BRANDING' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-white font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Top Header & Organization Branding</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Top Brand Name (Main Top Header)
                </label>
                <input
                  type="text"
                  value={config.header_brand_name}
                  onChange={(e) => setConfig({ ...config, header_brand_name: e.target.value })}
                  placeholder="e.g. AGENTIC_AI_A7"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-black focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Appears at the very top of the certificate in golden metallic styling.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Header Authority Subtitle
                </label>
                <input
                  type="text"
                  value={config.header_subtitle}
                  onChange={(e) => setConfig({ ...config, header_subtitle: e.target.value })}
                  placeholder="e.g. EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Certificate Document Title
                </label>
                <input
                  type="text"
                  value={config.document_title}
                  onChange={(e) => setConfig({ ...config, document_title: e.target.value })}
                  placeholder="e.g. OFFICIAL CERTIFICATE OF ACHIEVEMENT"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-serif italic focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Candidate Presentation Line
                </label>
                <input
                  type="text"
                  value={config.presentation_line}
                  onChange={(e) => setConfig({ ...config, presentation_line: e.target.value })}
                  placeholder="e.g. This prestigious credential is proudly presented to"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-serif italic focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB 2: POSITION & HONOURS */}
          {activeTab === 'RANKS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-white font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Podium Standing & Position Titles</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>1st Place Gold Champion Title</span>
                </label>
                <input
                  type="text"
                  value={config.rank_1_title}
                  onChange={(e) => setConfig({ ...config, rank_1_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-black focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-300 mb-1 flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-sky-400" />
                  <span>2nd Place Silver Runner-Up Title</span>
                </label>
                <input
                  type="text"
                  value={config.rank_2_title}
                  onChange={(e) => setConfig({ ...config, rank_2_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-sky-500/40 rounded-xl text-sky-300 text-xs font-black focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-orange-400" />
                  <span>3rd Place Bronze Standout Title</span>
                </label>
                <input
                  type="text"
                  value={config.rank_3_title}
                  onChange={(e) => setConfig({ ...config, rank_3_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-orange-500/40 rounded-xl text-orange-300 text-xs font-black focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  General Participant Rank Template
                </label>
                <input
                  type="text"
                  value={config.rank_participant_title}
                  onChange={(e) => setConfig({ ...config, rank_participant_title: e.target.value })}
                  placeholder="e.g. RANK #{rank} OF {total} PEERS • MERIT EXCELLENCE"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">Use <code className="text-amber-300">{'{rank}'}</code> and <code className="text-amber-300">{'{total}'}</code> as dynamic placeholders.</p>
              </div>
            </div>
          )}

          {/* TAB 3: VISIBILITY & METRIC TOGGLES */}
          {activeTab === 'VISIBILITY' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-white font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Certificate Elements & Metric Visibility Toggles</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {[
                  { key: 'show_rank', label: 'Position / Rank Badge', desc: 'Display Gold/Silver/Bronze honor pill' },
                  { key: 'show_score', label: 'Final Score Achieved', desc: 'e.g. 95 / 100 pts' },
                  { key: 'show_accuracy', label: 'Accuracy Percentage', desc: 'e.g. 95% rate' },
                  { key: 'show_time_taken', label: 'Completion Duration', desc: 'e.g. 2m 45s' },
                  { key: 'show_registration_id', label: 'Student Registration ID', desc: 'Show student code under name' },
                  { key: 'show_department', label: 'Student Department', desc: 'Show department of candidate' },
                  { key: 'show_signatures', label: 'Dual Signatory Blocks', desc: 'Official evaluation signatures' },
                  { key: 'show_seal', label: 'Holographic Auth Seal', desc: 'Official seal circular crest' },
                ].map((item) => {
                  const isChecked = Boolean((config as any)[item.key]);
                  return (
                    <div
                      key={item.key}
                      onClick={() => setConfig({ ...config, [item.key]: !isChecked })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked 
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{item.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                        isChecked ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SIGNATURES & HOLOGRAPHIC SEAL */}
          {activeTab === 'SIGNATURES' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-white font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Authorized Signatures & Authenticity Seal</span>
              </h3>

              {/* Signatory 1 (Left) */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-amber-300">Signatory 1 (Left Authorized Officer)</p>
                <div>
                  <input
                    type="text"
                    value={config.signatory_1_name}
                    onChange={(e) => setConfig({ ...config, signatory_1_name: e.target.value })}
                    placeholder="Name: e.g. Dr. Julian Vance, Ph.D."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.signatory_1_title}
                    onChange={(e) => setConfig({ ...config, signatory_1_title: e.target.value })}
                    placeholder="Title: Director of AI Evaluation"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={config.signatory_1_subtitle}
                    onChange={(e) => setConfig({ ...config, signatory_1_subtitle: e.target.value })}
                    placeholder="Board: Academic Certification Board"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Signatory 2 (Right) */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-sky-300">Signatory 2 (Right Autonomous System / Officer)</p>
                <div>
                  <input
                    type="text"
                    value={config.signatory_2_name}
                    onChange={(e) => setConfig({ ...config, signatory_2_name: e.target.value })}
                    placeholder="Name: e.g. AGENTIC_AI_A7 Neural Engine"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.signatory_2_title}
                    onChange={(e) => setConfig({ ...config, signatory_2_title: e.target.value })}
                    placeholder="Title: AGENTIC_AI_A7 Proctoring System"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={config.signatory_2_subtitle}
                    onChange={(e) => setConfig({ ...config, signatory_2_subtitle: e.target.value })}
                    placeholder="Subtitle: Autonomous Evaluation System"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Holographic Seal Text */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-xs font-bold text-amber-400">Center Foil Seal Text</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={config.seal_text}
                    onChange={(e) => setConfig({ ...config, seal_text: e.target.value })}
                    placeholder="Main Seal: AGENTIC_AI_A7"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-black focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={config.seal_subtext}
                    onChange={(e) => setConfig({ ...config, seal_subtext: e.target.value })}
                    placeholder="Sub: AUTHENTICATED"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: VERIFICATION & FOOTER NOTES */}
          {activeTab === 'VERIFICATION' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h3 className="text-white font-extrabold text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verification Notes & Remarks</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Footer Verification & Authentication Statement
                </label>
                <input
                  type="text"
                  value={config.footer_verification_text}
                  onChange={(e) => setConfig({ ...config, footer_verification_text: e.target.value })}
                  placeholder="e.g. Validated by AGENTIC_AI_A7 Examination Framework"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Custom Accreditation Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={config.custom_remarks || ''}
                  onChange={(e) => setConfig({ ...config, custom_remarks: e.target.value })}
                  placeholder="e.g. Awarded for demonstrating verified technical mastery..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            RIGHT COLUMN: REAL-TIME LIVE CERTIFICATE PREVIEW
            ========================================================================= */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          
          {/* Preview Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Real-Time Certificate Live Preview</span>
              </p>
              <p className="text-[11px] text-slate-400">Updates immediately as you edit the settings</p>
            </div>

            {/* Podium Rank Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPreviewRank(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewRank === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview 1st Place Gold"
              >
                🥇 1st
              </button>
              <button
                onClick={() => setPreviewRank(2)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewRank === 2 ? 'bg-slate-200 text-slate-950 font-black shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview 2nd Place Silver"
              >
                🥈 2nd
              </button>
              <button
                onClick={() => setPreviewRank(3)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewRank === 3 ? 'bg-amber-600 text-white font-black shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview 3rd Place Bronze"
              >
                🥉 3rd
              </button>
              <button
                onClick={() => setPreviewRank(4)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewRank === 4 ? 'bg-sky-500 text-white font-black shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Preview Participant Rank #4"
              >
                🎖️ #4
              </button>
            </div>
          </div>

          {/* Test Candidate Controls */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              placeholder="Test Student Name"
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold"
            />
            <input
              type="text"
              value={previewQuiz}
              onChange={(e) => setPreviewQuiz(e.target.value)}
              placeholder="Test Quiz Title"
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
            />
          </div>

          {/* Live Rendered Certificate DOM */}
          <div 
            id="admin-preview-certificate-node"
            className={`relative w-full aspect-[16/10] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-center overflow-hidden border-4 shadow-2xl transition-all select-none ${
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
            <div className="absolute inset-2 sm:inset-3 border-2 border-dashed border-white/20 rounded-xl pointer-events-none" />

            {/* Corner Ornamental Accents */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-300/80 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-300/80 pointer-events-none" />

            {/* TOP HEADER: BRAND NAME */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-center space-x-1.5 text-amber-300 text-[10px] tracking-widest font-black uppercase">
                <span>✦</span>
                <span className="tracking-[0.2em]">OFFICIAL CERTIFICATION SYSTEM</span>
                <span>✦</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-sm font-sans uppercase">
                {config.header_brand_name || 'AGENTIC_AI_A7'}
              </h2>

              <p className="text-[9px] sm:text-[10px] tracking-[0.15em] font-extrabold uppercase text-slate-400">
                {config.header_subtitle || 'EXCELLENCE IN ARTIFICIAL INTELLIGENCE & EVALUATION'}
              </p>

              <div>
                <p className="text-[11px] sm:text-xs font-serif italic text-amber-200/90 tracking-wide mt-0.5">
                  {config.document_title || 'OFFICIAL CERTIFICATE OF ACHIEVEMENT'}
                </p>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-0.5" />
              </div>
            </div>

            {/* BODY: PRESENTATION & NAME */}
            <div className="relative z-10 py-1 space-y-1.5">
              <p className="text-[10px] text-slate-400 font-serif italic">
                {config.presentation_line || 'This prestigious credential is proudly presented to'}
              </p>

              <h3 className="text-lg sm:text-2xl font-black text-white font-serif tracking-wide filter drop-shadow-md">
                {previewName}
              </h3>

              {(config.show_registration_id || config.show_department) && (
                <p className="text-[9px] font-mono text-slate-400">
                  {config.show_registration_id && 'Reg ID: 2026-AI-8942 • '}
                  {config.show_department && 'Department of Artificial Intelligence • '}
                  <span>Verified Identity</span>
                </p>
              )}

              {/* Position Pill */}
              {config.show_rank && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border shadow-sm my-0.5 bg-slate-950/70">
                  {isGold ? (
                    <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  ) : isSilver ? (
                    <Medal className="w-3.5 h-3.5 text-sky-300" />
                  ) : isBronze ? (
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Trophy className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span className={`text-[11px] font-black tracking-wide ${
                    isGold ? 'text-amber-300' : isSilver ? 'text-sky-200' : isBronze ? 'text-amber-400' : 'text-sky-300'
                  }`}>
                    {previewRankTitle}
                  </span>
                </div>
              )}

              {/* Quiz Context */}
              <p className="text-[10px] text-slate-300 max-w-sm mx-auto leading-tight line-clamp-1">
                in the official examination: <strong>“{previewQuiz}”</strong>
              </p>

              {/* Optional Custom Remarks */}
              {config.custom_remarks && (
                <p className="text-[9px] text-amber-200/80 italic max-w-sm mx-auto line-clamp-1">
                  "{config.custom_remarks}"
                </p>
              )}

              {/* Metrics Grid */}
              {(config.show_score || config.show_accuracy || config.show_time_taken) && (
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-0.5">
                  {config.show_score && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <p className="text-[8px] uppercase font-bold text-slate-400">Score</p>
                      <p className="text-[11px] font-black text-white">96 / 100</p>
                    </div>
                  )}
                  {config.show_accuracy && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <p className="text-[8px] uppercase font-bold text-slate-400">Accuracy</p>
                      <p className="text-[11px] font-black text-emerald-400">96%</p>
                    </div>
                  )}
                  {config.show_time_taken && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <p className="text-[8px] uppercase font-bold text-slate-400">Time</p>
                      <p className="text-[11px] font-black text-sky-400">2m 45s</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER: SEAL, SIGNATURES & VERIFICATION */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex items-end justify-between text-left">
              
              {/* Left Signature */}
              {config.show_signatures ? (
                <div className="space-y-0.5 min-w-[90px]">
                  <p className="font-serif italic text-amber-200 text-xs select-none truncate">
                    {config.signatory_1_name}
                  </p>
                  <div className="w-20 sm:w-28 h-0.5 bg-slate-600" />
                  <p className="text-[8px] font-bold text-slate-300 uppercase truncate">{config.signatory_1_title}</p>
                  <p className="text-[7px] text-slate-500 truncate">{config.signatory_1_subtitle}</p>
                </div>
              ) : <div />}

              {/* Central Foil Seal */}
              {config.show_seal && (
                <div className="flex flex-col items-center justify-center shrink-0 mx-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white flex flex-col items-center justify-center text-center shadow-md ${
                    isGold ? 'bg-amber-500 text-slate-950' : isSilver ? 'bg-slate-300 text-slate-950' : isBronze ? 'bg-amber-700 text-white' : 'bg-sky-600 text-white'
                  }`}>
                    <span className="text-[7px] font-black uppercase tracking-tighter truncate max-w-[40px]">{config.seal_text}</span>
                    <span className="text-[6px] font-bold tracking-tighter uppercase mt-0.5">{config.seal_subtext}</span>
                  </div>
                  <p className="text-[7px] font-mono text-slate-400 mt-0.5">A7-VERIFIED</p>
                </div>
              )}

              {/* Right Signature */}
              {config.show_signatures ? (
                <div className="space-y-0.5 text-right min-w-[90px]">
                  <p className="font-serif italic text-sky-200 text-xs select-none truncate">
                    {config.signatory_2_name}
                  </p>
                  <div className="w-20 sm:w-28 h-0.5 bg-slate-600 ml-auto" />
                  <p className="text-[8px] font-bold text-slate-300 uppercase truncate">{config.signatory_2_title}</p>
                  <p className="text-[7px] text-slate-500 truncate">{config.signatory_2_subtitle}</p>
                </div>
              ) : <div />}

            </div>

          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            {config.footer_verification_text}
          </div>

        </div>

      </div>

    </div>
  );
};
