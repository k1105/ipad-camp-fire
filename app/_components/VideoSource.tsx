"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { VideoHandle } from "./CameraSource";

interface VideoSourceProps {
  started: boolean;
  whepUrl?: string;
}

export const VideoSource = forwardRef<VideoHandle, VideoSourceProps>(
  function VideoSource({ started, whepUrl }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useImperativeHandle(ref, () => ({
      getVideo: () => videoRef.current,
    }));

    useEffect(() => {
      if (!started || !whepUrl) return;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (e) => {
        const video = videoRef.current;
        if (video && e.streams[0]) {
          video.srcObject = e.streams[0];
          video.play().catch(() => {});
        }
      };

      (async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch(whepUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });

        if (!res.ok) {
          console.error("WHEP negotiation failed:", res.status);
          return;
        }

        const answerSdp = await res.text();
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });
      })();

      return () => {
        pc.close();
        pcRef.current = null;
      };
    }, [started, whepUrl]);

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
        {!whepUrl && <source src="/dummy-video.mp4" type="video/mp4" />}
      </video>
    );
  }
);
