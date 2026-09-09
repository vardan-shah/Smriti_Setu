"use client";

import { useState, useEffect, useCallback } from "react";
import { Coffee, Music, TreePine, Mountain, Moon, Sun, Home as HomeIcon, Droplet, Pill, Volume2, Wifi, WifiOff, RefreshCcw, AlertCircle, CloudRain, Flower2 } from "lucide-react";
import Link from "next/link";
import { saveSessionLocally } from "../utils/db";
import { translations, Language } from "../../i18n/translations";
import { useDocumentLanguage } from "../../i18n/language";
import { playVoicePrompt } from "../../i18n/voice";

const CARD_POOL = [
  { icon: Coffee, key: "tea", color: "bg-amber-100 text-amber-700" },
  { icon: Music, key: "music", color: "bg-rose-100 text-rose-700" },
  { icon: TreePine, key: "bamboo", color: "bg-emerald-100 text-emerald-700" },
  { icon: Mountain, key: "hills", color: "bg-slate-200 text-slate-700" },
  { icon: Sun, key: "morning", color: "bg-orange-100 text-orange-600" },
  { icon: Moon, key: "night", color: "bg-indigo-100 text-indigo-700" },
  { icon: CloudRain, key: "rain", color: "bg-cyan-100 text-cyan-700" },
  { icon: Flower2, key: "flower", color: "bg-pink-100 text-pink-700" },
];

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

export default function PatientView() {
  const [lang, setLang] = useState<Language>("English");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlLang = new URLSearchParams(window.location.search).get("lang");
      if (urlLang && translations[urlLang as Language]) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(urlLang as Language);
      }
    }
  }, []);

  useDocumentLanguage(lang);
  const t = translations[lang];

  const [difficulty, setDifficulty] = useState<number>(6); // Start at Medium (6 pairs)
  const [activeCardCount, setActiveCardCount] = useState<number>(6);

  // Initialize strictly with unshuffled cards to prevent SSR hydration mismatch.
  const [cards, setCards] = useState(() => 
    [...CARD_POOL.slice(0, 6), ...CARD_POOL.slice(0, 6)].map((card, idx) => ({ ...card, uniqueId: idx }))
  );
  
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [win, setWin] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'playing' | 'unavailable'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [moves, setMoves] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Digital Biomarkers Tracking
  const [firstClickTime, setFirstClickTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const [memoryLapses, setMemoryLapses] = useState<number>(0);

  const initializeGame = useCallback((diffToUse: number) => {
    setActiveCardCount(diffToUse);
    const pool = CARD_POOL.slice(0, diffToUse);
    setCards([...pool, ...pool].sort(() => Math.random() - 0.5).map((card, idx) => ({ ...card, uniqueId: idx })));
    setFlipped([]);
    setMatched([]);
    setWin(false);
    setMoves(0);
    setStartTime(Date.now());
    
    // Reset biomarkers
    setFirstClickTime(null);
    setReactionTimes([]);
    setLastClickTime(0);
    setSeenCards(new Set());
    setMemoryLapses(0);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    // Safely shuffle cards only on client to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeGame(6);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);

    // AI Adaptive Difficulty: Fetch last session and adjust board size
    import("../utils/db").then(({ getAllSessions }) => {
      getAllSessions().then(sessions => {
        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1];
          let newDiff = 6;
          // RL Logic: If they are doing great, increase to 8 pairs. If struggling, drop to 4 pairs.
          if (lastSession.accuracy >= 80) newDiff = 8;
          else if (lastSession.accuracy < 50) newDiff = 4;
          
          setDifficulty(newDiff);
          // Only auto-update board if user hasn't started playing yet
          setMoves(m => {
             if (m === 0) initializeGame(newDiff);
             return m;
          });
        }
      });
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initializeGame]);

  const handleVoice = (key: string, text: string) => {
    if (voiceState === 'playing') return;
    setVoiceState('playing');
    playVoicePrompt(
      lang, 
      key, 
      text, 
      offlineMode,
      () => setVoiceState('playing'), 
      () => setVoiceState('idle'),
      () => {
        setVoiceState('unavailable');
        // Clear unavailable state after 3 seconds
        setTimeout(() => setVoiceState('idle'), 3000);
      }
    );
  };

  const handleCardClick = (index: number) => {
    if (!isReady || flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].key)) return;
    
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    
    // Biomarker: Hesitation (time to first click)
    if (moves === 0 && flipped.length === 0 && !firstClickTime) {
      setFirstClickTime(now);
    }

    // Biomarker: Reaction time between any clicks
    if (lastClickTime > 0) {
       setReactionTimes(prev => [...prev, now - lastClickTime]);
    }
    setLastClickTime(now);

    const cardKey = cards[index].key;

    // Biomarker: Memory Lapses (clicking a previously seen card that doesn't match the currently flipped card)
    if (flipped.length === 1) {
       const firstCardKey = cards[flipped[0]].key;
       if (firstCardKey !== cardKey && seenCards.has(cardKey)) {
          setMemoryLapses(prev => prev + 1);
       }
    }
    
    setSeenCards(prev => {
      const next = new Set(prev);
      next.add(cardKey);
      return next;
    });

    handleVoice(cardKey, t[cardKey] || cardKey);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];
      
      if (first.key === second.key) {
        setMatched(prev => {
          const newMatched = [...prev, first.key];
          if (newMatched.length === activeCardCount) {
            setWin(true);
            const elapsed = Math.floor((now - startTime) / 1000);
            const perfectMoves = activeCardCount;
            const actualMoves = moves + 1;
            const accuracy = Math.round((perfectMoves / actualMoves) * 100);
            
            // Calculate final biomarkers
            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
            const hesitationMs = firstClickTime ? (firstClickTime - startTime) : 0;
            const avgReactionTimeMs = reactionTimes.length > 0 
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
                : 0;

            saveSessionLocally({ 
              game: "matching", 
              matches: activeCardCount, 
              timeSpent: elapsed, 
              langUsed: lang,
              accuracy: accuracy > 100 ? 100 : accuracy,
              biomarkers: {
                avgReactionTimeMs,
                hesitationMs,
                memoryLapses,
                timeOfDay
              }
            }).catch(console.error);
            
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex justify-start mb-6">
        <Link href="/" className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-sm text-2xl font-bold text-slate-700 active:scale-95 transition-transform border border-slate-200 hover:bg-slate-100">
          <HomeIcon className="w-8 h-8" /> {t.home || "Home"}
        </Link>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 pb-20">
        
        <div className="w-full md:w-1/3 space-y-6">
          <div className={`rounded-3xl p-6 shadow-md border-4 flex flex-col gap-4 transition-colors ${effectivelyOffline ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
            <div className="flex items-center gap-4">
              {effectivelyOffline ? <WifiOff className="w-10 h-10 shrink-0" /> : <Wifi className="w-10 h-10 shrink-0" />}
              <div>
                <h3 className="font-bold text-xl leading-tight">{t.connectivity || "Connectivity"}</h3>
                <p className="text-sm font-medium opacity-80 mt-1">
                  {effectivelyOffline ? (offlineMode ? (t.offlineMode || "Offline Mode") : (t.offline || "Offline")) : (t.online || "Online")}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setOfflineMode(!offlineMode)}
              className={`w-full py-3 px-4 rounded-xl font-bold border-2 transition-colors active:scale-95 ${offlineMode ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              {offlineMode ? `Disable ${t.offlineMode || "Offline Mode"}` : `Enable ${t.offlineMode || "Offline Mode"}`}
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-emerald-500"/> {t.reminders || "Reminders"}
            </h2>
            <button 
              onClick={() => handleVoice('water', t.water || "Water")}
              disabled={voiceState === 'playing'}
              className="w-full flex items-center gap-4 p-4 mb-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border-2 border-blue-200 active:scale-95 disabled:opacity-50"
            >
              <Droplet className="w-10 h-10 shrink-0" />
              <span className="text-2xl font-bold text-left">{t.water || "Water"}</span>
            </button>
            <button 
              onClick={() => handleVoice('meds', t.meds || "Meds")}
              disabled={voiceState === 'playing'}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border-2 border-rose-200 active:scale-95 disabled:opacity-50"
            >
              <Pill className="w-10 h-10 shrink-0" />
              <span className="text-2xl font-bold text-left">{t.meds || "Meds"}</span>
            </button>
          </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-white p-6 md:p-8 rounded-3xl shadow-xl border-4 border-slate-100">
          <div className="w-full flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800">
              {lang} {t.gameMode || "Mode"}
              <span className="ml-3 text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase tracking-wide shadow-inner border border-indigo-200">
                Level {activeCardCount}
              </span>
            </h2>
            <div className="px-4 py-2 md:px-6 md:py-3 bg-emerald-100 rounded-2xl text-emerald-800 text-xl md:text-2xl font-bold border-4 border-emerald-200">
              {t.matches || "Matches"}: {matched.length} / {activeCardCount}
            </div>
          </div>

          {voiceState === 'unavailable' && (
            <div className="w-full mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span className="font-medium text-lg">{t.voiceNotAvailable || "Voice not available for this language"}</span>
            </div>
          )}

          {win ? (
            <div className="text-center space-y-8 py-12 animate-in fade-in zoom-in duration-500 w-full flex flex-col items-center">
              <h2 className="text-5xl md:text-6xl font-black text-emerald-600">{t.greatJob || "Great Job!"}</h2>
              <p className="text-2xl md:text-3xl text-slate-600 font-medium">{t.matchedAll || "Matched All"}</p>
              <button 
                onClick={() => initializeGame(difficulty)}
                className="mt-8 flex items-center gap-4 px-8 py-5 md:px-12 md:py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-3xl md:text-4xl font-bold shadow-xl active:scale-95 transition-all"
              >
                <RefreshCcw className="w-8 h-8 md:w-10 md:h-10" /> {t.playAgain || "Play Again"}
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`} role="grid" aria-label="Memory Game Board">
              {cards.map((card, idx) => {
                const isFlipped = flipped.includes(idx) || matched.includes(card.key);
                const IconComponent = card.icon;
                return (
                  <button
                    key={card.uniqueId}
                    onClick={() => handleCardClick(idx)}
                    aria-label={isFlipped ? (t[card.key] || card.key) : "Unflipped card"}
                    aria-pressed={isFlipped}
                    disabled={isFlipped || !isReady}
                    className={`relative aspect-square rounded-3xl text-center flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 ${
                      isFlipped 
                        ? `${card.color} shadow-inner border-4 border-white` 
                        : "bg-slate-50 shadow-md hover:shadow-xl border-4 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {isFlipped ? (
                      <>
                        <IconComponent className="w-12 h-12 md:w-16 md:h-16 mb-2 drop-shadow-sm" />
                        <span className="text-sm md:text-lg font-bold leading-tight px-1">{t[card.key] || card.key}</span>
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
    </div>
  );
}
