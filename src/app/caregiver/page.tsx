"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, AlertCircle, CheckCircle2, Clock, Calendar, TrendingDown} from "lucide-react";
import { Suspense } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", accuracy: 85, time: 12 },
  { day: "Tue", accuracy: 88, time: 11 },
  { day: "Wed", accuracy: 82, time: 14 },
  { day: "Thu", accuracy: 86, time: 12 },
  { day: "Fri", accuracy: 75, time: 18 },
  { day: "Sat", accuracy: 70, time: 22 },
  { day: "Sun", accuracy: 65, time: 25 },
];

const translations: any = {
  English: {
    dashboard: "Caregiver Dashboard", patient: "Patient", location: "Location",
    attention: "Attention Required", attentionDesc: "Aita's matching game accuracy has dropped by 18% over the last 3 days, and completion time has doubled. This may indicate a period of confusion or fatigue.",
    medAdherence: "Medication Adherence", avgGameTime: "Avg. Game Time", nextClinic: "Next Clinic Visit",
    trendTitle: "Cognitive Engagement Trend (Accuracy %)", last7: "Last 7 Days", home: "Home"
  },
  Assamese: {
    dashboard: "তত্ত্বাৱধায়কৰ ডেশ্ববৰ্ড", patient: "ৰোগী", location: "অৱস্থান",
    attention: "মনোযোগৰ প্ৰয়োজন", attentionDesc: "যোৱা ৩ দিনত আইতাৰ খেলৰ শুদ্ধতা ১৮% হ্ৰাস পাইছে। ই বিভ্ৰান্তি বা ভাগৰুৱা অৱস্থা সূচাব পাৰে।",
    medAdherence: "দৰব খোৱাৰ নিয়ম", avgGameTime: "গড় খেলৰ সময়", nextClinic: "পৰৱৰ্তী চিকিৎসালয় ভ্ৰমণ",
    trendTitle: "জ্ঞানাত্মক নিয়োজনৰ ধাৰা (শুদ্ধতা %)", last7: "যোৱা ৭ দিন", home: "ঘৰ"
  },
  Bengali: {
    dashboard: "পরিচর্যাকারীর ড্যাশবোর্ড", patient: "রোগী", location: "অবস্থান",
    attention: "মনোযোগ প্রয়োজন", attentionDesc: "গত ৩ দিনে আইতার গেমের নির্ভুলতা ১৮% কমেছে। এটি বিভ্রান্তি বা ক্লান্তি নির্দেশ করতে পারে।",
    medAdherence: "ওষুধ খাওয়ার নিয়ম", avgGameTime: "গড় খেলার সময়", nextClinic: "পরবর্তী হাসপাতাল পরিদর্শন",
    trendTitle: "জ্ঞানীয় নিযুক্তির প্রবণতা (নির্ভুলতা %)", last7: "গত ৭ দিন", home: "বাড়ি"
  },
  Hindi: {
    dashboard: "देखभालकर्ता डैशबोर्ड", patient: "रोगी", location: "स्थान",
    attention: "ध्यान देने की आवश्यकता है", attentionDesc: "पिछले 3 दिनों में आइता के गेम की सटीकता में 18% की गिरावट आई है। यह भ्रम या थकान का संकेत हो सकता है।",
    medAdherence: "दवा का पालन", avgGameTime: "औसत गेम समय", nextClinic: "अगली क्लिनिक यात्रा",
    trendTitle: "संज्ञानात्मक रुझान (सटीकता %)", last7: "पिछले 7 दिन", home: "होम"
  }
};

export default function CaregiverDashboard() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense>; }

function DashboardContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "English";
  const t = translations[lang] || translations["English"];

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

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4">
          <TrendingDown className="w-8 h-8 text-rose-600 shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-rose-800">{t.attention}</h3>
            <p className="text-rose-700 mt-1 font-medium">{t.attentionDesc}</p>
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
              <h3 className="text-2xl font-bold text-slate-800">16 mins</h3>
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
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="accuracy" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
