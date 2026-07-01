"use client";

import React from "react";

export const PhoneMockup = ({ 
  scrollProgress, 
  theme, 
  mouseOffset, 
  activeStep,
  children 
}: { 
  scrollProgress: number, 
  theme: "light" | "dark", 
  mouseOffset: { x: number, y: number }, 
  activeStep: string,
  children: React.ReactNode 
}) => {
  const glareX = (scrollProgress * 400) - 200 + (mouseOffset.x * 100);
  const glareY = (scrollProgress * 200) - 100 + (mouseOffset.y * 100);
  const isDark = theme === "dark";

  const shadowX = -8 - (mouseOffset.x * 15);
  const shadowY = 8 + (mouseOffset.y * 15);

  const screenRx = mouseOffset.y * -4;
  const screenRy = mouseOffset.x * 4;

  return (
    <div 
      className={`w-[280px] h-[550px] rounded-[44px] p-3 relative select-none transition-all duration-300 border antialiased ${
        isDark ? "bg-[#090A10] border-white/10" : "bg-[#F3F4F6] border-black/10"
      }`}
      style={{
        transformStyle: "preserve-3d",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        boxShadow: isDark 
          ? `
            -2px 2px 0px 0px rgba(255, 255, 255, 0.05),
            -4px 4px 0px 0px #1a1c24,
            -8px 8px 0px 0px #111217,
            ${shadowX}px ${shadowY}px 25px 0px rgba(0, 0, 0, 0.7),
            ${shadowX * 2}px ${shadowY * 2}px 50px 0px rgba(0, 0, 0, 0.5)
          `
          : `
            -2px 2px 0px 0px rgba(0, 0, 0, 0.03),
            -4px 4px 0px 0px #E5E7EB,
            -8px 8px 0px 0px #D1D5DB,
            ${shadowX}px ${shadowY}px 25px 0px rgba(0, 0, 0, 0.12),
            ${shadowX * 2}px ${shadowY * 2}px 50px 0px rgba(0, 0, 0, 0.08)
          `,
      }}
    >
      {/* 3D Side Buttons */}
      <div 
        className={`absolute left-[-3px] top-24 w-[3px] h-10 rounded-l font-sans ${isDark ? "bg-[#2D3039]" : "bg-gray-400"}`} 
        style={{ transform: "translateZ(-8px)" }}
      />
      <div 
        className={`absolute left-[-3px] top-38 w-[3px] h-14 rounded-l ${isDark ? "bg-[#2D3039]" : "bg-gray-400"}`} 
        style={{ transform: "translateZ(-8px)" }}
      />
      <div 
        className={`absolute right-[-3px] top-32 w-[3px] h-16 rounded-r ${isDark ? "bg-[#2D3039]" : "bg-gray-400"}`} 
        style={{ transform: "translateZ(-8px)" }}
      />

      {/* Screen container with translateZ to pop it forward in 3D */}
      <div 
        className={`w-full h-full rounded-[34px] overflow-hidden relative flex flex-col border transition-all duration-700 antialiased ${
          isDark ? "bg-[#030303] border-black/50" : "bg-white border-gray-200"
        }`}
        style={{
          transform: `translateZ(8px) rotateX(${screenRx}deg) rotateY(${screenRy}deg)`,
          transformStyle: "preserve-3d",
          WebkitFontSmoothing: "antialiased",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transition: "transform 0.15s ease-out, box-shadow 0.7s ease-in-out",
          boxShadow: "inset 0 0 20px rgba(99, 102, 241, 0.15)"
        }}
      >
        {/* Glass Glare Reflection Effect */}
        <div 
          className="absolute inset-0 z-25 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)',
            transform: `translateX(${glareX}px) translateY(${glareY}px) translateZ(12px)`,
            transition: 'transform 0.15s ease-out',
          }}
        />

        {/* Status bar (No Emojis) */}
        <div className={`h-8 pt-2.5 px-6 flex justify-between items-center text-[8px] font-mono z-20 select-none ${
          isDark ? "text-gray-400" : "text-gray-555"
        }`}>
          <span>09:41</span>
          <div className="flex items-center gap-2">
            {/* Clean SVG Signal */}
            <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M2 20h.01M6 20v-4M10 20v-8M14 20V8M18 20V4" />
            </svg>
            {/* Clean SVG Battery */}
            <svg className="w-3.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="2" y="5" width="16" height="14" rx="3" />
              <path d="M22 11v2" />
            </svg>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 w-full relative overflow-hidden font-sans">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="h-3 w-full flex items-center justify-center z-25">
          <div className={`w-16 h-0.5 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
        </div>
      </div>
    </div>
  );
};
