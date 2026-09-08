"use client";
import { useEffect } from "react";
import { Language } from "./translations";

export function useDocumentLanguage(lang: Language) {
  useEffect(() => {
    const codeMap: Record<Language, string> = {
      English: "en",
      Assamese: "as",
      Bengali: "bn",
      Hindi: "hi"
    };
    document.documentElement.lang = codeMap[lang] || "en";
  }, [lang]);
}
