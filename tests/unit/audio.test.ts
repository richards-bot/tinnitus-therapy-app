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

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it('waits for a suspended AudioContext to resume before starting playback', async () => {
    const startStates: string[] = [];

    class FakeAudioContext {
      state = 'suspended';
      currentTime = 0;
      sampleRate = 44_100;
      destination = {};

      async resume() {
        await Promise.resolve();
        this.state = 'running';
      }

      createGain() {
        return {
          context: this,
          gain: {
            value: 0,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }

      createStereoPanner() {
        return {
          pan: { value: 0 },
          connect: vi.fn(),
        };
      }

      createOscillator() {
        return {
          type: 'sine',
          frequency: { value: 0 },
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(() => startStates.push(this.state)),
          stop: vi.fn(),
        };
      }
    }

    window.AudioContext = FakeAudioContext as unknown as typeof AudioContext;

    const engine = new AudioEngine();
    const ok = await engine.playTone(440, 0, 0.5);

    expect(ok).toBe(true);
    expect(startStates).toEqual(['running']);
  });
});
