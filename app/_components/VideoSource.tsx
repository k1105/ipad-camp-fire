"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import type { VideoHandle } from "./CameraSource";

interface VideoSourceProps {
  started: boolean;
}

export const VideoSource = forwardRef<VideoHandle, VideoSourceProps>(
  function VideoSource({ started }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      getVideo: () => videoRef.current,
    }));

    return (
      <video
        ref={videoRef}
        autoPlay={started}
        playsInline
        muted
        loop
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
      >
        <source src="/dummy-video.mp4" type="video/mp4" />
      </video>
    );
  }
);
