import { useState } from 'react';
import type {
  IntakeData,
  Laterality,
  OnsetType,
  TinnitusDuration,
  HearingLoss,
  DistressScreening,
  RedFlags,
} from '../types';
import { saveIntake } from '../utils/storage';
import { getDistressCategory } from '../services/plan-generator';

interface Props {
  intake: IntakeData | null;
  onSaved: (intake: IntakeData) => void;
}

const SCREENING_QUESTIONS: { key: keyof DistressScreening; label: string }[] = [
  { key: 'concentration', label: 'Does tinnitus make it hard to concentrate?' },
  { key: 'anxiety', label: 'Does tinnitus make you feel tense or anxious?' },
  { key: 'sleep', label: 'Does tinnitus interfere with your sleep?' },
  { key: 'depression', label: 'Does tinnitus make you feel low or hopeless?' },
  { key: 'social', label: 'Does tinnitus affect social activities or relationships?' },
  { key: 'control', label: 'Do you feel tinnitus is in control of your life?' },
  { key: 'overallImpact', label: 'Overall, how much does tinnitus affect your quality of life?' },
];

const SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
const SCALE_COLOURS = ['#2d7a4f', '#6aab5e', '#e8a634', '#d97c2b', '#c0392b'];

function defaultRedFlags(): RedFlags {
  return {
    pulsatile: false,
    unilateralSudden: false,
    neurologicalSymptoms: false,
    drainageOrPain: false,
    recentHeadTrauma: false,
  };
}

function defaultScreening(): DistressScreening {
  return {
    concentration: 0,
    anxiety: 0,
    sleep: 0,
    depression: 0,
    social: 0,
    control: 0,
    overallImpact: 0,
  };
}

function computeScore(s: DistressScreening): number {
  return Object.values(s).reduce((a, b) => a + b, 0);
}

export default function Assessment({ intake, onSaved }: Props) {
  const [laterality, setLaterality] = useState<Laterality>(intake?.laterality ?? 'both');
  const [pulsatile, setPulsatile] = useState(intake?.pulsatile ?? false);
  const [onsetType, setOnsetType] = useState<OnsetType>(intake?.onsetType ?? 'gradual');
  const [duration, setDuration] = useState<TinnitusDuration>(intake?.duration ?? '3-12-months');
  const [redFlags, setRedFlags] = useState<RedFlags>(intake?.redFlags ?? defaultRedFlags());
  const [hearingLoss, setHearingLoss] = useState<HearingLoss>(intake?.hearingLoss ?? 'none');
  const [distressLevel, setDistressLevel] = useState(intake?.distressLevel ?? 5);
  const [sleepImpact, setSleepImpact] = useState(intake?.sleepImpact ?? 3);
  const [screening, setScreening] = useState<DistressScreening>(
    intake?.distressScreening ?? defaultScreening(),
  );
  const [saved, setSaved] = useState(false);

  const score = computeScore(screening);
  const category = getDistressCategory(score);

  function setFlag(key: keyof RedFlags, val: boolean) {
    setRedFlags((prev) => ({ ...prev, [key]: val }));
  }

  function setScreeningQ(key: keyof DistressScreening, val: number) {
    setScreening((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    const data: IntakeData = {
      completedAt: new Date().toISOString(),
      laterality,
      pulsatile,
      onsetType,
      duration,
      redFlags,
      hearingLoss,
      distressLevel,
      sleepImpact,
      distressScreening: screening,
      distressScore: score,
    };
    saveIntake(data);
    onSaved(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const hasAnyRedFlag = Object.values(redFlags).some(Boolean) || pulsatile;

  return (
    <div>
      <div className="section-header">
        <h2>Assessment</h2>
        <p>Help us understand your tinnitus so we can tailor your plan. All data stays on this device.</p>
      </div>

      {hasAnyRedFlag && (
        <div className="alert alert-urgent">
          <div className="alert-title">⚠ Warning signs detected</div>
          Please see a doctor or ENT specialist before proceeding. Some features of your tinnitus
          require medical evaluation.
        </div>
      )}

      <div className="card">
        <div className="card-title">About your tinnitus</div>

        <div className="form-group">
          <label className="form-label">Where do you hear the tinnitus?</label>
          <div className="radio-group">
            {(['left', 'right', 'both', 'in-head'] as Laterality[]).map((v) => (
              <label key={v} className="radio-label">
                <input type="radio" name="laterality" value={v} checked={laterality === v}
                  onChange={() => setLaterality(v)} />
                {v === 'left' ? 'Left ear only' : v === 'right' ? 'Right ear only'
                  : v === 'both' ? 'Both ears' : 'Inside the head / central'}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">How did it start?</label>
          <select className="form-control" value={onsetType}
            onChange={(e) => setOnsetType(e.target.value as OnsetType)}>
            <option value="sudden">Sudden (within hours to days)</option>
            <option value="gradual">Gradual (over weeks/months)</option>
            <option value="unknown">I don't know</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">How long have you had it?</label>
          <select className="form-control" value={duration}
            onChange={(e) => setDuration(e.target.value as TinnitusDuration)}>
            <option value="less-1-month">Less than 1 month</option>
            <option value="1-3-months">1–3 months</option>
            <option value="3-12-months">3–12 months</option>
            <option value="over-1-year">More than 1 year</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Hearing loss</label>
          <select className="form-control" value={hearingLoss}
            onChange={(e) => setHearingLoss(e.target.value as HearingLoss)}>
            <option value="none">None suspected</option>
            <option value="suspected-mild">Mild hearing loss suspected</option>
            <option value="suspected-moderate-severe">Moderate–severe hearing loss suspected</option>
            <option value="confirmed">Confirmed by hearing test</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Warning signs</div>
        <div className="card-subtitle">Tick any that apply. These may need medical attention.</div>
        <div className="checkbox-group">
          {[
            { key: 'pulsatile', label: 'Tinnitus pulses in time with my heartbeat' },
            { key: 'unilateralSudden', label: 'Started suddenly in one ear only' },
            { key: 'neurologicalSymptoms', label: 'Accompanied by dizziness, vertigo, or facial weakness' },
            { key: 'drainageOrPain', label: 'Ear discharge, pain, or pressure' },
            { key: 'recentHeadTrauma', label: 'Followed a head or neck injury' },
          ].map(({ key, label }) => (
            <label key={key} className="checkbox-label">
              <input type="checkbox"
                checked={key === 'pulsatile' ? pulsatile : redFlags[key as keyof RedFlags]}
                onChange={(e) => {
                  if (key === 'pulsatile') setPulsatile(e.target.checked);
                  else setFlag(key as keyof RedFlags, e.target.checked);
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Distress &amp; impact</div>

        <div className="form-group">
          <label className="form-label">Overall distress caused by tinnitus (0 = none, 10 = severe)</label>
          <div className="slider-container">
            <input type="range" className="slider" min={0} max={10} value={distressLevel}
              onChange={(e) => setDistressLevel(Number(e.target.value))} />
            <div className="slider-labels"><span>0</span><span>{distressLevel}</span><span>10</span></div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Sleep disruption (0 = none, 10 = severe)</label>
          <div className="slider-container">
            <input type="range" className="slider" min={0} max={10} value={sleepImpact}
              onChange={(e) => setSleepImpact(Number(e.target.value))} />
            <div className="slider-labels"><span>0</span><span>{sleepImpact}</span><span>10</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Distress Screening</div>
        <div className="card-subtitle">
          7-item questionnaire — inspired by published tinnitus distress measures but not a validated
          clinical instrument. For informational use only.
        </div>

        {SCREENING_QUESTIONS.map(({ key, label }) => (
          <div className="form-group" key={key}>
            <label className="form-label">{label}</label>
            <div className="scale-row" role="group" aria-label={label}>
              {SCALE_LABELS.map((scaleLabel, i) => (
                <button
                  key={i}
                  type="button"
                  className={`scale-cell${screening[key] === i ? ' filled' : ''}`}
                  style={{ background: SCALE_COLOURS[i] }}
                  onClick={() => setScreeningQ(key, i)}
                  title={scaleLabel}
                  aria-label={`${scaleLabel} (${i})`}
                  aria-pressed={screening[key] === i}
                />
              ))}
            </div>
            <div className="slider-labels">
              <span>Never</span>
              <span style={{ color: SCALE_COLOURS[screening[key]] }}>
                {SCALE_LABELS[screening[key]]}
              </span>
              <span>Always</span>
            </div>
          </div>
        ))}

        <div className="score-box">
          <div className="score-number">{score}</div>
          <div className="score-label">out of 28</div>
          <div className="score-category" style={{ color: score < 8 ? 'var(--success)' : score < 16 ? 'var(--warning)' : 'var(--error)' }}>
            {category} distress
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Screening score only. Not a clinical diagnosis.
          </p>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave}>
        {saved ? '✓ Saved' : intake ? 'Update Assessment' : 'Save Assessment'}
      </button>
      {saved && (
        <div className="alert alert-success mt-2">
          Assessment saved. Go to <strong>My Plan</strong> to generate your personalised plan.
        </div>
      )}
    </div>
  );
}
