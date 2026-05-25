# QuietPath Specification

## Goal

Build a static, GitHub Pages-deployable tinnitus self-management app grounded in current clinical guidelines and research.

## User outcomes

- Understand when tinnitus needs urgent or prompt medical evaluation.
- Record a brief non-diagnostic tinnitus profile and distress baseline.
- Approximate tinnitus pitch safely using browser audio.
- Receive a personalised plan that prioritises evidence-based distress management.
- Use self-guided habituation/adaptation, CBT-style exercises, mindfulness, and sound enrichment.
- Optionally try experimental notched/narrowband sound tools with conservative claims.

## Functional requirements

### Safety and onboarding

- Show medical disclaimer before app use.
- Warn about safe volume and limits of browser audio calibration.
- List red flags: sudden hearing loss, pulsatile tinnitus, unilateral/sudden symptoms, neurological symptoms, vertigo/dizziness, ear pain/discharge, head trauma, suicidal thoughts.
- Explain that data is stored locally only.

### Assessment

- Capture laterality, onset, duration, hearing-loss suspicion, distress, sleep impact, and red flags.
- Include a 7-item tinnitus-distress-inspired screening score (non-diagnostic).
- Persist answers locally.

### Pitch finder

- Use Web Audio oscillator with logarithmic 20–16000 Hz control.
- Provide coarse octave and fine semitone adjustments.
- Provide left/right/both panning.
- Default to low/safe gain and warn about high-frequency tones.
- Save frequency and ear locally.

### Treatment plan

- Generate recommendations from assessment and saved pitch.
- Urgent red flags create top-priority referral recommendation.
- Distress/sleep burden prioritises CBT, sleep, mindfulness and education.
- Hearing loss prompts audiology/hearing-aid assessment.
- Sound enrichment is optional/moderate evidence.
- Notched noise is added only with saved pitch and labelled experimental.

### Therapy modes

- Education and habituation/adaptation content.
- CBT-style thought challenging, attention shifting, acceptance practice.
- Mindfulness/relaxation exercises.
- Sound enrichment with white/pink/brown noise.
- Notched noise and narrowband noise centred on saved frequency.
- Session timer and local session log.

### Research library

- Summarise evidence quality and link/cite clinical guidelines, systematic reviews and RCTs.
- Avoid unsupported cure or loudness-reduction claims.

## Non-functional requirements

- Static app only; no backend.
- Mobile-friendly and keyboard-accessible controls.
- TypeScript strict build.
- Unit tests for plan-generation and pure audio utilities.
- GitHub Pages workflow builds and deploys `dist`.
