export type Laterality = 'left' | 'right' | 'both' | 'in-head';
export type OnsetType = 'sudden' | 'gradual' | 'unknown';
export type TinnitusDuration = 'less-1-month' | '1-3-months' | '3-12-months' | 'over-1-year';
export type HearingLoss = 'none' | 'suspected-mild' | 'suspected-moderate-severe' | 'confirmed';
export type Ear = 'left' | 'right' | 'both';
export type EvidenceTier = 'high' | 'moderate' | 'experimental' | 'expert-opinion';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type DistressCategory = 'minimal' | 'mild' | 'moderate' | 'severe';
export type TherapyMode = 'education' | 'cbt' | 'mindfulness' | 'sound' | 'notched';
export type NoiseType = 'white' | 'pink' | 'brown';

export interface RedFlags {
  pulsatile: boolean;
  unilateralSudden: boolean;
  neurologicalSymptoms: boolean;
  drainageOrPain: boolean;
  recentHeadTrauma: boolean;
}

export interface DistressScreening {
  concentration: number;
  anxiety: number;
  sleep: number;
  depression: number;
  social: number;
  control: number;
  overallImpact: number;
}

export interface IntakeData {
  completedAt: string;
  laterality: Laterality;
  pulsatile: boolean;
  onsetType: OnsetType;
  duration: TinnitusDuration;
  redFlags: RedFlags;
  hearingLoss: HearingLoss;
  distressLevel: number;
  sleepImpact: number;
  distressScreening: DistressScreening;
  distressScore: number;
}

export interface TinnitusMatch {
  frequency: number;
  ear: Ear;
  savedAt: string;
  notes: string;
}

export interface TreatmentRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  evidenceTier: EvidenceTier;
  priority: Priority;
  actionItems: string[];
  references: string[];
}

export interface TreatmentPlan {
  generatedAt: string;
  basedOnIntake: boolean;
  basedOnFrequency: boolean;
  distressCategory: DistressCategory;
  recommendations: TreatmentRecommendation[];
}

export interface Preset {
  id: string;
  name: string;
  mode: TherapyMode;
  noiseType: NoiseType;
  gain: number;
  pan: number;
  createdAt: string;
}

export interface SessionLog {
  id: string;
  mode: TherapyMode;
  startedAt: string;
  durationSeconds: number;
}

export interface AppState {
  disclaimerAccepted: boolean;
  intake: IntakeData | null;
  tinnitusMatch: TinnitusMatch | null;
  treatmentPlan: TreatmentPlan | null;
  presets: Preset[];
  sessionLog: SessionLog[];
}
