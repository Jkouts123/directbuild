"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface RevealTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  splitBy?: "word" | "line";
}

export default function RevealText({
  children,
  as: Tag = "h1",
  className = "",
  delay = 0,
  stagger = 0.04,
  splitBy = "word",
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
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
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = children.split(/\s+/);

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement>}
      className={`${className} reveal-text-container`}
      style={{ perspective: "600px" } as CSSProperties}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="reveal-word"
          style={
            {
              "--reveal-delay": `${delay + i * stagger}s`,
              animationPlayState: isVisible ? "running" : "paused",
            } as CSSProperties
          }
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Tag>
  );
}
