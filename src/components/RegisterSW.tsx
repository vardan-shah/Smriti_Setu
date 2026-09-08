"use client";
import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (reg) => console.log("SW registered:", reg.scope),
        (err) => console.error("SW registration failed:", err)
      );
    }
  }, []);
  return null;
}
