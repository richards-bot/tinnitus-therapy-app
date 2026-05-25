import { useMemo, useState } from 'react';
import type { AppState, IntakeData, SessionLog, TinnitusMatch, TreatmentPlan as TreatmentPlanType } from '../types';
import { acceptDisclaimer, loadState } from '../utils/storage';
import Disclaimer from './Disclaimer';
import Assessment from './Assessment';
import PitchFinder from './PitchFinder';
import TreatmentPlan from './TreatmentPlan';
import Therapy from './Therapy';
import ResearchLibrary from './ResearchLibrary';

type Tab = 'assessment' | 'pitch' | 'plan' | 'therapy' | 'research';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'assessment', label: 'Assessment', icon: '✓' },
  { id: 'pitch', label: 'Pitch Finder', icon: '♩' },
  { id: 'plan', label: 'My Plan', icon: '⌁' },
  { id: 'therapy', label: 'Therapy', icon: '◉' },
  { id: 'research', label: 'Research', icon: '⌘' },
];

export default function App() {
  const initial = useMemo<AppState>(() => loadState(), []);
  const [accepted, setAccepted] = useState(initial.disclaimerAccepted);
  const [intake, setIntake] = useState<IntakeData | null>(initial.intake);
  const [match, setMatch] = useState<TinnitusMatch | null>(initial.tinnitusMatch);
  const [plan, setPlan] = useState<TreatmentPlanType | null>(initial.treatmentPlan);
  const [sessionLog, setSessionLog] = useState<SessionLog[]>(initial.sessionLog);
  const [activeTab, setActiveTab] = useState<Tab>('assessment');

  function handleAcceptDisclaimer() {
    acceptDisclaimer();
    setAccepted(true);
  }

  function handleIntakeSaved(next: IntakeData) {
    setIntake(next);
    setPlan(null);
    setActiveTab('pitch');
  }

  function handleMatchSaved(next: TinnitusMatch) {
    setMatch(next);
    setPlan(null);
    setActiveTab('plan');
  }

  if (!accepted) {
    return <Disclaimer onAccepted={handleAcceptDisclaimer} />;
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Evidence-informed tinnitus self-management</div>
          <h1>QuietPath</h1>
          <p>
            Find your tinnitus pitch, understand your symptoms, and build a conservative plan around
            CBT-informed habituation, sound enrichment, mindfulness, and safe experimental notch tools.
          </p>
        </div>
        <div className="hero-card" aria-label="QuietPath safety summary">
          <strong>Safety first</strong>
          <span>No cure claims</span>
          <span>Local-only data</span>
          <span>Low-volume audio</span>
        </div>
      </header>

      <nav className="main-tabs" aria-label="Primary">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={`main-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content-panel">
        {activeTab === 'assessment' && <Assessment intake={intake} onSaved={handleIntakeSaved} />}
        {activeTab === 'pitch' && <PitchFinder match={match} onSaved={handleMatchSaved} />}
        {activeTab === 'plan' && (
          <TreatmentPlan
            intake={intake}
            match={match}
            plan={plan}
            onGenerated={setPlan}
            onNavigateTherapy={() => setActiveTab('therapy')}
          />
        )}
        {activeTab === 'therapy' && (
          <Therapy match={match} sessionLog={sessionLog} onSessionLogged={setSessionLog} />
        )}
        {activeTab === 'research' && <ResearchLibrary />}
      </main>

      <footer className="footer-note">
        QuietPath is educational self-management software, not a medical device or medical advice. Seek
        urgent care for sudden hearing loss, pulsatile tinnitus, one-sided sudden tinnitus, neurological
        symptoms, severe vertigo, ear pain/discharge, head injury, or suicidal thoughts.
      </footer>
    </div>
  );
}
