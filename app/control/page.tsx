"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MODE_LIST, SIGNAL_CHANNEL } from "@/app/_lib/modes";
import { AudioSender } from "@/app/_lib/audioSender";

export default function ControlPage() {
  const [activeMode, setActiveMode] = useState<number | null>(null);
  const [gain, setGain] = useState(0.5);
  const [duration, setDuration] = useState(0.5);
  const chRef = useRef<BroadcastChannel | null>(null);
  const senderRef = useRef<AudioSender | null>(null);

  if (typeof BroadcastChannel !== "undefined" && !chRef.current) {
    chRef.current = new BroadcastChannel(SIGNAL_CHANNEL);
  }

  useEffect(() => {
    return () => senderRef.current?.dispose();
  }, []);

  // Sync gain/duration to sender
  useEffect(() => {
    if (senderRef.current) {
      senderRef.current.gain = gain;
      senderRef.current.duration = duration;
    }
  }, [gain, duration]);

  const send = useCallback(
    async (key: number) => {
      setActiveMode(key);
      // BroadcastChannel (same-origin tabs)
      chRef.current?.postMessage({ mode: key });
      // Audio signal
      if (!senderRef.current) {
        senderRef.current = new AudioSender();
        senderRef.current.gain = gain;
        senderRef.current.duration = duration;
        await senderRef.current.init();
      }
      await senderRef.current.send(key - 1); // mode 1-based → channel 0-based
    },
    [gain, duration]
  );

  const stop = useCallback(() => {
    setActiveMode(null);
    senderRef.current?.stop();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Control</h1>

      <div style={styles.settings}>
        <div style={styles.sliders}>
          <label style={styles.sliderRow}>
            <span style={styles.sliderLabel}>Gain</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={gain}
              onChange={(e) => setGain(Number(e.target.value))}
            />
            <span style={styles.sliderValue}>{gain.toFixed(1)}</span>
          </label>
          <label style={styles.sliderRow}>
            <span style={styles.sliderLabel}>Duration</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <span style={styles.sliderValue}>{duration.toFixed(1)}s</span>
          </label>
        </div>
      </div>

      <div style={styles.grid}>
        {MODE_LIST.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => send(key)}
            style={{
              ...styles.button,
              ...(activeMode === key ? styles.active : {}),
            }}
          >
            <span style={styles.key}>{key}</span>
            <span style={styles.label}>{label}</span>
          </button>
        ))}
        <button
          onClick={stop}
          style={{
            ...styles.button,
            ...(activeMode === null ? styles.stopActive : {}),
          }}
        >
          <span style={{ ...styles.key, background: "#500" }}>■</span>
          <span style={styles.label}>停止</span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#111",
    color: "#fff",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 20,
  },
  settings: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sliders: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingLeft: 4,
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
  },
  sliderLabel: {
    width: 60,
    color: "#999",
  },
  sliderValue: {
    width: 36,
    textAlign: "right" as const,
    color: "#ccc",
    fontSize: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    background: "#222",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#444",
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.15s, border-color 0.15s",
  },
  active: {
    background: "#1a3a5c",
    borderColor: "#4a9eff",
  },
  stopActive: {
    background: "#3a1a1a",
    borderColor: "#ff4a4a",
  },
  key: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 6,
    background: "#333",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  label: {
    fontSize: 14,
  },
};
