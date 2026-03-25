"use client";

import { useCallback, useRef, useState } from "react";
import type { Mode } from "@/app/_hooks/useSignal";

interface DebugPanelProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  deviceId: number;
  setDeviceId: (id: number) => void;
  whepRaw: string;
  setWhepRaw: (url: string) => void;
}

export function DebugPanel({ mode, setMode, deviceId, setDeviceId, whepRaw, setWhepRaw }: DebugPanelProps) {
  const [visible, setVisible] = useState(false);
  const [idInput, setIdInput] = useState(String(deviceId));
  const [whepInput, setWhepInput] = useState(whepRaw);
  const lastTapRef = useRef(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setVisible((v) => !v);
    }
    lastTapRef.current = now;
  }, []);

  const appendDigit = (d: string) => {
    setIdInput((prev) => {
      if (prev === "0") return d;
      return prev + d;
    });
  };

  const clearInput = () => setIdInput("0");

  const backspace = () => {
    setIdInput((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
  };

  const applyId = () => {
    const num = parseInt(idInput, 10);
    if (!isNaN(num) && num >= 0) {
      setDeviceId(num);
    }
  };

  return (
    <>
      <div
        onClick={handleDoubleTap}
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          width: 80,
          height: 80,
          zIndex: 9998,
        }}
      />

      {visible && (
        <div style={styles.panel}>
          <div style={styles.row}>
            <span style={styles.label}>Mode: {mode} / ID: {deviceId}</span>
            <button
              onClick={() => setVisible(false)}
              style={styles.close}
            >
              ✕
            </button>
          </div>

          <div style={styles.divider} />

          <div style={styles.label}>Device ID 設定</div>
          <div style={styles.display}>{idInput}</div>

          <div style={styles.numpad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} onClick={() => appendDigit(d)} style={styles.key}>
                {d}
              </button>
            ))}
            <button onClick={clearInput} style={{ ...styles.key, color: "#f88" }}>
              C
            </button>
            <button onClick={() => appendDigit("0")} style={styles.key}>
              0
            </button>
            <button onClick={backspace} style={{ ...styles.key, color: "#ff8" }}>
              ←
            </button>
          </div>

          <button onClick={applyId} style={styles.apply}>
            設定
          </button>

          <div style={styles.divider} />

          <div style={styles.label}>WHEP URL</div>
          <input
            value={whepInput}
            onChange={(e) => setWhepInput(e.target.value)}
            style={styles.input}
            placeholder="https://host/streamKey"
          />
          <button
            onClick={() => setWhepRaw(whepInput)}
            style={styles.apply}
          >
            WHEP 適用
          </button>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 9999,
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    padding: 16,
    borderRadius: 8,
    fontSize: 14,
    width: 220,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  close: {
    background: "none",
    borderWidth: 0,
    color: "#888",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 2px",
  },
  label: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 4,
  },
  divider: {
    borderTop: "1px solid #333",
    margin: "8px 0",
  },
  display: {
    background: "#1a1a1a",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 20,
    fontWeight: 700,
    textAlign: "right" as const,
    marginBottom: 8,
    fontFamily: "monospace",
  },
  numpad: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
  },
  key: {
    background: "#333",
    borderWidth: 0,
    borderRadius: 6,
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    padding: "10px 0",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 12,
    fontFamily: "monospace",
    background: "#1a1a1a",
    color: "#fff",
    borderWidth: 0,
    borderRadius: 4,
    marginBottom: 8,
    boxSizing: "border-box" as const,
  },
  apply: {
    marginTop: 8,
    width: "100%",
    padding: "10px 0",
    background: "#1a5a2a",
    borderWidth: 0,
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
