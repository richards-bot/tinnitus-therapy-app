import { useState, useEffect, useRef, useCallback } from 'react';
import type { TinnitusMatch, NoiseType, SessionLog, TherapyMode } from '../types';
import { audioEngine, panFromEar, formatFrequency } from '../utils/audio';
import { addSessionLog } from '../utils/storage';

interface Props {
  match: TinnitusMatch | null;
  sessionLog: SessionLog[];
  onSessionLogged: (log: SessionLog[]) => void;
}

type SubTab = TherapyMode;

const TIMER_OPTIONS = [
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '60 min', seconds: 3600 },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Audio player used in Sound and Notched tabs
function AudioPlayer({
  label,
  mode,
  onPlay,
  onStop,
}: {
  label: string;
  mode: TherapyMode;
  onPlay: (gain: number) => boolean;
  onStop: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [gain, setGain] = useState(0.5);
  const [timerSecs, setTimerSecs] = useState(TIMER_OPTIONS[1].seconds);
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<string>('');
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const stopAll = useCallback(() => {
    onStop();
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemaining(null);
  }, [onStop]);

  function handlePlay() {
    if (playing) { stopAll(); return; }
    const ok = onPlay(gain);
    if (!ok) return;
    setPlaying(true);
    startedAtRef.current = new Date().toISOString();
    setRemaining(timerSecs);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null || prev <= 1) {
          audioEngine.stop();
          setPlaying(false);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;

          const durationSeconds = timerSecs;
          const entry: SessionLog = {
            id: crypto.randomUUID(),
            mode: modeRef.current,
            startedAt: startedAtRef.current,
            durationSeconds,
          };
          addSessionLog(entry);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const progress = remaining !== null ? ((timerSecs - remaining) / timerSecs) * 100 : 0;

  return (
    <div>
      <div className="form-group">
        <div className="volume-row">
          <label>Volume</label>
          <input
            type="range"
            className="slider"
            min={0}
            max={100}
            value={Math.round(gain * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              setGain(v);
            }}
            aria-label="Volume"
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '2.5rem', textAlign: 'right' }}>
            {Math.round(gain * 100)}%
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Session duration</label>
        <div className="timer-options">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              className={`timer-opt-btn${timerSecs === opt.seconds ? ' active' : ''}`}
              onClick={() => { if (!playing) setTimerSecs(opt.seconds); }}
              disabled={playing}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {remaining !== null && (
        <div>
          <div className="timer-display">{formatTime(remaining)}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="text-center mt-2">
        <button
          className={`play-btn${playing ? ' playing' : ''}`}
          onClick={handlePlay}
          aria-label={playing ? `Stop ${label}` : `Play ${label}`}
          aria-pressed={playing}
        >
          {playing ? '■' : '▶'}
        </button>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {playing ? `Playing${remaining !== null ? ` · ${formatTime(remaining)} remaining` : ''}` : `Press to start · ${formatTime(timerSecs)} session`}
        </p>
      </div>
    </div>
  );
}

// Education tab
function EducationTab() {
  return (
    <div>
      <div className="exercise-card">
        <h3>What is tinnitus?</h3>
        <p>
          Tinnitus is the perception of sound — ringing, buzzing, hissing, or other noise — without
          an external source. It is extremely common, affecting up to 15% of adults. In most people,
          it is not a sign of serious disease.
        </p>
      </div>
      <div className="exercise-card">
        <h3>Why does it persist?</h3>
        <p>
          Tinnitus is thought to arise from changes in neural activity in the auditory system,
          often following noise exposure or age-related hearing changes. The brain can amplify these
          signals, especially when they are perceived as threatening. This is why anxiety about
          tinnitus tends to make it worse.
        </p>
      </div>
      <div className="exercise-card">
        <h3>Habituation — the key concept</h3>
        <p>
          The goal of treatment is not to silence the tinnitus (for most people this is not possible)
          but to reach a state where it no longer triggers distress — called <strong>habituation</strong>.
          The brain is remarkably good at filtering out non-threatening signals. Many people with
          tinnitus reach a point where they notice it rarely.
        </p>
      </div>
      <div className="exercise-card">
        <h3>What actually helps?</h3>
        <ul className="exercise-steps">
          <li>
            <strong>CBT</strong> — the strongest evidence for reducing distress. Addresses unhelpful
            thoughts and behaviours around tinnitus.
          </li>
          <li>
            <strong>Sound enrichment</strong> — background sound reduces the contrast that makes
            tinnitus more noticeable in silence.
          </li>
          <li>
            <strong>Mindfulness</strong> — helps shift from reactive distress to non-judgmental
            awareness.
          </li>
          <li>
            <strong>Hearing aids</strong> — if hearing loss is present, addressing it reduces the
            auditory deprivation that worsens tinnitus.
          </li>
        </ul>
      </div>
      <div className="alert alert-info">
        <strong>Remember:</strong> Tinnitus distress almost always improves over time, especially
        with the right support. You are not alone, and effective self-management strategies exist.
      </div>
    </div>
  );
}

// CBT tab
function CbtTab() {
  const [step, setStep] = useState(0);

  const exercises = [
    {
      title: 'Thought challenging',
      intro: 'Unhelpful thoughts about tinnitus fuel distress. This exercise helps you examine and reframe them.',
      steps: [
        'Notice a distressing thought: e.g. "This ringing will drive me insane."',
        'Ask: What evidence supports this thought? What evidence contradicts it?',
        'Consider: What would I say to a friend with this thought?',
        'Create a balanced thought: e.g. "Tinnitus is unpleasant, but I have coped before and I can cope again."',
        'Write it down and read it back slowly.',
      ],
    },
    {
      title: 'Attention shifting',
      intro: 'Tinnitus worsens when attention is focused on it. Train your attention to shift deliberately.',
      steps: [
        'Find a comfortable position and close your eyes.',
        'For 30 seconds, focus entirely on the tinnitus sound.',
        'Now shift focus to sounds outside you — traffic, birds, your own breathing.',
        'Spend 60 seconds engaged with external sounds.',
        'Alternate between internal (tinnitus) and external focus 3 times.',
        'Notice that you can choose where to direct your attention.',
      ],
    },
    {
      title: 'Acceptance practice',
      intro: 'Fighting tinnitus maintains distress. Acceptance means allowing it to be there without struggle.',
      steps: [
        'Sit quietly and notice the tinnitus without trying to change it.',
        'Say silently: "I notice a ringing sound. It is there. I can let it be."',
        'Allow any emotional reaction — frustration, sadness — without acting on it.',
        'Breathe naturally and return to your day, carrying the sound without fighting it.',
        'Repeat daily. This takes practice — even small shifts reduce distress over time.',
      ],
    },
  ];

  const ex = exercises[step];

  return (
    <div>
      <div className="card-subtitle" style={{ marginBottom: '1rem' }}>
        CBT helps you identify and change unhelpful patterns of thinking and behaviour around tinnitus.
        Work through these exercises regularly for best results.
      </div>

      <div className="sub-tabs">
        {exercises.map((e, i) => (
          <button
            key={i}
            className={`sub-tab-btn${step === i ? ' active' : ''}`}
            onClick={() => setStep(i)}
          >
            {e.title}
          </button>
        ))}
      </div>

      <div className="exercise-card">
        <h3>{ex.title}</h3>
        <p>{ex.intro}</p>
        <ol className="exercise-steps">
          {ex.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>
    </div>
  );
}

// Mindfulness tab
function MindfulnessTab() {
  const [activeEx, setActiveEx] = useState(0);

  const exercises = [
    {
      title: 'Mindful breathing',
      body: (
        <div>
          <p>A simple 4-7-8 breathing pattern to calm the nervous system.</p>
          <ol className="exercise-steps">
            <li>Inhale quietly through your nose for <strong>4 counts</strong>.</li>
            <li>Hold your breath for <strong>7 counts</strong>.</li>
            <li>Exhale completely through your mouth for <strong>8 counts</strong>.</li>
            <li>Repeat 4 cycles. Let each exhale release tension.</li>
            <li>Notice how your body feels after the fourth cycle.</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Body scan',
      body: (
        <div>
          <p>A progressive body scan to ground attention in physical sensation.</p>
          <ol className="exercise-steps">
            <li>Lie down or sit comfortably. Close your eyes.</li>
            <li>Bring attention to the soles of your feet. Notice any sensation — warmth, pressure.</li>
            <li>Slowly move attention upward: feet → legs → abdomen → chest → hands → arms → shoulders → neck → face.</li>
            <li>At each point, simply notice without judging.</li>
            <li>If tinnitus draws your attention, acknowledge it: "I notice sound" — then return to the body area.</li>
            <li>Complete the scan in 5–10 minutes.</li>
          </ol>
        </div>
      ),
    },
    {
      title: 'Sound acceptance',
      body: (
        <div>
          <p>
            Rather than fighting the tinnitus, this exercise invites you to approach it with curiosity.
            Based on Mindfulness-Based Cognitive Therapy (MBCT) principles adapted for tinnitus.
          </p>
          <ol className="exercise-steps">
            <li>Sit comfortably. Take three slow breaths.</li>
            <li>Turn your attention gently to the tinnitus sound. Don't try to change it.</li>
            <li>Describe it mentally — pitch, rhythm, location. Observe as you would any natural sound.</li>
            <li>Notice any emotional reaction. Name it silently: "I notice irritation."</li>
            <li>Breathe and expand awareness to include the room, your body, other sounds.</li>
            <li>Let the tinnitus be one sound among many — not the centre of the world.</li>
            <li>Sit with this open awareness for 5–10 minutes.</li>
          </ol>
          <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
            Based on McKenna et al. (2017): MBCT specifically adapted for tinnitus showed significant
            reductions in distress and depression. DOI: 10.1159/000478267
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sub-tabs">
        {exercises.map((e, i) => (
          <button
            key={i}
            className={`sub-tab-btn${activeEx === i ? ' active' : ''}`}
            onClick={() => setActiveEx(i)}
          >
            {e.title}
          </button>
        ))}
      </div>
      <div className="exercise-card">
        <h3>{exercises[activeEx].title}</h3>
        {exercises[activeEx].body}
      </div>
    </div>
  );
}

// Sound enrichment tab
function SoundTab({ match }: { match: TinnitusMatch | null }) {
  const [noiseType, setNoiseType] = useState<NoiseType>('pink');

  function handlePlay(gain: number): boolean {
    return audioEngine.playNoise(noiseType, 0, gain * 0.9);
  }

  return (
    <div>
      <div className="card-subtitle" style={{ marginBottom: '1rem' }}>
        Background sound reduces the contrast that makes tinnitus more audible in silence. Choose a
        sound and set the volume just below the tinnitus level.
      </div>

      <div className="form-group">
        <label className="form-label">Noise type</label>
        <div className="sub-tabs">
          {(['white', 'pink', 'brown'] as NoiseType[]).map((t) => (
            <button
              key={t}
              className={`sub-tab-btn${noiseType === t ? ' active' : ''}`}
              onClick={() => { audioEngine.stop(); setNoiseType(t); }}
            >
              {t === 'white' ? 'White noise' : t === 'pink' ? 'Pink noise' : 'Brown noise'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          {noiseType === 'white' && 'Equal energy across all frequencies — like TV static.'}
          {noiseType === 'pink' && 'More bass than white noise — like rain or a waterfall. Often most comfortable.'}
          {noiseType === 'brown' && 'Deep, rumbling noise — like thunder or ocean waves.'}
        </p>
      </div>

      {match && (
        <div className="alert alert-info">
          Tip: for narrowband masking near your tinnitus frequency ({formatFrequency(match.frequency)}),
          try the Notched mode.
        </div>
      )}

      <AudioPlayer
        label={`${noiseType} noise`}
        mode="sound"
        onPlay={handlePlay}
        onStop={() => audioEngine.stop()}
      />

      <div className="card" style={{ marginTop: '1rem', background: 'var(--surface2)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Evidence note:</strong> Sound enrichment has moderate evidence for reducing
          tinnitus-related distress and improving sleep (Sereda et al. Cochrane 2018;
          DOI: 10.1002/14651858.CD013094.pub2).
        </p>
      </div>
    </div>
  );
}

// Notched noise tab
function NotchedTab({ match }: { match: TinnitusMatch | null }) {
  const [useNarrowband, setUseNarrowband] = useState(false);

  function handlePlay(gain: number): boolean {
    if (!match) return false;
    if (useNarrowband) {
      return audioEngine.playNarrowband(match.frequency, panFromEar(match.ear), gain * 0.9);
    }
    return audioEngine.playNotchedNoise(match.frequency, panFromEar(match.ear), gain * 0.9);
  }

  if (!match) {
    return (
      <div className="alert alert-warning">
        Complete the <strong>Pitch Finder</strong> and save your tinnitus frequency to unlock notched
        noise therapy.
      </div>
    );
  }

  return (
    <div>
      <div className="alert alert-warning">
        <strong>Experimental:</strong> Notched noise therapy has preliminary evidence but is not yet
        a mainstream clinical recommendation. Use in addition to, not instead of, first-line
        approaches (CBT, sound enrichment).
      </div>

      <div className="card">
        <div className="card-title">Notch centred at {formatFrequency(match.frequency)}</div>
        <div className="card-subtitle">
          White noise with a notch (gap) at your tinnitus frequency. Sustained listening may reduce
          lateral inhibition at that frequency over weeks to months.
        </div>

        <div className="form-group">
          <div className="sub-tabs">
            <button
              className={`sub-tab-btn${!useNarrowband ? ' active' : ''}`}
              onClick={() => { audioEngine.stop(); setUseNarrowband(false); }}
            >
              Notched white noise
            </button>
            <button
              className={`sub-tab-btn${useNarrowband ? ' active' : ''}`}
              onClick={() => { audioEngine.stop(); setUseNarrowband(true); }}
            >
              Narrowband noise
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {useNarrowband
              ? `Narrow band of noise centred at ${formatFrequency(match.frequency)} — useful for matching tinnitus directly.`
              : 'Full-spectrum white noise with a notch removed at the tinnitus frequency — the approach used in research.'}
          </p>
        </div>

        <AudioPlayer
          label="notched noise"
          mode="notched"
          onPlay={handlePlay}
          onStop={() => audioEngine.stop()}
        />
      </div>

      <div className="card" style={{ background: 'var(--surface2)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong>Evidence note:</strong> Okamoto et al. (PNAS 2010; DOI: 10.1073/pnas.0911268107)
          showed that listening to music with a notch centred on the tinnitus frequency over 12 months
          reduced perceived tinnitus loudness in a small RCT. Effect sizes are modest and replication
          in larger studies is ongoing. Claims to reduce tinnitus loudness for most users cannot be made.
        </p>
      </div>
    </div>
  );
}

export default function Therapy({ match, sessionLog, onSessionLogged }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>('education');

  // Stop audio when switching tabs
  const prevTab = useRef(activeTab);
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      audioEngine.stop();
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  // Sync session log after audio sessions (simplified: reload from storage on unmount)
  useEffect(() => {
    return () => { audioEngine.stop(); };
  }, []);

  // Expose updated log to parent — since addSessionLog persists directly, just re-trigger
  const handleSessionLogged = useCallback((log: SessionLog[]) => {
    onSessionLogged(log);
  }, [onSessionLogged]);
  void handleSessionLogged; // used via storage directly in AudioPlayer

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'education', label: 'Education' },
    { id: 'cbt', label: 'CBT' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'sound', label: 'Sound Enrichment' },
    { id: 'notched', label: 'Notched Noise' },
  ];

  return (
    <div>
      <div className="section-header">
        <h2>Therapy</h2>
        <p>Evidence-based tools for tinnitus self-management.</p>
      </div>

      <div className="sub-tabs" style={{ marginBottom: '1.25rem' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`sub-tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'education' && <EducationTab />}
      {activeTab === 'cbt' && <CbtTab />}
      {activeTab === 'mindfulness' && <MindfulnessTab />}
      {activeTab === 'sound' && <SoundTab match={match} />}
      {activeTab === 'notched' && <NotchedTab match={match} />}

      {sessionLog.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-title">Recent Sessions</div>
          {sessionLog
            .slice(-8)
            .reverse()
            .map((s) => (
              <div key={s.id} className="session-item">
                <span style={{ textTransform: 'capitalize' }}>{s.mode} therapy</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {Math.round(s.durationSeconds / 60)} min ·{' '}
                  {new Date(s.startedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
