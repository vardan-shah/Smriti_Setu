"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, CheckCircle2, Clock, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Suspense, useEffect, useState } from "react";
import { getAllSessions, GameSession } from "../utils/db";

const translations: Record<string, Record<string, string>> = {
  English: {
    dashboard: "Caregiver Dashboard", patient: "Patient", location: "Location",
    attention: "Engagement Insight", attentionDesc: "Aita completed sessions successfully. Real-time accuracy and completion times are being tracked below.",
    attentionAlert: "Attention Required", attentionAlertDesc: "Accuracy has dropped below 70% in recent sessions. This may indicate a period of confusion.",
    medAdherence: "Medication Adherence", avgGameTime: "Avg. Game Time", nextClinic: "Next Clinic Visit",
    trendTitle: "Cognitive Engagement Trend (Accuracy %)", last7: "Recent Sessions", home: "Home",
    emptyState: "No sessions recorded yet. Play a game to see trends.",
    mins: "mins"
  },
  Assamese: {
    dashboard: "তত্ত্বাৱধায়কৰ ডেশ্ববৰ্ড", patient: "ৰোগী", location: "অৱস্থান",
    attention: "নিয়োজনৰ তথ্য", attentionDesc: "আইতাই সফলতাৰে খেল সম্পূৰ্ণ কৰিছে।",
    attentionAlert: "মনোযোগৰ প্ৰয়োজন", attentionAlertDesc: "শেহতীয়া খেলসমূহত শুদ্ধতা ৭০% ৰ তললৈ নামিছে।",
    medAdherence: "দৰব খোৱাৰ নিয়ম", avgGameTime: "গড় খেলৰ সময়", nextClinic: "পৰৱৰ্তী চিকিৎসালয় ভ্ৰমণ",
    trendTitle: "জ্ঞানাত্মক নিয়োজনৰ ধাৰা (শুদ্ধতা %)", last7: "শেহতীয়া খেল", home: "ঘৰ",
    emptyState: "কোনো খেল খেলা হোৱা নাই।",
    mins: "মিনিট"
  },
  Bengali: {
    dashboard: "পরিচর্যাকারীর ড্যাশবোর্ড", patient: "রোগী", location: "অবস্থান",
    attention: "নিযুক্তি অন্তর্দৃষ্টি", attentionDesc: "আইতা সফলভাবে গেম শেষ করেছেন।",
    attentionAlert: "মনোযোগ প্রয়োজন", attentionAlertDesc: "সাম্প্রতিক সেশনগুলিতে নির্ভুলতা ৭০% এর নিচে নেমে গেছে।",
    medAdherence: "ওষুধ খাওয়ার নিয়ম", avgGameTime: "গড় খেলার সময়", nextClinic: "পরবর্তী হাসপাতাল পরিদর্শন",
    trendTitle: "জ্ঞানীয় নিযুক্তির প্রবণতা (নির্ভুলতা %)", last7: "সাম্প্রতিক গেম", home: "বাড়ি",
    emptyState: "কোনো গেম খেলা হয়নি।",
    mins: "মিনিট"
  },
  Hindi: {
    dashboard: "देखभालकर्ता डैशबोर्ड", patient: "रोगी", location: "स्थान",
    attention: "जुड़ाव अंतर्दृष्टि", attentionDesc: "आइता ने सफलतापूर्वक खेल पूरे किए हैं।",
    attentionAlert: "ध्यान देने की आवश्यकता है", attentionAlertDesc: "हाल के खेलों में सटीकता 70% से कम हो गई है।",
    medAdherence: "दवा का पालन", avgGameTime: "औसत गेम समय", nextClinic: "अगली क्लिनिक यात्रा",
    trendTitle: "संज्ञानात्मक रुझान (सटीकता %)", last7: "हाल के गेम", home: "होम",
    emptyState: "अभी तक कोई गेम नहीं खेला गया है।",
    mins: "मिनट"
  }
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "English";
  const t = translations[lang] || translations["English"];

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

  const chartData = sessions.map((s, i) => ({
    name: `S${i + 1}`,
    accuracy: s.accuracy || 0,
    time: s.timeSpent
  }));

  const avgTime = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.timeSpent, 0) / sessions.length / 60) 
    : 0;
  
  const recentAccuracy = sessions.length > 0 ? sessions[sessions.length - 1].accuracy : 100;
  const requiresAttention = recentAccuracy < 70;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t.dashboard}</h1>
            <p className="text-slate-500 mt-1">{t.patient}: Aita (72 yrs) | {t.location}: Aizawl, Mizoram</p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-medium">
            <Home className="w-5 h-5" /> {t.home}
          </Link>
        </header>

        {sessions.length > 0 ? (
          <>
            <div className={`border rounded-2xl p-6 flex items-start gap-4 ${requiresAttention ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              {requiresAttention ? <TrendingDown className="w-8 h-8 text-rose-600 shrink-0 mt-1" /> : <TrendingUp className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />}
              <div>
                <h3 className={`text-xl font-bold ${requiresAttention ? 'text-rose-800' : 'text-emerald-800'}`}>
                  {requiresAttention ? t.attentionAlert : t.attention}
                </h3>
                <p className={`mt-1 font-medium ${requiresAttention ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {requiresAttention ? t.attentionAlertDesc : t.attentionDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle2 className="w-8 h-8" /></div>
                <div>
                  <p className="text-slate-500 font-medium">{t.medAdherence}</p>
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
                  <p className="text-slate-500 font-medium">{t.nextClinic}</p>
                  <h3 className="text-2xl font-bold text-slate-800">Sept 14</h3>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">{t.trendTitle}</h2>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">{t.last7}</span>
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
