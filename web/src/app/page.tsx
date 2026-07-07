"use client";

import React from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { DecryptText } from "@/components/ui/DecryptText";
import { Faqs } from "@/components/landing/Faqs";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { theme, mounted, toggleTheme, colors } = useTheme();

  if (!mounted) {
    return <div className="bg-[#030303] min-h-screen" suppressHydrationWarning />;
  }

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
        <Header theme={theme} colors={colors} />

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
        <Footer theme={theme} colors={colors} toggleTheme={toggleTheme} />

      </div>
    </div>
  );
}
