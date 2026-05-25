import { useState } from 'react';
import { acceptDisclaimer } from '../utils/storage';

interface Props {
  onAccepted: () => void;
}

export default function Disclaimer({ onAccepted }: Props) {
  const [checked, setChecked] = useState(false);

  function handleAccept() {
    if (!checked) return;
    acceptDisclaimer();
    onAccepted();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="modal">
        <h2 id="disclaimer-title">⚠ Important Information Before You Begin</h2>

        <p>
          <strong>QuietPath is a self-management support tool, not a medical service.</strong> It provides
          education and evidence-informed techniques to help reduce tinnitus-related distress. It does{' '}
          <em>not</em> diagnose, treat, or cure tinnitus or any medical condition.
        </p>

        <p><strong>Seek medical advice if you have any of the following:</strong></p>
        <ul>
          <li>Tinnitus that pulses in time with your heartbeat (pulsatile tinnitus)</li>
          <li>Sudden onset of tinnitus, especially in one ear</li>
          <li>Tinnitus accompanied by hearing loss, dizziness, or facial weakness</li>
          <li>Ear pain, discharge, or pressure</li>
          <li>Tinnitus following a head or neck injury</li>
        </ul>
        <p>If any of the above apply, please see your GP or an ENT specialist before using this app.</p>

        <p><strong>Volume and hearing safety:</strong> This app generates audio tones and noise. Always
          start at a low volume. Never use at loud levels — permanent hearing damage can worsen tinnitus.
          Use comfortable headphones or speakers at a relaxing volume.</p>

        <p><strong>Privacy:</strong> All data (assessment, frequency matches, session logs) is stored
          only on this device. Nothing is sent to any server. This is a fully local, offline-capable app.</p>

        <p>
          QuietPath is inspired by evidence-based guidelines (AAO-HNSF 2014, NICE NG155) but is not a
          substitute for professional audiological or psychological care.
        </p>

        <div className="modal-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              aria-required="true"
            />
            I understand that QuietPath is a self-help tool, not medical treatment, and I will seek
            professional advice if I have any of the warning signs listed above.
          </label>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleAccept}
            disabled={!checked}
            aria-disabled={!checked}
          >
            I Understand — Begin
          </button>
        </div>
      </div>
    </div>
  );
}
