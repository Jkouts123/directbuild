"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: string;
}

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = "40px",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translateMap = {
    up: `translateY(${distance})`,
    down: `translateY(-${distance})`,
    left: `translateX(${distance})`,
    right: `translateX(-${distance})`,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={
        {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "translateY(0) translateX(0) translateZ(0)"
            : translateMap[direction],
          transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
          willChange: "opacity, transform",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
