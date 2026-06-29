"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

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
    return <div className="bg-app-bg-dark min-h-screen" />;
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="bg-app-bg-light dark:bg-app-bg-dark text-app-text-light dark:text-app-text-dark min-h-screen flex flex-col items-center relative overflow-x-hidden font-sans transition-colors duration-300">
        
        {/* Background Ambient Glows (Only in dark mode for premium depth) */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0 hidden dark:block" />
        <div className="absolute top-[35%] right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,139,253,0.06)_0%,rgba(0,0,0,0)_70%)] pointer-events-none z-0 hidden dark:block" />

        {/* Header */}
        <header className="w-full max-w-5xl px-6 py-6 flex justify-between items-center z-10 border-b border-app-border-light/50 dark:border-app-border-dark/50">
          <div className="flex items-center gap-2.5">
            {/* Logo Icon mimicking Mobile Branding */}
            <div className="w-6 h-6 rounded bg-indigo-600 dark:bg-app-text-dark flex items-center justify-center">
              <span className="text-xs font-black text-white dark:text-[#0E1116] font-mono">C</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-app-text-light to-gray-500 dark:from-app-text-dark dark:to-app-text-secondary-dark bg-clip-text text-transparent">
              CloudCode
            </span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-app-blue bg-app-blue/10 px-2 py-0.5 rounded-full border border-app-blue/20">
              Beta
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-app-text-secondary-light dark:text-app-text-secondary-dark hover:text-app-text-light dark:hover:text-app-text-dark transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-app-text-secondary-light dark:text-app-text-secondary-dark hover:text-app-text-light dark:hover:text-app-text-dark transition-colors">
              Terms
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-app-border-light dark:border-app-border-dark hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark transition-all cursor-pointer text-app-text-secondary-light dark:text-app-text-secondary-dark"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                // Sun Icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                // Moon Icon
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="w-full max-w-5xl px-6 pt-24 pb-32 flex flex-col items-center text-center z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none max-w-4xl mb-6 bg-gradient-to-br from-app-text-light via-app-text-light to-app-text-secondary-light dark:from-app-text-dark dark:via-app-text-dark dark:to-app-text-secondary-dark bg-clip-text text-transparent">
            The Mobile Cloud IDE
          </h1>
          <p className="text-base md:text-lg text-app-text-secondary-light dark:text-app-text-secondary-dark max-w-2xl mb-10 leading-relaxed">
            Provision isolated Linux sandboxes, write code with AI assistance, run root terminals, and preview deployments instantly from your mobile device.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-20">
            <a href="#" className="bg-indigo-600 hover:bg-indigo-500 dark:bg-app-text-dark text-white dark:text-[#0E1116] hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(243,244,246,0.15)] px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2.5 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Download on Google Play
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-transparent hover:bg-app-highlight-light dark:hover:bg-app-highlight-dark text-app-text-light dark:text-app-text-dark border border-app-border-light dark:border-app-border-dark px-6 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2.5 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Premium IDE Terminal Mockup */}
          <div className="w-full max-w-3xl rounded-xl border border-app-border-light dark:border-app-border-dark bg-app-card-light dark:bg-app-card-dark p-2.5 shadow-xl dark:shadow-2xl mb-24 transition-all duration-300">
            <div className="rounded-lg border border-app-border-light dark:border-app-border-dark bg-gray-100 dark:bg-app-bg-dark overflow-hidden transition-colors duration-300">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-app-card-light dark:bg-[#151922] border-b border-app-border-light dark:border-app-border-dark transition-colors duration-300">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-app-red" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-app-green" />
                </div>
                <span className="text-xs text-app-text-secondary-light dark:text-app-text-secondary-dark font-mono">sandbox-node-1 (CloudCode Terminal)</span>
                <div className="w-12" />
              </div>
              {/* Terminal Body */}
              <div className="p-5 text-left font-mono text-xs md:text-sm space-y-2.5 min-h-[220px] text-app-text-secondary-light dark:text-app-text-secondary-dark">
                <div># Setting up container environment...</div>
                <div className="text-app-purple">✓ Container initialized successfully</div>
                <div className="text-app-blue">✓ Node.js compiler v20.10.0 ready</div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-app-green">root@cloudcode:~$</span>
                  <span className="text-app-text-light dark:text-app-text-dark">npm run dev</span>
                </div>
                <div className="pl-4">
                  &gt; cloudcode-app@1.0.0 dev
                  <br />
                  &gt; next dev -p 3000
                </div>
                <div className="text-app-green pl-4">
                  ready - started server on 0.0.0.0:3000, url: http://localhost:3000
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-app-green">root@cloudcode:~$</span>
                  <span className="w-2 h-4 bg-app-blue animate-pulse inline-block" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            {/* Feature 1 */}
            <div className="bg-app-card-light dark:bg-app-card-dark border border-app-border-light dark:border-app-border-dark hover:border-app-blue/50 p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-300">
              <div className="w-11 h-11 rounded-lg bg-app-blue/10 text-app-blue flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="12" x="2" y="9" rx="2" />
                  <path d="M9 22V9M15 22V9M2 13h20" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Isolated Linux Sandboxes</h3>
              <p className="text-sm text-app-text-secondary-light dark:text-app-text-secondary-dark leading-relaxed">
                Spin up secure, dedicated cloud containers instantly. Run compilers, install packages, and manage files with full root authority.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-app-card-light dark:bg-app-card-dark border border-app-border-light dark:border-app-border-dark hover:border-app-purple/50 p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-300">
              <div className="w-11 h-11 rounded-lg bg-app-purple/10 text-app-purple flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">AI Pair Programming</h3>
              <p className="text-sm text-app-text-secondary-light dark:text-app-text-secondary-dark leading-relaxed">
                Work alongside collaborative LLM agents. Describe the feature you want in plain English or voice commands and watch it build.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-app-card-light dark:bg-app-card-dark border border-app-border-light dark:border-app-border-dark hover:border-app-green/50 p-8 rounded-2xl shadow-sm dark:shadow-none transition-all duration-300">
              <div className="w-11 h-11 rounded-lg bg-app-green/10 text-app-green flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17l6-6-6-6M12 19h8" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Professional Shell & Git</h3>
              <p className="text-sm text-app-text-secondary-light dark:text-app-text-secondary-dark leading-relaxed">
                Write commits, manage branches, and open pull requests. Experience a fully responsive multi-shell terminal optimized for mobile.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto w-full max-w-5xl px-6 py-10 border-t border-app-border-light dark:border-app-border-dark/60 flex flex-col items-center gap-4 z-10">
          <div className="flex flex-wrap gap-6 justify-center text-xs text-app-text-secondary-light dark:text-app-text-secondary-dark">
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-gray-300 dark:text-gray-800">•</span>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
            &copy; {new Date().getFullYear()} CloudCode. All rights reserved. Built for developers.
          </p>
        </footer>
      </div>
    </div>
  );
}
