"use client";

import React, { useState, useEffect, useRef } from "react";
import { PhoneMockup } from "./PhoneMockup/PhoneMockup";
import { PhoneScreen } from "./PhoneMockup/MockupScreens";
import { CLOUD_PATH, get3DTransform, WORKFLOW_TOOLS } from "./PhoneMockup/constants";

interface InteractiveShowcaseProps {
  theme: "light" | "dark";
  colors: {
    textSecondary: string;
    btnPrimary: string;
    btnSecondary: string;
  };
}

export function InteractiveShowcase({ theme, colors }: InteractiveShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
      else if (progress >= 0.15 && progress < 0.38) step = "welcome_phase";
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

  // Calculate Opacities and Scales for the transition and splash
  const mockupOpacity = scrollProgress < 0.08
    ? (scrollProgress / 0.08)
    : scrollProgress < 0.33 
      ? 1 
      : scrollProgress > 0.35 
        ? 0 
        : 1 - (scrollProgress - 0.33) / 0.02;

  const logoOpacity = scrollProgress < 0.33 
    ? 0 
    : scrollProgress > 0.35 
      ? 1 
      : (scrollProgress - 0.33) / 0.02;

  const flashOpacity = scrollProgress >= 0.33 && scrollProgress <= 0.37
    ? Math.max(0, 1 - Math.abs(scrollProgress - 0.35) / 0.02)
    : 0;

  // 1. Tracing progress (0.0 to 1.0 between 0.40 and 0.70)
  const drawT = Math.max(0, Math.min(1, (scrollProgress - 0.40) / 0.30));

  // 2. Splash progress (0.0 to 1.0 between 0.70 and 0.78)
  const splashT = Math.max(0, Math.min(1, (scrollProgress - 0.70) / 0.08));

  // Stroke fades out, fill fades in during the splash
  const strokeOpacity = 1 - splashT;
  const fillOpacity = splashT;

  // Elastic scale pop for the logo during the splash
  const logoScale = 1 + Math.sin(splashT * Math.PI) * 0.12;

  // Background glow flashes brighter during the splash and then settles
  const glowOpacity = Math.max(0, Math.min(0.4, 0.15 + Math.sin(splashT * Math.PI) * 0.25));
  const glowScale = 1 + splashT * 0.4;

  // Text reveals after the splash begins
  const textOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.15));

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-[500vh] transition-colors duration-300 ${
        isDark ? "bg-[#030303]" : "bg-[#FAFAFA]"
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
            <a 
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`${colors.btnSecondary} border px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer`}
            >
              {"Know more"}
            </a>
          </div>

          <div className="flex flex-col items-center mt-8 w-full max-w-lg mx-auto z-10">
            <p className={`text-[10px] font-mono tracking-widest ${colors.textSecondary} uppercase mb-4`}>
              {"Works With Your Workflow"}
            </p>
            
            {/* Scrolling Infinite Carousel */}
            <div className="relative w-full overflow-hidden py-2">
              {/* Left and Right Faded Corners */}
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#FAFAFA] dark:from-[#030303] to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#FAFAFA] dark:from-[#030303] to-transparent z-20 pointer-events-none" />
              
              {/* Scrolling Track */}
              <div className="flex gap-8 items-center w-max animate-marquee-right">
                {/* List 1 */}
                <div className="flex gap-8 shrink-0">
                  {WORKFLOW_TOOLS.map((tool, idx) => (
                    <div key={`t1-${idx}`} className="flex items-center gap-1.5 opacity-50 dark:opacity-40 hover:opacity-100 hover:text-indigo-400 dark:hover:text-white transition-all duration-200 cursor-default" title={tool.name}>
                      {tool.icon}
                      <span className="text-[10px] font-bold font-mono tracking-tight">{tool.name}</span>
                    </div>
                  ))}
                </div>
                {/* List 2 */}
                <div className="flex gap-8 shrink-0">
                  {WORKFLOW_TOOLS.map((tool, idx) => (
                    <div key={`t2-${idx}`} className="flex items-center gap-1.5 opacity-50 dark:opacity-40 hover:opacity-100 hover:text-indigo-400 dark:hover:text-white transition-all duration-200 cursor-default" title={tool.name}>
                      {tool.icon}
                      <span className="text-[10px] font-bold font-mono tracking-tight">{tool.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <p className={`text-[10px] font-medium tracking-tight ${colors.textSecondary} text-center mt-5 opacity-90 max-w-xs`}>
              {"Connect your existing workflow without changing how you build."}
            </p>
          </div>
        </div>

        <div 
          className={`absolute inset-0 z-5 pointer-events-none transition-opacity duration-300 ${
            isDark ? "bg-[#030303]" : "bg-[#FAFAFA]"
          }`}
          style={{
            opacity: Math.min(1, scrollProgress / 0.15)
          }}
        />

        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-8 overflow-hidden px-6"
          style={{
            opacity: (scrollProgress >= 0.15 && scrollProgress < 0.35)
              ? Math.sin(((scrollProgress - 0.15) / 0.20) * Math.PI) * 0.45
              : 0
          }}
        >
          <span className={`text-[7vw] font-black tracking-[0.18em] text-center uppercase leading-none bg-clip-text text-transparent bg-gradient-to-b ${
            isDark 
              ? "from-white/40 to-white/5" 
              : "from-black/30 to-black/5"
          }`}>
            WELCOME TO<br />CLOUDCODE
          </span>
        </div>

        {/* B. Glowing Aura behind phone (Dynamic Color Shifting) */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-in-out z-1"
          style={{ 
            opacity: mockupOpacity,
            background: isDark 
              ? "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)"
              : "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0) 70%)",
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
                className="absolute w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none transition-all duration-105 ease-out -z-1"
                style={{ 
                  opacity: glowOpacity,
                  transform: `scale(${glowScale})`,
                  background: isDark 
                    ? "radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(16, 185, 129, 0.25) 50%, rgba(0,0,0,0) 100%)"
                    : "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(0,0,0,0) 100%)"
                }}
              />

              <svg 
                width={isMobile ? "140" : "200"} 
                height={isMobile ? "90" : "135"} 
                viewBox="0 0 874 552" 
                className="transition-all duration-300"
                style={{
                  transform: `scale(${logoScale})`,
                }}
              >
                <path
                  d={CLOUD_PATH}
                  fill={isDark ? `rgba(255, 255, 255, ${fillOpacity * 0.9})` : `rgba(15, 17, 21, ${fillOpacity * 0.9})`}
                  stroke={isDark ? `rgba(255, 255, 255, ${strokeOpacity})` : `rgba(15, 17, 21, ${strokeOpacity})`}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2500"
                  strokeDashoffset={(1 - drawT) * 2500}
                  className="transition-all duration-75 ease-out"
                />
              </svg>

              <div 
                className="flex flex-col items-center gap-3 text-center transition-all duration-350"
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

        {/* Cinematic Flash Transition Overlay */}
        {flashOpacity > 0.01 && (
          <div 
            className="absolute inset-0 bg-white dark:bg-zinc-100 pointer-events-none z-50 transition-opacity duration-75"
            style={{ 
              opacity: flashOpacity * 0.95
            }}
          />
        )}
      </div>
    </div>
  );
}
