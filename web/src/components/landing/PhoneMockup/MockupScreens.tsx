"use client";

import React, { useState, useEffect, useRef } from "react";
import { CLOUD_PATH } from "./constants";

export const InitialScreen = ({ theme }: { theme: "light" | "dark" }) => {
  const isDark = theme === "dark";
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#05070B]" : "bg-[#FAFAFA]"
    }`}>
      <style>{`
        .trace-path {
          stroke-dasharray: 3000;
          stroke-dashoffset: 3000;
          animation: trace 2.2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards, fillIn 0.6s ease-out 1.8s forwards;
        }
        .fade-in-brand {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInBrand 0.8s cubic-bezier(0.16, 1, 0.3, 1) 2.0s forwards;
        }
        @keyframes trace {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fillIn {
          to {
            fill: ${isDark ? "#FFFFFF" : "#0F1115"};
            fill-opacity: 1;
            stroke-opacity: 0;
          }
        }
        @keyframes fadeInBrand {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="z-10 flex flex-col items-center gap-6">
        <svg width="80" height="80" viewBox="0 0 874 552">
          <path
            d={CLOUD_PATH}
            fill="none"
            stroke={isDark ? "#FFFFFF" : "#0F1115"}
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="trace-path"
          />
        </svg>

        <div className="fade-in-brand flex flex-col items-center gap-1.5">
          <h4 className={`text-[13px] font-extrabold tracking-[0.15em] uppercase font-sans ${isDark ? "text-white" : "text-[#0F1115]"}`}>
            CloudCode
          </h4>
          <span className={`text-[7px] tracking-[0.25em] font-mono uppercase ${isDark ? "text-gray-400" : "text-gray-550"}`}>
            Mobile Workspace
          </span>
        </div>
      </div>
    </div>
  );
};

export const EnvironmentsScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.48) / 0.20));

  const showTemplates = t < 0.35;
  const showLoading = t >= 0.35 && t < 0.80;
  const showComplete = t >= 0.80;

  const loadProgress = Math.max(0, Math.min(100, Math.floor((t - 0.35) / 0.45 * 100)));

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between font-sans transition-colors duration-300">
      <div className="space-y-3">
        <div className={`border-b pb-2 ${isDark ? "border-white/5" : "border-black/5"}`}>
          <h4 className="font-bold text-[10px] text-gray-400 tracking-wide uppercase font-mono">Select Template</h4>
        </div>
        
        <div className="space-y-1.5">
          {[
            { name: "Node.js / Next.js", desc: "React framework with Tailwind", icon: <i className="devicon-nodejs-plain colored text-xs mr-1 shrink-0" /> },
            { name: "Python / FastAPI", desc: "Modern Python web backend", icon: <i className="devicon-python-plain colored text-xs mr-1 shrink-0" /> },
            { name: "Rust / Cargo", desc: "Performance-critical system code", icon: <i className="devicon-rust-plain text-xs mr-1 shrink-0 text-black dark:text-white" /> }
          ].map((tmpl, idx) => {
            const isSelected = idx === 0 && showTemplates;
            return (
              <div key={idx} className={`p-2 rounded border transition-all text-left flex items-center gap-2 ${
                isSelected 
                  ? (isDark ? "border-white bg-white/5" : "border-black bg-black/5")
                  : (isDark ? "border-white/5 bg-white/5 opacity-40" : "border-black/5 bg-black/5 opacity-45")
              }`}>
                {tmpl.icon}
                <div>
                  <div className="font-bold text-[9px]">{tmpl.name}</div>
                  <div className={`text-[7px] ${isDark ? "text-gray-400" : "text-gray-550"}`}>{tmpl.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {showLoading && (
          <div className="space-y-1 text-center">
            <div className={`w-full h-1 rounded overflow-hidden ${isDark ? "bg-white/10" : "bg-black/5"}`}>
              <div 
                className={`h-full transition-all duration-75 ${isDark ? "bg-white" : "bg-black"}`} 
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <span className="text-[8px] font-mono text-gray-400">Allocating sandbox... {loadProgress}%</span>
          </div>
        )}
        
        {showComplete && (
          <div className={`border p-2 rounded text-left space-y-1 font-mono text-[8px] ${
            isDark 
              ? "bg-white/5 border-white/10 text-gray-400" 
              : "bg-black/5 border-black/10 text-gray-600"
          }`}>
            <div className="text-white dark:text-white font-bold">● Workspace Online</div>
            <div className="text-gray-400">ID: sandbox-node-1</div>
            <div className="text-gray-500">Resources: 4 Cores / 4GB RAM</div>
          </div>
        )}

        <button className={`w-full py-1.5 rounded text-[9px] font-bold text-center transition-all ${
          showComplete 
            ? (isDark ? "bg-white text-black" : "bg-black text-white") 
            : showLoading 
              ? (isDark ? "bg-white/10 text-white/40" : "bg-black/5 text-black/30") 
              : (isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800")
        }`}>
          {showComplete ? "Open Workspace" : showLoading ? "Starting..." : "Create Workspace"}
        </button>
      </div>
    </div>
  );
};

export const TerminalScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.68) / 0.10));

  const allLines = [
    "root@cloudcode:~# git clone https://github.com/user/project",
    "Cloning into 'project'... done.",
    "root@cloudcode:~# cd project && npm install",
    "added 342 packages in 4.1s",
    "root@cloudcode:~# npm run dev",
    "▲ Next.js 16.2.9 (Turbopack)",
    "- Local: http://localhost:3000"
  ];

  const visibleCount = Math.floor(t * (allLines.length + 1));

  return (
    <div className={`w-full h-full p-3 font-mono text-[9px] flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#08090E] text-gray-300" : "bg-gray-50 text-gray-800"
    }`}>
      <div className={`flex items-center justify-between border-b pb-1 mb-2 ${isDark ? "border-white/5" : "border-black/5"}`}>
        <span className="text-gray-500">bash - session-1</span>
        <span className="font-bold text-gray-400">● online</span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {allLines.slice(0, visibleCount).map((line, idx) => {
          if (line.startsWith("root@")) {
            return (
              <div key={idx}>
                <span className="font-bold">root@cloudcode</span>
                <span className="text-gray-500">:~#</span> <span className={isDark ? "text-white" : "text-black"}>{line.split("~# ")[1]}</span>
              </div>
            );
          }
          return <div key={idx} className="text-gray-405 dark:text-gray-400">{line}</div>;
        })}
        {visibleCount > 0 && visibleCount < allLines.length && (
          <div className={`w-1 h-2.5 inline-block ml-0.5 animate-pulse ${isDark ? "bg-white" : "bg-black"}`} />
        )}
      </div>
    </div>
  );
};

export const EditorScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.78) / 0.08));

  const showHighlight = t >= 0.20 && t < 0.40;
  const showPopup = t >= 0.20 && t < 0.40;
  const isPressed = t >= 0.35 && t < 0.40;
  const showAIPanel = t >= 0.40;
  const showNewCode = t >= 0.70;

  const promptText = "add transition and log the count";
  const promptLength = Math.floor(Math.max(0, Math.min(1, (t - 0.40) / 0.15)) * promptText.length);
  const currentPrompt = promptText.slice(0, promptLength);

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#0F1117]" : "bg-white"
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
        isDark ? "bg-[#0A0B0F] border-white/5" : "bg-gray-55 border-black/5"
      }`}>
        <div className="flex items-center gap-1">
          <i className="devicon-typescript-plain colored text-[8px] shrink-0" />
          <span className={`text-[8px] font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}>Counter.tsx</span>
        </div>
        <span className={`text-[7px] font-mono px-1 py-0.5 rounded ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"}`}>TypeScript</span>
      </div>

      <div className={`flex-1 p-3 font-mono text-[9px] space-y-1 overflow-y-auto leading-relaxed relative ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}>
        {!showNewCode ? (
          <>
            <div><span className="font-bold">import</span> &#123; useState  &#125; <span className="font-bold">from</span> <span className="italic text-gray-500">&apos;react&apos;</span>;</div>
            <div className="h-1" />
            <div><span className="font-bold">export function</span> <span className="underline decoration-gray-500">Counter</span>() &#123;</div>
            <div className="pl-3">
              <span className="font-bold">const</span> [count, setCount] = <span className="underline decoration-gray-550">useState</span>(<span className="font-bold">0</span>);
            </div>
            <div className="pl-3"><span className="font-bold">return</span> (</div>
            
            <div className="relative">
              {showPopup && (
                <div 
                  className={`absolute left-6 -top-7 px-2 py-1 rounded text-[8px] font-sans font-bold shadow-lg flex items-center gap-1 border transition-all duration-150 z-20 ${
                    isPressed 
                      ? (isDark ? "bg-white text-black border-white scale-95" : "bg-black text-white border-black scale-95")
                      : (isDark ? "bg-[#161821] text-white border-white/10" : "bg-white text-black border-black/10")
                  }`}
                >
                  <span>Ask AI</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPressed ? "bg-gray-400" : "bg-indigo-500 animate-pulse"}`} />
                </div>
              )}

              {showPopup && (
                <div 
                  className="absolute w-2 h-2 bg-black dark:bg-white rounded-full border border-white dark:border-black pointer-events-none transition-all duration-75 shadow-md z-30"
                  style={{
                    left: t < 0.35 ? `${40 - ((t - 0.20) / 0.15) * 20}%` : "20%",
                    top: t < 0.35 ? `${15 - ((t - 0.20) / 0.15) * 25}%` : "-10%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              )}

              <div className={`pl-6 transition-all duration-350 ${
                showHighlight 
                  ? (isDark ? "bg-white/10 border-l-2 border-white rounded" : "bg-black/5 border-l-2 border-black rounded") 
                  : ""
              }`}>
                &lt;<span className="font-bold">button</span> <span className="text-gray-550">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + <span className="font-bold">1</span>)&#125;&gt;
              </div>
            </div>

            <div className="pl-9">Count: &#123;count&#125;</div>
            <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
            <div className="pl-3">);</div>
            <div>&#125;</div>
          </>
        ) : (
          <>
            <div><span className="font-bold">import</span> &#123; useState, useEffect  &#125; <span className="font-bold">from</span> <span className="italic text-gray-500">&apos;react&apos;</span>;</div>
            <div className="h-1" />
            <div><span className="font-bold">export function</span> <span className="underline decoration-gray-500">Counter</span>() &#123;</div>
            <div className="pl-3">
              <span className="font-bold">const</span> [count, setCount] = <span className="underline decoration-gray-550">useState</span>(<span className="font-bold">0</span>);
            </div>
            <div className={`pl-3 border-l-2 rounded py-0.5 my-1 ${
              isDark ? "bg-white/10 border-white" : "bg-black/5 border-black"
            }`}>
              <span className="underline decoration-gray-550">useEffect</span>(() =&gt; &#123;
              <div className="pl-3">console.<span className="underline decoration-gray-550">log</span>(<span className="italic text-gray-500">&quot;Count is&quot;</span>, count);</div>
              &#125;, [count]);
            </div>
            <div className="pl-3"><span className="font-bold">return</span> (</div>
            <div className="pl-6">
              &lt;<span className="font-bold">button</span> 
            </div>
            <div className="pl-9 text-gray-500">onClick<span className={isDark ? "text-gray-400" : "text-gray-600"}>=&#123;() =&gt;</span> <span>setCount</span>(count + <span className="font-bold">1</span>)&#125;</div>
            <div className="pl-9 text-gray-500">className<span className={isDark ? "text-gray-400" : "text-gray-600"}>=&quot;active:scale-95 transition-all&quot;</span></div>
            <div className="pl-6">&gt;</div>
            <div className="pl-9">Count: &#123;count&#125;</div>
            <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
            <div className="pl-3">);</div>
            <div>&#125;</div>
          </>
        )}
      </div>

      {/* AI Assistant Chat Interface */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 border-t transition-all duration-500 transform space-y-2 ${
        showAIPanel ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      } ${
        isDark ? "bg-[#0A0B0F] border-white/5" : "bg-gray-55 border-black/5"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-white" : "bg-black"}`} />
          <span className="text-[7px] font-mono uppercase font-bold">CloudCode AI</span>
        </div>
        
        <div className="space-y-1">
          <div className={`text-[7px] font-mono p-1 rounded ${
            isDark ? "bg-white/5 text-gray-300" : "bg-black/5 text-gray-700"
          }`}>
            <span className="text-gray-500">User:</span> {currentPrompt}
            {t >= 0.40 && t < 0.55 && <span className="animate-pulse">|</span>}
          </div>
          
          {t >= 0.55 && (
            <div className={`text-[7px] font-mono p-1 rounded border ${
              showNewCode 
                ? (isDark ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black")
                : (isDark ? "bg-white/5 border-white/5 text-gray-400 animate-pulse" : "bg-black/5 border-black/5 text-gray-500 animate-pulse")
            }`}>
              <span className="text-gray-500">AI:</span> {showNewCode ? "Done! Added transition and useEffect hook." : "Refactoring code..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GitScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.86) / 0.06));

  const isPushing = t >= 0.35 && t < 0.70;
  const showPR = t >= 0.70;

  return (
    <div className={`w-full h-full p-3 font-sans text-xs flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0A0B10] text-gray-300" : "bg-white text-[#0F1115]"
    }`}>
      {!showPR ? (
        <>
          <div className={`border-b pb-2 ${isDark ? "border-white/5" : "border-black/5"}`}>
            <h4 className={`font-bold text-[10px] tracking-wide uppercase font-mono ${isDark ? "text-white" : "text-gray-800"}`}>Source Control</h4>
          </div>
          <div className="flex-1 py-3 space-y-3">
            <div>
              <span className="text-[9px] font-mono text-gray-500">CHANGES</span>
              <div className="mt-1 space-y-1">
                <div className={`flex items-center justify-between p-1.5 rounded border text-[9px] ${
                  isDark ? "bg-white/5 border-white/5" : "bg-gray-55 border-black/5"
                }`}>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-[#E2C08D]">M</span>
                    <i className="devicon-typescript-plain colored text-[9px] shrink-0" />
                    <span>Counter.tsx</span>
                  </div>
                  <span className="text-[7px] text-gray-500 font-mono">Modified</span>
                </div>
                <div className={`flex items-center justify-between p-1.5 rounded border text-[9px] ${
                  isDark ? "bg-white/5 border-white/5" : "bg-gray-55 border-black/5"
                }`}>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-[#E2C08D]">M</span>
                    <i className="devicon-nextjs-plain text-[9px] shrink-0 text-black dark:text-white" />
                    <span>page.tsx</span>
                  </div>
                  <span className="text-[7px] text-gray-500 font-mono">Modified</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-gray-500">COMMIT MESSAGE</span>
              <div className={`p-2 rounded border text-[9px] font-mono ${
                isDark ? "bg-white/5 border-white/5 text-white" : "bg-gray-55 border-black/5 text-black"
              }`}>
                feat: improve counter interactivity
              </div>
            </div>
          </div>
          
          <button className={`w-full py-2 rounded font-bold text-[10px] text-center transition-all duration-300 ${
            isPushing 
              ? (isDark ? "bg-white/10 text-white/40" : "bg-black/5 text-black/30") 
              : (isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-850")
          }`}>
            {isPushing ? "Pushing..." : "Commit & Push"}
          </button>
        </>
      ) : (
        <>
          <div className={`border-b pb-2 flex justify-between items-center ${isDark ? "border-white/5" : "border-black/5"}`}>
            <h4 className={`font-bold text-[10px] tracking-wide uppercase font-mono ${isDark ? "text-white" : "text-gray-800"}`}>Pull Request #42</h4>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${
              isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/10 text-black"
            }`}>Open</span>
          </div>
          <div className="flex-1 py-3 space-y-3">
            <div className="space-y-1">
              <h5 className={`font-bold text-[10px] ${isDark ? "text-white" : "text-gray-800"}`}>feat: improve counter interactivity</h5>
              <p className="text-[8px] text-gray-500 font-mono">Merged 2 commits from <code className="font-mono bg-white/5 px-1 rounded">feat/counter</code> into <code className="font-mono bg-white/5 px-1 rounded">main</code></p>
            </div>
            <div className={`p-2 rounded border text-[8px] space-y-1 font-mono ${
              isDark ? "bg-white/5 border-white/5" : "bg-gray-55 border-black/5"
            }`}>
              <div className="font-bold font-mono">✓ All checks passed (100%)</div>
              <div className="text-gray-500 font-mono">✓ No conflicts with base branch</div>
            </div>
          </div>
          
          <button className={`w-full py-2 rounded font-bold text-[10px] text-center transition-all ${
            isDark ? "bg-white text-black" : "bg-black text-white"
          }`}>
            Merge Pull Request
          </button>
        </>
      )}
    </div>
  );
};

export const PreviewsScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.92) / 0.04));

  let count = 0;
  if (t >= 0.33 && t < 0.66) count = 1;
  else if (t >= 0.66) count = 2;

  const isClicking = (t >= 0.30 && t <= 0.36) || (t >= 0.63 && t <= 0.69);
  const scrollTop = -t * 80;

  return (
    <div className="w-full h-full bg-[#FAFAFA] text-[#0F1115] flex flex-col justify-between overflow-hidden font-sans">
      <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
        <div className="flex-1 bg-gray-100 px-2 py-0.5 rounded text-[8px] text-gray-500 font-mono flex justify-between items-center">
          <span>localhost:3000</span>
          <span>🔒</span>
        </div>
        <span className="text-[8px] text-gray-400 font-mono">↻</span>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-55 relative overflow-hidden">
        <div 
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full max-w-[160px] text-center space-y-3 transition-transform duration-100"
          style={{ transform: `translateY(${scrollTop}px)` }}
        >
          <h5 className="font-bold text-[10px]">Interactive Preview</h5>
          <p className="text-[7px] text-gray-400">Click the button below to test interactions.</p>
          <button className={`px-3 py-1 rounded-lg text-[9px] font-bold text-white transition-all bg-black ${
            isClicking ? "scale-95 bg-gray-800" : "active:scale-95"
          }`}>
            Count: {count}
          </button>
        </div>

        <div 
          className="w-full max-w-[160px] mt-4 space-y-2 text-left opacity-60 transition-transform duration-100"
          style={{ transform: `translateY(${scrollTop}px)` }}
        >
          <div className="h-1 bg-gray-200 rounded w-12" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
        </div>

        <div 
          className="absolute w-2.5 h-2.5 bg-black rounded-full border border-white pointer-events-none transition-all duration-75 shadow-lg z-20"
          style={{
            left: t < 0.33 
              ? `${68 - (t / 0.33) * 18}%`
              : t < 0.66 
                ? `${50 + ((t - 0.33) / 0.33) * 18}%`
                : `${68 - ((t - 0.66) / 0.34) * 18}%`,
            top: t < 0.33 
              ? `${75 - (t / 0.33) * 17}%`
              : t < 0.66 
                ? `${58 + ((t - 0.33) / 0.33) * 17}%`
                : `${75 - ((t - 0.66) / 0.34) * 17}%`,
            transform: "translate(-50%, -50%)",
            opacity: 0.8,
          }}
        />
      </div>

      <div className="bg-[#0A0B0F] border-t border-white/5 p-2 font-mono text-[7px] text-gray-450 space-y-0.5 z-10">
        <div className="text-white uppercase font-bold tracking-wider text-[6px]">Console Logs</div>
        {count >= 1 && <div className="text-gray-300">[Console] Count is now 1</div>}
        {count >= 2 && <div className="text-gray-300">[Console] Count is now 2</div>}
      </div>
    </div>
  );
};

export const LockScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.25) / 0.10));

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between py-12 px-6 text-center select-none relative overflow-hidden ${
      isDark ? "bg-[#05070B] text-white/40" : "bg-[#FAFAFA] text-black/35"
    }`}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

      <div 
        className="space-y-0.5 transition-all duration-75"
        style={{
          transform: `translateY(${-t * 150}px)`,
          opacity: 1 - t
        }}
      >
        <div className="text-[6px] font-bold tracking-widest uppercase opacity-60 font-sans">
          Tuesday, June 30
        </div>
        <div className="text-4xl font-extralight tracking-tight font-sans leading-none">
          09:41
        </div>
      </div>

      {(() => {
        const zoomT = Math.max(0, Math.min(1, (scrollProgress - 0.30) / 0.05));
        const cloudScale = zoomT > 0
          ? 0.9 + zoomT * 1.5
          : 1 - t * 0.1;
        const cloudOpacity = zoomT > 0
          ? 0.4 + zoomT * 0.6
          : 1 - t;
        const cloudY = zoomT > 0
          ? -t * 100 * (1 - zoomT)
          : -t * 100;
        return (
          <div 
            className="flex items-center justify-center transition-all duration-75" 
            style={{ 
              transform: `translateY(${cloudY}px) scale(${cloudScale})`,
              opacity: cloudOpacity,
              transformOrigin: "center"
            }}
          >
            <svg width="36" height="36" viewBox="0 0 874 552" className="transition-all duration-75">
              <path
                d={CLOUD_PATH}
                fill="none"
                stroke="currentColor"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      })()}

      <div 
        className="flex flex-col items-center gap-1.5 opacity-60 transition-all duration-75"
        style={{
          transform: `translateY(${-t * 220}px)`,
          opacity: 1 - t
        }}
      >
        <span className="text-[6px] font-mono tracking-widest uppercase">
          Swipe up to unlock
        </span>
        <div className={`w-12 h-0.5 rounded-full ${isDark ? "bg-white/20" : "bg-black/15"}`} />
      </div>
    </div>
  );
};

export const PhoneScreen = ({ activeStep, theme, scrollProgress }: { activeStep: string, theme: "light" | "dark", scrollProgress: number }) => {
  switch (activeStep) {
    case "phone_rise":
    case "welcome_phase":
      return <LockScreen theme={theme} scrollProgress={scrollProgress} />;
    case "arrival":
      return <InitialScreen theme={theme} />;
    case "sandbox_orbit":
    case "sandbox_load":
      return <EnvironmentsScreen theme={theme} scrollProgress={scrollProgress} />;
    case "terminal":
      return <TerminalScreen theme={theme} scrollProgress={scrollProgress} />;
    case "editor":
      return <EditorScreen theme={theme} scrollProgress={scrollProgress} />;
    case "git":
      return <GitScreen theme={theme} scrollProgress={scrollProgress} />;
    case "previews":
      return <PreviewsScreen theme={theme} scrollProgress={scrollProgress} />;
    case "exit":
      return <InitialScreen theme={theme} />;
    default:
      return <InitialScreen theme={theme} />;
  }
};

export const GitDiffView = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  // eslint-disable-next-line @typescript-eslint-no-unused-vars
  const isDark = theme === "dark";
  
  return (
    <div className="w-full h-full flex text-[9px] font-mono divide-x divide-white/5 overflow-y-auto">
      <div className="w-1/2 p-3 space-y-1 bg-red-500/5 opacity-80 select-none">
        <div className="text-gray-400 font-bold border-b border-white/5 pb-1 mb-2">Counter.tsx (Before)</div>
        <div><span className="font-bold">import</span> &#123; useState &#125; <span className="font-bold">from</span> <span className="italic text-gray-500">&apos;react&apos;</span>;</div>
        <div className="h-1" />
        <div><span className="font-bold">export function</span> <span className="underline decoration-gray-500">Counter</span>() &#123;</div>
        <div className="pl-3">
          <span className="font-bold">const</span> [count, setCount] = <span className="underline decoration-gray-550">useState</span>(<span className="font-bold">0</span>);
        </div>
        <div className="pl-3"><span className="font-bold">return</span> (</div>
        <div className="pl-6 bg-black/20 text-gray-400">
          - &lt;<span className="font-bold">button</span> <span className="text-gray-555">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + 1)&#125;&gt;
        </div>
        <div className="pl-9">Count: &#123;count&#125;</div>
        <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
        <div className="pl-3">);</div>
        <div>&#125;</div>
      </div>

      <div className="w-1/2 p-3 space-y-1 bg-white/5">
        <div className="text-white font-bold border-b border-white/5 pb-1 mb-2">Counter.tsx (After)</div>
        <div><span className="font-bold">import</span> &#123; useState, useEffect &#125; <span className="font-bold">from</span> <span className="italic text-gray-500">&apos;react&apos;</span>;</div>
        <div className="h-1" />
        <div><span className="font-bold">export function</span> <span className="underline decoration-gray-500">Counter</span>() &#123;</div>
        <div className="pl-3">
          <span className="font-bold">const</span> [count, setCount] = <span className="underline decoration-gray-550">useState</span>(<span className="font-bold">0</span>);
        </div>
        <div className="pl-3 bg-white/10 text-white">
          + <span className="underline decoration-gray-550">useEffect</span>(() =&gt; &#123;
          <div className="pl-3">console.<span className="underline decoration-gray-550">log</span>(<span className="italic text-gray-500">&quot;Count is&quot;</span>, count);</div>
          + &#125;, [count]);
        </div>
        <div className="pl-3"><span className="font-bold">return</span> (</div>
        <div className="pl-6 bg-white/10 text-white">
          + &lt;<span className="font-bold">button</span> <span className="text-gray-555">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + 1)&#125; className=&quot;active:scale-95&quot;&gt;
        </div>
        <div className="pl-9">Count: &#123;count&#125;</div>
        <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
      </div>
    </div>
  );
};

export const WorkspaceIDE = ({ activeStep, theme, scrollProgress }: { activeStep: string, theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  const showSidebar = activeStep === "terminal" || activeStep === "editor" || activeStep === "git";
  const showTerminal = activeStep === "terminal";
  const showPreview = activeStep === "previews";

  return (
    <div className={`w-full h-full flex flex-col transition-colors duration-300 ${
      isDark ? "bg-[#08090C] text-gray-300" : "bg-gray-100 text-[#0F1115]"
    }`}>
      <div className={`h-9 px-4 flex items-center justify-between border-b text-xs ${
        isDark ? "bg-[#0D0E12] border-white/5 text-gray-400" : "bg-white border-black/5 text-gray-655"
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white/20" : "bg-black/10"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white/20" : "bg-black/10"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white/20" : "bg-black/10"}`} />
          </div>
          <span className="ml-4 font-mono text-[9px]">sandbox-1</span>
        </div>
        <div className="flex items-center gap-4 text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
            <span>Connected</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-10 flex flex-col items-center py-4 gap-5 border-r ${
          isDark ? "bg-[#090A0E] border-white/5" : "bg-gray-55 border-black/5"
        }`}>
          {[
            <svg key="files" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>,
            <svg key="search" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>,
            <svg key="git" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M6 9v6M9 6h6a3 3 0 013 3v6" />
            </svg>
          ].map((icon, idx) => (
            <span 
              key={idx} 
              className={`cursor-pointer hover:opacity-100 transition-opacity ${
                idx === 2 && activeStep === "git" ? "opacity-100 scale-105" : "opacity-40"
              }`}
            >
              {icon}
            </span>
          ))}
        </div>

        <div className={`transition-all duration-500 overflow-hidden flex flex-col border-r ${
          showSidebar 
            ? "w-40" 
            : "w-0 border-r-0"
        } ${
          isDark ? "bg-[#0B0C10] border-white/5" : "bg-white border-black/5"
        }`}>
          {activeStep === "git" ? (
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-mono">Source Control</div>
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-gray-500">CHANGES</span>
                  <div className={`p-1.5 rounded border text-[8px] flex justify-between items-center ${
                    isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5"
                  }`}>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-[#E2C08D]">M</span>
                      <i className="devicon-typescript-plain colored text-[9px] shrink-0" />
                      <span>Counter.tsx</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-4 font-mono text-[8px]">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Explorer</div>
              <div className="space-y-2">
                <div className="font-bold">
                  <svg className="w-2.5 h-2.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  project
                </div>
                <div className="pl-3 space-y-2">
                  <div>
                    <svg className="w-2.5 h-2.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    src
                  </div>
                  <div className="pl-3 space-y-2">
                    <div className="text-gray-500">
                      <svg className="w-2.5 h-2.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      components
                    </div>
                    <div className="pl-3 font-bold text-white dark:text-white flex items-center">
                      <i className="devicon-typescript-plain colored text-[9px] mr-1.5 shrink-0" />
                      Counter.tsx
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className={`h-8 flex border-b ${
              isDark ? "bg-[#090A0E] border-white/5" : "bg-gray-55 border-black/5"
            }`}>
              <div className={`px-4 flex items-center gap-2 border-r text-[8px] font-mono ${
                isDark ? "bg-[#0F1117] border-white/5 text-white" : "bg-white border-black/5 text-black"
              }`}>
                <i className="devicon-typescript-plain colored text-[9px] shrink-0" />
                <span>Counter.tsx</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {activeStep === "git" ? (
                <GitDiffView theme={theme} scrollProgress={scrollProgress} />
              ) : (
                <EditorScreen theme={theme} scrollProgress={scrollProgress} />
              )}
            </div>
          </div>

          <div className={`transition-all duration-500 overflow-hidden border-t ${
            showTerminal 
              ? "h-40" 
              : "h-0 border-t-0"
          } ${
            isDark ? "border-white/5" : "border-black/5"
          }`}>
            <TerminalScreen theme={theme} scrollProgress={scrollProgress} />
          </div>
        </div>

        <div className={`transition-all duration-500 overflow-hidden flex flex-col border-l ${
          showPreview 
            ? "w-[45%]" 
            : "w-0 border-l-0"
        } ${
          isDark ? "border-white/5" : "border-black/5"
        }`}>
          <PreviewsScreen theme={theme} scrollProgress={scrollProgress} />
        </div>
      </div>
    </div>
  );
};
