# Project: QuietPath

## Project Overview

**What:** Evidence-informed static web app for tinnitus self-management, pitch matching, personalised planning, and safe sound tools.
**Stack:** Vite, React, TypeScript, Web Audio API, Vitest, ESLint, GitHub Pages.
**Status:** Active development / MVP deployed.

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint
npm run typecheck    # Type checks
npm run ci           # Full verification: typecheck, lint, tests, build
npm run preview      # Preview production build
```

## Product guardrails

- This is educational self-management software, not medical advice or a medical device.
- Do not claim to cure tinnitus or reliably reduce tinnitus loudness.
- CBT/education/sleep/stress work is first-line for distress reduction.
- Sound enrichment is optional and should be low-volume/comfortable.
- Notched noise/music is experimental and must be labelled as such.
- Red flags require referral messaging: sudden hearing loss, pulsatile tinnitus, one-sided sudden tinnitus/asymmetric hearing, neurological symptoms, severe vertigo, ear pain/discharge, head trauma, suicidal thoughts.
- All user data stays local in `localStorage`.

## Structure

```text
src/
  components/     # App UI and feature modules
  services/       # Plan generation and evidence logic
  utils/          # Web Audio and localStorage utilities
  types/          # Type definitions
tests/unit/       # Vitest unit tests
docs/             # SPEC and decision log
.github/workflows # GitHub Pages deployment
```

## Evidence sources to preserve

- AAO-HNSF Clinical Practice Guideline: Tinnitus, 2014. DOI: 10.1177/0194599814545325
- NICE NG155, 2020
- Fuller et al. Cochrane CBT, 2020. DOI: 10.1002/14651858.CD012614.pub2
- Cima et al. Lancet, 2012. DOI: 10.1016/S0140-6736(12)60469-3
- Beukes et al. JAMA Otolaryngology, 2018. DOI: 10.1001/jamaoto.2018.2238
- Sereda et al. Cochrane sound therapy, 2018. DOI: 10.1002/14651858.CD013094.pub2
- Okamoto et al. PNAS notched music, 2010. DOI: 10.1073/pnas.0911268107
- McKenna et al. MBCT, 2017. DOI: 10.1159/000478267
- Hoare et al. hearing aids, 2014. DOI: 10.1002/14651858.CD010151.pub2

## Git

Commit format: Conventional commits. Beads was initialised by the template but the Dolt backend is broken in this relocated working copy; see `docs/DECISIONS.md`.
