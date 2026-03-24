"use client";

import { useEffect, useRef, useCallback } from "react";
import { AUDIO_CONFIG, getFrequencyForChannel } from "@/app/_lib/audioSignal";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface UseAudioReceiverOptions {
  enabled: boolean;
  onDetected: (channel: number) => void;
}

export function useAudioReceiver({ enabled, onDetected }: UseAudioReceiverOptions) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const cooldownRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const start = useCallback(async () => {
    if (audioCtxRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: AUDIO_CONFIG.SAMPLE_RATE });
      audioCtxRef.current = ctx;

      micRef.current = ctx.createMediaStreamSource(stream);

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.Q.value = 1;
      filter.frequency.value = 10000;
      filter.gain.value = 40;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
      analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING;
      analyserRef.current = analyser;

      micRef.current.connect(filter);
      filter.connect(analyser);

      // Detection loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);

        const actualSampleRate = ctx.sampleRate;
        const actualFftSize = analyser.fftSize;

        let maxIntensity = 0;
        let detectedChannel = -1;

        for (let ch = 0; ch < AUDIO_CONFIG.NUM_CHANNELS; ch++) {
          const targetFreq = getFrequencyForChannel(ch);
          const binIndex = Math.round(
            (targetFreq * actualFftSize) / actualSampleRate
          );

          if (binIndex >= bufferLength) continue;

          let intensity = 0;
          const range = 2;
          for (let i = -range; i <= range; i++) {
            const idx = binIndex + i;
            if (idx >= 0 && idx < bufferLength) {
              intensity += dataArray[idx];
            }
          }
          intensity = intensity / (range * 2 + 1) / 255.0;

          if (
            intensity >= AUDIO_CONFIG.DETECTION_THRESHOLD &&
            intensity > maxIntensity
          ) {
            maxIntensity = intensity;
            detectedChannel = ch;
          }
        }

        if (detectedChannel !== -1 && !cooldownRef.current) {
          onDetectedRef.current(detectedChannel);
          cooldownRef.current = true;
          setTimeout(() => {
            cooldownRef.current = false;
          }, AUDIO_CONFIG.COOLDOWN_MS);
        }
      }, AUDIO_CONFIG.DETECTION_INTERVAL_MS);
    } catch (e) {
      console.error("Audio receiver init error:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (micRef.current) {
      micRef.current.disconnect();
      micRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    cooldownRef.current = false;
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    }
    return () => stop();
  }, [enabled, start, stop]);
}
