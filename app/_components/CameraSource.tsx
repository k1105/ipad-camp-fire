"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface CameraSourceProps {
  stream: MediaStream | null;
}

export interface VideoHandle {
  getVideo: () => HTMLVideoElement | null;
}

export const CameraSource = forwardRef<VideoHandle, CameraSourceProps>(
  function CameraSource({ stream }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      getVideo: () => videoRef.current,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !stream) return;
      video.srcObject = stream;
      video.play().catch(() => {});
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    );
  }
);
