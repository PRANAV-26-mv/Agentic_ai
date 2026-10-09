import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShieldAlert, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { loginWithDevEmail, loginWithGoogleToken, loginWithRegNumber, role, user } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [googleClientId, setGoogleClientId] = useState<string>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || '284417810408-prac0n0e79hkaqvg1vgs27uuqrjchihu.apps.googleusercontent.com'
  );

  useEffect(() => {
    const restrictionMsg = sessionStorage.getItem('portal_restriction_msg');
    if (restrictionMsg) {
      setErrorMsg(restrictionMsg);
      sessionStorage.removeItem('portal_restriction_msg');
    }

    api.get('/auth/google-client-id')
      .then(res => {
        if (res.data?.google_client_id) {
          setGoogleClientId(res.data.google_client_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && role) {
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }
  }, [user, role, navigate]);

  useEffect(() => {
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response.credential) {
              setLoading(true);
              loginWithGoogleToken(response.credential).catch((err: any) => {
                setErrorMsg(err.response?.data?.message || 'Google Auth Verification Failed');
                setLoading(false);
              });
            }
          }
        });
        const container = document.getElementById('googleSignInBtnContainer');
        if (container) {
          const btnWidth = Math.min(320, Math.max(240, window.innerWidth - 80));
          (window as any).google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: btnWidth,
            text: 'continue_with'
          });
        }
      } catch (err) {
        console.error('Google GSI init error:', err);
      }
    }
  }, [googleClientId, loginWithGoogleToken]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithRegNumber(loginId, password);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || 'Access Denied: Invalid credentials provided.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Apple Studio Lighting Background Sheen */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-black/[0.06] p-8 sm:p-10 space-y-6 text-center relative z-10 animate-fade-in">

        {/* Minimalist Apple-inspired Brand Icon */}
        <div className="mx-auto w-14 h-14 bg-gradient-to-b from-[#1d1d1f] to-[#2c2c2e] text-white rounded-2xl flex items-center justify-center shadow-md mb-2 border border-white/10 transition-transform duration-300 hover:scale-105">
          <BookOpen className="w-7 h-7 text-white" />
        </div>

        {/* Title & Product Storytelling */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-black/[0.04] text-slate-700 border border-black/[0.05] mb-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Campus Learning & Assessment Platform</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1d1d1f] tracking-tight">
            Sign In to Portal
          </h1>
          <p className="text-xs text-slate-400 font-normal">
            Precision Assessments • Group Discussion • Cohort Analytics
          </p>
        </div>

        {/* Access Denied Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-left flex items-start space-x-3 animate-fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900">Access Denied</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left pt-1">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Email or Registration Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. 717822P101 or email@domain.com"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-black/[0.02] border border-black/[0.08] focus:border-black/[0.2] focus:bg-white rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Registration Number / Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-black/[0.02] border border-black/[0.08] focus:border-black/[0.2] focus:bg-white rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1d1d1f] hover:bg-black text-white font-semibold text-xs rounded-full shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Google OAuth Section */}
        {!!googleClientId && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/[0.06]"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white/80 px-2 text-slate-400 font-semibold">Or continue with</span></div>
            </div>

            <div className="flex justify-center min-h-[44px]">
              <div id="googleSignInBtnContainer"></div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
