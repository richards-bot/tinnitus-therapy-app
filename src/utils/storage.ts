import type { AppState, IntakeData, TinnitusMatch, TreatmentPlan, Preset, SessionLog } from '../types';

const STORAGE_KEY = 'quietpath-v1';

const DEFAULT_STATE: AppState = {
  disclaimerAccepted: false,
  intake: null,
  tinnitusMatch: null,
  treatmentPlan: null,
  presets: [],
  sessionLog: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as AppState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function persist(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

export function acceptDisclaimer(): void {
  const state = loadState();
  persist({ ...state, disclaimerAccepted: true });
}

export function saveIntake(intake: IntakeData): void {
  const state = loadState();
  persist({ ...state, intake });
}

export function saveTinnitusMatch(match: TinnitusMatch): void {
  const state = loadState();
  persist({ ...state, tinnitusMatch: match });
}

export function saveTreatmentPlan(plan: TreatmentPlan): void {
  const state = loadState();
  persist({ ...state, treatmentPlan: plan });
}

export function savePreset(preset: Preset): void {
  const state = loadState();
  const existing = state.presets.filter((p) => p.id !== preset.id);
  persist({ ...state, presets: [...existing, preset] });
}

export function deletePreset(id: string): void {
  const state = loadState();
  persist({ ...state, presets: state.presets.filter((p) => p.id !== id) });
}

export function addSessionLog(entry: SessionLog): void {
  const state = loadState();
  const log = [...state.sessionLog, entry].slice(-100);
  persist({ ...state, sessionLog: log });
}
