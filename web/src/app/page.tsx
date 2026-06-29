"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "editor" | "git">("terminal");

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

  return (
    <div className={`${colors.bg} ${colors.text} min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans transition-colors duration-300`}>
      
      {/* Ambient Glows (Only in dark mode for premium depth) */}
      {theme === "dark" && (
        <>
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />
          <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,139,253,0.04)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0" />
        </>
      )}

      {/* Header */}
      <header className={`w-full max-w-5xl px-6 py-5 flex justify-between items-center z-10 border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          {/* Logo using Mobile App Logo Image */}
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

          {/* Theme Toggle Button */}
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

      {/* Main Container */}
      <main className="w-full max-w-5xl px-6 pt-20 pb-32 flex flex-col items-center text-center z-10">
        
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-app-green animate-pulse" />
          The Mobile IDE for Professional Developers
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none max-w-4xl mb-6 bg-gradient-to-br from-app-text-light via-app-text-light to-app-text-secondary-light dark:from-app-text-dark dark:via-app-text-dark dark:to-app-text-secondary-dark bg-clip-text text-transparent">
          Write Code. Run Sandboxes. Anywhere.
        </h1>
        <p className={`text-base md:text-lg ${colors.textSecondary} max-w-2xl mb-10 leading-relaxed`}>
          Provision isolated Linux containers, run compiler toolchains with full root access, write code with AI, and manage Git repositories—all from your phone.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-24">
          <a href="#" className="bg-indigo-600 hover:bg-indigo-500 dark:bg-[#F3F4F6] text-white dark:text-[#0E1116] hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(243,244,246,0.15)] px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2.5 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Download on Google Play
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`bg-transparent ${colors.highlight} ${colors.text} border ${colors.border} px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2.5 transition-all`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Interactive App Mockup Section (WOW Factor) */}
        <div className="w-full max-w-3xl mb-24">
          <div className={`rounded-xl border ${colors.border} ${colors.card} p-2 shadow-xl dark:shadow-2xl transition-all duration-300`}>
            <div className={`rounded-lg border ${colors.border} ${colors.terminalBg} overflow-hidden transition-colors duration-300`}>
              
              {/* Mockup Tab Bar */}
              <div className={`flex items-center justify-between px-4 py-1.5 ${colors.terminalHeader} border-b ${colors.border} transition-colors duration-300`}>
                <div className="flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-app-red" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-app-green" />
                </div>
                
                {/* Tabs */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => setActiveTab("terminal")}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                      activeTab === "terminal" 
                        ? (theme === "dark" ? "bg-[#070913] text-app-blue" : "bg-[#F0F2F5] text-indigo-600 font-bold")
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Terminal
                  </button>
                  <button 
                    onClick={() => setActiveTab("editor")}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                      activeTab === "editor" 
                        ? (theme === "dark" ? "bg-[#070913] text-app-blue" : "bg-[#F0F2F5] text-indigo-600 font-bold")
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    main.tsx
                  </button>
                  <button 
                    onClick={() => setActiveTab("git")}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer ${
                      activeTab === "git" 
                        ? (theme === "dark" ? "bg-[#070913] text-app-blue" : "bg-[#F0F2F5] text-indigo-600 font-bold")
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Git Diff
                  </button>
                </div>
                <div className="w-10" />
              </div>

              {/* Mockup Tab Content */}
              <div className="p-6 text-left font-mono text-xs md:text-sm min-h-[240px] transition-all duration-300">
                {activeTab === "terminal" && (
                  <div className="space-y-2.5 text-app-text-secondary-dark">
                    <div className="text-gray-500">{"# Initializing Docker sandbox container..."}</div>
                    <div className="text-app-purple">{"[OK] Container environment ready [node-lts-alpine]"}</div>
                    <div className="text-app-blue">{"[OK] Port forwarding configured on port 3000"}</div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-app-green">{"root@cloudcode:~/workspace$"}</span>
                      <span className={theme === "dark" ? "text-white" : "text-gray-800"}>{"npm run dev"}</span>
                    </div>
                    <div className="pl-4">
                      {"> dev-server@1.0.0 dev"}
                      <br />
                      {"> next dev"}
                    </div>
                    <div className="text-app-green pl-4">
                      {"- ready started server on 0.0.0.0:3000, url: http://localhost:3000"}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-app-green">{"root@cloudcode:~/workspace$"}</span>
                      <span className="w-2 h-4 bg-app-blue animate-pulse inline-block" />
                    </div>
                  </div>
                )}

                {activeTab === "editor" && (
                  <div className="space-y-1 text-gray-500 dark:text-gray-400">
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">1</span><span className="text-app-purple">import</span>{" React, { useState, useEffect } "}<span className="text-app-purple">from</span> <span className="text-app-green">&apos;react&apos;</span>;</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">2</span><span className="text-app-purple">import</span>{" { Terminal, Cloud } "}<span className="text-app-purple">from</span> <span className="text-app-green">&apos;lucide-react-native&apos;</span>;</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">3</span></div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">4</span><span className="text-app-purple">export default function</span> <span className="text-app-blue">CloudSandbox</span>() &#123;</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">5</span>  <span className="text-app-purple">const</span>{" [active, setActive] = "}<span className="text-app-blue">useState</span>(<span className="text-app-purple">true</span>);</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">6</span></div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">7</span>  <span className="text-app-purple">return</span> (</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">8</span>    {"<"}<span className="text-app-blue">View</span>{" className=\"flex-1 bg-slate-950 p-4\">"}</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">9</span>      {"<"}<span className="text-app-blue">Text</span>{">Welcome to CloudCode Sandboxes!</"}<span className="text-app-blue">Text</span>{">"}</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">10</span>    {"</"}<span className="text-app-blue">View</span>{">"}</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">11</span>  );</div>
                    <div><span className="text-gray-400 dark:text-gray-600 select-none mr-4">12</span>&#125;</div>
                  </div>
                )}

                {activeTab === "git" && (
                  <div className="space-y-1">
                    <div className="text-gray-500">{"diff --git a/app/page.tsx b/app/page.tsx"}</div>
                    <div className="text-gray-500">{"index e69de29..d95f3ad 100644"}</div>
                    <div className="text-gray-500">{"--- a/app/page.tsx"}</div>
                    <div className="text-gray-500">{"+++ b/app/page.tsx"}</div>
                    <div className="text-gray-500">{"@@ -5,4 +5,8 @@"}</div>
                    <div className="text-red-500 bg-red-500/10 px-1">{"- const IDE = 'Local';"}</div>
                    <div className="text-green-500 bg-green-500/10 px-1">{"+ const IDE = 'CloudCode Mobile Cloud IDE';"}</div>
                    <div className="text-green-500 bg-green-500/10 px-1">{"+ const active = true;"}</div>
                    <div className="text-green-500 bg-green-500/10 px-1">{"+ const platform = 'Isolated Docker Container';"}</div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Feature 1 */}
          <div className={`${colors.card} border p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-350 hover:scale-[1.01]`}>
            <div className="w-11 h-11 rounded-lg bg-app-blue/10 text-app-blue flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="12" x="2" y="9" rx="2" />
                <path d="M9 22V9M15 22V9M2 13h20" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Isolated Linux Sandboxes</h3>
            <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
              Spin up secure, dedicated cloud containers instantly. Run compilers, install packages, and manage files with full root authority.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`${colors.card} border p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-350 hover:scale-[1.01]`}>
            <div className="w-11 h-11 rounded-lg bg-app-purple/10 text-app-purple flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">AI Pair Programming</h3>
            <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
              Work alongside collaborative LLM agents. Describe the feature you want in plain English or voice commands and watch it build.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`${colors.card} border p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-350 hover:scale-[1.01]`}>
            <div className="w-11 h-11 rounded-lg bg-app-green/10 text-app-green flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 17l6-6-6-6M12 19h8" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Professional Shell & Git</h3>
            <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
              Write commits, manage branches, and open pull requests. Experience a fully responsive multi-shell terminal optimized for mobile.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className={`mt-auto w-full max-w-5xl px-6 py-10 border-t ${colors.border} flex flex-col items-center gap-4 z-10`}>
          <div className={`flex flex-wrap gap-6 justify-center text-xs ${colors.textSecondary}`}>
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-gray-300 dark:text-gray-800">|</span>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
            &copy; {new Date().getFullYear()} CloudCode. All rights reserved. Built for developers.
          </p>
        </footer>
      </div>
  );
}
