"use client";

import { useState, useCallback } from "react";

interface StartScreenProps {
  onReady: (micStream: MediaStream) => void;
}

export function StartScreen({ onReady }: StartScreenProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleStart = useCallback(async () => {
    setStatus("requesting");
    try {
      // カメラ+マイクを一括で要求（iPadでは1回のダイアログで済む）
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // カメラトラックは停止（useCamera側で改めて取得する）
      // マイクストリームだけ親に渡す
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((t) => t.stop());

      const micStream = new MediaStream(audioTracks);
      onReady(micStream);
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        e instanceof Error ? e.message : "カメラ・マイクへのアクセスが拒否されました"
      );
    }
  }, [onReady]);

  return (
    <div style={styles.container} onClick={status === "idle" ? handleStart : undefined}>
      {status === "idle" && (
        <div style={styles.subtitle}>tap to start</div>
      )}
      {status === "requesting" && (
        <div style={styles.subtitle}>許可を待っています...</div>
      )}
      {status === "error" && (
        <>
          <div style={styles.errorText}>{errorMsg}</div>
          <button onClick={handleStart} style={styles.retryButton}>
            再試行
          </button>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    inset: 0,
    background: "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    cursor: "pointer",
    userSelect: "none",
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 4,
    marginBottom: 24,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    color: "#666",
    fontSize: 13,
  },
  errorText: {
    color: "#f66",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center" as const,
    padding: "0 32px",
  },
  retryButton: {
    background: "#333",
    borderWidth: 0,
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
    padding: "12px 32px",
    cursor: "pointer",
  },
};
