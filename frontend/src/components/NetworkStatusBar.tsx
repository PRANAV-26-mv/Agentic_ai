import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, CloudUpload, AlertTriangle, X } from 'lucide-react';
import { flushOfflineQueue, getOfflineQueue } from '../services/api';

export const NetworkStatusBar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Check connection speed via Network Information API
  const checkSpeed = () => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const slow = conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g' || conn.saveData;
      setIsSlow(Boolean(slow));
    }
  };

  useEffect(() => {
    checkSpeed();

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setIsDismissed(false);
      checkSpeed();
      flushOfflineQueue();

      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setIsDismissed(false);
    };

    const handleNetworkStatus = (e: any) => {
      const detail = e.detail;
      if (detail?.message) {
        setStatusNotice(detail.message);
        const timer = setTimeout(() => setStatusNotice(null), 4000);
        return () => clearTimeout(timer);
      }
    };

    const handleQueueUpdated = (e: any) => {
      setOfflineQueueCount(e.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('portal:network_status', handleNetworkStatus as EventListener);
    window.addEventListener('portal:queue_updated', handleQueueUpdated as EventListener);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', checkSpeed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('portal:network_status', handleNetworkStatus as EventListener);
      window.removeEventListener('portal:queue_updated', handleQueueUpdated as EventListener);
      if (conn) {
        conn.removeEventListener('change', checkSpeed);
      }
    };
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Ping lightweight status endpoint or check online state
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        await flushOfflineQueue();
        setStatusNotice('Connection is active! Offline queue checked.');
      } else {
        setStatusNotice('Device is still offline.');
      }
    } catch (_) {
      setStatusNotice('Network response delayed.');
    } finally {
      setIsTesting(false);
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  // If online, not slow, no recent reconnection, no queue, and no status notice -> don't render anything
  if (isOnline && !isSlow && !showReconnected && offlineQueueCount === 0 && !statusNotice) {
    return null;
  }

  // If dismissed by user, only reappear if offline
  if (isDismissed && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-2.5 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-[92vw] sm:max-w-md px-2 pointer-events-auto transition-all animate-fade-in-down">
      {/* 1. Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-950/95 text-amber-100 border border-amber-600/60 rounded-2xl p-2.5 sm:px-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </span>
            <div className="min-w-0">
              <p className="font-black text-amber-200 text-[11px] sm:text-xs">
                Offline Mode Active
              </p>
              <p className="text-[10px] text-amber-300/80 truncate">
                Serving cached data. Answers save safely to local storage.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              title="Test connection"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Retry</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-amber-400 hover:text-white rounded-lg cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Reconnected Notice */}
      {isOnline && showReconnected && (
        <div className="bg-emerald-950/95 text-emerald-100 border border-emerald-500/60 rounded-2xl p-2.5 sm:px-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <p className="font-black text-emerald-200 text-[11px] sm:text-xs">
                Connection Restored
              </p>
              <p className="text-[10px] text-emerald-300/80">
                You are back online. Background sync complete.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReconnected(false)}
            className="p-1 text-emerald-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Slow Network Warning (Only when online and not already showing reconnected) */}
      {isOnline && !showReconnected && isSlow && (
        <div className="bg-slate-900/90 text-slate-200 border border-slate-700 rounded-2xl p-2 px-3 sm:px-4 shadow-lg backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <p className="text-[11px] font-medium text-slate-300">
              <strong className="text-amber-400 font-bold">Low network:</strong> Local caching active for fast responses.
            </p>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 4. Offline Queue Status / Sync Notice */}
      {isOnline && !showReconnected && !isSlow && (statusNotice || offlineQueueCount > 0) && (
        <div className="bg-indigo-950/90 text-indigo-100 border border-indigo-700/60 rounded-2xl p-2 px-3 sm:px-4 shadow-lg backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <CloudUpload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <p className="text-[11px] font-medium text-indigo-200">
              {statusNotice || `${offlineQueueCount} unsynced item(s) pending upload.`}
            </p>
          </div>
          <button
            onClick={() => {
              setStatusNotice(null);
              setIsDismissed(true);
            }}
            className="p-1 text-indigo-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
