# QuietPath — Evidence-informed tinnitus self-management

QuietPath is a privacy-first static web app for tinnitus self-management. It helps a user:

- Screen for tinnitus red flags and seek appropriate medical care.
- Record a brief tinnitus/distress assessment.
- Approximate their tinnitus frequency with a safe Web Audio pitch finder.
- Generate a conservative treatment plan grounded in clinical guidelines and systematic reviews.
- Use CBT-informed habituation/adaptation exercises, mindfulness, sound enrichment, narrowband noise, and experimental notched noise.
- Review the research basis and evidence strength for each intervention.

QuietPath does **not** claim to cure tinnitus or reliably reduce tinnitus loudness. It is educational self-management software, not a medical device or a substitute for audiology/ENT/mental-health care.

## Evidence stance

Prioritised:

- Education, reassurance, red-flag triage and referral.
- CBT-informed tinnitus distress management.
- Sleep and stress regulation.
- Safe sound enrichment / partial masking.
- Audiology/hearing-aid assessment where hearing loss is suspected.

Optional/experimental:

- Browser-based pitch matching.
- Notched noise centred on the saved tinnitus frequency.
- Narrowband noise for sound matching/enrichment.

Key sources include AAO-HNSF tinnitus guideline (2014), NICE NG155, Cochrane CBT review (2020), Cima et al. Lancet (2012), Beukes et al. JAMA Otolaryngology (2018), Sereda et al. Cochrane sound therapy (2018), Scherer et al. JAMA Otolaryngology TRT RCT (2019), Okamoto et al. PNAS notched music (2010), McKenna et al. MBCT (2017), and Hoare et al. hearing aids review (2014).

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run ci
```

## Deployment

The app is built with Vite and configured with `base: '/tinnitus-therapy-app/'` for GitHub Pages. The Pages workflow lives at `.github/workflows/deploy-pages.yml` and deploys `dist` on pushes to `main`.

## Privacy

There is no backend. Assessment answers, saved pitch, treatment plan, presets and session logs are stored in browser `localStorage` under `quietpath-v1`.
