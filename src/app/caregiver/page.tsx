"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, CheckCircle2, Clock, Calendar, TrendingDown, TrendingUp, Activity, AlertOctagon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Suspense, useEffect, useState } from "react";
import { getAllSessions, GameSession } from "../utils/db";
import { translations, Language } from "../../i18n/translations";
import { useDocumentLanguage } from "../../i18n/language";

function DashboardContent() {
  const searchParams = useSearchParams();
  const langParam = (searchParams.get("lang") as Language) || "English";
  const lang = translations[langParam] ? langParam : "English";
  const t = translations[lang];

  useDocumentLanguage(lang);

  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllSessions();
        setSessions(data);
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
    
    const avgRecentAccuracy = latest3.reduce((a, b) => a + b.accuracy, 0) / latest3.length;
    const avgPastAccuracy = previous.reduce((a, b) => a + b.accuracy, 0) / previous.length;
    
    if (avgPastAccuracy - avgRecentAccuracy >= 20) {
      anomalyDetected = true;
      anomalyMessage = `COGNITIVE DECLINE: Accuracy dropped by ${(avgPastAccuracy - avgRecentAccuracy).toFixed(1)}% over the last 3 sessions.`;
    }

    const recentHesitation = latest3.filter(s => s.biomarkers).reduce((a, b) => a + (b.biomarkers?.hesitationMs || 0), 0) / latest3.length;
    if (recentHesitation > 8000) { 
      anomalyDetected = true;
      anomalyMessage = `BIOMARKER ANOMALY: Severe hesitation detected (Avg ${(recentHesitation / 1000).toFixed(1)}s before interaction).`;
    }
  }

  const recentAccuracy = recentSessions.length > 0 ? recentSessions[recentSessions.length - 1].accuracy : 100;
  const requiresAttention = recentAccuracy < 70;

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
              <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 border-4 border-red-700">
                <AlertOctagon className="w-12 h-12 shrink-0 text-red-100" />
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-wide uppercase">AI Predictive Alert</h3>
                  <p className="mt-1 text-red-100 font-medium text-base md:text-lg">{anomalyMessage} Please review immediately.</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle2 className="w-8 h-8" /></div>
                <div>
                  <p className="text-slate-500 font-medium">{t.medAdherence} <span className="text-xs text-amber-600 font-bold">{t.demoOnly}</span></p>
                  <h3 className="text-2xl font-bold text-slate-800">100%</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 bg-blue-100 rounded-xl text-blue-600"><Clock className="w-8 h-8" /></div>
                <div>
                  <p className="text-slate-500 font-medium">{t.avgGameTime}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{avgTime} {t.mins}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 bg-purple-100 rounded-xl text-purple-600"><Calendar className="w-8 h-8" /></div>
                <div>
                  <p className="text-slate-500 font-medium">{t.nextClinic} <span className="text-xs text-amber-600 font-bold">{t.demoOnly}</span></p>
                  <h3 className="text-2xl font-bold text-slate-800">{t.noData}</h3>
                </div>
              </div>
            </div>

            {recentSessions.length > 0 && recentSessions[recentSessions.length - 1].biomarkers && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-indigo-500"/> Digital Biomarkers (Latest Session)
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
