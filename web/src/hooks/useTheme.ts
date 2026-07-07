"use client";

import React, { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

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

  return {
    theme,
    mounted,
    toggleTheme,
    colors,
  };
}
