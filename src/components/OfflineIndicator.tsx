"use client";
import { useState, useEffect } from "react";
import { WifiOff, Database, RefreshCw, Check } from "lucide-react";
import { getPendingSessions, processSyncQueue } from "../app/utils/db";
import { translations, Language } from "../i18n/translations";


export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');

  // We fetch language loosely here without suspense wrapper since it's just a floating widget
  // and we don't want to break the entire layout. It uses window location as a fallback.
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const urlLang = url.searchParams.get("lang") as Language;
      if (urlLang && translations[urlLang]) return urlLang;
    }
    return "English";
  });

  const t = translations[lang];

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const pending = await getPendingSessions();
      if (pending.length > 0) {
        setSyncState('syncing');
        await processSyncQueue();
        const remaining = await getPendingSessions();
        if (remaining.length === 0) {
          setSyncState('synced');
          setTimeout(() => setSyncState('idle'), 3000);
        } else {
          setSyncState('failed');
          setTimeout(() => setSyncState('idle'), 3000);
        }
        setPendingCount(remaining.length);
      }
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(async () => {
      try {
        const pending = await getPendingSessions();
        setPendingCount(pending.length);
      } catch (e) {
        console.error(e);
      }
    }, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0 && syncState === 'idle') return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 flex flex-col items-start gap-1 px-4 py-2 rounded-2xl shadow-lg transition-colors border-2 ${
      syncState === 'syncing' ? "bg-blue-50 text-blue-800 border-blue-200" :
      syncState === 'synced' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
      !isOnline ? "bg-amber-50 text-amber-800 border-amber-200" : 
      "bg-emerald-50 text-emerald-800 border-emerald-200"
    }`}>
      <div className="flex items-center gap-2">
        {syncState === 'syncing' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
         syncState === 'synced' ? <Check className="w-5 h-5" /> :
         !isOnline ? <WifiOff className="w-5 h-5" /> : 
         <Database className="w-5 h-5" />}
        <span className="font-bold text-sm">
          {syncState === 'syncing' ? t.syncing :
           syncState === 'synced' ? t.synced :
           syncState === 'failed' ? t.syncFailed :
           !isOnline ? t.offlineMode : 
           t.savedLocally}
        </span>
      </div>
      {pendingCount > 0 && syncState === 'idle' && (
        <span className="text-xs font-medium opacity-80">
          {pendingCount} {t.savedLocally}
        </span>
      )}
    </div>
  );
}
