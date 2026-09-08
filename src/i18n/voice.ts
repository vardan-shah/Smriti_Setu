import { Language } from "./translations";

export async function playVoicePrompt(lang: Language, key: string, text: string, onStart?: () => void, onEnd?: () => void) {
  // 1. Try local audio asset for Assamese
  if (lang === "Assamese") {
    try {
      const audio = new Audio(`/audio/as/${key}.m4a`);
      audio.onplay = () => onStart?.();
      audio.onended = () => onEnd?.();
      audio.onerror = () => {
        // Fallback to TTS if local audio fails
        fallbackToTTS(lang, text, onStart, onEnd);
      };
      await audio.play();
      return;
    } catch (e) {
      fallbackToTTS(lang, text, onStart, onEnd);
      return;
    }
  }

  // Fallback to Browser TTS for other languages
  fallbackToTTS(lang, text, onStart, onEnd);
}

function fallbackToTTS(lang: Language, text: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === "undefined" || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  
  let locale = "en-IN";
  if (lang === "Hindi") locale = "hi-IN";
  if (lang === "Bengali") locale = "bn-IN";
  if (lang === "Assamese") locale = "as-IN"; // Rarely supported, but try

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = 0.85;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}
