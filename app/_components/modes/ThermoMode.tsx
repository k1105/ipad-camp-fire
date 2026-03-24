"use client";

import { useEffect, useRef } from "react";
import type { VideoHandle } from "../CameraSource";
import { thermoVert } from "@/app/_shaders/thermo.vert";
import { thermoFrag } from "@/app/_shaders/thermo.frag";
import {
  createShaderProgram,
  setupFullscreenQuad,
  updateTexCoords,
  createVideoTexture,
  updateTextureFromVideo,
} from "@/app/_lib/webgl";

interface ThermoModeProps {
  sourceRef: React.RefObject<VideoHandle | null>;
}

export function ThermoMode({ sourceRef }: ThermoModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const program = createShaderProgram(gl, thermoVert, thermoFrag);
    gl.useProgram(program);
    const texBuf = setupFullscreenQuad(gl, program);
    const texture = createVideoTexture(gl);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");

    let lastVW = 0, lastVH = 0, lastCW = 0, lastCH = 0;

    const render = () => {
      const video = sourceRef.current?.getVideo();
      if (video && video.readyState >= 2) {
        // cover用テクスチャ座標を映像サイズ変更時に更新
        if (
          video.videoWidth !== lastVW || video.videoHeight !== lastVH ||
          canvas.width !== lastCW || canvas.height !== lastCH
        ) {
          lastVW = video.videoWidth;
          lastVH = video.videoHeight;
          lastCW = canvas.width;
          lastCH = canvas.height;
          updateTexCoords(gl, texBuf, lastVW, lastVH, lastCW, lastCH);
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uTime, performance.now() * 0.001);
        updateTextureFromVideo(gl, texture, video);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [sourceRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
