"use client";

import React from "react";
import Link from "next/link";

interface FooterProps {
  theme: "light" | "dark";
  colors: {
    border: string;
    textSecondary: string;
    highlight: string;
  };
  toggleTheme: (event?: React.MouseEvent) => void;
}

export function Footer({ theme, colors, toggleTheme }: FooterProps) {
  return (
    <footer className={`w-full pt-10 pb-6 z-10 overflow-hidden mt-auto ${
        theme === "dark"
          ? "bg-gradient-to-t from-[#030303]/90 via-[#030303]/40 to-transparent"
          : "bg-gradient-to-t from-[#FAFAFA]/90 via-[#FAFAFA]/40 to-transparent"
      }`}>
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-left mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/cloudcodelogolight.png" 
              alt="CloudCode" 
              className="h-5 w-auto object-contain dark:invert-0 invert cursor-pointer"
            />
          </Link>
          <span className={`text-xs ${colors.textSecondary}`}>
            {`© ${new Date().getFullYear()} CloudCode, Inc. All rights reserved.`}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className={`text-xs ${colors.textSecondary} hover:text-indigo-550 dark:hover:text-white transition-colors`}>
            {"Privacy"}
          </Link>
          <Link href="/terms" className={`text-xs ${colors.textSecondary} hover:text-indigo-550 dark:hover:text-white transition-colors`}>
            {"Terms"}
          </Link>
          
          <button
            onClick={(e) => toggleTheme(e)}
            className={`p-1.5 rounded-md border ${colors.border} ${colors.highlight} transition-all cursor-pointer ${colors.textSecondary}`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="w-full flex justify-center pointer-events-none select-none overflow-hidden mt-8 px-6 pb-4">
        <img 
          src="/cloudcodelogolight.png" 
          alt="CloudCode" 
          className="w-full max-w-5xl h-12 md:h-20 object-contain opacity-15 hover:opacity-30 transition-all duration-500"
          style={{
            filter: theme === "dark" 
              ? "drop-shadow(1.5px 0px 0px rgba(255, 255, 255, 0.15)) drop-shadow(-1.5px 0px 0px rgba(255, 255, 255, 0.15)) drop-shadow(0px 1.5px 0px rgba(255, 255, 255, 0.15)) drop-shadow(0px -1.5px 0px rgba(255, 255, 255, 0.15))" 
              : "invert(1) drop-shadow(1.5px 0px 0px rgba(0, 0, 0, 0.08)) drop-shadow(-1.5px 0px 0px rgba(0, 0, 0, 0.08)) drop-shadow(0px 1.5px 0px rgba(0, 0, 0, 0.08)) drop-shadow(0px -1.5px 0px rgba(0, 0, 0, 0.08))",
          }}
        />
      </div>
    </footer>
  );
}
