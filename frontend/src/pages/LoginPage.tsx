import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShieldAlert, Lock, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithDevEmail, loginWithGoogleToken, loginWithRegNumber, role, user } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isRealGoogleClientId = !!(rawGoogleClientId && !rawGoogleClientId.includes('your-google-client-id') && !rawGoogleClientId.includes('YOUR_GOOGLE_CLIENT_ID'));

  useEffect(() => {
    if (user && role) {
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }
  }, [user, role, navigate]);

  useEffect(() => {
    if (isRealGoogleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: rawGoogleClientId,
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
          (window as any).google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with'
          });
        }
      } catch (err) {
        console.error('Google GSI init error:', err);
      }
    }
  }, [isRealGoogleClientId, rawGoogleClientId, loginWithGoogleToken]);

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

  const handleGoogleEmailLogin = async (emailToLogin: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithDevEmail(emailToLogin);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || 'Access Denied: Your email is not registered.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      
      {/* Container */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-6 text-center relative">

        {/* Logo Badge */}
        <div className="mx-auto w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30 mb-2">
          <BookOpen className="w-8 h-8" />
        </div>

        {/* Title & Tagline */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Student Assessment<br />& Learning Portal
          </h1>
          <p className="text-xs font-bold text-sky-600 mt-2 tracking-wide uppercase">
            Learn • Practice • Assess • Improve
          </p>
        </div>

        {/* Access Denied Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-left flex items-start space-x-3 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">Access Denied</h4>
              <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Credentials Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left pt-2">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Email ID or Register Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="abc@gmail.com"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Registration Number"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Google OAuth Section (if configured) */}
        {isRealGoogleClientId && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or Google OAuth</span></div>
            </div>

            <div className="space-y-3">
              <div id="googleSignInBtnContainer" className="flex justify-center min-h-[44px]"></div>
            </div>
          </>
        )}

      </div>

    </div>
  );
};
