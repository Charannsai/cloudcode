"use client";

import React, { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  theme: "light" | "dark";
  colors: {
    text: string;
    border: string;
    btnPrimary: string;
  };
}

export function Header({ theme, colors }: HeaderProps) {
  const [showAppDropdown, setShowAppDropdown] = useState(false);

  return (
    <nav className={`sticky top-0 w-full z-50 ${
      theme === "dark" 
        ? "bg-gradient-to-b from-[#141414]/90 via-[#141414]/40 to-transparent" 
        : "bg-gradient-to-b from-[#FAFAFA]/90 via-[#FAFAFA]/40 to-transparent"
    } transition-all duration-300`}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/cloudcodelogolight.png" 
              alt="CloudCode" 
              className="h-[21px] my-[1.5px] w-auto object-contain dark:invert-0 invert cursor-pointer"
            />
          </Link>
        </div>
        
        <div className="flex items-center gap-6 relative">
          <div className="relative">
            <button 
              onClick={() => setShowAppDropdown(!showAppDropdown)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${colors.btnPrimary} hover:opacity-90 active:scale-95`}
            >
              <span>{"Get the app"}</span>
              <svg 
                className={`w-3 h-3 transition-transform duration-300 ${showAppDropdown ? "rotate-180" : ""}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {/* Backdrop click layer */}
            {showAppDropdown && (
              <div className="fixed inset-0 z-40" onClick={() => setShowAppDropdown(false)} />
            )}

            {/* Smooth Animated Dropdown Container */}
            <div 
              className={`absolute right-0 mt-2.5 w-52 rounded-xl border ${colors.border} bg-white/90 dark:bg-[#1c1c1c]/90 backdrop-blur-md shadow-xl py-2 z-50 transition-all duration-300 origin-top-right ${
                showAppDropdown 
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="flex items-center px-4 py-2.5 text-xs font-semibold text-zinc-400 dark:text-zinc-600 cursor-not-allowed select-none">
                <img 
                  src="/assets/playstorelogo.png" 
                  alt="Playstore" 
                  className="w-3.5 h-3.5 mr-2.5 object-contain opacity-70 dark:opacity-60"
                />
                <span>{"Playstore"}</span>
                <span className="ml-auto text-[7.5px] font-mono font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded tracking-wider">
                  {"Soon"}
                </span>
              </div>
              
              <div className="flex items-center px-4 py-2.5 text-xs font-semibold text-zinc-400 dark:text-zinc-600 cursor-not-allowed select-none">
                <img 
                  src="/assets/appstorelogo.png" 
                  alt="App Store" 
                  className="w-3.5 h-3.5 mr-2.5 object-contain opacity-70 dark:opacity-60"
                />
                <span>{"App store"}</span>
                <span className="ml-auto text-[7.5px] font-mono font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded tracking-wider">
                  {"Soon"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
