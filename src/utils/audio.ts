import type { Ear, NoiseType } from '../types';

const FREQ_MIN = 20;
const FREQ_MAX = 16000;
const SLIDER_MAX = 1000;
export const MASTER_GAIN_CAP = 0.25;
const FADE_TIME = 0.5;
const FALLBACK_RATE = 44_100;
const FALLBACK_SECONDS = 2;

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

// AudioEngine — manages playback. Web Audio is preferred for precise synthesis/filtering;
// HTMLAudioElement looped WAV blobs are a compatibility fallback for mobile in-app browsers
// (Telegram/iOS WKWebView) where AudioContext can fail to start even after resume().

type AudioContextCtor = typeof AudioContext;
export type AudioBackend = 'html-audio' | 'web-audio' | 'none';

export interface AudioStatus {
  backend: AudioBackend;
  message: string;
  degraded?: boolean;
}

interface AudioDebugEvent {
  at: string;
  event: string;
  details?: Record<string, unknown>;
}

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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function channelGains(pan: number): { left: number; right: number } {
  const clamped = Math.max(-1, Math.min(1, pan));
  return {
    left: clamped > 0 ? 1 - clamped : 1,
    right: clamped < 0 ? 1 + clamped : 1,
  };
}

function encodeWavStereo(left: Float32Array, right: Float32Array, sampleRate: number): Blob {
  const frames = Math.min(left.length, right.length);
  const buffer = new ArrayBuffer(44 + frames * 4);
  const view = new DataView(buffer);

  function writeString(offset: number, value: string): void {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + frames * 4, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, frames * 4, true);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    view.setInt16(offset, Math.max(-1, Math.min(1, left[i])) * 0x7fff, true);
    view.setInt16(offset + 2, Math.max(-1, Math.min(1, right[i])) * 0x7fff, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function makeStereoBlob(mono: Float32Array, pan: number, amplitude: number): Blob {
  const { left: leftGain, right: rightGain } = channelGains(pan);
  const left = new Float32Array(mono.length);
  const right = new Float32Array(mono.length);
  for (let i = 0; i < mono.length; i++) {
    left[i] = mono[i] * amplitude * leftGain;
    right[i] = mono[i] * amplitude * rightGain;
  }
  return encodeWavStereo(left, right, FALLBACK_RATE);
}

function makeToneBlob(frequency: number, pan: number): Blob {
  const frames = FALLBACK_RATE * FALLBACK_SECONDS;
  const mono = new Float32Array(frames);
  const clampedFrequency = Math.max(FREQ_MIN, Math.min(FREQ_MAX, frequency));
  for (let i = 0; i < frames; i++) {
    // short envelope at loop boundaries to avoid hard clicks
    const t = i / FALLBACK_RATE;
    const edge = Math.min(i, frames - 1 - i) / (FALLBACK_RATE * 0.02);
    const env = Math.min(1, Math.max(0, edge));
    mono[i] = Math.sin(2 * Math.PI * clampedFrequency * t) * env;
  }
  return makeStereoBlob(mono, pan, 0.3);
}

function makeNoiseBlob(type: NoiseType, pan: number): Blob {
  const frames = FALLBACK_RATE * FALLBACK_SECONDS;
  const mono = new Float32Array(frames);
  if (type === 'white') fillWhiteNoise(mono);
  else if (type === 'pink') fillPinkNoise(mono);
  else fillBrownNoise(mono);
  return makeStereoBlob(mono, pan, 0.28);
}

function applyBiquad(
  input: Float32Array,
  kind: 'notch' | 'bandpass',
  frequency: number,
  q: number,
): Float32Array {
  const output = new Float32Array(input.length);
  const f = Math.max(80, Math.min(FREQ_MAX, frequency));
  const w0 = 2 * Math.PI * f / FALLBACK_RATE;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);

  let b0: number;
  let b1: number;
  let b2: number;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;

  if (kind === 'notch') {
    b0 = 1;
    b1 = -2 * cos;
    b2 = 1;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }

  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - na1 * y1 - na2 * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return output;
}

function makeFilteredNoiseBlob(kind: 'notch' | 'bandpass', centerFreq: number, pan: number): Blob {
  const frames = FALLBACK_RATE * FALLBACK_SECONDS;
  const mono = new Float32Array(frames);
  fillWhiteNoise(mono);
  const filtered = applyBiquad(mono, kind, centerFreq, kind === 'notch' ? 1.4 : 8);
  return makeStereoBlob(filtered, pan, kind === 'notch' ? 0.28 : 0.34);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSource: OscillatorNode | AudioBufferSourceNode | null = null;
  private activeGain: GainNode | null = null;
  private activePanner: StereoPannerNode | null = null;
  private fallbackAudio: HTMLAudioElement | null = null;
  private fallbackUrl: string | null = null;
  private _isPlaying = false;
  private _lastStatus: AudioStatus = { backend: 'none', message: 'Audio has not started yet.' };
  private debugEvents: AudioDebugEvent[] = [];

  get lastStatus(): AudioStatus {
    return this._lastStatus;
  }

  private setStatus(status: AudioStatus): void {
    this._lastStatus = status;
  }

  private log(event: string, details?: Record<string, unknown>): void {
    this.debugEvents.push({ at: new Date().toISOString(), event, details });
    if (this.debugEvents.length > 30) this.debugEvents.shift();
  }

  getDebugReport(): string {
    const probeAudio = typeof Audio !== 'undefined' ? new Audio() : null;
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const win = typeof window !== 'undefined' ? window : null;
    const doc = typeof document !== 'undefined' ? document : null;
    const report = {
      url: win?.location.href,
      userAgent: nav?.userAgent,
      platform: nav?.platform,
      maxTouchPoints: nav?.maxTouchPoints,
      visibilityState: doc?.visibilityState,
      isSecureContext: win?.isSecureContext,
      audioContext: {
        hasAudioContext: Boolean(win?.AudioContext),
        hasWebkitAudioContext: Boolean((win as (Window & { webkitAudioContext?: AudioContextCtor }) | null)?.webkitAudioContext),
        existingState: this.ctx?.state ?? null,
        sampleRate: this.ctx?.sampleRate ?? null,
      },
      htmlAudio: {
        hasAudio: typeof Audio !== 'undefined',
        wavSupport: probeAudio?.canPlayType('audio/wav; codecs="1"') || probeAudio?.canPlayType('audio/wav') || 'unknown',
        mp3Support: probeAudio?.canPlayType('audio/mpeg') || 'unknown',
      },
      lastStatus: this._lastStatus,
      isPlaying: this._isPlaying,
      debugEvents: this.debugEvents,
    };
    return JSON.stringify(report, null, 2);
  }

  private async getCtx(): Promise<AudioContext | null> {
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      this.log('web-audio-unavailable');
      return null;
    }
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new Ctor();
        this.log('web-audio-created', { state: this.ctx.state, sampleRate: this.ctx.sampleRate });
      }
      if (this.ctx.state === 'suspended') {
        this.log('web-audio-resume-start', { state: this.ctx.state });
        await this.ctx.resume();
        this.log('web-audio-resume-finished', { state: this.ctx.state });
      }
      if (this.ctx.state !== 'running') {
        this.log('web-audio-not-running', { state: this.ctx.state });
        return null;
      }
      return this.ctx;
    } catch (error) {
      this.log('web-audio-error', { error: errorMessage(error), state: this.ctx?.state });
      return null;
    }
  }

  private async buildGraph(pan: number, gain: number): Promise<{ ctx: AudioContext; gainNode: GainNode } | null> {
    const ctx = await this.getCtx();
    if (!ctx) return null;

    try {
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
    } catch (error) {
      this.log('web-audio-graph-error', { error: errorMessage(error) });
      return null;
    }
  }

  async playTone(frequency: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    if (await this.tryPlayToneWebAudio(frequency, pan, gain)) return true;
    return this.playFallback(makeToneBlob(frequency, pan), gain, 'Tone playing using the compatible audio backend.');
  }

  async playNoise(type: NoiseType, pan: number, gain: number): Promise<boolean> {
    this.stop();
    if (await this.tryPlayNoiseWebAudio(type, pan, gain)) return true;
    return this.playFallback(makeNoiseBlob(type, pan), gain, `${type} noise playing using the compatible audio backend.`);
  }

  async playNotchedNoise(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    if (await this.tryPlayNotchedNoiseWebAudio(centerFreq, pan, gain)) return true;
    return this.playFallback(
      makeFilteredNoiseBlob('notch', centerFreq, pan),
      gain,
      'Notched-noise approximation playing using the compatible audio backend.',
      true,
    );
  }

  async playNarrowband(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    this.stop();
    if (await this.tryPlayNarrowbandWebAudio(centerFreq, pan, gain)) return true;
    return this.playFallback(
      makeFilteredNoiseBlob('bandpass', centerFreq, pan),
      gain,
      'Narrowband-noise approximation playing using the compatible audio backend.',
      true,
    );
  }

  private async tryPlayToneWebAudio(frequency: number, pan: number, gain: number): Promise<boolean> {
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    try {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = Math.max(FREQ_MIN, Math.min(FREQ_MAX, frequency));
      osc.connect(gainNode);
      osc.start();

      this.activeSource = osc;
      this._isPlaying = true;
      this.setStatus({ backend: 'web-audio', message: 'Tone playing with Web Audio.' });
      this.log('web-audio-tone-started', { frequency, pan, gain, state: ctx.state });
      return true;
    } catch (error) {
      this.log('web-audio-tone-error', { error: errorMessage(error) });
      this.stopWebAudio();
      return false;
    }
  }

  private async tryPlayNoiseWebAudio(type: NoiseType, pan: number, gain: number): Promise<boolean> {
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    try {
      const src = this.createNoiseSource(ctx, type);
      src.connect(gainNode);
      src.start();

      this.activeSource = src;
      this._isPlaying = true;
      this.setStatus({ backend: 'web-audio', message: `${type} noise playing with Web Audio.` });
      this.log('web-audio-noise-started', { type, pan, gain, state: ctx.state });
      return true;
    } catch (error) {
      this.log('web-audio-noise-error', { error: errorMessage(error) });
      this.stopWebAudio();
      return false;
    }
  }

  private async tryPlayNotchedNoiseWebAudio(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    try {
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
      this.setStatus({ backend: 'web-audio', message: 'Notched noise playing with Web Audio filtering.' });
      this.log('web-audio-notched-started', { centerFreq, pan, gain, state: ctx.state });
      return true;
    } catch (error) {
      this.log('web-audio-notched-error', { error: errorMessage(error) });
      this.stopWebAudio();
      return false;
    }
  }

  private async tryPlayNarrowbandWebAudio(centerFreq: number, pan: number, gain: number): Promise<boolean> {
    const result = await this.buildGraph(pan, gain);
    if (!result) return false;
    const { ctx, gainNode } = result;

    try {
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
      this.setStatus({ backend: 'web-audio', message: 'Narrowband noise playing with Web Audio filtering.' });
      this.log('web-audio-narrowband-started', { centerFreq, pan, gain, state: ctx.state });
      return true;
    } catch (error) {
      this.log('web-audio-narrowband-error', { error: errorMessage(error) });
      this.stopWebAudio();
      return false;
    }
  }

  private async playFallback(blob: Blob, gain: number, message: string, degraded = false): Promise<boolean> {
    if (typeof Audio === 'undefined' || typeof URL === 'undefined') {
      this.setStatus({
        backend: 'none',
        message: 'Audio could not start in this browser. Try opening the app in Safari or Chrome.',
      });
      return false;
    }

    try {
      this.stopFallback();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = Math.min(0.75, clamp01(gain));
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.style.display = 'none';
      if (typeof document !== 'undefined' && document.body && audio instanceof Node) {
        document.body.appendChild(audio);
      }
      this.fallbackUrl = url;
      this.fallbackAudio = audio;
      this.log('html-audio-play-start', {
        blobType: blob.type,
        blobSize: blob.size,
        volume: audio.volume,
        canPlayWav: audio.canPlayType('audio/wav') || 'unknown',
      });
      await audio.play();
      this._isPlaying = true;
      this.setStatus({ backend: 'html-audio', message, degraded });
      this.log('html-audio-play-started', { paused: audio.paused, readyState: audio.readyState, networkState: audio.networkState });
      return true;
    } catch (error) {
      this.log('html-audio-play-error', { error: errorMessage(error) });
      this.stopFallback();
      this._isPlaying = false;
      this.setStatus({
        backend: 'none',
        message: 'Audio was blocked by this browser. If you are in Telegram, use “Open in Browser” and check media volume / silent mode.',
      });
      return false;
    }
  }

  stop(): void {
    this.stopWebAudio();
    this.stopFallback();
    this._isPlaying = false;
  }

  private stopWebAudio(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (this.activeGain) {
      try {
        this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, now);
        this.activeGain.gain.linearRampToValueAtTime(0, now + FADE_TIME);
      } catch { /* already disconnected */ }
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
  }

  private stopFallback(): void {
    if (this.fallbackAudio) {
      try { this.fallbackAudio.pause(); } catch { /* already stopped */ }
      this.fallbackAudio.removeAttribute('src');
      this.fallbackAudio.load();
      this.fallbackAudio.remove();
    }
    if (this.fallbackUrl) {
      URL.revokeObjectURL(this.fallbackUrl);
    }
    this.fallbackAudio = null;
    this.fallbackUrl = null;
  }

  updatePan(_pan: number): void {
    // HTMLAudio fallback embeds panning in the generated stereo WAV. Active panning
    // changes are applied by restarting playback from the UI when parameters change.
    if (this.activePanner) this.activePanner.pan.value = _pan;
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
