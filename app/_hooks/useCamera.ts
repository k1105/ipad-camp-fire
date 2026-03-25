"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useCamera(): {
  stream: MediaStream | null;
  error: string | null;
  start: () => Promise<void>;
  switchCamera: () => Promise<void>;
} {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const currentIndexRef = useRef(0);

  const startWithDeviceId = useCallback(async (deviceId?: string) => {
    // 古いストリームを停止
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "environment" },
      audio: false,
    };

    try {
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      setStream(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
    }
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    await startWithDeviceId();
    // カメラ一覧を取得（getUserMedia後でないとlabelが取れない）
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devicesRef.current = allDevices.filter((d) => d.kind === "videoinput");
  }, [startWithDeviceId]);

  const switchCamera = useCallback(async () => {
    const devices = devicesRef.current;
    if (devices.length < 2) return;
    currentIndexRef.current = (currentIndexRef.current + 1) % devices.length;
    await startWithDeviceId(devices[currentIndexRef.current].deviceId);
  }, [startWithDeviceId]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { stream, error, start, switchCamera };
}
