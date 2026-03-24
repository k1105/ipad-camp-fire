"use client";

import { useEffect, useRef } from "react";
import type { VideoHandle } from "../CameraSource";
import { drawCoveredVideo } from "@/app/_lib/webgl";

interface FlashModeProps {
  sourceRef: React.RefObject<VideoHandle | null>;
}

export function FlashMode({ sourceRef }: FlashModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Draw video frames to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const video = sourceRef.current?.getVideo();
      if (video && video.readyState >= 2) {
        drawCoveredVideo(ctx, video, canvas.width, canvas.height);
      }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [sourceRef]);

  // Flash overlay logic with ease-in/out
  useEffect(() => {
    const flash = flashRef.current;
    if (!flash) return;

    let active = true;
    let flashRaf = 0;

    // ease-in-out using smoothstep
    const easeInOut = (t: number) => t * t * (3 - 2 * t);

    const FADE_IN = 80;   // ms for ease-in
    const FADE_OUT = 120;  // ms for ease-out

    const scheduleFlash = () => {
      if (!active) return;
      const interval = 500 + Math.random() * 2500; // 0.5-3s wait

      timerRef.current = setTimeout(() => {
        if (!active) return;

        const holdDuration = 50 + Math.random() * 250; // 50-300ms hold at peak
        const start = performance.now();
        const totalDuration = FADE_IN + holdDuration + FADE_OUT;

        const animate = (now: number) => {
          if (!active) return;
          const elapsed = now - start;

          let opacity: number;
          if (elapsed < FADE_IN) {
            opacity = easeInOut(elapsed / FADE_IN);
          } else if (elapsed < FADE_IN + holdDuration) {
            opacity = 1;
          } else if (elapsed < totalDuration) {
            opacity = 1 - easeInOut((elapsed - FADE_IN - holdDuration) / FADE_OUT);
          } else {
            flash.style.opacity = "0";
            scheduleFlash();
            return;
          }

          flash.style.opacity = String(opacity);
          flashRaf = requestAnimationFrame(animate);
        };

        flashRaf = requestAnimationFrame(animate);
      }, interval);
    };

    scheduleFlash();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(flashRaf);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div
        ref={flashRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
