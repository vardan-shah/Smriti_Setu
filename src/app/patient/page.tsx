"use client";

import { useState, useEffect, Suspense } from "react";
import { Coffee, Music, TreePine, Mountain, Moon, Sun, Home as HomeIcon, Droplet, Pill, Volume2, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveSessionLocally } from "../utils/db";

const translations: Record<string, Record<string, string>> = {
  English: {
    tea: "Assam Tea", music: "Bihu Dhol", bamboo: "Bamboo", hills: "Hills", morning: "Morning", night: "Night",
    matches: "Matches", playAgain: "Play Again", greatJob: "Great Job!", matchedAll: "You matched all the items.",
    reminders: "Daily Reminders", water: "Drink Water", meds: "Take Medicine", speak: "Read Aloud",
    voiceOnline: "Voice Active", voiceOffline: "Voice Disabled", voiceNotAvailable: "Voice not available for this language"
  },
  Assamese: {
    tea: "অসমৰ চাহ", music: "বিহু ঢোল", bamboo: "বাঁহ", hills: "পাহাৰ", morning: "ৰাতিপুৱা", night: "ৰাতি",
    matches: "মিলসমূহ", playAgain: "আকৌ খেলক", greatJob: "বঢ়িয়া!", matchedAll: "আপুনি সকলো বস্তু মিলাইছে।",
    reminders: "দৈনিক সোঁৱৰণি", water: "পানী খাওক", meds: "দৰব খাওক", speak: "পঢ়ক",
    voiceOnline: "ভইচ সক্ৰিয়", voiceOffline: "ভইচ নিষ্ক্ৰিয়", voiceNotAvailable: "এই ভাষাৰ বাবে ভইচ উপলব্ধ নহয়"
  },
  Bengali: {
    tea: "আসাম চা", music: "বিহু ঢোল", bamboo: "বাঁশ", hills: "পাহাড়", morning: "সকাল", night: "রাত",
    matches: "মিলগুলি", playAgain: "আবার খেলুন", greatJob: "দারুণ!", matchedAll: "আপনি সব মিলিয়েছেন।",
    reminders: "দৈনিক অনুস্মারক", water: "জল পান করুন", meds: "ওষুধ খান", speak: "পড়ুন",
    voiceOnline: "ভয়েস সক্রিয়", voiceOffline: "ভয়েস অক্ষম", voiceNotAvailable: "এই ভাষার জন্য ভয়েস উপলব্ধ নয়"
  },
  Hindi: {
    tea: "असम की चाय", music: "बिहू ढोल", bamboo: "बांस", hills: "पहाड़", morning: "सुबह", night: "रात",
    matches: "मिलान", playAgain: "फिर से खेलें", greatJob: "बहुत बढ़िया!", matchedAll: "आपने सभी वस्तुओं का मिलान किया।",
    reminders: "दैनिक अनुस्मारक", water: "पानी पिएं", meds: "दवा लें", speak: "सुनाएं",
    voiceOnline: "आवाज़ सक्रिय", voiceOffline: "आवाज़ अक्षम", voiceNotAvailable: "इस भाषा के लिए आवाज़ उपलब्ध नहीं है"
  }
};

const CARDS = [
  { icon: Coffee, key: "tea", color: "bg-amber-100 text-amber-700" },
  { icon: Music, key: "music", color: "bg-rose-100 text-rose-700" },
  { icon: TreePine, key: "bamboo", color: "bg-emerald-100 text-emerald-700" },
  { icon: Mountain, key: "hills", color: "bg-slate-200 text-slate-700" },
  { icon: Sun, key: "morning", color: "bg-orange-100 text-orange-600" },
  { icon: Moon, key: "night", color: "bg-indigo-100 text-indigo-700" },
];

function GameBoard() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "English";
  const t = translations[lang] || translations["English"];

  const [cards, setCards] = useState<Array<typeof CARDS[0] & {uniqueId: number}>>(() => [...CARDS, ...CARDS].sort(() => Math.random() - 0.5).map((card, idx) => ({ ...card, uniqueId: idx })));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [win, setWin] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [startTime] = useState<number>(() => Date.now());
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);


    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const playVoicePrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      let locale = "en-IN";
      if (lang === "Hindi") locale = "hi-IN";
      if (lang === "Bengali") locale = "bn-IN";
      if (lang === "Assamese") locale = "as-IN";
      
      const voices = window.speechSynthesis.getVoices();
      const voiceExists = voices.some(v => v.lang.startsWith(locale.split('-')[0]));
      
      if (!voiceExists && voices.length > 0) {
        setVoiceAvailable(false);
      } else {
        setVoiceAvailable(true);
        utterance.lang = locale;
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].key)) return;
    
    playVoicePrompt(t[cards[index].key]);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];
      
      if (first.key === second.key) {
        setMatched([...matched, first.key]);
        setFlipped([]);
        if (matched.length + 1 === CARDS.length) {
          setWin(true);
          /* eslint-disable-next-line react-hooks/purity */
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const perfectMoves = CARDS.length;
          const actualMoves = moves + 1;
          const accuracy = Math.round((perfectMoves / actualMoves) * 100);
          
          saveSessionLocally({ 
            game: "matching", 
            matches: CARDS.length, 
            timeSpent: elapsed, 
            langUsed: lang,
            accuracy: accuracy > 100 ? 100 : accuracy
          });
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
      
      <div className="w-full md:w-1/3 space-y-6">
        <div className={`rounded-3xl p-6 shadow-md border-4 flex flex-col gap-2 transition-colors ${isOnline ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center gap-4">
            {isOnline ? <Wifi className="w-10 h-10 shrink-0" /> : <WifiOff className="w-10 h-10 shrink-0" />}
            <div>
              <h3 className="font-bold text-xl leading-tight">Connectivity</h3>
              <p className="text-sm font-medium opacity-80 flex items-center gap-1 mt-1">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          {!voiceAvailable && (
             <p className="text-sm text-amber-700 font-bold mt-2 bg-amber-100 p-2 rounded-lg">{t.voiceNotAvailable}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-emerald-500"/> {t.reminders}
          </h2>
          <button 
            onClick={() => playVoicePrompt(t.water)}
            className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-2 border-blue-200 active:scale-95"
          >
            <Droplet className="w-10 h-10 shrink-0" />
            <span className="text-2xl font-bold text-left">{t.water}</span>
          </button>
          <button 
            onClick={() => playVoicePrompt(t.meds)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border-2 border-rose-200 active:scale-95"
          >
            <Pill className="w-10 h-10 shrink-0" />
            <span className="text-2xl font-bold text-left">{t.meds}</span>
          </button>
        </div>
      </div>

      <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-white p-8 rounded-3xl shadow-xl border-4 border-slate-100">
        <div className="w-full flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-800">
            {lang} Mode
          </h2>
          <div className="px-6 py-3 bg-emerald-100 rounded-2xl text-emerald-800 text-2xl font-bold border-4 border-emerald-200">
            {t.matches}: {matched.length} / {CARDS.length}
          </div>
        </div>

        {win ? (
          <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500">
            <h2 className="text-6xl font-black text-emerald-600">{t.greatJob}</h2>
            <p className="text-3xl text-slate-600 font-medium">{t.matchedAll}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-12 py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-4xl font-bold shadow-xl active:scale-95 transition-all"
            >
              {t.playAgain}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(card.key);
              return (
                <button
                  key={card.uniqueId}
                  onClick={() => handleCardClick(idx)}
                  className={`relative aspect-square rounded-3xl text-center flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 ${
                    isFlipped 
                      ? `${card.color} shadow-inner border-4 border-white` 
                      : "bg-slate-50 shadow-md hover:shadow-xl border-4 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {isFlipped ? (
                    <>
                      <card.icon className="w-12 h-12 md:w-16 md:h-16 mb-2 drop-shadow-sm" />
                      <span className="text-sm md:text-lg font-bold leading-tight px-1">{t[card.key]}</span>
                    </>
                  ) : (
                    <BrainIcon className="w-12 h-12 md:w-16 md:h-16 text-slate-300 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientView() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex justify-start mb-6">
        <Link href="/" className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-sm text-2xl font-bold text-slate-700 active:scale-95 transition-transform border border-slate-200 hover:bg-slate-100">
          <HomeIcon className="w-8 h-8" /> Home
        </Link>
      </div>
      <Suspense fallback={<div className="text-2xl font-bold p-10">Loading...</div>}>
        <GameBoard />
      </Suspense>
    </div>
  );
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  );
}
