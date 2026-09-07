"use client";

import Link from "next/link";
import { Brain, LineChart, Globe } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [lang, setLang] = useState("English");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
      
      {/* LANGUAGE SELECTOR */}
      <div className="absolute top-6 right-6 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
        <Globe className="w-5 h-5 text-slate-500" />
        <select 
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
        >
          <option value="English">English</option>
          <option value="Assamese">অসমীয়া (Assamese)</option>
          <option value="Bengali">বাংলা (Bengali)</option>
          <option value="Hindi">हिंदी (Hindi)</option>
        </select>
      </div>

      <div className="max-w-3xl w-full text-center space-y-12 mt-12">
        
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Memori<span className="text-emerald-600">NER</span></h1>
          <p className="text-xl text-slate-600 font-medium">
            AI-Based Cognitive Gaming & Memory Assistance Platform for the North Eastern Region
          </p>
          <p className="text-md text-slate-500 max-w-2xl mx-auto bg-slate-100 p-4 rounded-xl border border-slate-200">
            <strong>Official SIH 26003 Demo:</strong> Voice-enabled multilingual interface, adaptive gaming, offline sync, and caregiver monitoring tailored for elderly dementia patients in NER.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          <Link href={`/patient?lang=${lang}`} 
            className="group relative flex flex-col items-center p-10 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Brain className="w-24 h-24 text-emerald-600 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-3xl font-bold text-slate-800 relative z-10">
              {lang === "Assamese" ? "ৰোগীৰ দৰ্শন" : lang === "Bengali" ? "রোগীর দৃশ্য" : lang === "Hindi" ? "रोगी दृश्य" : "Patient View"}
            </h2>
            <p className="text-slate-500 mt-4 relative z-10 text-lg">
              Start the culturally adaptive cognitive matching game.
            </p>
          </Link>

          <Link href={`/caregiver?lang=${lang}`} 
            className="group relative flex flex-col items-center p-10 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-indigo-100 hover:border-indigo-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <LineChart className="w-24 h-24 text-indigo-600 mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-3xl font-bold text-slate-800 relative z-10">Caregiver View</h2>
            <p className="text-slate-500 mt-4 relative z-10 text-lg">
              View engagement trends, insights, and offline sync logs.
            </p>
          </Link>

        </div>
        
        <div className="pt-8">
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
            Team AlgoNauts | SIH 26003 | MDoNER
          </p>
        </div>
      </div>
    </div>
  );
}
