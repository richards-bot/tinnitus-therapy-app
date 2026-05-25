import { describe, expect, it } from 'vitest';
import type { IntakeData, TinnitusMatch } from '../../src/types';
import { generateTreatmentPlan, getDistressCategory } from '../../src/services/plan-generator';

function intake(overrides: Partial<IntakeData> = {}): IntakeData {
  return {
    completedAt: '2026-01-01T00:00:00.000Z',
    laterality: 'both',
    pulsatile: false,
    onsetType: 'gradual',
    duration: '3-12-months',
    redFlags: {
      pulsatile: false,
      unilateralSudden: false,
      neurologicalSymptoms: false,
      drainageOrPain: false,
      recentHeadTrauma: false,
    },
    hearingLoss: 'none',
    distressLevel: 6,
    sleepImpact: 5,
    distressScreening: {
      concentration: 3,
      anxiety: 3,
      sleep: 3,
      depression: 2,
      social: 2,
      control: 2,
      overallImpact: 3,
    },
    distressScore: 18,
    ...overrides,
  };
}

describe('treatment plan generation', () => {
  it('classifies screening distress categories', () => {
    expect(getDistressCategory(3)).toBe('minimal');
    expect(getDistressCategory(10)).toBe('mild');
    expect(getDistressCategory(18)).toBe('moderate');
    expect(getDistressCategory(24)).toBe('severe');
  });

  it('prioritises CBT, sleep and sound enrichment for bothersome tinnitus', () => {
    const plan = generateTreatmentPlan(intake(), null);
    const ids = plan.recommendations.map((r) => r.id);
    expect(ids).toContain('education');
    expect(ids).toContain('cbt');
    expect(ids).toContain('sleep');
    expect(ids).toContain('sound-enrichment');
    expect(ids).not.toContain('notched-noise');
  });

  it('adds urgent referral for red flags and notch option when frequency is saved', () => {
    const match: TinnitusMatch = { frequency: 7200, ear: 'left', savedAt: '2026-01-01', notes: '' };
    const plan = generateTreatmentPlan(
      intake({ redFlags: { pulsatile: true, unilateralSudden: false, neurologicalSymptoms: false, drainageOrPain: false, recentHeadTrauma: false } }),
      match,
    );
    const ids = plan.recommendations.map((r) => r.id);
    expect(ids[0]).toBe('urgent-referral');
    expect(ids).toContain('notched-noise');
    expect(plan.basedOnFrequency).toBe(true);
  });
});
