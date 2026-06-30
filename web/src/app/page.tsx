"use client";

import React, { useState, useEffect, useRef } from "react";
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
    return <div className="bg-[#030303] min-h-screen" suppressHydrationWarning />;
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
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: none; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .animate-line-draw {
          stroke-dasharray: 8, 4;
          animation: line-draw 1.5s linear infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center relative font-sans transition-colors duration-350`}>
        
        {/* ==================== NAVBAR ==================== */}
        <nav className={`sticky top-0 w-full z-50 ${
          theme === "dark" 
            ? "bg-gradient-to-b from-[#030303]/90 via-[#030303]/40 to-transparent" 
            : "bg-gradient-to-b from-[#FAFAFA]/90 via-[#FAFAFA]/40 to-transparent"
        } transition-all duration-300`}>
          <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
                alt="CloudCode" 
                className="h-6 w-auto object-contain"
              />
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
            {"Introducing CloudCode"}
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mb-6 ${
            theme === "dark" 
              ? "bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50" 
              : "text-[#0F1115]"
          }`}>
            {"The Mobile-First"}
            <br />
            {"Engineering Workspace."}
          </h1>
          
          <p className={`text-sm md:text-base ${colors.textSecondary} max-w-2xl mb-8 leading-relaxed`}>
            {"CloudCode brings a professional cloud IDE, autonomous AI agents, and isolated Linux containers into a single, seamless workspace engineered entirely for mobile devices."}
          </p>

          <div className="flex gap-3 justify-center mb-16">
            <a href="#" className={`${colors.btnPrimary} px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Download App"}
            </a>
            <a href="#" className={`${colors.btnSecondary} border px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Watch Demo"}
            </a>
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

        {/* ==================== INTERACTIVE SHOWCASE ==================== */}
        <InteractiveShowcase theme={theme} colors={colors} />

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
              {"The mobile-first"}
              <br />
              {"engineering workspace."}
            </h2>

            <p className={`text-xs ${colors.textSecondary} max-w-sm`}>
              {"Fits right in your pocket. Join developers building software wherever inspiration strikes."}
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

// ==================== INTERACTIVE SHOWCASE SUBCOMPONENTS ====================

const STEPS = [
  {
    id: "initial",
    title: "The Mobile-First Workspace",
    badge: "01 / BOOTING",
    description: "Your phone is now a fully-equipped engineering environment. Scroll to boot up your mobile-first workspace.",
  },
  {
    id: "environments",
    title: "Create Dev Environments",
    badge: "02 / SANDBOXES",
    description: "Launch isolated workspaces for any language or framework in seconds. Pre-configured Docker environments with zero setup required.",
  },
  {
    id: "terminal",
    title: "Isolated Terminal Sessions",
    badge: "03 / TERMINAL",
    description: "Get full root access with isolated, persistent Linux terminal sessions. Run compilers, install dependencies, and manage processes.",
  },
  {
    id: "editor",
    title: "AI-Powered Editor",
    badge: "04 / CODE EDITOR",
    description: "Edit files manually with a desktop-grade editor, or select code and let our built-in AI assistant refactor, explain, or write it for you.",
  },
  {
    id: "git",
    title: "Git & PR Workflows",
    badge: "05 / VERSION CONTROL",
    description: "Manage your source control directly from your phone. Commit, push, raise pull requests, and review code changes seamlessly.",
  },
  {
    id: "previews",
    title: "Native Browser Previews",
    badge: "06 / LIVE PREVIEW",
    description: "Test your web applications with an integrated browser preview. Supports hot-reloading, console logging, and inspect elements.",
  }
];

const HONEYCOMB_CELLS = [
  { label: "React", name: "React", x: -160, y: -160 },
  { label: "Node.js", name: "Node", x: 160, y: -160 },
  { label: "Python", name: "Python", x: -280, y: -60 },
  { label: "Docker", name: "Docker", x: 0, y: -240 }, // Top center
  { label: "Go", name: "Go", x: 280, y: -60 },
  { label: "Rust", name: "Rust", x: -160, y: 160 },
  { label: "TypeScript", name: "TS", x: 160, y: 160 },
  { label: "Next.js", name: "Next.js", x: -280, y: 60 },
  { label: "Tailwind", name: "Tailwind", x: 0, y: 240 }, // Bottom center
  { label: "Git", name: "Git", x: 280, y: 60 },
  { label: "Postgres", name: "Postgres", x: -160, y: 0 },
  { label: "Linux", name: "Linux", x: 160, y: 0 },
];

const getIcon = (name: string) => {
  switch (name) {
    case "React":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#61DAFB" strokeWidth="2" className="w-5 h-5">
          <circle cx="12" cy="12" r="1.5" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(90 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(150 12 12)" />
        </svg>
      );
    case "Node":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#68A063" strokeWidth="2" className="w-5 h-5">
          <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
          <path d="M12 22V12M3 7l9 5 9-5" />
        </svg>
      );
    case "Python":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3776AB" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 2c-3 0-3 2-3 2v2h3v1H6c-2 0-2 2-2 4v3c0 2 2 2 2 2h1v-2c0-1.2 1.2-2 2.5-2h3c1.2 0 2.5-.8 2.5-2V7.5c0-2-1.5-5-4.5-5.5z" />
          <path d="M12 22c3 0 3-2 3-2v-2h-3v-1h6c2 0 2-2 2-4v-3c0-2-2-2-2-2h-1v2c0 1.2-1.2 2-3 2h-3c-1.2 0-2.5.8-2.5 2v3.5c0 2 1.5 5 4.5 5.5z" />
        </svg>
      );
    case "Docker":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#2496ED" strokeWidth="1.8" className="w-5 h-5">
          <path d="M2 14h20M4 14v-2h2v2M8 14v-2h2v2M12 14v-2h2v2M16 14v-2h2v2M6 10v-2h2v2M10 10v-2h2v2M14 10v-2h2v2M8 6v-2h2v2" />
          <path d="M2 14c0 3 2.5 5 6 5h8c3.5 0 6-2 6-5" />
        </svg>
      );
    case "Go":
      return (
        <span className="text-[10px] font-bold text-[#00ADD8] font-mono">GO</span>
      );
    case "Rust":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#E57324" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="7" strokeDasharray="2.5 2.5" />
          <text x="12" y="15" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#E57324" textAnchor="middle">R</text>
        </svg>
      );
    case "TS":
      return (
        <span className="text-[10px] font-bold text-[#3178C6] font-mono">TS</span>
      );
    case "Next.js":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 15.5V8.5l8 7V8.5" />
        </svg>
      );
    case "Tailwind":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 6c-3 0-5 1.5-5.5 5 2.2-1.3 4.5-.8 5.8.8.9-1.3 2.2-2 5-2 3 0 5 1.5 5.5 5-2.2-1.3-4.5-.8-5.8.8-.9-1.3-2.2-2-5-2z" transform="scale(0.8) translate(3, 3)" />
        </svg>
      );
    case "Git":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F05032" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="6" cy="6" r="2.5" />
          <path d="M6 8.5v7M8.5 18h7M18 18a2.5 2.5 0 0 0 2.5-2.5V8.5" />
        </svg>
      );
    case "Postgres":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#336791" strokeWidth="1.8" className="w-5 h-5">
          <path d="M4 6h16M4 12h16M4 18h16M4 6v12M20 6v12" />
        </svg>
      );
    case "Linux":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.8 5.5 4.5 6.5v2H8v1.5h8v-1.5h-2.5v-2c2.7-1 4.5-3.5 4.5-6.5 0-3.5-2.5-6-6-6z" />
        </svg>
      );
    default:
      return null;
  }
};

const InitialScreen = ({ theme }: { theme: "light" | "dark" }) => {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-300 ${
      theme === "dark" ? "bg-[#030303]" : "bg-[#FAFAFA]"
    }`}>
      <div className="absolute w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
      <div className="z-10 space-y-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
          <span className="text-white font-bold text-lg font-mono">CC</span>
        </div>
        <div className="space-y-1">
          <h4 className={`font-bold text-xs tracking-tight ${theme === "dark" ? "text-white" : "text-[#0F1115]"}`}>CloudCode Workspace</h4>
          <p className="text-[9px] text-gray-500 font-mono">v1.0.0-beta</p>
        </div>
        <div className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded text-[8px] font-mono ${
          theme === "dark" 
            ? "bg-white/5 border-white/5 text-gray-400" 
            : "bg-black/5 border-black/5 text-gray-600"
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>Scroll to Boot</span>
        </div>
      </div>
    </div>
  );
};

const EnvironmentsScreen = ({ active, theme }: { active: boolean, theme: "light" | "dark" }) => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      setComplete(false);
      return;
    }

    const t1 = setTimeout(() => {
      setLoading(true);
    }, 800);

    const t2 = setTimeout(() => {
      setLoading(false);
      setComplete(true);
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className={`w-full h-full p-4 flex flex-col justify-between font-sans transition-colors duration-300 ${
      theme === "dark" ? "bg-[#0A0B10] text-white" : "bg-white text-[#0F1115]"
    }`}>
      <div className="space-y-3">
        <div className={`border-b pb-2 ${theme === "dark" ? "border-white/5" : "border-black/5"}`}>
          <h4 className="font-bold text-[10px] text-gray-400 tracking-wide uppercase font-mono">Select Template</h4>
        </div>
        
        <div className="space-y-1.5">
          {[
            { name: "Node.js / Next.js", desc: "React framework with Tailwind" },
            { name: "Python / FastAPI", desc: "Modern Python web backend" },
            { name: "Rust / Cargo", desc: "Performance-critical system code" }
          ].map((tmpl, idx) => (
            <div key={idx} className={`p-2 rounded border transition-all text-left ${
              idx === 0 
                ? (theme === "dark" ? "border-indigo-500 bg-indigo-500/10" : "border-indigo-500 bg-indigo-500/5")
                : (theme === "dark" ? "border-white/5 bg-white/5 opacity-60" : "border-black/5 bg-black/5 opacity-60")
            }`}>
              <div className="font-bold text-[9px]">{tmpl.name}</div>
              <div className={`text-[7px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{tmpl.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="space-y-1 text-center">
            <div className={`w-full h-1 rounded overflow-hidden ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}>
              <div className="bg-indigo-500 h-full w-[80%] animate-pulse" />
            </div>
            <span className="text-[8px] font-mono text-indigo-400">Allocating sandbox...</span>
          </div>
        )}
        
        {complete && (
          <div className={`border p-2 rounded text-left space-y-1 font-mono text-[8px] animate-fade-in-up ${
            theme === "dark" 
              ? "bg-emerald-500/15 border-emerald-500/20 text-gray-450" 
              : "bg-emerald-500/5 border-emerald-500/15 text-gray-600"
          }`}>
            <div className="text-emerald-400 font-bold">● Workspace Online</div>
            <div className="text-gray-455">ID: sandbox-node-1</div>
            <div className="text-gray-500">Resources: 4 Cores / 4GB RAM</div>
          </div>
        )}

        <button className={`w-full py-1.5 rounded text-[9px] font-bold text-center transition-all ${
          complete 
            ? "bg-emerald-500 text-white" 
            : loading 
              ? "bg-indigo-600/50 text-white/50" 
              : (theme === "dark" ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700")
        }`}>
          {complete ? "Open Workspace" : loading ? "Starting..." : "Create Workspace"}
        </button>
      </div>
    </div>
  );
};

const TerminalScreen = ({ active }: { active: boolean }) => {
  const [lines, setLines] = useState<string[]>([]);
  
  useEffect(() => {
    if (!active) {
      setLines([]);
      return;
    }
    
    const allLines = [
      "root@cloudcode:~# git clone https://github.com/user/project",
      "Cloning into 'project'... done.",
      "root@cloudcode:~# cd project && npm install",
      "added 342 packages in 4.1s",
      "root@cloudcode:~# npm run dev",
      "▲ Next.js 16.2.9 (Turbopack)",
      "- Local: http://localhost:3000"
    ];
    
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < allLines.length) {
        const lineToAdd = allLines[currentLine];
        setLines(prev => [...prev, lineToAdd]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="w-full h-full bg-[#08090E] p-3 font-mono text-[9px] text-gray-300 flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-2">
        <span className="text-gray-500">bash - session-1</span>
        <span className="text-emerald-450">● online</span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {lines.map((line, idx) => {
          if (!line) return null;
          if (line.startsWith("root@")) {
            return (
              <div key={idx}>
                <span className="text-emerald-500">root@cloudcode</span>
                <span className="text-gray-500">:~#</span> <span className="text-white">{line.split("~# ")[1]}</span>
              </div>
            );
          }
          if (line.startsWith("▲") || line.startsWith("-")) {
            return <div key={idx} className="text-indigo-455">{line}</div>;
          }
          return <div key={idx} className="text-gray-400">{line}</div>;
        })}
        {active && lines.length < 7 && (
          <div className="w-1 h-2.5 bg-indigo-500 animate-pulse inline-block ml-0.5" />
        )}
      </div>
    </div>
  );
};

const EditorScreen = ({ active, theme }: { active: boolean, theme: "light" | "dark" }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }

    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3000);
    const t3 = setTimeout(() => setStep(3), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active]);

  const isDark = theme === "dark";

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#0F1117]" : "bg-white"
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
        isDark ? "bg-[#0A0B0F] border-white/5" : "bg-gray-55 border-black/5"
      }`}>
        <span className={`text-[8px] font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}>Counter.tsx</span>
        <span className="text-[7px] font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">TypeScript</span>
      </div>

      <div className={`flex-1 p-3 font-mono text-[9px] space-y-1 overflow-y-auto leading-relaxed ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}>
        {step < 3 ? (
          <>
            <div><span className="text-purple-500">import</span> &#123; useState  &#125; <span className="text-purple-500">from</span> <span className="text-emerald-600">&apos;react&apos;</span>;</div>
            <div className="h-1" />
            <div><span className="text-purple-500">export function</span> <span className="text-blue-550">Counter</span>() &#123;</div>
            <div className="pl-3">
              <span className="text-purple-500">const</span> [count, setCount] = <span className="text-blue-550">useState</span>(<span className="text-orange-550">0</span>);
            </div>
            <div className="pl-3"><span className="text-purple-500">return</span> (</div>
            <div className={`pl-6 transition-all duration-500 ${
              step === 1 
                ? (isDark ? "bg-indigo-500/20 border-l-2 border-indigo-500 rounded" : "bg-indigo-500/10 border-l-2 border-indigo-500 rounded") 
                : ""
            }`}>
              &lt;<span className="text-blue-550">button</span> <span className="text-yellow-650">onClick</span>=&#123;() =&gt; <span className="text-blue-550">setCount</span>(count + <span className="text-orange-550">1</span>)&#125;&gt;
            </div>
            <div className="pl-9">Count: &#123;count&#125;</div>
            <div className="pl-6">&lt;/<span className="text-blue-550">button</span>&gt;</div>
            <div className="pl-3">);</div>
            <div>&#125;</div>
          </>
        ) : (
          <>
            <div><span className="text-purple-400">import</span> &#123; useState, useEffect &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">&apos;react&apos;</span>;</div>
            <div className="h-1" />
            <div><span className="text-purple-400">export function</span> <span className="text-blue-455">Counter</span>() &#123;</div>
            <div className="pl-3">
              <span className="text-purple-400">const</span> [count, setCount] = <span className="text-blue-455">useState</span>(<span className="text-orange-400">0</span>);
            </div>
            <div className={`pl-3 border-l-2 rounded py-0.5 my-1 ${
              isDark ? "bg-emerald-500/10 border-emerald-500" : "bg-emerald-500/5 border-emerald-500"
            }`}>
              <span className="text-blue-455">useEffect</span>(() =&gt; &#123;
              <div className="pl-3">console.<span className="text-blue-455">log</span>(<span className="text-emerald-400">&quot;Count is&quot;</span>, count);</div>
              &#125;, [count]);
            </div>
            <div className="pl-3"><span className="text-purple-400">return</span> (</div>
            <div className="pl-6">
              &lt;<span className="text-blue-455">button</span> 
            </div>
            <div className="pl-9 text-yellow-400">onClick<span className={isDark ? "text-gray-350" : "text-gray-600"}>=&#123;() =&gt;</span> <span className="text-blue-455">setCount</span>(count + <span className="text-orange-400">1</span>)&#125;</div>
            <div className="pl-9 text-yellow-400">className<span className={isDark ? "text-gray-350" : "text-gray-600"}>=&quot;active:scale-95 transition-all&quot;</span></div>
            <div className="pl-6">&gt;</div>
            <div className="pl-9">Count: &#123;count&#125;</div>
            <div className="pl-6">&lt;/<span className="text-blue-455">button</span>&gt;</div>
            <div className="pl-3">);</div>
            <div>&#125;</div>
          </>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 p-3 border-t transition-all duration-500 transform ${
        step >= 2 && step < 3 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      } ${
        isDark ? "bg-[#0A0B0F] border-white/5" : "bg-gray-55 border-black/5"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[7px] font-mono text-indigo-500 uppercase font-bold">CloudCode AI</span>
        </div>
        <div className={`text-[8px] font-mono p-1.5 rounded border ${
          isDark ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black"
        }`}>
          {"✨ Refactoring: Adding transition and console.log..."}
        </div>
      </div>
    </div>
  );
};

const GitScreen = ({ active, theme }: { active: boolean, theme: "light" | "dark" }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }

    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3000);
    const t3 = setTimeout(() => setStep(3), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active]);

  const isDark = theme === "dark";

  return (
    <div className={`w-full h-full p-3 font-sans text-xs flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#0A0B10] text-gray-300" : "bg-white text-[#0F1115]"
    }`}>
      {step < 2 ? (
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
                  <span className="font-mono text-emerald-400">M  Counter.tsx</span>
                  <span className="text-[7px] text-gray-500">Modified</span>
                </div>
                <div className={`flex items-center justify-between p-1.5 rounded border text-[9px] ${
                  isDark ? "bg-white/5 border-white/5" : "bg-gray-55 border-black/5"
                }`}>
                  <span className="font-mono text-emerald-400">M  page.tsx</span>
                  <span className="text-[7px] text-gray-500">Modified</span>
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
            step === 1 
              ? "bg-indigo-600 text-white scale-95 opacity-50" 
              : "bg-indigo-500 text-white hover:bg-indigo-600"
          }`}>
            {step === 1 ? "Pushing..." : "Commit & Push"}
          </button>
        </>
      ) : (
        <>
          <div className={`border-b pb-2 flex justify-between items-center ${isDark ? "border-white/5" : "border-black/5"}`}>
            <h4 className={`font-bold text-[10px] tracking-wide uppercase font-mono ${isDark ? "text-white" : "text-gray-800"}`}>Pull Request #42</h4>
            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Open</span>
          </div>
          <div className="flex-1 py-3 space-y-3">
            <div className="space-y-1">
              <h5 className={`font-bold text-[10px] ${isDark ? "text-white" : "text-gray-800"}`}>feat: improve counter interactivity</h5>
              <p className="text-[8px] text-gray-400">Merged 2 commits from <code className="font-mono bg-white/5 px-1 rounded text-indigo-400">feat/counter</code> into <code className="font-mono bg-white/5 px-1 rounded text-gray-350">main</code></p>
            </div>
            <div className={`p-2 rounded border text-[8px] space-y-1 font-mono ${
              isDark ? "bg-white/5 border-white/5" : "bg-gray-55 border-black/5"
            }`}>
              <div className="text-emerald-450">✓ All checks passed (100%)</div>
              <div className="text-gray-500">✓ No conflicts with base branch</div>
            </div>
          </div>
          
          <button className={`w-full py-2 rounded font-bold text-[10px] text-center transition-all duration-300 ${
            step === 3 
              ? "bg-purple-600 text-white opacity-50" 
              : "bg-purple-500 text-white hover:bg-purple-600"
          }`}>
            {step === 3 ? "Merged ✓" : "Merge Pull Request"}
          </button>
        </>
      )}
    </div>
  );
};

const PreviewsScreen = ({ active }: { active: boolean }) => {
  const [count, setCount] = useState(0);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    if (!active) {
      setCount(0);
      setIsClicking(false);
      return;
    }

    const t1 = setTimeout(() => {
      setIsClicking(true);
      setCount(1);
    }, 1500);

    const t2 = setTimeout(() => {
      setIsClicking(false);
    }, 1800);

    const t3 = setTimeout(() => {
      setIsClicking(true);
      setCount(2);
    }, 3000);

    const t4 = setTimeout(() => {
      setIsClicking(false);
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active]);

  return (
    <div className="w-full h-full bg-[#FAFAFA] text-[#0F1115] flex flex-col justify-between overflow-hidden font-sans">
      <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <div className="flex-1 bg-gray-100 px-2 py-0.5 rounded text-[8px] text-gray-500 font-mono flex justify-between items-center">
          <span>localhost:3000</span>
          <span>🔒</span>
        </div>
        <span className="text-[8px] text-gray-400">↻</span>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-55 relative">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full max-w-[160px] text-center space-y-3">
          <h5 className="font-bold text-[10px]">Interactive Preview</h5>
          <p className="text-[7px] text-gray-400">Click the button below to test interactions.</p>
          <button className={`px-3 py-1 rounded-lg text-[9px] font-bold text-white transition-all bg-indigo-500 ${
            isClicking ? "scale-95 bg-indigo-600" : "active:scale-95"
          }`}>
            Count: {count}
          </button>
        </div>

        {active && (
          <div 
            className="absolute w-2.5 h-2.5 bg-black rounded-full border border-white pointer-events-none transition-all duration-1000 shadow-lg"
            style={{
              left: isClicking ? "50%" : "68%",
              top: isClicking ? "58%" : "75%",
              transform: "translate(-50%, -50%)",
              opacity: 0.8,
            }}
          />
        )}
      </div>

      <div className="bg-[#0A0B0F] border-t border-white/5 p-2 font-mono text-[7px] text-gray-450 space-y-0.5">
        <div className="text-indigo-400 uppercase font-bold tracking-wider text-[6px]">Console Logs</div>
        {count >= 1 && <div className="text-emerald-400">[Console] Count is now 1</div>}
        {count >= 2 && <div className="text-emerald-400">[Console] Count is now 2</div>}
      </div>
    </div>
  );
};

const PhoneScreen = ({ activeStep, theme }: { activeStep: string, theme: "light" | "dark" }) => {
  switch (activeStep) {
    case "initial":
      return <InitialScreen theme={theme} />;
    case "environments":
      return <EnvironmentsScreen active={activeStep === "environments"} theme={theme} />;
    case "terminal":
      return <TerminalScreen active={activeStep === "terminal"} />;
    case "editor":
      return <EditorScreen active={activeStep === "editor"} theme={theme} />;
    case "git":
      return <GitScreen active={activeStep === "git"} theme={theme} />;
    case "previews":
      return <PreviewsScreen active={activeStep === "previews"} />;
    default:
      return <InitialScreen theme={theme} />;
  }
};

const KEYFRAMES = [
  { p: 0.0, rx: 15, ry: -20, rz: 10, s: 0.9, tx: 0, ty: 10, tz: 0 },      // initial
  { p: 0.2, rx: 8, ry: -12, rz: 5, s: 1.0, tx: -20, ty: 0, tz: 20 },     // environments
  { p: 0.4, rx: 5, ry: 5, rz: -3, s: 1.15, tx: 10, ty: -10, tz: 50 },    // terminal
  { p: 0.6, rx: 0, ry: 0, rz: 0, s: 1.25, tx: 0, ty: -20, tz: 100 },     // editor
  { p: 0.8, rx: 8, ry: 15, rz: -5, s: 1.1, tx: 20, ty: 10, tz: 30 },     // git
  { p: 1.0, rx: 0, ry: 0, rz: 0, s: 1.05, tx: 0, ty: 0, tz: 10 }         // previews
];

const get3DTransform = (progress: number, isMobile: boolean, mouseX: number, mouseY: number) => {
  let idx = 0;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (progress >= KEYFRAMES[i].p && progress <= KEYFRAMES[i + 1].p) {
      idx = i;
      break;
    }
  }
  
  const k1 = KEYFRAMES[idx];
  const k2 = KEYFRAMES[idx + 1];
  
  const range = k2.p - k1.p;
  const t = range === 0 ? 0 : (progress - k1.p) / range;
  
  const lerp = (a: number, b: number) => a + (b - a) * t;
  
  const factor = isMobile ? 0.2 : 1.0;
  
  const mouseRx = isMobile ? 0 : mouseY * -15;
  const mouseRy = isMobile ? 0 : mouseX * 15;
  
  const rx = (lerp(k1.rx, k2.rx) + mouseRx) * factor;
  const ry = (lerp(k1.ry, k2.ry) + mouseRy) * factor;
  const rz = lerp(k1.rz, k2.rz) * factor;
  const s = lerp(k1.s, k2.s) * (isMobile ? 0.85 : 1.0);
  const tx = lerp(k1.tx, k2.tx) * factor;
  const ty = lerp(k1.ty, k2.ty) * factor;
  const tz = lerp(k1.tz, k2.tz) * factor;
  
  return `perspective(1200px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
};

const PhoneMockup = ({ children, scrollProgress, theme }: { children: React.ReactNode, scrollProgress: number, theme: "light" | "dark" }) => {
  const glareX = (scrollProgress * 400) - 200;
  const isDark = theme === "dark";

  return (
    <div 
      className={`w-[280px] h-[550px] rounded-[44px] p-3 relative select-none transition-all duration-300 border ${
        isDark ? "bg-[#090A10] border-white/10" : "bg-[#F3F4F6] border-black/10"
      }`}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: isDark 
          ? `
            -2px 2px 0px 0px rgba(255, 255, 255, 0.05),
            -4px 4px 0px 0px #1a1c24,
            -8px 8px 0px 0px #111217,
            -12px 12px 20px 0px rgba(0, 0, 0, 0.7),
            -24px 24px 50px 0px rgba(0, 0, 0, 0.5)
          `
          : `
            -2px 2px 0px 0px rgba(0, 0, 0, 0.03),
            -4px 4px 0px 0px #E5E7EB,
            -8px 8px 0px 0px #D1D5DB,
            -12px 12px 20px 0px rgba(0, 0, 0, 0.12),
            -24px 24px 50px 0px rgba(0, 0, 0, 0.08)
          `,
      }}
    >
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

      <div 
        className={`w-full h-full rounded-[34px] overflow-hidden relative flex flex-col border ${
          isDark ? "bg-[#030303] border-black/50" : "bg-white border-gray-200"
        }`}
        style={{
          transform: "translateZ(8px)",
          transformStyle: "preserve-3d",
        }}
      >
        <div 
          className="absolute inset-0 z-25 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)',
            transform: `translateX(${glareX}px) translateY(${glareX * 0.5}px) translateZ(12px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />

        <div 
          className={`absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4.5 rounded-full z-30 flex items-center justify-center border ${
            isDark ? "bg-black border-white/5" : "bg-[#0F1115] border-black/5"
          }`}
          style={{ transform: "translateZ(10px)" }}
        >
          <div className="w-2 h-2 rounded-full bg-[#101118] ml-auto mr-2 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#1c2d5a]" />
          </div>
        </div>

        <div className={`h-8 pt-2.5 px-6 flex justify-between items-center text-[8px] font-mono z-20 select-none ${
          isDark ? "text-gray-455" : "text-gray-500"
        }`}>
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        <div className="flex-1 w-full relative overflow-hidden">
          {children}
        </div>

        <div className="h-3 w-full flex items-center justify-center z-25">
          <div className={`w-16 h-0.5 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"}`} />
        </div>
      </div>
    </div>
  );
};

const HoneycombBackground = ({ scrollProgress, activeStep, theme }: { scrollProgress: number, activeStep: string, theme: "light" | "dark" }) => {
  const translateY = (scrollProgress - 0.25) * -160;
  const isEnvironments = activeStep === "environments";
  const isDark = theme === "dark";

  return (
    <div 
      className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out"
      style={{
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
        {HONEYCOMB_CELLS.map((cell, idx) => {
          const isActive = isEnvironments || (
            (activeStep === "terminal" && (cell.name === "Linux" || cell.name === "Docker")) ||
            (activeStep === "editor" && (cell.name === "TS" || cell.name === "React" || cell.name === "Next.js")) ||
            (activeStep === "git" && cell.name === "Git") ||
            (activeStep === "previews" && (cell.name === "Next.js" || cell.name === "React" || cell.name === "Node"))
          );

          return (
            <div 
              key={idx}
              className={`absolute transition-all duration-700 animate-float ${
                isActive 
                  ? 'opacity-80 scale-100' 
                  : (isDark ? 'opacity-10 scale-90 blur-[0.5px]' : 'opacity-25 scale-90 blur-[0.5px]')
              }`}
              style={{
                left: `calc(50% + ${cell.x}px)`,
                top: `calc(50% + ${cell.y}px)`,
                width: '82px',
                height: '95px',
                transform: 'translate(-50%, -50%)',
                animationDelay: `${idx * 0.4}s`,
              }}
            >
              <div 
                className={`w-full h-full flex flex-col items-center justify-center relative shadow-lg transition-all duration-500 border ${
                  isActive 
                    ? (isDark ? 'bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/5' : 'bg-indigo-500/5 border-indigo-500/20 shadow-md shadow-indigo-500/5') 
                    : (isDark ? 'bg-[#0B0C10]/80 border-white/5' : 'bg-white/90 border-black/5 shadow-sm')
                }`}
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent animate-pulse" />
                )}
                <div className="mb-1">{getIcon(cell.name)}</div>
                <span className={`text-[7px] font-mono font-bold tracking-tight transition-colors ${
                  isActive ? (isDark ? 'text-white' : 'text-[#0F1115]') : 'text-gray-500'
                }`}>{cell.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function InteractiveShowcase({ theme, colors }: { theme: "light" | "dark", colors: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<string>("initial");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      setScrollProgress(progress);
      const steps = ["initial", "environments", "terminal", "editor", "git", "previews"];
      setActiveStep(steps[Math.min(Math.floor(progress * steps.length), steps.length - 1)]);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseOffset({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5
    });
  };

  const handleMouseLeave = () => setMouseOffset({ x: 0, y: 0 });
  const get3DTransform = (p: number, m: boolean, ox: number, oy: number) => {
    const k = KEYFRAMES[Math.min(Math.floor(p * 5), 4)];
    const rx = (oy * -20) + k.rx;
    const ry = (ox * 20) + k.ry;
    return `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${m ? 0.8 : k.s})`;
  };

  const transformStyle = get3DTransform(scrollProgress, isMobile, mouseOffset.x, mouseOffset.y);
  const currentStepData = STEPS.find(s => s.id === activeStep) || STEPS[0];
  const isDark = theme === "dark";

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-[500vh] border-y transition-colors duration-300 ${
        isDark ? "bg-[#030303] border-white/5" : "bg-[#FAFAFA] border-black/5"
      }`}
    >
      <div className="sticky top-0 h-screen w-full flex flex-col md:flex-row items-center justify-between px-6 md:px-24 overflow-hidden z-20">
        <div className="w-full md:w-[40%] h-[30vh] md:h-full flex flex-col justify-center order-2 md:order-1 text-center md:text-left pb-8 md:pb-0">
          <div key={activeStep} className="space-y-4 animate-fade-in-up">
            <span className={`inline-block text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full uppercase ${
              isDark 
                ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" 
                : "text-indigo-600 bg-indigo-600/5 border border-indigo-600/15"
            }`}>
              {currentStepData.badge}
            </span>
            <h3 className={`text-2xl md:text-5xl font-bold tracking-tight leading-tight font-sans ${
              isDark ? "text-white" : "text-[#0F1115]"
            }`}>
              {currentStepData.title}
            </h3>
            <p className={`text-xs md:text-sm leading-relaxed max-w-md mx-auto md:mx-0 ${
              isDark ? "text-gray-400" : "text-gray-650"
            }`}>
              {currentStepData.description}
            </p>
          </div>
        </div>

        <div 
          className="w-full md:w-[60%] h-[55vh] md:h-full relative flex items-center justify-center overflow-hidden order-1 md:order-2"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <HoneycombBackground scrollProgress={scrollProgress} activeStep={activeStep} theme={theme} />
          <div className="absolute w-[260px] h-[260px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div 
            className="relative z-10 transition-transform duration-300 ease-out"
            style={{ transform: transformStyle, transformStyle: "preserve-3d" }}
          >
            <PhoneMockup scrollProgress={scrollProgress} theme={theme}>
              <PhoneScreen activeStep={activeStep} theme={theme} />
            </PhoneMockup>
          </div>
        </div>
      </div>
    </div>
  );
}
