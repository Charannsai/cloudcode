"use client";

import React, { useState, useEffect, useRef } from "react";

export function DecryptText({ text, duration = 800 }: { text: string; duration?: number }) {
  const [display, setDisplay] = useState("");
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_#@$";
    let iterations = 0;
    const totalSteps = text.length * 3;
    
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (index < iterations / 3) {
              return text[index];
            }
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iterations++;
      if (iterations >= totalSteps) {
        setDisplay(text);
        clearInterval(interval);
      }
    }, duration / totalSteps);

    return () => clearInterval(interval);
  }, [hasStarted, text, duration]);

  return <span ref={ref}>{display || text}</span>;
}
