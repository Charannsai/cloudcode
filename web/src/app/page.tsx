"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [activeStory, setActiveStory] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // 3D Tilt State for Hero Phone
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // AI Section Animation State
  const [aiStep, setAiStep] = useState(0);
  const aiSteps = [
    { label: "Analyzing codebase...", status: "active" },
    { label: "Searching for authentication bug...", status: "active" },
    { label: "Reading src/lib/auth.ts...", status: "active" },
    { label: "Running unit tests...", status: "active" },
    { label: "Applying patch to verifyToken()...", status: "active" },
    { label: "Creating database migration...", status: "active" },
    { label: "All tests passed. Commit ready.", status: "success" }
  ];

  // Loop through AI steps
  useEffect(() => {
    const interval = setInterval(() => {
      setAiStep((prev) => (prev + 1) % aiSteps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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

  // Handle Mouse Move for 3D Tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Calculate rotation angles (max 10 degrees)
    const rX = -(mouseY / height) * 20;
    const rY = (mouseX / width) * 20;
    
    setTilt({ x: rX, y: rY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  if (!mounted) {
    return <div className="bg-[#0E1116] min-h-screen" />;
  }

  // Color tokens mapped directly from the mobile app theme store
  const colors = {
    bg: theme === "dark" ? "bg-[#0E1116]" : "bg-[#F6F8FA]",
    card: theme === "dark" ? "bg-[#151922] border-[#21262D]" : "bg-[#FFFFFF] border-[#D8DEE4]",
    text: theme === "dark" ? "text-[#F3F4F6]" : "text-[#0E1116]",
    textSecondary: theme === "dark" ? "text-[#8B929A]" : "text-[#656D76]",
    border: theme === "dark" ? "border-[#21262D]" : "border-[#D8DEE4]",
    highlight: theme === "dark" ? "hover:bg-[#1C2128]" : "hover:bg-[#0E111610]",
    terminalBg: theme === "dark" ? "bg-[#070913]" : "bg-[#F0F2F5]",
    terminalHeader: theme === "dark" ? "bg-[#151922]" : "bg-[#E1E4E8]",
  };

  const techLogos = [
    "React", "Node.js", "Supabase", "Docker", "GitHub", "OpenAI", 
    "Anthropic", "Gemini", "PostgreSQL", "Redis", "MongoDB", "Linux", "Cloudflare"
  ];

  const floatingLangs = [
    { name: "TypeScript", top: "15%", left: "8%" },
    { name: "React", top: "25%", right: "10%" },
    { name: "Next.js", top: "45%", left: "5%" },
    { name: "Python", top: "12%", right: "20%" },
    { name: "Go", top: "60%", right: "8%" },
    { name: "Rust", top: "70%", left: "12%" },
    { name: "Docker", top: "80%", right: "15%" },
    { name: "Kubernetes", top: "35%", right: "25%" }
  ];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      {/* Injecting CSS Animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes aurora {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes pulse-halo {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.3; }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-aurora-1 {
          animation: aurora 20s ease-in-out infinite alternate;
        }
        .animate-aurora-2 {
          animation: aurora 25s ease-in-out infinite alternate-reverse;
        }
        .animate-pulse-halo {
          animation: pulse-halo 4s ease-in-out infinite;
        }
      `}</style>

      <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans transition-colors duration-300`}>
        
        {/* ==================== 1. HERO SECTION ==================== */}
        <div 
          ref={heroRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full min-h-screen flex flex-col items-center justify-between relative border-b border-app-border-light dark:border-app-border-dark"
        >
          {/* Aurora Gradients */}
          {theme === "dark" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,rgba(0,0,0,0)_75%)] animate-aurora-1" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.06)_0%,rgba(0,0,0,0)_75%)] animate-aurora-2" />
            </div>
          )}
          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

          {/* Floating Language Tags */}
          {floatingLangs.map((lang, idx) => (
            <span
              key={idx}
              style={{ top: lang.top, left: lang.left, right: lang.right }}
              className="absolute hidden md:inline-block text-xs font-mono px-3 py-1.5 rounded-full border border-app-border-light dark:border-app-border-dark bg-app-card-light/40 dark:bg-app-card-dark/40 backdrop-blur-sm text-app-text-secondary-light dark:text-app-text-secondary-dark pointer-events-none select-none z-0 shadow-sm"
            >
              {lang.name}
            </span>
          ))}

          {/* Header */}
          <header className={`w-full max-w-5xl px-6 py-5 flex justify-between items-center z-20`}>
            <div className="flex items-center gap-3">
              <img 
                src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
                alt="CloudCode Logo" 
                className="h-7 w-auto object-contain"
              />
              <span className="text-[9px] uppercase tracking-widest font-bold text-app-blue bg-app-blue/10 px-2 py-0.5 rounded-full border border-app-blue/20">
                Beta
              </span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/privacy" className={`text-sm ${colors.textSecondary} hover:text-indigo-600 dark:hover:text-white transition-colors`}>
                Privacy
              </Link>
              <Link href="/terms" className={`text-sm ${colors.textSecondary} hover:text-indigo-600 dark:hover:text-white transition-colors`}>
                Terms
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg border ${colors.border} ${colors.highlight} transition-all cursor-pointer ${colors.textSecondary}`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </button>
            </nav>
          </header>

          {/* Hero Content */}
          <div className="w-full max-w-4xl px-6 pt-16 flex flex-col items-center text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-[#8957e5] mb-6">
              {"Mobile-First Engineering Workspace"}
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none max-w-4xl mb-6 bg-gradient-to-br from-app-text-light via-app-text-light to-app-text-secondary-light dark:from-app-text-dark dark:via-app-text-dark dark:to-app-text-secondary-dark bg-clip-text text-transparent">
              {"Build, Debug & Deploy"}
              <br />
              {"Software From Anywhere."}
            </h1>
            
            <p className={`text-base md:text-lg ${colors.textSecondary} max-w-2xl mb-8 leading-relaxed`}>
              {"CloudCode combines a professional cloud IDE, autonomous AI agents, Git workflows, terminals, live previews and cloud environments into a single mobile-first workspace. Write production software completely using your mobile."}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <a href="#" className="bg-indigo-600 hover:bg-indigo-500 dark:bg-[#F3F4F6] text-white dark:text-[#0E1116] px-6 py-3.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-md">
                {"Download App"}
              </a>
              <a href="#" className={`bg-transparent ${colors.highlight} ${colors.text} border ${colors.border} px-6 py-3.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all`}>
                {"Watch Demo"}
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-500 dark:text-gray-400 mt-4 font-mono">
              <span>{"[o] No setup"}</span>
              <span>{"[o] Cloud environments in seconds"}</span>
              <span>{"[o] Built for professional developers"}</span>
            </div>
          </div>

          {/* 3D Tilting Phone Mockup */}
          <div className="w-full max-w-md px-6 pt-12 pb-4 z-10 flex justify-center">
            <div 
              style={{ 
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transition: "transform 0.1s ease-out"
              }}
              className="w-72 h-[420px] rounded-[36px] border-8 border-gray-800 dark:border-gray-700 bg-black shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black rounded-b-xl z-20" />
              
              {/* Screen Content - Editor Mockup */}
              <div className="w-full h-full flex flex-col justify-between bg-[#0E1116] pt-5 font-mono text-[9px] text-gray-400">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#151922] border-b border-[#21262D]">
                  <span className="text-white font-bold">main.tsx</span>
                  <span className="text-app-green">● Sandbox</span>
                </div>
                {/* Editor Lines */}
                <div className="p-3 space-y-1.5 text-left flex-1 overflow-hidden">
                  <div><span className="text-gray-600 mr-2">1</span><span className="text-app-purple">import</span> React <span className="text-app-purple">from</span> <span className="text-app-green">&apos;react&apos;</span>;</div>
                  <div><span className="text-gray-600 mr-2">2</span><span className="text-app-purple">import</span> &#123; Cloud &#125; <span className="text-app-purple">from</span> <span className="text-app-green">&apos;core&apos;</span>;</div>
                  <div><span className="text-gray-600 mr-2">3</span></div>
                  <div><span className="text-gray-600 mr-2">4</span><span className="text-app-purple">export default function</span> <span className="text-app-blue">App</span>() &#123;</div>
                  <div><span className="text-gray-600 mr-2">5</span>  <span className="text-app-purple">return</span> (</div>
                  <div className="pl-3"><span className="text-gray-600 mr-2">6</span>    &lt;<span className="text-app-blue">Cloud</span> active=&#123;<span className="text-app-purple">true</span>&#125;&gt;</div>
                  <div className="pl-6"><span className="text-gray-600 mr-2">7</span>      &lt;<span className="text-app-blue">Text</span>&gt;Code on the go&lt;/<span className="text-app-blue">Text</span>&gt;</div>
                  <div className="pl-3"><span className="text-gray-600 mr-2">8</span>    &lt;/<span className="text-app-blue">Cloud</span>&gt;</div>
                  <div><span className="text-gray-600 mr-2">9</span>  );</div>
                  <div><span className="text-gray-600 mr-2">10</span>&#125;</div>
                </div>
                {/* Editor Footer */}
                <div className="p-2 bg-[#151922] border-t border-[#21262D] flex items-center justify-between text-[8px] text-gray-500">
                  <span>UTF-8</span>
                  <span>TypeScript</span>
                  <span className="text-app-blue">Ln 7, Col 22</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ==================== 2. TRUSTED BY SECTION ==================== */}
        <section className={`w-full py-8 border-b ${colors.border} bg-app-card-light/20 dark:bg-app-card-dark/20 backdrop-blur-sm z-10 overflow-hidden`}>
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className={`text-xs font-mono tracking-wider ${colors.textSecondary} uppercase mb-6`}>
              {"Built using technologies developers already trust"}
            </p>
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
              <div className="animate-marquee flex gap-16 items-center">
                {techLogos.concat(techLogos).map((logo, idx) => (
                  <span key={idx} className="text-sm font-bold text-gray-400 dark:text-gray-650 tracking-wide font-mono select-none">
                    {logo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 3. THE PROBLEM ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {"Development was never designed"}
              <br />
              {"for mobile."}
            </h2>
            <p className={`text-sm ${colors.textSecondary} max-w-lg mx-auto`}>
              {"Traditional tools bind you to a desk. CloudCode liberates your workflow while retaining full professional capabilities."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Old Workflow */}
            <div className={`rounded-2xl border ${colors.border} ${colors.card} p-8 flex flex-col justify-between`}>
              <div>
                <span className="text-xs font-bold text-app-red uppercase tracking-wider font-mono">{"[x] Old Workflow"}</span>
                <h3 className="text-2xl font-bold mt-2 mb-6">{"Bound to the Desktop"}</h3>
                <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <li className="flex items-center gap-3"><span className="text-app-red">{"[-]"}</span> {"Must carry a heavy laptop everywhere"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-red">{"[-]"}</span> {"Cannot easily fix critical production bugs on the road"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-red">{"[-]"}</span> {"No access to terminals or compilers on your phone"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-red">{"[-]"}</span> {"Unable to review and test PRs with live environments"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-red">{"[-]"}</span> {"AI tools disconnected from your running sandbox"}</li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-app-border-light dark:border-app-border-dark text-xs text-gray-400 font-mono">
                {"Status: Restricted"}
              </div>
            </div>

            {/* CloudCode Workflow */}
            <div className={`rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-[#151922] p-8 flex flex-col justify-between relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider font-mono">{"[+] CloudCode Workflow"}</span>
                <h3 className="text-2xl font-bold mt-2 mb-6">{"Full Mobility"}</h3>
                <ul className="space-y-4 text-sm text-app-text-light dark:text-app-text-dark font-medium">
                  <li className="flex items-center gap-3"><span className="text-app-green">{"[+]"}</span> {"Full-featured cloud IDE in your pocket"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-green">{"[+]"}</span> {"Real Linux terminal with root authority"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-green">{"[+]"}</span> {"Autonomous AI engineer working inside your workspace"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-green">{"[+]"}</span> {"Full Git integration with branch and PR reviews"}</li>
                  <li className="flex items-center gap-3"><span className="text-app-green">{"[+]"}</span> {"Instant live browser preview of running services"}</li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-indigo-500/25 text-xs text-indigo-400 font-mono">
                {"Status: Fully Operational"}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 4. FEATURE STORY ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {"Everything in Sync."}
            </h2>
            <p className={`text-sm ${colors.textSecondary} max-w-md mx-auto`}>
              {"Explore the timeline of features that turn your phone into a complete software engineering station."}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Timeline Sidebar (Left) */}
            <div className="w-full md:w-1/3 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 sticky top-6 z-20 bg-app-bg-light/80 dark:bg-app-bg-dark/80 backdrop-blur-md py-2">
              {[
                "Instant Cloud Workspace",
                "Professional Code Editor",
                "Autonomous AI Engineer",
                "Linux Terminal",
                "Live Preview",
                "Git Workflows"
              ].map((storyName, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStory(idx)}
                  className={`px-4 py-3 rounded-lg text-left text-xs font-mono transition-all cursor-pointer whitespace-nowrap md:whitespace-normal border ${
                    activeStory === idx
                      ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                      : `${colors.border} ${colors.card} ${colors.textSecondary} hover:text-app-text-light dark:hover:text-app-text-dark`
                  }`}
                >
                  {`0${idx + 1}. ${storyName}`}
                </button>
              ))}
            </div>

            {/* Story Showcase Panel (Right) */}
            <div className="w-full md:w-2/3">
              <div className={`rounded-2xl border ${colors.border} ${colors.card} p-8 min-h-[420px] flex flex-col justify-between shadow-lg`}>
                
                {/* 1. Instant Cloud Workspace */}
                {activeStory === 0 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"01 / Cloud Workspace"}</span>
                    <h3 className="text-3xl font-bold">{"Isolated Cloud Workspace"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"Launch isolated cloud environments within seconds. No local installations, no package configuration issues, no battery drain. Just secure, clean Docker containers pre-loaded with your toolchain."}
                    </p>
                    <div className={`p-4 rounded-xl ${colors.terminalBg} border ${colors.border} font-mono text-[10px] text-gray-500`}>
                      <div>{"$ cc workspace create --template node"}</div>
                      <div className="text-app-blue">{"[o] Allocating container..."}</div>
                      <div className="text-app-purple">{"[o] Mounting persistent storage..."}</div>
                      <div className="text-app-green">{"[OK] Workspace online at: https://sandbox-node-1.cloudcode.app"}</div>
                    </div>
                  </div>
                )}

                {/* 2. Professional Code Editor */}
                {activeStory === 1 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"02 / Code Editor"}</span>
                    <h3 className="text-3xl font-bold">{"Desktop-Grade Code Editor"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"A full-featured code editor optimized specifically for touch. Features intelligent auto-complete, code folding, a visual minimap, syntax highlighting for 100+ languages, and inline Git diff decorations."}
                    </p>
                    <div className="border border-app-border-light dark:border-app-border-dark rounded-xl overflow-hidden font-mono text-[10px] bg-slate-950 text-gray-400 p-4 space-y-1.5">
                      <div><span className="text-app-purple">export const</span> <span className="text-app-blue">useTerminal</span> = () =&gt; &#123;</div>
                      <div className="pl-3">const [lines, setLines] = useState&lt;string[]&gt;([]);</div>
                      <div className="pl-3">const execute = (cmd: string) =&gt; &#123; ... &#125;;</div>
                      <div className="pl-3">return &#123; lines, execute &#125;;</div>
                      <div>&#125;;</div>
                    </div>
                  </div>
                )}

                {/* 3. Autonomous AI Engineer */}
                {activeStory === 2 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"03 / AI Agent"}</span>
                    <h3 className="text-3xl font-bold">{"Autonomous AI Engineer"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"Not just a simple chat assistant—this is a collaborative engineer. The AI agent understands your entire workspace hierarchy, writes files, runs tests, debugs compilation failures, and presents code reviews for your approval."}
                    </p>
                    <div className={`p-4 rounded-xl ${colors.terminalBg} border ${colors.border} font-mono text-[10px] space-y-2`}>
                      <div className="text-app-blue">{"User: Create a new API route that fetches user projects."}</div>
                      <div className="text-app-purple">{"AI: I will create `src/app/api/projects/route.ts` and add database fetching."}</div>
                      <div className="text-app-green">{"[+] File created successfully"}</div>
                      <div className="text-gray-500">{"AI: Running database verification..."}</div>
                    </div>
                  </div>
                )}

                {/* 4. Linux Terminal */}
                {activeStory === 3 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"04 / Linux Terminal"}</span>
                    <h3 className="text-3xl font-bold">{"Real Linux Shell"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"A real, fully operational Linux terminal. Not a simulator. Run compilers, manage processes, use git, npm, python, cargo, or docker. Designed with custom touch gestures for quick keys and arrow navigation."}
                    </p>
                    <div className={`p-4 rounded-xl ${colors.terminalBg} border ${colors.border} font-mono text-[10px] text-app-text-secondary-dark`}>
                      <div className="flex gap-2"><span className="text-app-green">root@sandbox:~$</span> <span className="text-white">git status</span></div>
                      <div>{"On branch main"}</div>
                      <div>{"Your branch is up to date with 'origin/main'."}</div>
                      <div className="text-app-green">{"nothing to commit, working tree clean"}</div>
                    </div>
                  </div>
                )}

                {/* 5. Live Preview */}
                {activeStory === 4 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"05 / Live Preview"}</span>
                    <h3 className="text-3xl font-bold">{"Instant Live Preview"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"Preview your running web applications instantly without leaving your workspace. Includes a built-in browser view with an interactive console log, network request inspection, and hot-reload support."}
                    </p>
                    <div className="border border-app-border-light dark:border-app-border-dark rounded-xl overflow-hidden bg-white dark:bg-slate-900 p-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-[10px] text-gray-500 mb-2">
                        <span className="w-2 h-2 rounded-full bg-app-green" />
                        <span>localhost:3000</span>
                      </div>
                      <div className="h-20 bg-gray-50 dark:bg-slate-950 rounded-lg flex items-center justify-center text-xs text-gray-400">
                        {"[Web App View]"}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Git Workflows */}
                {activeStory === 5 && (
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-app-blue uppercase font-mono">{"06 / Source Control"}</span>
                    <h3 className="text-3xl font-bold">{"Integrated Git Workflows"}</h3>
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"Manage your repositories with ease. View visual diffs, write commits, create and switch branches, review pull requests, and push changes to GitHub, GitLab, or your custom Git server."}
                    </p>
                    <div className={`p-4 rounded-xl ${colors.terminalBg} border ${colors.border} font-mono text-[10px] space-y-1.5`}>
                      <div className="text-app-purple">{"o [main] Commit: Fix authentication bug"}</div>
                      <div className="text-app-blue">{"|\\"}</div>
                      <div className="text-app-green">{"| o [feat/auth] Commit: Add verification"}</div>
                      <div className="text-gray-500">{"|/"}</div>
                      <div className="text-white">{"o [origin/main] Initial commit"}</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* ==================== 5. EVERYTHING YOU NEED ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {"Everything You Need."}
            </h2>
            <p className={`text-sm ${colors.textSecondary} max-w-md mx-auto`}>
              {"A comprehensive suite of tools built specifically for developers on the move."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-app-blue/10 text-app-blue flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Cloud IDE</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Desktop-grade code editing with autocomplete, diagnostics, and syntax highlighting."}
              </p>
            </div>

            {/* Card 2 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-app-purple/10 text-app-purple flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
                  <path d="M12 2a10 10 0 0 1 10 10h-10V2Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">AI Engineer</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Autonomous AI agent that writes code, runs commands, and plans multi-step tasks."}
              </p>
            </div>

            {/* Card 3 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-app-green/10 text-app-green flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17l6-6-6-6M12 19h8" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Git</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Visual version control, diff viewer, branch switcher, and full GitHub integration."}
              </p>
            </div>

            {/* Card 4 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18M15 3v18" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Terminal</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Real Linux shell inside your workspace with shell gestures and keyboard shortcuts."}
              </p>
            </div>

            {/* Card 5 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12h20M12 2v20M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Preview</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Preview your web applications instantly with console and network inspection tabs."}
              </p>
            </div>

            {/* Card 6 */}
            <div className={`${colors.card} border p-8 rounded-2xl hover:scale-[1.02] hover:shadow-lg transition-all duration-300`}>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Extensions</h3>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Personalize your workspace with custom compilers, tools, themes, and keymaps."}
              </p>
            </div>
          </div>
        </section>

        {/* ==================== 6. AI SECTION ==================== */}
        <section className="w-full bg-gradient-to-br from-[#0e0e1a] via-[#120f26] to-[#0E1116] py-28 flex flex-col items-center justify-center border-y border-indigo-500/20 z-10">
          <div className="w-full max-w-4xl px-6 flex flex-col md:flex-row items-center gap-12">
            
            {/* Left Info */}
            <div className="w-full md:w-1/2 text-left space-y-6">
              <span className="text-xs font-bold text-app-purple uppercase tracking-wider font-mono">{"[AI Engineer]"}</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                {"Your second"}
                <br />
                {"engineer."}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                {"CloudCode's AI agent doesn't just suggest lines of code—it performs autonomous development tasks. It analyzes issues, plans steps, edits your files, runs shell commands, verifies fixes with compilers, and presents clean commits."}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-app-purple font-mono pt-4">
                <span>{"[o] Autonomous"}</span>
                <span>{"[o] Transparent"}</span>
                <span>{"[o] Always reviewable"}</span>
              </div>
            </div>

            {/* Right Interactive Animation */}
            <div className="w-full md:w-1/2">
              <div className="rounded-xl border border-purple-500/30 bg-[#070913]/90 p-5 shadow-2xl font-mono text-xs text-left min-h-[280px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-purple-950/50 pb-3 mb-4">
                    <span className="text-app-purple font-bold">{"task_runner_agent.sh"}</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  </div>
                  <div className="text-gray-400 mb-2">{"User: Fix authentication bug"}</div>
                  
                  {/* List of steps with active indicator */}
                  <div className="space-y-2">
                    {aiSteps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2.5 transition-all duration-300 ${
                          idx === aiStep 
                            ? "text-white scale-[1.01] translate-x-1" 
                            : idx < aiStep 
                              ? "text-purple-400/60" 
                              : "text-purple-950/30"
                        }`}
                      >
                        <span>{idx === aiStep ? "●" : idx < aiStep ? "✓" : "○"}</span>
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-[10px] text-purple-600/50 pt-4 border-t border-purple-950/30 text-right">
                  {"Agent Status: Active"}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================== 7. MOBILE EXPERIENCE ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {"Built for thumbs,"}
            <br />
            {"not mouse pointers."}
          </h2>
          <p className={`text-sm ${colors.textSecondary} max-w-md mx-auto mb-16`}>
            {"Every gesture, menu, and interface is custom engineered for mobile and tablet screens."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className={`p-6 border ${colors.border} ${colors.card} rounded-xl`}>
              <h4 className="font-bold text-sm mb-3">{"Terminal Gestures"}</h4>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Swipe left or right to switch active terminal shells. Drag up to expand terminal history, or down to minimize."}
              </p>
            </div>
            <div className={`p-6 border ${colors.border} ${colors.card} rounded-xl`}>
              <h4 className="font-bold text-sm mb-3">{"Floating Action Menus"}</h4>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Quickly trigger compiler runs, Git commits, or AI refactors using our responsive radial action button."}
              </p>
            </div>
            <div className={`p-6 border ${colors.border} ${colors.card} rounded-xl`}>
              <h4 className="font-bold text-sm mb-3">{"Selection Toolbar"}</h4>
              <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                {"Select code blocks and immediately apply refactoring, comments, or explanations using the overlay AI toolbar."}
              </p>
            </div>
          </div>
        </section>

        {/* ==================== 8. PERFORMANCE ==================== */}
        <section className="w-full bg-[#070913] py-24 border-y border-app-border-dark z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-app-green uppercase tracking-wider font-mono">{"[System Metrics]"}</span>
              <h2 className="text-4xl font-black tracking-tight mt-2 mb-4 text-white">
                {"CloudCode boots"}
                <br />
                {"in seconds."}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-app-green">{"< 5s"}</div>
                <div className="text-xs font-bold text-white">{"Workspace startup"}</div>
                <div className="text-[10px] text-gray-500 font-mono">{"Container allocation"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-app-blue">{"50ms"}</div>
                <div className="text-xs font-bold text-white">{"Terminal latency"}</div>
                <div className="text-[10px] text-gray-500 font-mono">{"Optimized SSH protocols"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-app-purple">{"99.9%"}</div>
                <div className="text-xs font-bold text-white">{"Infrastructure uptime"}</div>
                <div className="text-[10px] text-gray-500 font-mono">{"Redundant hosting clusters"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-yellow-500">{"AES-256"}</div>
                <div className="text-xs font-bold text-white">{"Encrypted workspaces"}</div>
                <div className="text-[10px] text-gray-500 font-mono">{"Secure container namespaces"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 9. TESTIMONIALS ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10 text-center">
          <div className={`max-w-2xl mx-auto rounded-2xl border ${colors.border} ${colors.card} p-12 shadow-md`}>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider font-mono">{"[Testimonials]"}</span>
            <h3 className="text-2xl font-bold mt-2 mb-4">{"Developer Reviews"}</h3>
            <p className={`text-sm ${colors.textSecondary} mb-6 leading-relaxed`}>
              {"Coming soon. Join early access and shape the future of mobile-first software engineering."}
            </p>
            <a href="#" className="inline-flex bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-colors">
              {"Join Early Access"}
            </a>
          </div>
        </section>

        {/* ==================== 10. PRICING ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {"Simple, transparent pricing."}
            </h2>
            <p className={`text-sm ${colors.textSecondary} max-w-md mx-auto`}>
              {"Choose the tier that matches your development workflow."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className={`rounded-2xl border ${colors.border} ${colors.card} p-8 flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all`}>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">{"[Free]"}</span>
                <h3 className="text-3xl font-black mt-2 mb-4">{"$0"}</h3>
                <p className={`text-xs ${colors.textSecondary} mb-6`}>{"For hobbyists and casual coding."}</p>
                <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <li>{"- 1 Active Sandbox"}</li>
                  <li>{"- 512MB RAM / 1 Core"}</li>
                  <li>{"- Basic AI autocomplete"}</li>
                  <li>{"- Community support"}</li>
                </ul>
              </div>
              <button className={`w-full mt-8 bg-transparent hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark ${colors.text} border ${colors.border} font-bold py-2.5 rounded-lg text-xs transition-all`}>
                {"Get Started"}
              </button>
            </div>

            {/* Pro Tier (Highlighted) */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-500/5 dark:bg-[#151922] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden hover:scale-[1.01] transition-all">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                {"Popular"}
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">{"[Pro]"}</span>
                <h3 className="text-3xl font-black mt-2 mb-4">{"$19"}<span className="text-xs font-normal text-gray-400">{"/mo"}</span></h3>
                <p className={`text-xs ${colors.textSecondary} mb-6`}>{"For professional software engineering."}</p>
                <ul className="space-y-3 text-xs text-app-text-light dark:text-app-text-dark font-medium">
                  <li>{"- Unlimited Sandboxes"}</li>
                  <li>{"- 4GB RAM / 4 Dedicated Cores"}</li>
                  <li>{"- Autonomous AI agent integrations"}</li>
                  <li>{"- Advanced Git & PR workflows"}</li>
                  <li>{"- Priority email support"}</li>
                </ul>
              </div>
              <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-md">
                {"Get Started with Pro"}
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className={`rounded-2xl border ${colors.border} ${colors.card} p-8 flex flex-col justify-between shadow-sm hover:scale-[1.01] transition-all`}>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">{"[Enterprise]"}</span>
                <h3 className="text-3xl font-black mt-2 mb-4">{"Custom"}</h3>
                <p className={`text-xs ${colors.textSecondary} mb-6`}>{"For large teams and custom servers."}</p>
                <ul className="space-y-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <li>{"- Dedicated host clusters"}</li>
                  <li>{"- Custom resource configurations"}</li>
                  <li>{"- Custom AI model integrations"}</li>
                  <li>{"- SLA & dedicated accounts"}</li>
                </ul>
              </div>
              <button className={`w-full mt-8 bg-transparent hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark ${colors.text} border ${colors.border} font-bold py-2.5 rounded-lg text-xs transition-all`}>
                {"Contact Sales"}
              </button>
            </div>
          </div>
        </section>

        {/* ==================== 11. FAQ ==================== */}
        <section className="w-full max-w-3xl px-6 py-24 z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              {"Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-4">
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
              },
              {
                q: "Can I connect my own server?",
                a: "Yes. In addition to our managed cloud sandboxes, you can connect your own VPS or development server via SSH to use as your workspace."
              },
              {
                q: "Offline support?",
                a: "Yes. You can edit files locally in offline mode. Once your connection is restored, CloudCode will automatically sync your changes back to your cloud sandbox."
              }
            ].map((faq, idx) => (
              <div key={idx} className={`border ${colors.border} ${colors.card} rounded-xl overflow-hidden`}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left text-sm font-bold cursor-pointer hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark transition-all"
                >
                  <span>{faq.q}</span>
                  <span>{openFaq === idx ? "-" : "+"}</span>
                </button>
                {openFaq === idx && (
                  <div className={`px-6 pb-4 pt-2 text-xs ${colors.textSecondary} leading-relaxed border-t ${colors.border}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ==================== 12. FINAL CTA ==================== */}
        <section className="w-full py-32 flex flex-col items-center justify-center relative border-t border-app-border-light dark:border-app-border-dark overflow-hidden bg-gradient-to-t from-[#0d0f1a] to-[#0E1116] z-10">
          
          {/* Glowing Halo behind Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl animate-pulse-halo pointer-events-none z-0" />

          <div className="w-full max-w-4xl px-6 flex flex-col items-center text-center z-10 space-y-8">
            {/* Pulsing Logo */}
            <img 
              src="/cloudcodeicon.svg" 
              alt="CloudCode Icon" 
              className="h-16 w-16 object-contain animate-bounce"
            />
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl">
              {"The future of software"}
              <br />
              {"development fits"}
              <br />
              {"in your pocket."}
            </h2>

            <p className={`text-sm ${colors.textSecondary} max-w-md`}>
              {"Join developers building software wherever inspiration strikes."}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-lg font-bold text-sm transition-all shadow-md">
                {"Download CloudCode"}
              </a>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className={`bg-transparent ${colors.highlight} ${colors.text} border ${colors.border} px-6 py-3.5 rounded-lg font-bold text-sm transition-all`}>
                {"Join Discord"}
              </a>
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className={`w-full py-16 border-t ${colors.border} bg-app-card-light/10 dark:bg-app-card-dark/10 backdrop-blur-sm z-10`}>
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
            
            {/* Col 1 - Logo & Slogan */}
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

            {/* Col 2 - Products */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Products"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"Download"}</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"Pricing"}</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"Changelog"}</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"Roadmap"}</a></li>
              </ul>
            </div>

            {/* Col 3 - Developers */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Developers"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"Documentation"}</a></li>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"API"}</a></li>
                <li><a href="https://github.com" className="hover:text-indigo-600 dark:hover:text-white">{"GitHub"}</a></li>
              </ul>
            </div>

            {/* Col 4 - Company */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold text-gray-400 uppercase tracking-wider font-mono">{"Company"}</h5>
              <ul className={`space-y-2 ${colors.textSecondary}`}>
                <li><a href="#" className="hover:text-indigo-600 dark:hover:text-white">{"About"}</a></li>
                <li><a href="/privacy" className="hover:text-indigo-600 dark:hover:text-white">{"Privacy Policy"}</a></li>
                <li><a href="/terms" className="hover:text-indigo-600 dark:hover:text-white">{"Terms of Service"}</a></li>
              </ul>
            </div>

          </div>

          <div className="max-w-5xl mx-auto px-6 pt-8 mt-8 border-t border-app-border-light/40 dark:border-app-border-dark/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-gray-450">
              {`© ${new Date().getFullYear()} CloudCode, Inc. All rights reserved.`}
            </p>
            <p className="text-[10px] text-gray-450 font-mono">
              {"Made with <3 for the developer community"}
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
