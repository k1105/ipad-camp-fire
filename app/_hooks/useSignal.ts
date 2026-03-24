"use client";

import { useEffect, useState, useCallback } from "react";
import { MODE_LIST, SIGNAL_CHANNEL } from "@/app/_lib/modes";
import { useAudioReceiver } from "./useAudioReceiver";

export type Mode = number;

const VALID_MODES = new Set(MODE_LIST.map((m) => m.key));

// チャンネル番号(0-based) → モードキー(1-based) のマッピング
function channelToMode(channel: number): Mode | null {
  const mode = channel + 1;
  return VALID_MODES.has(mode) ? mode : null;
}

export function useSignal(initialMode: Mode = 7): {
  mode: Mode;
  setMode: (m: Mode) => void;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
} {
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const setMode = useCallback((m: Mode) => {
    if (VALID_MODES.has(m)) setModeState(m);
  }, []);

  // Keyboard trigger
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (VALID_MODES.has(num)) {
        setModeState(num);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // BroadcastChannel trigger (from /control page)
  useEffect(() => {
    const ch = new BroadcastChannel(SIGNAL_CHANNEL);
    ch.onmessage = (e: MessageEvent) => {
      const num = e.data?.mode;
      if (typeof num === "number" && VALID_MODES.has(num)) {
        setModeState(num);
      }
    };
    return () => ch.close();
  }, []);

  // Ultrasonic audio signal trigger
  useAudioReceiver({
    enabled: audioEnabled,
    onDetected: useCallback((channel: number) => {
      const m = channelToMode(channel);
      if (m !== null) setModeState(m);
    }, []),
  });

  return { mode, setMode, audioEnabled, setAudioEnabled };
}
