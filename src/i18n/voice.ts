import { Language } from "./translations";

export async function playVoicePrompt(
  lang: Language, 
  key: string, 
  text: string, 
  offlineMode: boolean,
  onStart?: () => void, 
  onEnd?: () => void,
  onUnavailable?: () => void
) {
  // 1. Try local audio asset for Assamese
  if (lang === "Assamese") {
    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      fallbackToTTS(lang, text, offlineMode, onStart, onEnd, onUnavailable);
    };

    try {
      const audio = new Audio(`/audio/as/${key}.m4a`);
      audio.onplay = () => onStart?.();
      audio.onended = () => onEnd?.();
      audio.onerror = () => triggerFallback();
      await audio.play();
      return;
    } catch (e) {
      triggerFallback();
      return;
    }
  }

  // Fallback to Browser TTS for other languages
  fallbackToTTS(lang, text, offlineMode, onStart, onEnd, onUnavailable);
}

function fallbackToTTS(
  lang: Language, 
  text: string, 
  offlineMode: boolean,
  onStart?: () => void, 
  onEnd?: () => void,
  onUnavailable?: () => void
) {
  if (typeof window === "undefined" || !('speechSynthesis' in window)) {
    onUnavailable?.();
    onEnd?.();
    return;
  }

  if (offlineMode) {
    // True offline mode skips browser TTS since many TTS engines require network (e.g. Google Network voices).
    onUnavailable?.();
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  
  let locale = "en-IN";
  if (lang === "Hindi") locale = "hi-IN";
  if (lang === "Bengali") locale = "bn-IN";
  if (lang === "Assamese") locale = "as-IN"; // Rarely supported, but try

  const voices = window.speechSynthesis.getVoices();
  // Most voices use a standard BCP-47 tag. We check if any voice matches the primary language subtag.
  const langPrefix = locale.split('-')[0];
  const hasVoice = voices.length === 0 || voices.some(v => v.lang.startsWith(langPrefix));

  if (!hasVoice) {
    onUnavailable?.();
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.85;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    onUnavailable?.();
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
