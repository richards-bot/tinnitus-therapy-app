# Decisions

## 2026-05-25 — Static React/Vite app

QuietPath is implemented as a fully static Vite + React + TypeScript app. This keeps deployment simple on GitHub Pages and avoids collecting sensitive health data on a server.

## 2026-05-25 — Local-only persistence

Assessment, pitch match, treatment plan and session history are stored in `localStorage` under `quietpath-v1`. No analytics, accounts, backend or cloud sync are included in the MVP.

## 2026-05-25 — Conservative medical claims

The app frames itself as tinnitus self-management and distress regulation. It does not claim to cure tinnitus or reliably reduce tinnitus loudness. CBT/education/sleep/stress strategies are prioritised; notched noise is explicitly marked experimental.

## 2026-05-25 — Browser audio limitations

Web Audio can generate tones, noise, bandpass and notch filters, but cannot know actual dB SPL because device volume and headphones are outside browser control. The UI therefore uses conservative gain defaults and safety copy rather than calibrated loudness claims.

## 2026-05-25 — Beads unavailable in relocated copy

Ricky's template initialised Beads successfully, but after moving the generated repo into `/home/rich/projects/tinnitus-therapy-app`, the Dolt backend reports `database not found: tinnitus_therapy_app`. Work proceeded without blocking on Beads; commits may need `--no-verify` until Beads is repaired or reinitialised.
