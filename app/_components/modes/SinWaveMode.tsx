"use client";

import { useEffect, useRef } from "react";

const SPEED = 1.0; // Hz
const TOTAL_DEVICES = 20;

interface SinWaveModeProps {
  deviceId: number;
}

export function SinWaveMode({ deviceId }: SinWaveModeProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    const delay = (deviceId / TOTAL_DEVICES) * 2 * Math.PI;

    const animate = () => {
      const t =
        (Math.sin(performance.now() / 1000 * SPEED * 2 * Math.PI + delay) + 1) / 2;
      const r = 255;
      const g = Math.round(255 * t);
      const b = Math.round(255 * t);
      div.style.background = `rgb(${r},${g},${b})`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [deviceId]);

  return (
    <div
      ref={divRef}
      style={{ position: "absolute", inset: 0, background: "#ff0000" }}
    />
  );
}
