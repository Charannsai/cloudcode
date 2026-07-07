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
        ? "bg-gradient-to-b from-[#030303]/90 via-[#030303]/40 to-transparent" 
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
              className={`absolute right-0 mt-2.5 w-52 rounded-xl border ${colors.border} bg-white/90 dark:bg-[#07080b]/90 backdrop-blur-md shadow-xl py-2 z-50 transition-all duration-300 origin-top-right ${
                showAppDropdown 
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <a 
                href="https://play.google.com" 
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowAppDropdown(false)}
                className="flex items-center px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-[#0F1115] dark:hover:text-white transition-all duration-200 group/item"
              >
                <svg className="w-3.5 h-3.5 mr-2.5 text-zinc-400 group-hover/item:text-indigo-550 dark:group-hover/item:text-white transition-colors shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.783 12 3.609 22.186A2.229 2.229 0 0 1 3 20.59V3.41c0-.624.26-1.2.609-1.596zm11.238 9.123l2.871-1.654L6.155 3.327l8.692 7.61zm2.871 2.126l-2.871-1.654-8.692 7.61 11.563-5.956zm.939-.817c.528-.304.843-.88.843-1.493a1.72 1.72 0 0 0-.843-1.493l-2.029-1.168-3.047 3.061 3.047 3.061 2.029-1.168z"/>
                </svg>
                <span className="group-hover/item:translate-x-0.5 transition-transform duration-200">{"Playstore"}</span>
                <svg className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
              
              <div className="flex items-center px-4 py-2.5 text-xs font-semibold text-zinc-400 dark:text-zinc-600 cursor-not-allowed select-none">
                <svg className="w-3.5 h-3.5 mr-2.5 text-zinc-300 dark:text-zinc-800 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                </svg>
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
