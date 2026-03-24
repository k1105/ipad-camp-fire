"use client";

import { useEffect, useRef, useState } from "react";

export function useCamera(): {
  stream: MediaStream | null;
  error: string | null;
  start: () => Promise<void>;
} {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    if (streamRef.current) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { stream, error, start };
}
