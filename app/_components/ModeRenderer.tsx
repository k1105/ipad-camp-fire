"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CROSSFADE_DURATION } from "@/app/_lib/transition";

interface ModeRendererProps {
  mode: number;
  renderMode: (mode: number) => ReactNode;
}

export function ModeRenderer({ mode, renderMode }: ModeRendererProps) {
  const [current, setCurrent] = useState(mode);
  const [previous, setPrevious] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(1);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (mode === current) return;

    setPrevious(current);
    setCurrent(mode);
    setOpacity(0);
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / CROSSFADE_DURATION, 1);
      setOpacity(progress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPrevious(null);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {previous !== null && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - opacity,
            pointerEvents: "none",
          }}
        >
          {renderMode(previous)}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: previous !== null ? opacity : 1,
        }}
      >
        {renderMode(current)}
      </div>
    </>
  );
}
