import { useState, useRef, useEffect, useCallback } from 'react';
import type { Ear, TinnitusMatch } from '../types';
import {
  audioEngine,
  logSliderToFreq,
  freqToLogSlider,
  formatFrequency,
  panFromEar,
  stepFreqBySemitone,
  stepFreqByOctave,
} from '../utils/audio';
import { saveTinnitusMatch } from '../utils/storage';

interface Props {
  match: TinnitusMatch | null;
  onSaved: (match: TinnitusMatch) => void;
}

const SLIDER_MAX = 1000;

export default function PitchFinder({ match, onSaved }: Props) {
  const [sliderPos, setSliderPos] = useState(() =>
    match ? Math.round(freqToLogSlider(match.frequency)) : 500,
  );
  const [ear, setEar] = useState<Ear>(match?.ear ?? 'both');
  const [gain, setGain] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [audioMessage, setAudioMessage] = useState('');
  const earRef = useRef(ear);
  const gainRef = useRef(gain);

  useEffect(() => { earRef.current = ear; }, [ear]);
  useEffect(() => { gainRef.current = gain; }, [gain]);

  const freq = logSliderToFreq(sliderPos);
  const lastAudioParams = useRef({ freq, ear, gain });

  const playTone = useCallback(async () => {
    const ok = await audioEngine.playTone(freq, panFromEar(earRef.current), gainRef.current * 0.9);
    if (ok) setPlaying(true);
    setAudioMessage(audioEngine.lastStatus.message);
  }, [freq]);

  useEffect(() => {
    const previous = lastAudioParams.current;
    const changed = previous.freq !== freq || previous.ear !== ear || previous.gain !== gain;
    lastAudioParams.current = { freq, ear, gain };

    if (playing && changed) {
      audioEngine.stop();
      void audioEngine.playTone(freq, panFromEar(ear), gain * 0.9).then((ok) => {
        if (!ok) setPlaying(false);
        setAudioMessage(audioEngine.lastStatus.message);
      });
    }
  }, [freq, ear, gain, playing]);

  function togglePlay() {
    if (playing) {
      audioEngine.stop();
      setPlaying(false);
      setAudioMessage('');
    } else {
      void playTone();
    }
  }

  function nudge(semitones: number) {
    const newFreq = stepFreqBySemitone(freq, semitones);
    setSliderPos(Math.round(freqToLogSlider(newFreq)));
  }

  function nudgeOctave(octaves: number) {
    const newFreq = stepFreqByOctave(freq, octaves);
    setSliderPos(Math.round(freqToLogSlider(newFreq)));
  }

  function handleSave() {
    const m: TinnitusMatch = {
      frequency: Math.round(freq),
      ear,
      savedAt: new Date().toISOString(),
      notes: '',
    };
    saveTinnitusMatch(m);
    onSaved(m);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  useEffect(() => {
    return () => { audioEngine.stop(); };
  }, []);

  return (
    <div>
      <div className="section-header">
        <h2>Pitch Finder</h2>
        <p>
          Adjust the tone to match your tinnitus. Save it to unlock your personalised notched noise
          therapy.
        </p>
      </div>

      <div className="alert alert-warning">
        <strong>Volume safety:</strong> Start low. Listening above a comfortable level can damage
        hearing. Never use at full volume.
      </div>

      {match && (
        <div className="alert alert-info">
          Previously saved: <strong>{formatFrequency(match.frequency)}</strong> ({match.ear} ear
          {match.ear === 'both' ? 's' : ''}) —{' '}
          {new Date(match.savedAt).toLocaleDateString()}
        </div>
      )}

      <div className="card">
        <div className="card-title">Frequency</div>
        <div className="freq-display">
          {formatFrequency(freq)}
          <small>Adjust the slider or use the buttons below</small>
        </div>

        <div className="form-group">
          <input
            type="range"
            className="slider"
            min={0}
            max={SLIDER_MAX}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Frequency"
            aria-valuemin={20}
            aria-valuemax={16000}
            aria-valuenow={Math.round(freq)}
            aria-valuetext={formatFrequency(freq)}
          />
          <div className="slider-labels">
            <span>20 Hz</span>
            <span>1 kHz</span>
            <span>16 kHz</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Coarse adjustment (octaves)</label>
          <div className="step-controls">
            <button className="step-btn" onClick={() => nudgeOctave(-1)} aria-label="One octave down">−1 oct</button>
            <button className="step-btn" onClick={() => nudgeOctave(-0.5)} aria-label="Half octave down">−½ oct</button>
            <button className="step-btn" onClick={() => nudgeOctave(0.5)} aria-label="Half octave up">+½ oct</button>
            <button className="step-btn" onClick={() => nudgeOctave(1)} aria-label="One octave up">+1 oct</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Fine adjustment (semitones)</label>
          <div className="step-controls">
            <button className="step-btn" onClick={() => nudge(-3)} aria-label="3 semitones down">−3 st</button>
            <button className="step-btn" onClick={() => nudge(-1)} aria-label="1 semitone down">−1 st</button>
            <button className="step-btn" onClick={() => nudge(1)} aria-label="1 semitone up">+1 st</button>
            <button className="step-btn" onClick={() => nudge(3)} aria-label="3 semitones up">+3 st</button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ear / panning</label>
          <div className="ear-selector">
            {(['left', 'both', 'right'] as Ear[]).map((e) => (
              <button
                key={e}
                className={`ear-btn${ear === e ? ' active' : ''}`}
                onClick={() => setEar(e)}
                aria-pressed={ear === e}
              >
                {e === 'left' ? '◄ Left' : e === 'right' ? 'Right ►' : '◄ Both ►'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="volume-row">
            <label>Volume</label>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              value={Math.round(gain * 100)}
              onChange={(e) => setGain(Number(e.target.value) / 100)}
              aria-label="Volume"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '2.5rem', textAlign: 'right' }}>
              {Math.round(gain * 100)}%
            </span>
          </div>
        </div>

        <div className="text-center mt-2">
          <button
            className={`play-btn${playing ? ' playing' : ''}`}
            onClick={togglePlay}
            aria-label={playing ? 'Stop tone' : 'Play tone'}
            aria-pressed={playing}
          >
            {playing ? '■' : '▶'}
          </button>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {playing ? 'Playing — adjust to match your tinnitus' : 'Press to hear tone'}
          </p>
          {audioMessage && (
            <div className={`alert ${playing ? 'alert-info' : 'alert-warning'}`} style={{ marginTop: '0.75rem', textAlign: 'left' }}>
              {audioMessage}
              {!playing && ' If you are using Telegram’s in-app browser, tap the menu and choose “Open in Browser”, then try Safari or Chrome.'}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Save matched frequency</div>
        <div className="card-subtitle">
          Saving enables personalised notched noise therapy in your plan.
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <div>
            <div className="saved-freq-pill">♩ {formatFrequency(freq)} · {ear}</div>
          </div>
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save as My Frequency'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          <strong>Tip:</strong> Play the tone and adjust until it closely matches the pitch of your
          tinnitus. Exact matching is not critical — within a semitone or two is sufficient.
        </p>
      </div>
    </div>
  );
}
