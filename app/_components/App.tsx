"use client";

import { useRef, useState, useCallback } from "react";
import { useSignal, type Mode } from "@/app/_hooks/useSignal";
import { useCamera } from "@/app/_hooks/useCamera";
import { useQueryId } from "@/app/_hooks/useQueryId";
import { ModeRenderer } from "./ModeRenderer";
import { CameraSource, type VideoHandle } from "./CameraSource";
import { VideoSource } from "./VideoSource";
import { ThermoMode } from "./modes/ThermoMode";
import { FlashMode } from "./modes/FlashMode";
import { SolidColor } from "./modes/SolidColor";
import { RedGrain } from "./modes/RedGrain";
import { SinWaveMode } from "./modes/SinWaveMode";
import { DebugPanel } from "./DebugPanel";
import { StartScreen } from "./StartScreen";

export function App() {
  const [ready, setReady] = useState(false);
  const { mode, setMode, audioEnabled, setAudioEnabled } = useSignal(7);
  const { stream, start: startCamera } = useCamera();
  const { id: deviceId, setId: setDeviceId } = useQueryId();
  const cameraRef = useRef<VideoHandle>(null);
  const videoRef = useRef<VideoHandle>(null);

  const handleReady = useCallback(() => {
    setReady(true);
    startCamera();
    // 超音波受信を自動有効化（マイク許可済みなので確実に動く）
    setAudioEnabled(true);
    setTimeout(() => {
      const video = videoRef.current?.getVideo();
      if (video) video.play().catch(() => {});
    }, 100);
  }, [startCamera, setAudioEnabled]);

  const renderMode = useCallback(
    (m: number) => {
      switch (m as Mode) {
        case 1:
          return <ThermoMode sourceRef={cameraRef} />;
        case 2:
          return <FlashMode sourceRef={cameraRef} />;
        case 3:
          return <ThermoMode sourceRef={videoRef} />;
        case 4:
          return <FlashMode sourceRef={videoRef} />;
        case 5:
          return <SolidColor color="#ffffff" />;
        case 6:
          return <RedGrain />;
        case 7:
          return <SolidColor color="#000000" />;
        case 8:
          return <SinWaveMode deviceId={deviceId} />;
        default:
          return <SolidColor color="#000000" />;
      }
    },
    [deviceId]
  );

  if (!ready) {
    return <StartScreen onReady={handleReady} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <CameraSource ref={cameraRef} stream={stream} />
      <VideoSource ref={videoRef} started={ready} />
      <ModeRenderer mode={mode} renderMode={renderMode} />
      <DebugPanel
        mode={mode}
        setMode={setMode}
        deviceId={deviceId}
        setDeviceId={setDeviceId}
      />
    </div>
  );
}
