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

        {/* ==================== INTERACTIVE SHOWCASE (Includes Hero & Trusted By) ==================== */}
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

const TECH_NODES = [
  { label: "React", name: "React", bx: -180, by: -180 },
  { label: "Node.js", name: "Node", bx: 180, by: -180 },
  { label: "Python", name: "Python", bx: -280, by: -60 },
  { label: "Docker", name: "Docker", bx: 0, by: -260 },
  { label: "Go", name: "Go", bx: 280, by: -60 },
  { label: "Rust", name: "Rust", bx: -180, by: 180 },
  { label: "TypeScript", name: "TS", bx: 180, by: 180 },
  { label: "Next.js", name: "Next.js", bx: -280, by: 60 },
  { label: "Tailwind", name: "Tailwind", bx: 0, by: 260 },
  { label: "Git", name: "Git", bx: 280, by: 60 }
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

const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z";

const InitialScreen = ({ theme }: { theme: "light" | "dark" }) => {
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

const EnvironmentsScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.48 to 0.68
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.48) / 0.20));

  const showTemplates = t < 0.35;
  const showLoading = t >= 0.35 && t < 0.80;
  const showComplete = t >= 0.80;

  const loadProgress = Math.max(0, Math.min(100, Math.floor((t - 0.35) / 0.45 * 100)));

  return (
    <div className={`w-full h-full p-4 flex flex-col justify-between font-sans transition-colors duration-300 ${
      isDark ? "bg-[#0A0B10] text-white" : "bg-white text-[#0F1115]"
    }`}>
      <div className="space-y-3">
        <div className={`border-b pb-2 ${isDark ? "border-white/5" : "border-black/5"}`}>
          <h4 className="font-bold text-[10px] text-gray-400 tracking-wide uppercase font-mono">Select Template</h4>
        </div>
        
        <div className="space-y-1.5">
          {[
            { name: "Node.js / Next.js", desc: "React framework with Tailwind" },
            { name: "Python / FastAPI", desc: "Modern Python web backend" },
            { name: "Rust / Cargo", desc: "Performance-critical system code" }
          ].map((tmpl, idx) => {
            const isSelected = idx === 0 && showTemplates;
            return (
              <div key={idx} className={`p-2 rounded border transition-all text-left ${
                isSelected 
                  ? (isDark ? "border-white bg-white/5" : "border-black bg-black/5")
                  : (isDark ? "border-white/5 bg-white/5 opacity-40" : "border-black/5 bg-black/5 opacity-45")
              }`}>
                <div className="font-bold text-[9px]">{tmpl.name}</div>
                <div className={`text-[7px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{tmpl.desc}</div>
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
              : (isDark ? "bg-white text-black hover:bg-gray-255" : "bg-black text-white hover:bg-gray-850")
        }`}>
          {showComplete ? "Open Workspace" : showLoading ? "Starting..." : "Create Workspace"}
        </button>
      </div>
    </div>
  );
};

const TerminalScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.68 to 0.78
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

  // Number of lines visible is directly proportional to scroll progress
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
          return <div key={idx} className="text-gray-400 dark:text-gray-400">{line}</div>;
        })}
        {visibleCount > 0 && visibleCount < allLines.length && (
          <div className={`w-1 h-2.5 inline-block ml-0.5 animate-pulse ${isDark ? "bg-white" : "bg-black"}`} />
        )}
      </div>
    </div>
  );
};

const EditorScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.78 to 0.86
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.78) / 0.08));

  const showHighlight = t >= 0.20 && t < 0.40;
  const showPopup = t >= 0.20 && t < 0.40;
  const isPressed = t >= 0.35 && t < 0.40;
  const showAIPanel = t >= 0.40;
  const showNewCode = t >= 0.70;

  // AI Prompt Typing Effect
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
        <span className={`text-[8px] font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}>Counter.tsx</span>
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
              {/* Ask AI Tooltip Popup */}
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

              {/* Simulated Cursor for Ask AI */}
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
                &lt;<span className="font-bold">button</span> <span className="text-gray-500">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + <span className="font-bold">1</span>)&#125;&gt;
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

      {/* AI Assistant Chat Interface (Slides up when active) */}
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
          {/* User Prompt */}
          <div className={`text-[7px] font-mono p-1 rounded ${
            isDark ? "bg-white/5 text-gray-300" : "bg-black/5 text-gray-700"
          }`}>
            <span className="text-gray-500">User:</span> {currentPrompt}
            {t >= 0.40 && t < 0.55 && <span className="animate-pulse">|</span>}
          </div>
          
          {/* AI Response Status */}
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

const GitScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.86 to 0.92
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
                  isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5"
                }`}>
                  <span className="font-mono font-bold">M  Counter.tsx</span>
                  <span className="text-[7px] text-gray-500 font-mono">Modified</span>
                </div>
                <div className={`flex items-center justify-between p-1.5 rounded border text-[9px] ${
                  isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5"
                }`}>
                  <span className="font-mono font-bold">M  page.tsx</span>
                  <span className="text-[7px] text-gray-500 font-mono">Modified</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-gray-500">COMMIT MESSAGE</span>
              <div className={`p-2 rounded border text-[9px] font-mono ${
                isDark ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
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
              isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5"
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

const PreviewsScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.92 to 0.96
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.92) / 0.04));

  // Determine counter value based on scroll progress
  let count = 0;
  if (t >= 0.33 && t < 0.66) count = 1;
  else if (t >= 0.66) count = 2;

  // Determine cursor position and clicking state based on scroll progress
  const isClicking = (t >= 0.30 && t <= 0.36) || (t >= 0.63 && t <= 0.69);

  // Scroll offset for the mock browser content (scrolls up as t increases)
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

      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
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

        {/* Scrollable Dummy Page Contents that appear as you scroll */}
        <div 
          className="w-full max-w-[160px] mt-4 space-y-2 text-left opacity-60 transition-transform duration-100"
          style={{ transform: `translateY(${scrollTop}px)` }}
        >
          <div className="h-1 bg-gray-200 rounded w-12" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Scroll-driven cursor indicator */}
        <div 
          className="absolute w-2.5 h-2.5 bg-black rounded-full border border-white pointer-events-none transition-all duration-75 shadow-lg z-20"
          style={{
            left: t < 0.33 
              ? `${68 - (t / 0.33) * 18}%` // moving to button
              : t < 0.66 
                ? `${50 + ((t - 0.33) / 0.33) * 18}%` // moving away
                : `${68 - ((t - 0.66) / 0.34) * 18}%`, // clicking again
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

const LockScreen = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate swipe-up interpolation factor as we scroll from 0.25 to 0.35
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.25) / 0.10));

  return (
    <div className={`w-full h-full flex flex-col items-center justify-between py-12 px-6 text-center select-none relative overflow-hidden ${
      isDark ? "bg-[#05070B] text-white/40" : "bg-[#FAFAFA] text-black/35"
    }`}>
      {/* Ambient lockscreen glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

      {/* Date & Time */}
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

      {/* Pulsing Cloud Icon Outline */}
      <div 
        className="animate-pulse flex items-center justify-center transition-all duration-75" 
        style={{ 
          animationDuration: '3s',
          transform: `translateY(${-t * 100}px) scale(${1 - t * 0.1})`,
          opacity: 1 - t
        }}
      >
        <svg width="36" height="36" viewBox="0 0 874 552" className="opacity-40">
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

      {/* Bottom Swipe Indicator */}
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

const PhoneScreen = ({ activeStep, theme, scrollProgress }: { activeStep: string, theme: "light" | "dark", scrollProgress: number }) => {
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

const GitDiffView = ({ theme, scrollProgress }: { theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  
  // Calculate local progress t from 0.86 to 0.92
  const t = Math.max(0, Math.min(1, (scrollProgress - 0.86) / 0.06));

  return (
    <div className="w-full h-full flex text-[9px] font-mono divide-x divide-white/5 overflow-y-auto">
      {/* Left Side: Old Code */}
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
          - &lt;<span className="font-bold">button</span> <span className="text-gray-550">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + 1)&#125;&gt;
        </div>
        <div className="pl-9">Count: &#123;count&#125;</div>
        <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
        <div className="pl-3">);</div>
        <div>&#125;</div>
      </div>

      {/* Right Side: New Code */}
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
          + &lt;<span className="font-bold">button</span> <span className="text-gray-550">onClick</span>=&#123;() =&gt; <span>setCount</span>(count + 1)&#125; className=&quot;active:scale-95&quot;&gt;
        </div>
        <div className="pl-9">Count: &#123;count&#125;</div>
        <div className="pl-6">&lt;/<span className="font-bold">button</span>&gt;</div>
      </div>
    </div>
  );
};

const WorkspaceIDE = ({ activeStep, theme, scrollProgress }: { activeStep: string, theme: "light" | "dark", scrollProgress: number }) => {
  const isDark = theme === "dark";
  const showSidebar = activeStep === "terminal" || activeStep === "editor" || activeStep === "git";
  const showTerminal = activeStep === "terminal";
  const showPreview = activeStep === "previews";

  return (
    <div className={`w-full h-full flex flex-col transition-colors duration-300 ${
      isDark ? "bg-[#08090C] text-gray-300" : "bg-gray-100 text-[#0F1115]"
    }`}>
      {/* Top Title Bar */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (Icons - No Emojis) */}
        <div className={`w-10 flex flex-col items-center py-4 gap-5 border-r ${
          isDark ? "bg-[#090A0E] border-white/5" : "bg-gray-50 border-black/5"
        }`}>
          {[
            // Files Icon
            <svg key="files" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>,
            // Search Icon
            <svg key="search" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>,
            // Git Icon
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

        {/* Sidebar */}
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono">M</span>
                      <span className="font-mono text-gray-400">Counter.tsx</span>
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
                    <div className="pl-3 font-bold text-white dark:text-white">
                      <svg className="w-2.5 h-2.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M13 2v7h7" />
                      </svg>
                      Counter.tsx
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Editor & Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Editor Tabs */}
            <div className={`h-8 flex border-b ${
              isDark ? "bg-[#090A0E] border-white/5" : "bg-gray-50 border-black/5"
            }`}>
              <div className={`px-4 flex items-center gap-2 border-r text-[8px] font-mono ${
                isDark ? "bg-[#0F1117] border-white/5 text-white" : "bg-white border-black/5 text-black"
              }`}>
                <svg className="w-2.5 h-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M13 2v7h7" />
                </svg>
                <span>Counter.tsx</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              {activeStep === "git" ? (
                <GitDiffView theme={theme} scrollProgress={scrollProgress} />
              ) : (
                <EditorScreen theme={theme} scrollProgress={scrollProgress} />
              )}
            </div>
          </div>

          {/* Terminal Panel */}
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

        {/* Live Preview Panel (Right) */}
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

const KEYFRAMES = [
  // 1. Phone Rise (0.0 - 0.15) - Phone rises from below, screen is black/off, straight rise
  { p: 0.0, rx: 0, ry: 0, rz: 0, s: 0.25, tx: 0, ty: 450, tz: 0, bezelOpacity: 1 },
  { p: 0.15, rx: 0, ry: 0, rz: 0, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  // 2. Welcome Phase (0.15 - 0.35) - Phone is centered, screen is blank/off, welcome text fades in/out in bg
  { p: 0.35, rx: 0, ry: 0, rz: 0, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  // 3. Arrival & Boot (0.35 - 0.48) - Welcome text is gone, phone boots (traces logo)
  { p: 0.48, rx: 8, ry: -10, rz: 3, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  // 4. Sandbox Orbit (0.48 - 0.58) - Centered
  { p: 0.58, rx: 5, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 30, bezelOpacity: 1 },
  // 5. Sandbox Load (0.58 - 0.68) - Centered
  { p: 0.68, rx: 0, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  // 6. Terminal (0.68 - 0.78) - Crisp centered focus (1.6x zoom, low tz for subpixel clarity)
  { p: 0.71, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },
  { p: 0.78, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },
  // 7. Editor (0.78 - 0.86) - Zoom out to select code, then zoom back in for AI refactor
  { p: 0.79, rx: 6, ry: -8, rz: 2, s: 1.25, tx: 0, ty: 0, tz: 10, bezelOpacity: 1 }, // zoom out for selection
  { p: 0.82, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },  // zoom in for AI popup
  { p: 0.84, rx: 0, ry: 0, rz: 0, s: 1.45, tx: 0, ty: 0, tz: 15, bezelOpacity: 1 }, // zoom out slightly for AI panel
  { p: 0.86, rx: 0, ry: 0, rz: 0, s: 1.45, tx: 0, ty: 0, tz: 15, bezelOpacity: 1 },
  // 8. Git (0.86 - 0.92) - Git screen on phone
  { p: 0.92, rx: 0, ry: 15, rz: -2, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  // 9. Previews (0.92 - 0.96) - Starts on phone, then deep zooms to fullscreen desktop preview
  { p: 0.94, rx: 0, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  { p: 0.96, rx: 0, ry: 0, rz: 0, s: 6.0, tx: 0, ty: 0, tz: 500, bezelOpacity: 0 },
  // 10. Exit (0.96 - 1.0) - Re-emerge to floating phone
  { p: 1.0, rx: 15, ry: -20, rz: 10, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 }
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
  
  // Cubic easing for transitions
  const ease = t * t * (3 - 2 * t);
  const lerp = (a: number, b: number) => a + (b - a) * ease;
  
  const factor = isMobile ? 0.25 : 1.0;
  
  const mouseRx = isMobile ? 0 : mouseY * -15;
  const mouseRy = isMobile ? 0 : mouseX * 15;
  
  const rx = (lerp(k1.rx, k2.rx) + mouseRx) * factor;
  const ry = (lerp(k1.ry, k2.ry) + mouseRy) * factor;
  const rz = lerp(k1.rz, k2.rz) * factor;
  const s = lerp(k1.s, k2.s) * (isMobile ? 0.8 : 1.0);
  const tx = lerp(k1.tx, k2.tx) * factor;
  const ty = lerp(k1.ty, k2.ty) * factor;
  const tz = lerp(k1.tz, k2.tz) * factor;
  
  return `perspective(1200px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
};

const PhoneMockup = ({ 
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

  // Dynamic Island status indicator based on scrollProgress (No emojis)
  const getIslandIcon = () => {
    return <span className="text-[6px] text-indigo-455 dark:text-indigo-400 animate-pulse font-mono">Syncing</span>;
  };

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

export function InteractiveShowcase({ theme, colors }: { theme: "light" | "dark", colors: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeStep, setActiveStep] = useState<string>("phone_rise");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const scrollProgressRef = useRef<number>(0);
  scrollProgressRef.current = scrollProgress;

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

      let step = "phone_rise";
      if (progress < 0.15) step = "phone_rise";
      else if (progress >= 0.15 && progress < 0.35) step = "welcome_phase";
      else step = "logo_transition";

      setActiveStep(step);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [theme]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseOffset({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5
    });
  };

  const handleMouseLeave = () => setMouseOffset({ x: 0, y: 0 });

  const transformStyle = get3DTransform(scrollProgress, isMobile, mouseOffset.x, mouseOffset.y);
  const isDark = theme === "dark";

  // Calculate Opacities for the transition
  const mockupOpacity = scrollProgress < 0.35 
    ? 1 
    : Math.max(0, Math.min(1, 1 - (scrollProgress - 0.35) / 0.08));

  const logoOpacity = scrollProgress < 0.35 
    ? 0 
    : Math.max(0, Math.min(1, (scrollProgress - 0.35) / 0.08));

  const drawT = Math.max(0, Math.min(1, (scrollProgress - 0.40) / 0.35));
  const textOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.65) / 0.20));

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-[500vh] border-y transition-colors duration-300 ${
        isDark ? "bg-[#030303] border-white/5" : "bg-[#FAFAFA] border-black/5"
      }`}
    >
      <div 
        className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-20"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10 pointer-events-none"
          style={{
            opacity: scrollProgress < 0.15 ? 1 - (scrollProgress / 0.15) : 0,
            transform: `translateY(${-scrollProgress * 80}px)`,
            pointerEvents: scrollProgress < 0.10 ? "auto" : "none"
          }}
        >
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

          <div className="flex gap-3 justify-center mb-10">
            <a href="#" className={`${colors.btnPrimary} px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Download App"}
            </a>
            <a href="#" className={`${colors.btnSecondary} border px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}>
              {"Watch Demo"}
            </a>
          </div>

          <div className="flex flex-col items-center mt-6">
            <p className={`text-[10px] font-mono tracking-widest ${colors.textSecondary} uppercase mb-4`}>
              {"Built using technologies developers already trust"}
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-2 justify-center items-center opacity-45 dark:opacity-35 text-[10px] font-mono">
              {["React", "Node.js", "Python", "Rust", "Go"].map((logo, idx) => (
                <span key={idx} className="font-bold tracking-wider">{logo}</span>
              ))}
            </div>
          </div>
        </div>

        {/* B. Glowing Aura behind phone (Dynamic Color Shifting) */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-in-out z-1"
          style={{ 
            opacity: mockupOpacity,
            background: getGlowColor(activeStep, isDark),
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />
        
        <div 
          className="relative z-10 transition-all duration-300 ease-out"
          style={{
            transform: transformStyle,
            transformStyle: "preserve-3d",
            opacity: mockupOpacity,
            pointerEvents: mockupOpacity > 0.1 ? "auto" : "none"
          }}
        >
          <PhoneMockup scrollProgress={scrollProgress} theme={theme} mouseOffset={mouseOffset} activeStep={activeStep}>
            <PhoneScreen activeStep={activeStep} theme={theme} scrollProgress={scrollProgress} />
          </PhoneMockup>
        </div>

        {/* Centered Large Logo Transition Layer */}
        {scrollProgress >= 0.35 && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-6"
            style={{
              opacity: logoOpacity,
            }}
          >
            {/* Massive Glowing Logo & Brand Intro */}
            <div className="flex flex-col items-center gap-6 select-none relative">
              {/* Glowing Ambient Glow behind the logo */}
              <div 
                className="absolute w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ease-in-out -z-1"
                style={{ 
                  opacity: Math.max(0, Math.min(0.25, (scrollProgress - 0.50) / 0.20)),
                  background: isDark 
                    ? "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(16, 185, 129, 0.2) 50%, rgba(0,0,0,0) 100%)"
                    : "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(0,0,0,0) 100%)"
                }}
              />

              <svg 
                width={isMobile ? "140" : "200"} 
                height={isMobile ? "90" : "135"} 
                viewBox="0 0 874 552" 
                className="transition-all duration-300"
              >
                <path
                  d={CLOUD_PATH}
                  fill={isDark ? `rgba(255, 255, 255, ${Math.max(0, Math.min(0.08, (scrollProgress - 0.55) / 0.25))})` : `rgba(15, 17, 21, ${Math.max(0, Math.min(0.05, (scrollProgress - 0.55) / 0.25))})`}
                  stroke={isDark ? "#FFFFFF" : "#0F1115"}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2500"
                  strokeDashoffset={(1 - drawT) * 2500}
                  className="transition-all duration-75 ease-out"
                />
              </svg>

              <div 
                className="flex flex-col items-center gap-3 text-center transition-all duration-300"
                style={{
                  opacity: textOpacity,
                  transform: `translateY(${(1 - textOpacity) * 20}px)`
                }}
              >
                <h2 
                  className={`text-4xl md:text-6xl font-black uppercase tracking-[0.18em] leading-none ${
                    isDark ? "text-white" : "text-[#0F1115]"
                  }`}
                  style={{
                    letterSpacing: `${(1 - textOpacity) * 0.4 + 0.18}em`
                  }}
                >
                  CloudCode
                </h2>
                <p className={`text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] ${
                  isDark ? "text-gray-400" : "text-gray-555"
                }`}>
                  Mobile-First Engineering Workspace
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
