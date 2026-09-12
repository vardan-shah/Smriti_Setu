"use client";

import Link from "next/link";
import { Home, Clock, TrendingDown, TrendingUp, Activity, AlertOctagon, CheckCircle, Calendar, Upload, Image as ImageIcon, Database, Lock, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAllSessions, GameSession, saveMemory, getMemories, FamilyMemory, getPendingSessions, deleteMemory } from "../utils/db";
import { computeArmValues, DIFFICULTY_ARMS } from "../../lib/adaptiveDifficulty";
import { translations, Language } from "../../i18n/translations";
import { useDocumentLanguage } from "../../i18n/language";

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlLang = searchParams.get("lang") as Language;
  const lang = (urlLang && translations[urlLang]) ? urlLang : "English";

  const t = translations[lang];

  useDocumentLanguage(lang);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [memories, setMemories] = useState<FamilyMemory[]>([]);
  const [newMemName, setNewMemName] = useState("");
  const [newMemImage, setNewMemImage] = useState("");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllSessions();
        setSessions(data);
        const mems = await getMemories();
        setMemories(mems);
        const pending = await getPendingSessions();
        setPendingSyncCount(pending.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter latest 7
  const recentSessions = sessions.slice(-7);

  
  const chartData = recentSessions.map((s, i) => ({
    name: `S${i + 1}`,
    accuracy: s.accuracy || 0,
    time: s.timeSpent
  }));

  const avgTime = recentSessions.length > 0 
    ? Math.round(recentSessions.reduce((acc, s) => acc + s.timeSpent, 0) / recentSessions.length / 60) 
    : 0;
  
  // AI Predictive Anomaly Detection
  let anomalyDetected = false;
  let anomalyMessage = "";

  if (recentSessions.length >= 4) {
    const latest3 = recentSessions.slice(-3);
    const previous = recentSessions.slice(0, -3);
    
    const avgRecentAccuracy = latest3.reduce((a, b) => a + (b.accuracy || 0), 0) / latest3.length;
    const avgPastAccuracy = previous.reduce((a, b) => a + (b.accuracy || 0), 0) / previous.length;
    
    if (avgPastAccuracy - avgRecentAccuracy >= 20) {
      anomalyDetected = true;
      anomalyMessage = t.cognitiveDeclineAlert.replace('{diff}', (avgPastAccuracy - avgRecentAccuracy).toFixed(1));
    }

    const sessionsWithBiomarkers = latest3.filter(s => s.biomarkers);
    const recentHesitation = sessionsWithBiomarkers.length > 0 
      ? sessionsWithBiomarkers.reduce((a, b) => a + (b.biomarkers?.hesitationMs || 0), 0) / sessionsWithBiomarkers.length 
      : 0;
    if (recentHesitation > 8000) { 
      anomalyDetected = true;
      anomalyMessage = t.biomarkerAnomalyAlert.replace('{time}', (recentHesitation / 1000).toFixed(1));
    }
  }

  const recentAccuracy = recentSessions.length > 0 ? recentSessions[recentSessions.length - 1].accuracy : 100;
  const requiresAttention = recentAccuracy < 70;
  const armStats = computeArmValues(sessions);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setNewMemImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMemory = async (id: number) => {
    await deleteMemory(id);
    const mems = await getMemories();
    setMemories(mems);
  };

  const handleSaveMemory = async () => {
    if (!newMemName || !newMemImage) return;
    await saveMemory({ name: newMemName, image: newMemImage });
    setNewMemName("");
    setNewMemImage("");
    const mems = await getMemories();
    setMemories(mems);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t.dashboard}</h1>
            <p className="text-slate-500 mt-1">{t.patient}: {t.demoPatient} (72 yrs) | {t.location}: Aizawl, Mizoram</p>
          </div>
          <Link href={`/?lang=${lang}`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-medium">
            <Home className="w-5 h-5" /> {t.home}
          </Link>
        </header>

        {sessions.length > 0 ? (
          <>
            {anomalyDetected && (
              <div className={`p-6 rounded-2xl shadow-lg flex items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 border-4 ${sessions.length >= 5 ? 'bg-red-600 text-white border-red-700' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                <AlertOctagon className={`w-12 h-12 shrink-0 ${sessions.length >= 5 ? 'text-red-100' : 'text-amber-600'}`} />
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase">AI Predictive Alert</h3>
                  <p className={`mt-1 font-medium text-base md:text-lg ${sessions.length >= 5 ? 'text-red-100' : 'text-amber-800'}`}>{anomalyMessage} Please review immediately.</p>
                </div>
              </div>
            )}

            <div className={`border rounded-2xl p-6 flex items-start gap-4 ${requiresAttention ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {requiresAttention ? <TrendingDown className="w-8 h-8 text-rose-600 shrink-0 mt-1" /> : <TrendingUp className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />}
              <div>
                <h3 className={`text-xl font-bold ${requiresAttention ? 'text-rose-800' : 'text-emerald-800'}`}>
                  {requiresAttention ? t.attention : t.insight}
                </h3>
                <p className={`mt-1 font-medium ${requiresAttention ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {requiresAttention ? t.attentionDesc : t.insightDesc}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 w-full md:w-1/3">
                <div className="p-4 bg-blue-100 rounded-xl text-blue-600"><Clock className="w-8 h-8" /></div>
                <div>
                  <p className="text-slate-500 font-medium">{t.avgGameTime}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{avgTime} {t.mins}</h3>
                </div>
              </div>

            {recentSessions.length > 0 && recentSessions[recentSessions.length - 1].biomarkers && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-indigo-500"/> {t.digitalBiomarkers}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Avg Reaction Time</p>
                    <p className="text-xl font-bold text-slate-800">
                      {(recentSessions[recentSessions.length - 1].biomarkers!.avgReactionTimeMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Hesitation</p>
                    <p className="text-xl font-bold text-slate-800">
                      {(recentSessions[recentSessions.length - 1].biomarkers!.hesitationMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Memory Lapses</p>
                    <p className="text-xl font-bold text-slate-800">
                      {recentSessions[recentSessions.length - 1].biomarkers!.memoryLapses}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Time of Day</p>
                    <p className="text-xl font-bold text-slate-800 capitalize">
                      {recentSessions[recentSessions.length - 1].biomarkers!.timeOfDay}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">{t.trendTitle}</h2>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">{t.recentSessions}</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            


            {/* AI Adaptive Difficulty (Multi-Armed Bandit) */}
            {sessions.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-fuchsia-500"/> AI Adaptive Difficulty (Contextual Bandit Q-Values)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {DIFFICULTY_ARMS.map(arm => (
                    <div key={arm} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                      <p className="text-sm text-slate-500 font-medium">{t.level || "Level"} {arm}</p>
                      <div className="w-full bg-slate-200 h-2 mt-2 rounded-full overflow-hidden">
                        <div className="bg-fuchsia-500 h-full transition-all" style={{ width: `${Math.round(Math.max(0, armStats[arm].qValue) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-bold">{t.qValue || "Q-Value"}: {armStats[arm].qValue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Family Memory Vault */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-blue-500"/> {t.memoryVault || "Family Memory Vault"}
                </h2>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input type="text" placeholder={t.photoName || "Person's Name"} value={newMemName} onChange={(e) => setNewMemName(e.target.value)} className="p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="p-2 border border-slate-200 rounded-xl" />
                    {newMemImage && <img src={newMemImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl mt-2" />}
                    <button onClick={handleSaveMemory} className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
                      <Upload className="w-5 h-5" /> {t.saveMemory || "Save Memory"}
                    </button>
                  </div>
                  
                  <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
                    {memories.length === 0 ? (
                      <p className="text-slate-400 text-sm italic">{t.noMemories || "No memories added yet."}</p>
                    ) : (
                      memories.map(m => (
                        <div key={m.id} className="flex-shrink-0 relative group">
                          <img src={m.image} alt={m.name} className="w-24 h-24 object-cover rounded-2xl shadow-md border-2 border-white" />
                          <button onClick={() => handleDeleteMemory(m.id!)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600">
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-2xl">
                            <p className="text-white text-xs font-bold truncate text-center">{m.name}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Local Sync Status */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                <Database className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Local Storage</h2>
                <p className="text-slate-500 mb-6 max-w-xs">
                  {pendingSyncCount} session{pendingSyncCount !== 1 ? 's' : ''} stored securely on this device, waiting to be synced when connected.
                </p>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden relative">
                   <div className="absolute inset-y-0 left-0 bg-emerald-400 w-full animate-pulse opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{t.syncPending || "Pending Sync"}</span>
                   </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          !loading && (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
              <p className="text-xl text-slate-500 font-medium">{t.emptyState}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function CaregiverDashboard() {
  return (
    <Suspense fallback={<div className="p-10 text-2xl font-bold">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
