"use client";
import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { getUnsyncedSessions, markAsSynced } from "../app/utils/db";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      try {
        const unsynced = await getUnsyncedSessions();
        if (unsynced.length > 0) {
          console.log("Syncing to cloud...", unsynced);
          // FAKE CLOUD API CALL HERE
          await new Promise(r => setTimeout(r, 1000));
          await markAsSynced(unsynced.map(s => s.id));
          console.log("Sync complete!");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSyncing(false);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !syncing) return null;

  return (
    <div className={`fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-colors ${!isOnline ? "bg-amber-100 text-amber-800 border-2 border-amber-200" : "bg-emerald-100 text-emerald-800 border-2 border-emerald-200"}`}>
      {!isOnline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5 animate-pulse" />}
      <span className="font-bold text-sm">
        {!isOnline ? "Offline Mode (Saving locally)" : "Syncing progress..."}
      </span>
    </div>
  );
}
