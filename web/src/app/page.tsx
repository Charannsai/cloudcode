"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { DecryptText } from "@/components/ui/DecryptText";
import { Faqs } from "@/components/landing/Faqs";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [showAppDropdown, setShowAppDropdown] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    let initialTheme: "light" | "dark" = "dark";
    if (savedTheme) {
      initialTheme = savedTheme;
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      initialTheme = systemPrefersDark ? "dark" : "light";
    }
    setTheme(initialTheme);
    
    // Sync class list immediately
    const root = window.document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const toggleTheme = (event?: React.MouseEvent) => {
    const newTheme = theme === "dark" ? "light" : "dark";
    
    // Check if browser supports View Transition API
    if (
      typeof window === "undefined" ||
      !event ||
      !(document as any).startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      const root = window.document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = window.document.documentElement;
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);

    const transition = (document as any).startViewTransition(() => {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          "--reveal-radius": ["0px", `${endRadius}px`]
        },
        {
          duration: 500,
          easing: "ease-in-out"
        }
      );
    });
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
        @keyframes marquee-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-right {
          animation: marquee-right 30s linear infinite;
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
                className={theme === "dark" ? "h-[21px] my-[1.5px] w-auto object-contain" : "h-6 w-auto object-contain"}
              />
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

        {/* ==================== INTERACTIVE SHOWCASE (Includes Hero & Trusted By) ==================== */}
        <InteractiveShowcase theme={theme} colors={colors} />

        {/* ==================== EVERYTHING YOU NEED SECTION ==================== */}
        <section id="features" className="w-full max-w-5xl px-6 py-24 z-10">
          {/* Header */}
          <ScrollReveal>
            <div className="mb-16 text-left">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Platform"}</span>
              <h2 className={`text-3xl font-semibold tracking-tighter mt-2 ${colors.text}`}>{"everything you need"}</h2>
            </div>
          </ScrollReveal>

          {/* Seamless Content Flow Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT COLUMN: Cloud Sandbox (spans 8 cols) */}
            <div className="lg:col-span-8">
              <ScrollReveal delay={100}>
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-[#0A0A0A]">
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#05070B] via-transparent to-transparent z-10 pointer-events-none"></div>
                    <img 
                      alt="System Core Architecture" 
                      className="w-full grayscale opacity-85 filter contrast-125 brightness-95 dark:brightness-75 object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCynieWEkovurckRwBDGbYKl7T8sD-DC2mgvxMe09pqe8FcomXYoQD6fI2o9BERaM5iYAF5LPxyGiFdZNHLdEse5HmQQ66NdylKUHuitv4l2NDKdbtsVIUNA5u-8oUpxaM6jUxX3UcxtAZe0GAwFzRBmJXmeKHxoWL850yZq5_NyK-7A2CClMmiPPNzZJP4jdMYb1KQBAubq-7bMV7RuQmmYyWRG6pqSQz1LQ68_BpGveEWd-F5ey0H2666xKaFduBmzT45CRpe5w"
                    />
                  </div>
                  
                  <div className="max-w-2xl space-y-2">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                      {"01 / Infrastructure"}
                    </span>
                    <h3 className={`text-xl md:text-2xl font-semibold tracking-tighter ${colors.text}`}>
                      {"create workspaces or clone your repos"}
                    </h3>
                    <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                      {"Spin up containerized workspaces in under 5 seconds. Connect directly to your GitHub, clone any branch, and start coding instantly with full environment parity."}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* RIGHT COLUMN: Vertical Feature Flow (spans 4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Feature 02: Terminal */}
              <ScrollReveal delay={150}>
                <div className={`group border-t ${colors.border} pt-6 space-y-1.5`}>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">{"02"}</span>
                  <h4 className={`text-base md:text-lg font-semibold tracking-tighter ${colors.text}`}>
                    {"Terminal"}
                  </h4>
                  <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                    {"Raw Linux container shell with full toolchain support and native package managers."}
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 03: AI Agent */}
              <ScrollReveal delay={250}>
                <div className={`group border-t ${colors.border} pt-6 space-y-1.5`}>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">{"03"}</span>
                  <h4 className={`text-base md:text-lg font-semibold tracking-tighter ${colors.text}`}>
                    {"AI Agent"}
                  </h4>
                  <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                    {"Autonomous companions that execute builds, resolve conflicts, and optimize deployments."}
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 04: Web Preview */}
              <ScrollReveal delay={350}>
                <div className={`group border-t ${colors.border} pt-6 space-y-1.5`}>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">{"04"}</span>
                  <h4 className={`text-base md:text-lg font-semibold tracking-tighter ${colors.text}`}>
                    {"Web Preview"}
                  </h4>
                  <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                    {"Instant hot-reloading in a secure sandbox with integrated developer diagnostics."}
                  </p>
                </div>
              </ScrollReveal>

              {/* Feature 05: Git Workflows */}
              <ScrollReveal delay={450}>
                <div className={`group border-t ${colors.border} pt-6 space-y-1.5`}>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">{"05"}</span>
                  <h4 className={`text-base md:text-lg font-semibold tracking-tighter ${colors.text}`}>
                    {"Git Workflows"}
                  </h4>
                  <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                    {"Seamless version control with visual diffing and automated pull request management."}
                  </p>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* ==================== 8. PERFORMANCE ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-center">
          <ScrollReveal>
            <div className="mb-16">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Infrastructure"}</span>
              <h2 className="text-3xl font-semibold tracking-tighter mt-2">{"CloudCode boots in seconds."}</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <ScrollReveal delay={100}>
              <div>
                <div className={`text-3xl font-bold tracking-tighter ${colors.text}`}>
                  <AnimatedNumber value={5} prefix="< " suffix="s" />
                </div>
                <div className="text-xs font-semibold mt-1">{"Workspace Startup"}</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div>
                <div className={`text-3xl font-bold tracking-tighter ${colors.text}`}>
                  <AnimatedNumber value={50} suffix="ms" />
                </div>
                <div className="text-xs font-semibold mt-1">{"Terminal Latency"}</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div>
                <div className={`text-3xl font-bold tracking-tighter ${colors.text}`}>
                  <AnimatedNumber value={99.9} suffix="%" decimals={1} />
                </div>
                <div className="text-xs font-semibold mt-1">{"System Uptime"}</div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <div>
                <div className={`text-3xl font-bold tracking-tighter ${colors.text}`}>
                  <DecryptText text="AES-256" />
                </div>
                <div className="text-xs font-semibold mt-1">{"Workspace Encryption"}</div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== 9. COMFORT / MANAGEMENT ==================== */}
        <section className="w-full max-w-5xl px-6 py-24 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Side: Title & Call-To-Action */}
            <div className="lg:col-span-5 space-y-6">
              <ScrollReveal>
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Workflow"}</span>
                  <h2 className={`text-3xl font-semibold tracking-tighter leading-tight ${colors.text}`}>
                    {"Manage with comfort"}
                  </h2>
                  <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                    {"Enjoy a native, streamlined mobile developer experience without sacrificing terminal root power, git version control, or containerized execution speed."}
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="pt-4 space-y-3">
                  <a 
                    href="#" 
                    className={`inline-flex items-center gap-2 ${colors.btnPrimary} px-5 py-2.5 rounded-lg font-bold text-xs transition-all`}
                  >
                    <span>{"Get the app from Playstore"}</span>
                  </a>
                  <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {"* iOS App Store version will be available soon."}
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Side: Numbered Features */}
            <div className="lg:col-span-7 space-y-6">
              {[
                {
                  num: "01",
                  title: "Mobile Pull Requests",
                  desc: "Raise and review PRs smoothly from the mobile itself."
                },
                {
                  num: "02",
                  title: "Native IDE Sync",
                  desc: "Sync local changes to your Native-IDE if you don't want to push them."
                },
                {
                  num: "03",
                  title: "BYOK Integration",
                  desc: "BYOK for your own AI agentic setup and many more."
                }
              ].map((item, idx) => (
                <ScrollReveal key={idx} delay={150 + idx * 100}>
                  <div className={`group border-t ${colors.border} pt-6 flex gap-6 items-start`}>
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                      {item.num}
                    </span>
                    <div className="space-y-1">
                      <h4 className={`text-base font-semibold tracking-tighter ${colors.text}`}>
                        {item.title}
                      </h4>
                      <p className={`text-xs md:text-sm ${colors.textSecondary} leading-relaxed`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

          </div>
        </section>

        {/* ==================== 10. PRICING ==================== */}
        <section className="w-full max-w-5xl px-6 py-28 z-10 text-center">
          <ScrollReveal>
            <div className="mb-16">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">{"Pricing"}</span>
              <h2 className="text-3xl font-semibold tracking-tighter mt-2">{"Simple, transparent pricing."}</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* Free Plan */}
            <ScrollReveal delay={100}>
              <div className={`p-8 rounded-2xl border ${colors.border} ${colors.card} flex flex-col justify-between h-full hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md`}>
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-semibold tracking-tight ${colors.text}`}>{"Free"}</h3>
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>{"For students and hobbyists getting started."}</p>
                    <div className="mt-4 flex items-baseline">
                      <span className={`text-4xl font-bold tracking-tight ${colors.text}`}>{"$0"}</span>
                      <span className={`text-xs ${colors.textSecondary} ml-1`}>{"/ month"}</span>
                    </div>
                  </div>

                  <hr className={`border-t ${colors.border}`} />

                  <ul className="space-y-3.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"0.5 Core CPU"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"512 MB RAM"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"5 GB SSD Storage"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"3 Workspaces Max"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"50K Monthly AI Tokens"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"15 Mbps Network Cap"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"25 API req/min"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"10 min Auto-Stop Timeout"}</span>
                    </li>
                  </ul>
                </div>
                <button className={`w-full mt-8 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 ${colors.text} border ${colors.border} font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer`}>
                  {"Get Started"}
                </button>
              </div>
            </ScrollReveal>

            {/* Pro Developer */}
            <ScrollReveal delay={200}>
              <div className={`p-8 rounded-2xl border-2 ${theme === "dark" ? "border-zinc-50 bg-[#07080b] hover:border-zinc-200" : "border-zinc-950 bg-white hover:border-zinc-800"} flex flex-col justify-between h-full relative transition-all duration-300 shadow-md hover:shadow-lg`}>
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold ${theme === "dark" ? "text-zinc-950 bg-zinc-100 border-zinc-705" : "text-zinc-50 bg-zinc-900 border-zinc-205"} border px-2.5 py-1 rounded-full uppercase tracking-wider`}>{"Most Popular"}</span>
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-semibold tracking-tight ${colors.text}`}>{"Pro Developer"}</h3>
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>{"For creators and professional developers."}</p>
                    <div className="mt-4 flex items-baseline">
                      <span className={`text-4xl font-bold tracking-tight ${colors.text}`}>{"$25"}</span>
                      <span className={`text-xs ${colors.textSecondary} ml-1`}>{"/ month"}</span>
                    </div>
                  </div>

                  <hr className={`border-t ${colors.border}`} />

                  <ul className="space-y-3.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"4 Cores CPU"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"8 GB RAM"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"50 GB SSD Storage"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"20 Workspaces Max"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"5M Monthly AI Tokens"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"Uncapped Network Speed"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"500 API req/min"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{"60 min Auto-Stop Timeout"}</span>
                    </li>
                  </ul>
                </div>
                <button className={`w-full mt-8 ${colors.btnPrimary} font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer`}>
                  {"Upgrade to Pro"}
                </button>
              </div>
            </ScrollReveal>

            {/* Advanced Team */}
            <ScrollReveal delay={300}>
              <div className={`p-8 rounded-2xl border ${colors.border} ${colors.card} flex flex-col justify-between h-full hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm hover:shadow-md`}>
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-semibold tracking-tight ${colors.text}`}>{"Advanced Team"}</h3>
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>{"For growing startups and scaling teams."}</p>
                    <div className="mt-4 flex items-baseline">
                      <span className={`text-4xl font-bold tracking-tight ${colors.text}`}>{"$99"}</span>
                      <span className={`text-xs ${colors.textSecondary} ml-1`}>{"/ month"}</span>
                    </div>
                  </div>

                  <hr className={`border-t ${colors.border}`} />

                  <ul className="space-y-3.5 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"8 Cores CPU"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"32 GB RAM"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"200 GB SSD Storage"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"Unlimited Workspaces"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"Unlimited Monthly AI Tokens"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"Uncapped Network Speed"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"Uncapped API Requests"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{"Always-On Active Session"}</span>
                    </li>
                  </ul>
                </div>
                <button className={`w-full mt-8 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 ${colors.text} border ${colors.border} font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer`}>
                  {"Upgrade to Advanced"}
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== 11. FAQ ==================== */}
        <Faqs colors={colors} />

        {/* ==================== FOOTER ==================== */}
        <footer className={`w-full pt-10 pb-6 border-t ${colors.border} z-10 overflow-hidden`}>
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-left mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img 
                src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
                alt="CloudCode" 
                className="h-[20px] w-auto object-contain"
              />
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
              src={theme === "dark" ? "/cloudcodelogolight.png" : "/cloudcodelogo.png"} 
              alt="CloudCode" 
              className="w-full max-w-5xl h-auto object-contain opacity-15 hover:opacity-30 transition-all duration-500"
              style={{
                filter: theme === "dark" 
                  ? "drop-shadow(1.5px 0px 0px rgba(255, 255, 255, 0.15)) drop-shadow(-1.5px 0px 0px rgba(255, 255, 255, 0.15)) drop-shadow(0px 1.5px 0px rgba(255, 255, 255, 0.15)) drop-shadow(0px -1.5px 0px rgba(255, 255, 255, 0.15))" 
                  : "drop-shadow(1.5px 0px 0px rgba(0, 0, 0, 0.08)) drop-shadow(-1.5px 0px 0px rgba(0, 0, 0, 0.08)) drop-shadow(0px 1.5px 0px rgba(0, 0, 0, 0.08)) drop-shadow(0px -1.5px 0px rgba(0, 0, 0, 0.08))",
              }}
            />
          </div>
        </footer>

      </div>
    </div>
  );
}
