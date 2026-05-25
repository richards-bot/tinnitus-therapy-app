import type { Ear, NoiseType } from '../types';

const FREQ_MIN = 20;
const FREQ_MAX = 16000;
const SLIDER_MAX = 1000;
export const MASTER_GAIN_CAP = 0.25;
const FADE_TIME = 0.5;

// Pure utility functions (safe to test without AudioContext)

export function logSliderToFreq(pos: number): number {
  const clamped = Math.max(0, Math.min(SLIDER_MAX, pos));
  return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, clamped / SLIDER_MAX);
}

export function freqToLogSlider(freq: number): number {
  const clamped = Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq));
  return (Math.log(clamped / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * SLIDER_MAX;
}

export function formatFrequency(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
  return `${Math.round(hz)} Hz`;
}

export function panFromEar(ear: Ear): number {
  if (ear === 'left') return -1;
  if (ear === 'right') return 1;
  return 0;
}

export function stepFreqBySemitone(freq: number, semitones: number): number {
  return Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq * Math.pow(2, semitones / 12)));
}

export function stepFreqByOctave(freq: number, octaves: number): number {
  return Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq * Math.pow(2, octaves)));
}

// AudioEngine — manages a shared AudioContext and active audio nodes

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    ((window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null)
  );
}

function fillWhiteNoise(data: Float32Array): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

function fillPinkNoise(data: Float32Array): void {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
}

function fillBrownNoise(data: Float32Array): void {
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSource: OscillatorNode | AudioBufferSourceNode | null = null;
  private activeGain: GainNode | null = null;
  private activePanner: StereoPannerNode | null = null;
  private _isPlaying = false;

  private async getCtx(): Promise<AudioContext | null> {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return null;
      }
    }
    if (this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  private async buildGraph(pan: number, gain: number): Promise<{ ctx: AudioContext; gainNode: GainNode } | null> {
    const ctx = await this.getCtx();
    if (!ctx) return null;

    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = MASTER_GAIN_CAP;
      this.masterGain.connect(ctx.destination);
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      Math.min(gain, 1),
      ctx.currentTime + FADE_TIME,
    );

    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gainNode.connect(panner);
      panner.connect(this.masterGain);
      this.activePanner = panner;
    } else {
      gainNode.connect(this.masterGain);
      this.activePanner = null;
    }
    this.activeGain = gainNode;

    return { ctx, gainNode };
  }

  async playTone(frequency: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    osc.start();

    this.activeSource = osc;
    this._isPlaying = true;
    return true;
  }

  async playNoise(type: NoiseType, pan: number, gain: number): Promise<boolean> {
    this.stop();
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    const src = this.createNoiseSource(ctx, type);
    src.connect(gainNode);
    src.start();

    this.activeSource = src;
    this._isPlaying = true;
    return true;
  }

  async playNotchedNoise(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    const src = this.createNoiseSource(ctx, 'white');

    const notch = ctx.createBiquadFilter();
    notch.type = 'notch';
    notch.frequency.value = centerFreq;
    notch.Q.value = 1.4; // ~1 octave notch

    src.connect(notch);
    notch.connect(gainNode);
    src.start();

    this.activeSource = src;
    this._isPlaying = true;
    return true;
  }

  async playNarrowband(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    const src = this.createNoiseSource(ctx, 'white');

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = centerFreq;
    bp.Q.value = 8;

    src.connect(bp);
    bp.connect(gainNode);
    src.start();

    this.activeSource = src;
    this._isPlaying = true;
    return true;
  }

  stop(): void {
    if (!this._isPlaying || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (this.activeGain) {
      this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, now);
      this.activeGain.gain.linearRampToValueAtTime(0, now + FADE_TIME);
    }

    const src = this.activeSource;
    if (src) {
      setTimeout(() => {
        try { src.stop(); } catch { /* already stopped */ }
        try { src.disconnect(); } catch { /* already disconnected */ }
      }, (FADE_TIME + 0.1) * 1000);
    }

    this.activeSource = null;
    this.activeGain = null;
    this.activePanner = null;
    this._isPlaying = false;
  }

  updatePan(pan: number): void {
    if (this.activePanner) this.activePanner.pan.value = pan;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  private createNoiseSource(ctx: AudioContext, type: NoiseType): AudioBufferSourceNode {
    const rate = ctx.sampleRate;
    const size = rate * 2;
    const buffer = ctx.createBuffer(1, size, rate);
    const data = buffer.getChannelData(0);

    if (type === 'white') fillWhiteNoise(data);
    else if (type === 'pink') fillPinkNoise(data);
    else fillBrownNoise(data);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }
}

export const audioEngine = new AudioEngine();
