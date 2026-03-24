// 超音波信号の共通設定（ASP-system互換）
export const AUDIO_CONFIG = {
  BASE_FREQ: 18000,
  FREQ_RANGE: 1000,
  NUM_CHANNELS: 16,
  SAMPLE_RATE: 44100,
  FFT_SIZE: 1024,
  DETECTION_THRESHOLD: 0.2,
  SMOOTHING: 0.6,
  COOLDOWN_MS: 500,
  NO_SIGNAL_MS: 2000,
  DETECTION_INTERVAL_MS: 50,
};

export function getFrequencyForChannel(channel: number): number {
  const step = AUDIO_CONFIG.FREQ_RANGE / AUDIO_CONFIG.NUM_CHANNELS;
  return AUDIO_CONFIG.BASE_FREQ + (AUDIO_CONFIG.NUM_CHANNELS - channel) * step;
}
