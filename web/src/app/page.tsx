"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [activeStory, setActiveStory] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  if (!mounted) {
    return <div className="bg-[#030303] min-h-screen" />;
  }

  // Pure, calm color tokens matching the reference image
  const colors = {
    bg: theme === "dark" ? "bg-[#030303]" : "bg-[#FAFAFA]",
    card: theme === "dark" ? "bg-[#0B0C10] border-[#1A1C23]" : "bg-[#FFFFFF] border-[#E4E7EB]",
    text: theme === "dark" ? "text-[#F3F4F6]" : "text-[#0F1115]",
    textSecondary: theme === "dark" ? "text-[#8E939E]" : "text-[#6B7280]",
    border: theme === "dark" ? "border-[#1A1C23]" : "border-[#E4E7EB]",
    highlight: theme === "dark" ? "hover:bg-[#161821]" : "hover:bg-[#0F111508]",
    terminalBg: theme === "dark" ? "bg-[#08090E]" : "bg-[#F3F4F6]",
    terminalHeader: theme === "dark" ? "bg-[#0F1117]" : "bg-[#E5E7EB]",
    
    // Theme-specific button classes
    btnPrimary: theme === "dark" ? "bg-white text-[#030303] hover:bg-white/90" : "bg-[#0F1115] text-white hover:bg-[#0F1115]/90",
    btnSecondary: theme === "dark" ? "bg-transparent text-white border-[#21262D] hover:bg-white/5" : "bg-transparent text-[#0F1115] border-[#D8DEE4] hover:bg-black/5",
  };

  const trustedTech = [
    "React", "Node.js", "Supabase", "Docker", "GitHub", "OpenAI", "Anthropic", "Linux", "Cloudflare"
  ];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      {/* Embedded Animations for Subtle Motion */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.06); }
        }
        @keyframes line-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .animate-line-draw {
          stroke-dasharray: 8, 4;
          animation: line-draw 1.5s linear infinite;
        }
      `}</style>

      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center relative font-sans transition-colors duration-350`}>
        
        {/* ==================== NAVBAR ==================== */}
        <nav className={`sticky top-0 w-full z-50 backdrop-blur-lg ${theme === "dark" ? "bg-[#030303]/75 border-b border-white/5" : "bg-[#FAFAFA]/75 border-b border-black/5"} transition-colors duration-300`}>
          <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
                alt="CloudCode" 
                className="h-6 w-auto object-contain"
              />
              <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                Beta
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className={`text-xs ${colors.textSecondary} hover:text-indigo-500 dark:hover:text-white transition-colors`}>
                Privacy
              </Link>
              <Link href="/terms" className={`text-xs ${colors.textSecondary} hover:text-indigo-500 dark:hover:text-white transition-colors`}>
                Terms
              </Link>
              <button
                onClick={toggleTheme}
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
        </nav>

        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="w-full max-w-5xl px-6 pt-24 pb-16 flex flex-col items-center text-center relative z-10">
          {/* Subtle Ambient Background Glow */}
          {theme === "dark" && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none z-0 animate-pulse-glow" />
          )}

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/15 text-[10px] font-mono text-indigo-400 mb-6">
            {"Mobile-First Engineering Workspace"}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tighter leading-[1.1] max-w-3xl mb-6">
            {"The command center"}
            <br />
            {"for your mobile coding."}
          </h1>
          
          <p className={`text-sm md:text-base ${colors.textSecondary} max-w-xl mb-8 leading-relaxed`}>
            {"CloudCode combines a professional cloud IDE, autonomous AI agents, and isolated Linux environments into a single mobile-first workspace."}
          </p>

          <div className="flex gap-3 justify-center mb-16">
            <a href="#" className={`${colors.btnPrimary} px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Download App"}
            </a>
            <a href="#" className={`${colors.btnSecondary} border px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Watch Demo"}
            </a>
          </div>

          {/* Layered Laptop & Phone Mockup */}
          <div className="w-full max-w-3xl relative mt-4 flex justify-center items-end">
            {/* Laptop Mockup */}
            <div className={`w-[85%] aspect-[16/10] rounded-t-xl border-t-4 border-x-4 border-[#24292e] dark:border-[#2F363D] ${colors.card} p-1 shadow-2xl z-10 overflow-hidden`}>
              <div className="w-full h-full rounded-t bg-[#07080C] p-3 text-left font-mono text-[9px] text-gray-500 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-2">
                  <span>workspace-node-1</span>
                  <span className="text-app-green">● Online</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div><span className="text-gray-600 mr-2">1</span><span className="text-app-purple">import</span> React <span className="text-app-purple">from</span> <span className="text-app-green">&apos;react&apos;</span>;</div>
                  <div><span className="text-gray-600 mr-2">2</span><span className="text-app-purple">const</span> <span className="text-app-blue">IDE</span> = <span className="text-app-green">&apos;CloudCode&apos;</span>;</div>
                  <div><span className="text-gray-600 mr-2">3</span><span className="text-app-purple">export default</span> () =&gt; &lt;<span className="text-app-blue">div</span>&gt;&#123;<span className="text-app-blue">IDE</span>&#125;&lt;/<span className="text-app-blue">div</span>&gt;;</div>
                </div>
              </div>
            </div>

            {/* Overlapping Phone Mockup (Bottom Right) */}
            <div className="absolute right-[5%] bottom-[-20px] w-[24%] aspect-[9/19] rounded-[24px] border-[5px] border-[#24292e] dark:border-[#2F363D] bg-[#030303] shadow-2xl z-20 overflow-hidden flex flex-col justify-between p-1">
              <div className="w-full h-full rounded-[18px] bg-[#07080C] p-2 text-left font-mono text-[7px] text-gray-500 flex flex-col justify-between">
                <div className="text-[6px] text-app-blue border-b border-white/5 pb-1 mb-1">Terminal</div>
                <div className="flex-1 space-y-1">
                  <div className="text-app-purple">✓ Sandbox running</div>
                  <div className="text-app-green">root@cloudcode:~$ npm run dev</div>
                  <div className="text-gray-655">- ready on port 3000</div>
                </div>
                <div className="w-1.5 h-3 bg-app-blue animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. TRUSTED BY SECTION ==================== */}
        <section className="w-full max-w-5xl px-6 py-12 z-10">
          <div className="flex flex-col items-center">
            <p className={`text-[10px] font-mono tracking-widest ${colors.textSecondary} uppercase mb-6`}>
              {"Built using technologies developers already trust"}
            </p>
            <div className="flex flex-wrap gap-x-12 gap-y-4 justify-center items-center opacity-45 dark:opacity-35">
              {trustedTech.map((logo, idx) => (
                <span key={idx} className="text-xs font-bold font-mono tracking-wider">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 3. THE PROBLEM ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Title Block */}
            <div className="md:col-span-5 text-left space-y-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-tight">
                {"Development was"}
                <br />
                {"never designed"}
                <br />
                {"for mobile."}
              </h2>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Traditional tools bind you to a desk. CloudCode liberates your workflow while retaining full professional capabilities."}
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Old way */}
              <div className={`p-6 rounded-xl border ${colors.border} ${colors.card} space-y-4 text-left`}>
                <span className="text-[10px] font-mono font-bold text-app-red">{"[x] TRADITIONAL"}</span>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-455 font-medium">
                  <li>{"- Carry a heavy laptop"}</li>
                  <li>{"- Hard to patch bugs on road"}</li>
                  <li>{"- No local compilers"}</li>
                  <li>{"- AI is disconnected"}</li>
                </ul>
              </div>

              {/* CloudCode */}
              <div className={`p-6 rounded-xl border border-indigo-500/25 bg-indigo-500/5 dark:bg-[#0B0C10] space-y-4 text-left`}>
                <span className="text-[10px] font-mono font-bold text-indigo-400">{"[+] CLOUDCODE"}</span>
                <ul className="space-y-2.5 text-xs text-app-text-light dark:text-app-text-dark font-medium">
                  <li>{"- Full cloud IDE on phone"}</li>
                  <li>{"- Root Linux terminal"}</li>
                  <li>{"- Integrated compiler"}</li>
                  <li>{"- Autonomous AI agent"}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 4. FEATURE STORY (TIMELINE) ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Timeline Sidebar */}
            <div className="w-full md:w-1/4 flex md:flex-col gap-2 pb-4 md:pb-0 sticky top-16 z-20 py-2">
              {[
                "Instant Workspace",
                "Code Editor",
                "AI Engineer",
                "Linux Terminal",
                "Live Preview",
                "Git Workflows"
              ].map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStory(idx)}
                  className={`px-3 py-2.5 rounded-lg text-left text-xs font-mono transition-all cursor-pointer whitespace-nowrap md:whitespace-normal border ${
                    activeStory === idx
                      ? (theme === "dark" ? "bg-[#161821] border-[#2E3039] text-white font-semibold" : "bg-[#E5E7EB] border-[#D1D5DB] text-black font-semibold")
                      : `border-transparent text-gray-500 ${theme === "dark" ? "hover:text-gray-300" : "hover:text-gray-900"}`
                  }`}
                >
                  {`0${idx + 1}. ${name}`}
                </button>
              ))}
            </div>

            {/* Showcase Panel */}
            <div className="w-full md:w-3/4">
              <div className={`rounded-xl border ${colors.border} ${colors.card} p-8 min-h-[360px] flex flex-col justify-between shadow-sm`}>
                
                {activeStory === 0 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"01 / WORKSPACE"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Isolated Cloud Workspace"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"Launch isolated cloud environments within seconds. No local installations, no package configuration issues, no battery drain. Just secure, clean Docker containers pre-loaded with your toolchain."}
                    </p>
                    <div className={`p-4 rounded-lg ${colors.terminalBg} border ${colors.border} font-mono text-[9px] text-gray-500`}>
                      <div className="text-app-blue">{"$ cc workspace create --template node"}</div>
                      <div className="text-app-purple">{"[o] Allocating container..."}</div>
                      <div className="text-app-green">{"[OK] Workspace online at: https://sandbox-node-1.cloudcode.app"}</div>
                    </div>
                  </div>
                )}

                {activeStory === 1 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"02 / EDITOR"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Desktop-Grade Code Editor"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"A full-featured code editor optimized specifically for touch. Features intelligent auto-complete, code folding, a visual minimap, syntax highlighting for 100+ languages, and inline Git diff decorations."}
                    </p>
                    <div className="border border-app-border-light dark:border-app-border-dark rounded-lg overflow-hidden font-mono text-[9px] bg-slate-950 text-gray-400 p-4 space-y-1">
                      <div><span className="text-app-purple">export const</span> <span className="text-app-blue">useTerminal</span> = () =&gt; &#123;</div>
                      <div className="pl-3">const [lines, setLines] = useState&lt;string[]&gt;([]);</div>
                      <div className="pl-3">return &#123; lines &#125;;</div>
                      <div>&#125;;</div>
                    </div>
                  </div>
                )}

                {activeStory === 2 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"03 / AI AGENT"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Autonomous AI Engineer"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"Not just a simple chat assistant—this is a collaborative engineer. The AI agent understands your entire workspace hierarchy, writes files, runs tests, debugs compilation failures, and presents code reviews for your approval."}
                    </p>
                    <div className={`p-4 rounded-lg ${colors.terminalBg} border ${colors.border} font-mono text-[9px] space-y-1`}>
                      <div className="text-app-blue">{"User: Create a new API route that fetches user projects."}</div>
                      <div className="text-app-purple">{"AI: Creating `src/app/api/projects/route.ts`..."}</div>
                      <div className="text-app-green">{"[OK] File created successfully."}</div>
                    </div>
                  </div>
                )}

                {activeStory === 3 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"04 / TERMINAL"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Real Linux Shell"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"A real, fully operational Linux terminal. Not a simulator. Run compilers, manage processes, use git, npm, python, cargo, or docker. Designed with custom touch gestures for quick keys."}
                    </p>
                    <div className={`p-4 rounded-lg ${colors.terminalBg} border ${colors.border} font-mono text-[9px] text-app-text-secondary-dark`}>
                      <div className="flex gap-2"><span className="text-app-green">root@sandbox:~$</span> <span className="text-white">git status</span></div>
                      <div className="text-app-green">{"nothing to commit, working tree clean"}</div>
                    </div>
                  </div>
                )}

                {activeStory === 4 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"05 / PREVIEW"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Instant Live Preview"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"Preview your running web applications instantly without leaving your workspace. Includes a built-in browser view with an interactive console log, network request inspection, and hot-reload."}
                    </p>
                    <div className="border border-app-border-light dark:border-app-border-dark rounded-lg overflow-hidden bg-white dark:bg-[#08090E] p-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-[#0F1117] rounded text-[8px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-app-green" />
                        <span>localhost:3000</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStory === 5 && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400">{"06 / GIT"}</span>
                    <h3 className="text-2xl font-bold tracking-tight">{"Integrated Git Workflows"}</h3>
                    <p className={`text-xs ${colors.textSecondary} leading-relaxed max-w-xl`}>
                      {"Manage your repositories with ease. View visual diffs, write commits, create and switch branches, review pull requests, and push changes to GitHub."}
                    </p>
                    <div className={`p-4 rounded-lg ${colors.terminalBg} border ${colors.border} font-mono text-[9px] space-y-1`}>
                      <div className="text-app-purple">{"o [main] Commit: Fix authentication bug"}</div>
                      <div className="text-gray-500">{"|\\"}</div>
                      <div className="text-app-green">{"| o [feat/auth] Commit: Add verification"}</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* ==================== 5. EVERYTHING YOU NEED ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-left">
          <div className="mb-16">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Features"}</span>
            <h2 className="text-3xl font-semibold tracking-tighter mt-2 mb-4">{"Everything you need."}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Cloud IDE", desc: "Professional editing with autocomplete, diagnostics, and syntax highlighting." },
              { title: "AI Engineer", desc: "Autonomous AI agent that writes code, runs commands, and plans multi-step tasks." },
              { title: "Git", desc: "Visual version control, diff viewer, branch switcher, and full GitHub integration." },
              { title: "Terminal", desc: "Real Linux shell inside your workspace with shell gestures and keyboard shortcuts." },
              { title: "Preview", desc: "Preview your web applications instantly with console and network inspection." },
              { title: "Extensions", desc: "Personalize your workspace with custom compilers, tools, themes, and keymaps." }
            ].map((feat, idx) => (
              <div key={idx} className={`p-6 rounded-xl border ${colors.border} ${colors.card} space-y-3`}>
                {/* Minimalist Monochrome Icon Placeholder */}
                <div className="w-5 h-5 text-gray-400 dark:text-gray-550">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>
                <h4 className="font-semibold text-sm">{feat.title}</h4>
                <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 6. AI SECTION (FLOW DIAGRAM) ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-center flex flex-col items-center">
          <div className="max-w-xl mb-16">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"AI Agent Workflow"}</span>
            <h2 className="text-3xl font-semibold tracking-tighter mt-2 mb-4">{"Your second engineer."}</h2>
            <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
              {"CloudCode's AI agent plans steps, edits your files, runs shell commands, and verifies fixes with compilers."}
            </p>
          </div>

          {/* Minimalist SVG Node-Link Diagram */}
          <div className="w-full max-w-2xl py-8">
            <svg viewBox="0 0 600 120" className="w-full h-auto text-gray-550 dark:text-gray-600">
              {/* Nodes */}
              <circle cx="100" cy="60" r="30" className="fill-indigo-500/5 stroke-indigo-500/35" strokeWidth="1.5" />
              <circle cx="300" cy="60" r="30" className="fill-purple-500/5 stroke-purple-500/35" strokeWidth="1.5" />
              <circle cx="500" cy="60" r="30" className="fill-emerald-500/5 stroke-emerald-500/35" strokeWidth="1.5" />
              
              {/* Labels inside Nodes */}
              <text x="100" y="63" fontSize="9" fontFamily="monospace" textAnchor="middle" className="fill-indigo-450 font-bold">DEV</text>
              <text x="300" y="63" fontSize="9" fontFamily="monospace" textAnchor="middle" className="fill-purple-455 font-bold">AGENT</text>
              <text x="500" y="63" fontSize="9" fontFamily="monospace" textAnchor="middle" className="fill-emerald-450 font-bold">SANDBOX</text>

              {/* Connecting Lines */}
              <path d="M 130 60 L 270 60" className="stroke-indigo-500/20" strokeWidth="1" />
              <path d="M 330 60 L 470 60" className="stroke-purple-500/20" strokeWidth="1" />
              
              {/* Animated pulses along the path */}
              <circle cx="100" cy="60" r="3" className="fill-indigo-500/60 animate-line-draw">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 30 0 L 170 0" />
              </circle>
              <circle cx="300" cy="60" r="3" className="fill-purple-500/60 animate-line-draw">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 30 0 L 170 0" />
              </circle>
            </svg>
          </div>
          
          <div className="flex gap-8 text-[10px] font-mono text-gray-500 dark:text-gray-450">
            <span>{"[o] Autonomous Planning"}</span>
            <span>{"[o] Code Editing"}</span>
            <span>{"[o] Compiler Verification"}</span>
          </div>
        </section>

        {/* ==================== 7. MOBILE EXPERIENCE ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5 space-y-4">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Design"}</span>
              <h2 className="text-3xl font-semibold tracking-tighter">
                {"Built for thumbs,"}
                <br />
                {"not mouse pointers."}
              </h2>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Every gesture, menu, and interface is custom engineered for mobile and tablet screens."}
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-5 rounded-xl border ${colors.border} ${colors.card} space-y-2`}>
                <h5 className="font-semibold text-xs text-white">{"Terminal Gestures"}</h5>
                <p className={`text-[11px] ${colors.textSecondary} leading-relaxed`}>{"Swipe to switch shells, drag to expand history."}</p>
              </div>
              <div className={`p-5 rounded-xl border ${colors.border} ${colors.card} space-y-2`}>
                <h5 className="font-semibold text-xs text-white">{"Floating Menus"}</h5>
                <p className={`text-[11px] ${colors.textSecondary} leading-relaxed`}>{"Radial actions to trigger builds or commits."}</p>
              </div>
              <div className={`p-5 rounded-xl border ${colors.border} ${colors.card} space-y-2`}>
                <h5 className="font-semibold text-xs text-white">{"Selection Toolbar"}</h5>
                <p className={`text-[11px] ${colors.textSecondary} leading-relaxed`}>{"Immediate AI refactoring on selected code."}</p>
              </div>
              <div className={`p-5 rounded-xl border ${colors.border} ${colors.card} space-y-2`}>
                <h5 className="font-semibold text-xs text-white">{"Keyboard Shortcuts"}</h5>
                <p className={`text-[11px] ${colors.textSecondary} leading-relaxed`}>{"Dedicated key row for quick coding modifiers."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 8. PERFORMANCE ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-center">
          <div className="mb-16">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Infrastructure"}</span>
            <h2 className="text-3xl font-semibold tracking-tighter mt-2">{"CloudCode boots in seconds."}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-indigo-500">{"< 5s"}</div>
              <div className="text-xs font-semibold mt-1">{"Workspace Startup"}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-app-blue">{"50ms"}</div>
              <div className="text-xs font-semibold mt-1">{"Terminal Latency"}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-app-purple">{"99.9%"}</div>
              <div className="text-xs font-semibold mt-1">{"System Uptime"}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-app-green">{"AES-256"}</div>
              <div className="text-xs font-semibold mt-1">{"Workspace Encryption"}</div>
            </div>
          </div>
        </section>

        {/* ==================== 9. TESTIMONIALS ==================== */}
        <section className="w-full max-w-xl px-6 py-16 z-10 text-center">
          <div className={`p-8 rounded-xl border ${colors.border} ${colors.card} space-y-3`}>
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">{"Access"}</span>
            <h4 className="font-semibold text-base">{"Join Early Access"}</h4>
            <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
              {"Coming soon. Join early access and shape the future of mobile software engineering."}
            </p>
          </div>
        </section>

        {/* ==================== 10. PRICING ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-center">
          <div className="mb-16">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Pricing"}</span>
            <h2 className="text-3xl font-semibold tracking-tighter mt-2">{"Simple, transparent pricing."}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Free */}
            <div className={`p-8 rounded-xl border ${colors.border} ${colors.card} flex flex-col justify-between text-left`}>
              <div>
                <span className="text-[10px] font-mono text-gray-450 uppercase">{"[Free]"}</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">{"$0"}</h3>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-450 font-medium">
                  <li>{"- 1 Active Sandbox"}</li>
                  <li>{"- 512MB RAM / 1 Core"}</li>
                  <li>{"- Basic AI autocomplete"}</li>
                </ul>
              </div>
              <button className={`w-full mt-8 bg-transparent hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark ${colors.text} border ${colors.border} font-bold py-2 rounded-lg text-xs transition-all cursor-pointer`}>
                {"Get Started"}
              </button>
            </div>

            {/* Pro */}
            <div className={`p-8 rounded-xl border border-indigo-500/40 bg-indigo-500/5 dark:bg-[#0B0C10] flex flex-col justify-between text-left relative`}>
              <span className="absolute top-3 right-3 text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{"POPULAR"}</span>
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">{"[Pro]"}</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">{"$19"}<span className="text-xs font-normal text-gray-500">{"/mo"}</span></h3>
                <ul className="space-y-2.5 text-xs text-app-text-light dark:text-app-text-dark font-medium">
                  <li>{"- Unlimited Sandboxes"}</li>
                  <li>{"- 4GB RAM / 4 Dedicated Cores"}</li>
                  <li>{"- Autonomous AI agent"}</li>
                </ul>
              </div>
              <button className={`w-full mt-8 ${colors.btnPrimary} font-bold py-2 rounded-lg text-xs transition-all cursor-pointer`}>
                {"Get Started with Pro"}
              </button>
            </div>

            {/* Enterprise */}
            <div className={`p-8 rounded-xl border ${colors.border} ${colors.card} flex flex-col justify-between text-left`}>
              <div>
                <span className="text-[10px] font-mono text-gray-450 uppercase">{"[Enterprise]"}</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">{"Custom"}</h3>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <li>{"- Dedicated host clusters"}</li>
                  <li>{"- Custom configurations"}</li>
                  <li>{"- SLA & dedicated accounts"}</li>
                </ul>
              </div>
              <button className={`w-full mt-8 bg-transparent hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark ${colors.text} border ${colors.border} font-bold py-2 rounded-lg text-xs transition-all cursor-pointer`}>
                {"Contact Sales"}
              </button>
            </div>
          </div>
        </section>

        {/* ==================== 11. FAQ ==================== */}
        <section className="w-full max-w-2xl px-6 py-28 z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tighter">{"Frequently Asked Questions"}</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I use GitHub?",
                a: "Yes. CloudCode integrates fully with GitHub. You can sign in using GitHub OAuth, clone private repositories, commit changes, create branches, and push directly back to GitHub."
              },
              {
                q: "Can I use my own AI model?",
                a: "Yes. In your settings, you can configure your own API keys for OpenAI, Anthropic, or Gemini to power the AI code assistant and autonomous agent."
              },
              {
                q: "Can I run Docker?",
                a: "Yes. Our cloud sandboxes are running in isolated Linux containers. You have full root access to run Docker, compilers, and install any packages you need."
              },
              {
                q: "Do I need a laptop?",
                a: "No. CloudCode is designed to let you write, compile, test, and deploy production software entirely from your mobile device or tablet."
              }
            ].map((faq, idx) => (
              <div key={idx} className={`border ${colors.border} ${colors.card} rounded-lg overflow-hidden`}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-3.5 flex justify-between items-center text-left text-xs font-bold cursor-pointer hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark transition-all"
                >
                  <span>{faq.q}</span>
                  <span className="text-gray-400">{openFaq === idx ? "-" : "+"}</span>
                </button>
                {openFaq === idx && (
                  <div className={`px-5 pb-3.5 pt-1 text-[11px] ${colors.textSecondary} leading-relaxed border-t ${colors.border}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 12. FINAL CTA ==================== */}
        <section className="w-full py-32 flex flex-col items-center justify-center relative border-t border-app-border-light dark:border-app-border-dark overflow-hidden bg-gradient-to-t from-[#090a10] to-[#030303] z-10 text-center">
          {theme === "dark" && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl animate-pulse-glow pointer-events-none z-0" />
          )}

          <div className="w-full max-w-2xl px-6 flex flex-col items-center z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-none">
              {"The future of software"}
              <br />
              {"development fits in your pocket."}
            </h2>

            <p className={`text-xs ${colors.textSecondary} max-w-sm`}>
              {"Join developers building software wherever inspiration strikes."}
            </p>

            <div className="flex gap-3 justify-center">
              <a href="#" className={`${colors.btnPrimary} px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
                {"Download CloudCode"}
              </a>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className={`${colors.btnSecondary} border px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
                {"Join Discord"}
              </a>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className={`w-full py-16 border-t ${colors.border} bg-app-card-light/10 dark:bg-app-card-dark/10 backdrop-blur-sm z-10`}>
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-left">
            
            <div className="col-span-2 space-y-4">
              <img 
                src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
                alt="CloudCode" 
                className="h-6 w-auto object-contain"
              />
              <p className={`text-xs ${colors.textSecondary} max-w-xs leading-relaxed`}>
                {"Designed for builders. Engineered for the future."}
              </p>
            </div>

            <div className="space-y-3 text-[11px]">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Products"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"Download"}</a></li>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"Pricing"}</a></li>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"Changelog"}</a></li>
              </ul>
            </div>

            <div className="space-y-3 text-[11px]">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Developers"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"Documentation"}</a></li>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"API"}</a></li>
                <li><a href="https://github.com" className="hover:text-indigo-500 dark:hover:text-white">{"GitHub"}</a></li>
              </ul>
            </div>

            <div className="space-y-3 text-[11px]">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Company"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-500 dark:hover:text-white">{"About"}</a></li>
                <li><a href="/privacy" className="hover:text-indigo-500 dark:hover:text-white">{"Privacy Policy"}</a></li>
                <li><a href="/terms" className="hover:text-indigo-500 dark:hover:text-white">{"Terms of Service"}</a></li>
              </ul>
            </div>

          </div>

          <div className="max-w-5xl mx-auto px-6 pt-8 mt-8 border-t border-app-border-light/30 dark:border-app-border-dark/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px]">
            <p className="text-gray-450">
              {`© ${new Date().getFullYear()} CloudCode, Inc. All rights reserved.`}
            </p>
            <p className="text-gray-450 font-mono">
              {"Designed for builders."}
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
