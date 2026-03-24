import { getFrequencyForChannel } from "./audioSignal";

export class AudioSender {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private repeatInterval: ReturnType<typeof setInterval> | null = null;
  gain = 0.5;
  duration = 0.5;

  async init() {
    if (this.ctx) return;
    // sampleRate指定なし — システムデフォルトを使用（元のコントローラーと同じ）
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  async send(channel: number) {
    if (!this.ctx || !this.gainNode) return;

    this.stopRepeat();

    const frequency = getFrequencyForChannel(channel);
    const duration = this.duration;
    const gainValue = this.gain;
    const ctx = this.ctx;
    const gainNode = this.gainNode;

    // 前のオシレーターをフェードアウト
    const now = ctx.currentTime;
    if (this.oscillator) {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
      this.oscillator.stop(now + 0.01);
      this.oscillator = null;
    } else {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
    }

    // フェードアウト完了を待つ（元コントローラーと同じ10ms delay）
    await new Promise((r) => setTimeout(r, 10));

    const emit = () => {
      if (!this.ctx || !this.gainNode) return;

      this.oscillator = ctx.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      this.oscillator.connect(gainNode);

      // エンベロープ
      const t = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(gainValue, t + 0.01);
      gainNode.gain.setValueAtTime(gainValue, t + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, t + duration);

      this.oscillator.start(t);
      this.oscillator.stop(t + duration);
    };

    // 元コントローラーと同じ: setIntervalからのみ発火
    this.repeatInterval = setInterval(emit, duration * 1000 * 1.5);
  }

  stop() {
    this.stopRepeat();
    if (!this.ctx || !this.gainNode) return;

    const now = this.ctx.currentTime;
    if (this.oscillator) {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
      this.oscillator.stop(now + 0.01);
      this.oscillator = null;
    } else {
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
    }
  }

  private stopRepeat() {
    if (this.repeatInterval !== null) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  }

  dispose() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
    this.gainNode = null;
  }
}
