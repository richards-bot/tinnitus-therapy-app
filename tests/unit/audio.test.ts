import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AudioEngine,
  formatFrequency,
  freqToLogSlider,
  logSliderToFreq,
  panFromEar,
  stepFreqBySemitone,
} from '../../src/utils/audio';

describe('audio utilities', () => {
  it('maps log slider positions to frequency range', () => {
    expect(Math.round(logSliderToFreq(0))).toBe(20);
    expect(Math.round(logSliderToFreq(1000))).toBe(16000);
  });

  it('round trips frequency to slider and back approximately', () => {
    const frequency = 8000;
    const slider = freqToLogSlider(frequency);
    expect(logSliderToFreq(slider)).toBeCloseTo(frequency, 0);
  });

  it('formats high and low frequencies clearly', () => {
    expect(formatFrequency(800)).toBe('800 Hz');
    expect(formatFrequency(8000)).toBe('8.0 kHz');
  });

  it('calculates panning and semitone steps', () => {
    expect(panFromEar('left')).toBe(-1);
    expect(panFromEar('right')).toBe(1);
    expect(panFromEar('both')).toBe(0);
    expect(stepFreqBySemitone(1000, 12)).toBeCloseTo(2000, 0);
  });
});

describe('AudioEngine', () => {
  const originalAudioContext = window.AudioContext;
  const originalUrl = window.URL;

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.unstubAllGlobals();
    window.URL = originalUrl;
    vi.restoreAllMocks();
  });

  function mockHtmlAudio(playImpl: () => Promise<void> = () => Promise.resolve()) {
    const play = vi.fn(playImpl);
    const pause = vi.fn();
    const load = vi.fn();
    const removeAttribute = vi.fn();
    const remove = vi.fn();
    const setAttribute = vi.fn();
    const canPlayType = vi.fn(() => 'probably');

    class FakeAudio {
      loop = false;
      volume = 1;
      preload = 'none';
      paused = false;
      readyState = 4;
      networkState = 1;
      style = { display: '' };
      src: string;
      play = play;
      pause = pause;
      load = load;
      removeAttribute = removeAttribute;
      remove = remove;
      setAttribute = setAttribute;
      canPlayType = canPlayType;

      constructor(src = '') {
        this.src = src;
      }
    }

    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test-audio'),
      revokeObjectURL: vi.fn(),
    });

    return { play, pause, load, removeAttribute };
  }

  it('plays pitch tones through the HTMLAudio fallback backend', async () => {
    const htmlAudio = mockHtmlAudio();
    window.AudioContext = undefined as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playTone(440, 0, 0.5);

    expect(ok).toBe(true);
    expect(htmlAudio.play).toHaveBeenCalledTimes(1);
    expect(engine.lastStatus.backend).toBe('html-audio');
  });

  it('plays simple noise through the HTMLAudio fallback backend', async () => {
    const htmlAudio = mockHtmlAudio();
    window.AudioContext = undefined as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playNoise('pink', 0, 0.5);

    expect(ok).toBe(true);
    expect(htmlAudio.play).toHaveBeenCalledTimes(1);
    expect(engine.lastStatus.message).toContain('pink noise');
  });

  it('reports a helpful failure when media-element playback is rejected', async () => {
    mockHtmlAudio(() => Promise.reject(new Error('blocked')));
    window.AudioContext = undefined as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playTone(440, 0, 0.5);

    expect(ok).toBe(false);
    expect(engine.lastStatus.backend).toBe('none');
    expect(engine.lastStatus.message).toContain('Telegram');
  });

  it('prefers HTMLAudio on iPhone even when Web Audio is available', async () => {
    const htmlAudio = mockHtmlAudio();
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1');
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');

    class FakeAudioContext {
      state = 'running';
      sampleRate = 48000;
    }

    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playTone(440, 0, 0.5);

    expect(ok).toBe(true);
    expect(htmlAudio.play).toHaveBeenCalledTimes(1);
    expect(engine.lastStatus.backend).toBe('html-audio');
    expect(engine.lastStatus.message).toContain('iPhone-compatible');
  });

  it('falls back to HTMLAudio when advanced notched Web Audio cannot resume', async () => {
    const htmlAudio = mockHtmlAudio();

    class FakeAudioContext {
      state = 'suspended';
      async resume() {
        throw new Error('blocked');
      }
    }

    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playNotchedNoise(8000, 0, 0.5);

    expect(ok).toBe(true);
    expect(htmlAudio.play).toHaveBeenCalledTimes(1);
    expect(engine.lastStatus.backend).toBe('html-audio');
    expect(engine.lastStatus.degraded).toBe(true);
  });
});
