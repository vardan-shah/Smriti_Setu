"use client";
import { useState, useEffect } from "react";
import { WifiOff, Database } from "lucide-react";
import { getUnsyncedSessions } from "../app/utils/db";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodically check local session count
    const interval = setInterval(async () => {
      try {
        const unsynced = await getUnsyncedSessions();
        setUnsyncedCount(unsynced.length);
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

  if (isOnline && unsyncedCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 flex flex-col items-start gap-1 px-4 py-2 rounded-2xl shadow-lg transition-colors border-2 ${!isOnline ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
      <div className="flex items-center gap-2">
        {!isOnline ? <WifiOff className="w-5 h-5" /> : <Database className="w-5 h-5" />}
        <span className="font-bold text-sm">
          {!isOnline ? "Offline Mode" : "Local Storage Active"}
        </span>
      </div>
      {unsyncedCount > 0 && (
        <span className="text-xs font-medium opacity-80">
          {unsyncedCount} session{unsyncedCount !== 1 ? 's' : ''} saved locally.
        </span>
      )}
    </div>
  );
}
