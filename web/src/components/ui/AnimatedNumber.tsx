"use client";

import React, { useState, useEffect, useRef } from "react";

export function AnimatedNumber({ 
  value, 
  suffix = "", 
  prefix = "", 
  decimals = 0, 
  duration = 1000 
}: { 
  value: number; 
  suffix?: string; 
  prefix?: string; 
  decimals?: number; 
  duration?: number 
}) {
  const [count, setCount] = useState(0);
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

    let start = 0;
    const end = value;
    const totalFrames = Math.round(duration / 16);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentVal = start + (end - start) * (progress * (2 - progress));
      
      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(currentVal);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [hasStarted, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}
