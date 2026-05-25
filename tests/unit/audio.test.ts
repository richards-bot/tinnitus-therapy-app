import { describe, expect, it } from 'vitest';
import { formatFrequency, freqToLogSlider, logSliderToFreq, panFromEar, stepFreqBySemitone } from '../../src/utils/audio';

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
