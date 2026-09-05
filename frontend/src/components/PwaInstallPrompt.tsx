import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, Wifi, CheckCircle2 } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running as installed standalone PWA app
    const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isApp);

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Listen for Chrome/Android native install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowModal(false);
        }
      });
    } else {
      setShowModal(true);
    }
  };

  const localHostUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(localHostUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Action Button for Phone App Installation */}
      <button
        onClick={handleInstallClick}
        className="hidden sm:flex fixed bottom-5 right-5 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xl border border-white/20 items-center space-x-2 animate-bounce transition-all hover:scale-105"
        title="Use this Portal as an App on your Mobile Phone"
      >
        <Smartphone className="w-4 h-4 text-sky-300" />
        <span>Install Phone App</span>
      </button>

      {/* Mobile App Installation Guidance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 text-slate-800 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full font-bold"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Install Portal App on Mobile</h3>
                <p className="text-xs text-slate-500">Run like a native app on Android & iOS</p>
              </div>
            </div>

            {/* Step 1: Open on Physical Phone */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Wifi className="w-4 h-4 text-purple-600" />
                <span>1. Open on Your Mobile Browser</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Connect your phone to the same Wi-Fi network and navigate to:
              </p>
              <div className="flex items-center space-x-2 bg-white p-2 border rounded-xl font-mono text-[11px] font-bold text-purple-700">
                <span className="flex-1 truncate">{localHostUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded-lg text-[10px] hover:bg-purple-700"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 2: Installation Instructions */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">2. Add to Phone Home Screen</h4>

              {isIOS ? (
                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl space-y-2 text-indigo-950">
                  <div className="font-bold flex items-center space-x-1">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <span>iPhone / Safari Instructions:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Tap the <strong>Share button</strong> (<Share2 className="w-3 h-3 inline" />) at the bottom of Safari.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong> (<PlusSquare className="w-3 h-3 inline" />).</li>
                    <li>Tap <strong>Add</strong> in the top-right corner!</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-2 text-purple-950">
                  <div className="font-bold flex items-center space-x-1">
                    <Download className="w-4 h-4 text-purple-600" />
                    <span>Android / Chrome Instructions:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>Tap the 3-dots menu (⋮) in Chrome.</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                    <li>Open the installed <strong>Campus Portal app icon</strong> on your home screen!</li>
                  </ol>
                </div>
              )}
            </div>

            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Click to Install App Automatically Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
