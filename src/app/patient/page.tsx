"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { Coffee, Music, TreePine, Mountain, Moon, Sun, Home as HomeIcon, Droplet, Pill, Volume2, Wifi, WifiOff, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveSessionLocally } from "../utils/db";
import { translations, Language } from "../../i18n/translations";
import { useDocumentLanguage } from "../../i18n/language";
import { playVoicePrompt } from "../../i18n/voice";

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
  const langParam = (searchParams.get("lang") as Language) || "English";
  const lang: Language = translations[langParam] ? langParam : "English";
  const t = translations[lang];

  useDocumentLanguage(lang);

  const [cards, setCards] = useState<Array<typeof CARDS[0] & {uniqueId: number}>>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [win, setWin] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'playing' | 'unavailable'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const initializeGame = useCallback(() => {
    const shuffled = [...CARDS, ...CARDS]
      .sort(() => Math.random() - 0.5)
      .map((card, idx) => ({ ...card, uniqueId: idx }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setWin(false);
    setMoves(0);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
  }, [initializeGame]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial voices load
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleVoice = (key: string, text: string) => {
    if (voiceState === 'playing') return;
    setVoiceState('playing');
    playVoicePrompt(lang, key, text, 
      () => setVoiceState('playing'), 
      () => setVoiceState('idle')
    );
  };

  const handleCardClick = (index: number) => {
    if (!isReady || flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].key)) return;
    
    handleVoice(cards[index].key, t[cards[index].key]);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];
      
      if (first.key === second.key) {
        setMatched(prev => {
          const newMatched = [...prev, first.key];
          if (newMatched.length === CARDS.length) {
            setWin(true);
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
            }).catch(console.error);
            
            // Play win audio
            setTimeout(() => handleVoice('greatJob', t.greatJob), 500);
          }
          return newMatched;
        });
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const effectivelyOffline = offlineMode || !isOnline;

  if (!isReady) return null;

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 pb-20">
      
      <div className="w-full md:w-1/3 space-y-6">
        <div className={`rounded-3xl p-6 shadow-md border-4 flex flex-col gap-4 transition-colors ${effectivelyOffline ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
          <div className="flex items-center gap-4">
            {effectivelyOffline ? <WifiOff className="w-10 h-10 shrink-0" /> : <Wifi className="w-10 h-10 shrink-0" />}
            <div>
              <h3 className="font-bold text-xl leading-tight">{t.connectivity}</h3>
              <p className="text-sm font-medium opacity-80 mt-1">
                {effectivelyOffline ? (offlineMode ? t.offlineMode : t.offline) : t.online}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-full py-3 px-4 rounded-xl font-bold border-2 transition-colors active:scale-95 ${offlineMode ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {offlineMode ? `Disable ${t.offlineMode}` : `Enable ${t.offlineMode}`}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-emerald-500"/> {t.reminders}
          </h2>
          <button 
            onClick={() => handleVoice('water', t.water)}
            disabled={voiceState === 'playing'}
            className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-2 border-blue-200 active:scale-95 disabled:opacity-50"
          >
            <Droplet className="w-10 h-10 shrink-0" />
            <span className="text-2xl font-bold text-left">{t.water}</span>
          </button>
          <button 
            onClick={() => handleVoice('meds', t.meds)}
            disabled={voiceState === 'playing'}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border-2 border-rose-200 active:scale-95 disabled:opacity-50"
          >
            <Pill className="w-10 h-10 shrink-0" />
            <span className="text-2xl font-bold text-left">{t.meds}</span>
          </button>
        </div>
      </div>

      <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-white p-6 md:p-8 rounded-3xl shadow-xl border-4 border-slate-100">
        <div className="w-full flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-800">
            {lang} {t.gameMode}
          </h2>
          <div className="px-4 py-2 md:px-6 md:py-3 bg-emerald-100 rounded-2xl text-emerald-800 text-xl md:text-2xl font-bold border-4 border-emerald-200">
            {t.matches}: {matched.length} / {CARDS.length}
          </div>
        </div>

        {win ? (
          <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500 w-full flex flex-col items-center">
            <h2 className="text-5xl md:text-6xl font-black text-emerald-600">{t.greatJob}</h2>
            <p className="text-2xl md:text-3xl text-slate-600 font-medium">{t.matchedAll}</p>
            <button 
              onClick={initializeGame}
              className="mt-8 flex items-center gap-4 px-8 py-5 md:px-12 md:py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-3xl md:text-4xl font-bold shadow-xl active:scale-95 transition-all"
            >
              <RefreshCcw className="w-8 h-8 md:w-10 md:h-10" /> {t.playAgain}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full" role="grid" aria-label="Memory Game Board">
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(card.key);
              return (
                <button
                  key={card.uniqueId}
                  onClick={() => handleCardClick(idx)}
                  aria-label={isFlipped ? t[card.key] : "Unflipped card"}
                  aria-pressed={isFlipped}
                  disabled={isFlipped}
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex justify-start mb-6">
        <Suspense fallback={<div>...</div>}>
          <HomeLink />
        </Suspense>
      </div>
      <Suspense fallback={<div className="text-2xl font-bold p-10">Loading...</div>}>
        <GameBoard />
      </Suspense>
    </div>
  );
}

function HomeLink() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "English";
  const t = translations[lang as Language] || translations["English"];
  return (
    <Link href="/" className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-sm text-2xl font-bold text-slate-700 active:scale-95 transition-transform border border-slate-200 hover:bg-slate-100">
      <HomeIcon className="w-8 h-8" /> {t.home}
    </Link>
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
