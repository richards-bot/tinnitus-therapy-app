import type {
  IntakeData,
  TinnitusMatch,
  TreatmentPlan,
  TreatmentRecommendation,
  DistressCategory,
} from '../types';

export function getDistressCategory(score: number): DistressCategory {
  if (score < 8) return 'minimal';
  if (score < 16) return 'mild';
  if (score < 22) return 'moderate';
  return 'severe';
}

function hasAnyRedFlag(intake: IntakeData): boolean {
  return (
    intake.redFlags.pulsatile ||
    intake.redFlags.unilateralSudden ||
    intake.redFlags.neurologicalSymptoms ||
    intake.redFlags.drainageOrPain ||
    intake.redFlags.recentHeadTrauma
  );
}

function urgentReferralRec(intake: IntakeData): TreatmentRecommendation {
  const flagList: string[] = [];
  if (intake.redFlags.pulsatile) flagList.push('pulsatile (heartbeat-like) tinnitus');
  if (intake.redFlags.unilateralSudden) flagList.push('sudden onset in one ear');
  if (intake.redFlags.neurologicalSymptoms) flagList.push('neurological symptoms');
  if (intake.redFlags.drainageOrPain) flagList.push('ear drainage or pain');
  if (intake.redFlags.recentHeadTrauma) flagList.push('recent head/neck trauma');

  return {
    id: 'urgent-referral',
    category: 'Medical Referral',
    title: 'Seek Medical Evaluation Promptly',
    description:
      'One or more features of your tinnitus warrant prompt assessment by a doctor or ENT specialist to rule out underlying medical causes.',
    evidenceTier: 'expert-opinion',
    priority: 'urgent',
    actionItems: [
      `See your GP or ENT as soon as possible. Identified concern(s): ${flagList.join(', ')}.`,
      'Do not delay — some causes of pulsatile or sudden-onset tinnitus require urgent investigation.',
      'Bring a timeline of symptom onset and any associated symptoms.',
    ],
    references: ['AAO-HNSF Tinnitus Guideline 2014 (DOI: 10.1177/0194599814545325)'],
  };
}

function educationRec(): TreatmentRecommendation {
  return {
    id: 'education',
    category: 'Education & Habituation',
    title: 'Tinnitus Education and Habituation',
    description:
      'Understanding what tinnitus is — and is not — reduces fear and reactive distress. The brain can learn to treat the tinnitus signal as non-threatening, a process called habituation. Education is recommended in all major clinical guidelines as a first step.',
    evidenceTier: 'high',
    priority: 'high',
    actionItems: [
      'Read the Education module in the Therapy section of this app.',
      'Understand that tinnitus is rarely a sign of serious disease in most people.',
      'Learn about the neurological basis of habituation.',
      'Avoid silence-seeking, which can maintain hypervigilance to the sound.',
    ],
    references: [
      'AAO-HNSF Tinnitus Guideline 2014 (DOI: 10.1177/0194599814545325)',
      'NICE Guideline NG155 (2020)',
    ],
  };
}

function cbtRec(): TreatmentRecommendation {
  return {
    id: 'cbt',
    category: 'Psychological Support',
    title: 'Cognitive Behavioural Therapy (CBT)',
    description:
      'CBT is the intervention with the strongest evidence base for reducing tinnitus-related distress, anxiety, and quality-of-life impact. It works by changing unhelpful thought patterns and behaviours associated with tinnitus, not by reducing the sound itself. Internet-delivered CBT (iCBT) has also shown benefit.',
    evidenceTier: 'high',
    priority: 'high',
    actionItems: [
      'Work through the CBT module in the Therapy section.',
      'Consider a referral to a psychologist or CBT therapist experienced with tinnitus.',
      'Internet-delivered programmes are an evidence-based alternative.',
      'Allow 8–12 weeks for a full CBT course.',
    ],
    references: [
      'Fuller et al. Cochrane 2020 (DOI: 10.1002/14651858.CD012614.pub2)',
      'Cima et al. Lancet 2012 (DOI: 10.1016/S0140-6736(12)60469-3)',
      'Beukes et al. JAMA Otolaryngology 2018 (DOI: 10.1001/jamaoto.2018.2238)',
    ],
  };
}

function sleepRec(): TreatmentRecommendation {
  return {
    id: 'sleep',
    category: 'Sleep Hygiene',
    title: 'Sleep Improvement Strategies',
    description:
      'Poor sleep worsens tinnitus distress, and tinnitus worsens sleep — a vicious cycle. Sleep hygiene and CBT for Insomnia (CBT-I) can break this cycle. Sound enrichment at bedtime can help reduce tinnitus audibility in silence.',
    evidenceTier: 'high',
    priority: 'high',
    actionItems: [
      'Use low-level background sound at bedtime (see Sound Enrichment in Therapy).',
      'Maintain a consistent sleep schedule.',
      'Avoid screens 1 hour before bed.',
      'Keep the bedroom cool, dark, and quiet — but not silent if tinnitus is disruptive.',
      'Consider a referral for CBT-I if sleep remains disrupted.',
    ],
    references: [
      'AAO-HNSF Tinnitus Guideline 2014 (DOI: 10.1177/0194599814545325)',
      'NICE Guideline NG155 (2020)',
    ],
  };
}

function stressRec(): TreatmentRecommendation {
  return {
    id: 'stress',
    category: 'Stress Management',
    title: 'Stress Reduction and Relaxation',
    description:
      'Stress and anxiety amplify tinnitus perception. Relaxation techniques, mindfulness, and lifestyle changes that reduce chronic stress can meaningfully reduce tinnitus-related distress.',
    evidenceTier: 'moderate',
    priority: 'medium',
    actionItems: [
      'Practice the Mindfulness module in this app daily.',
      'Engage in regular aerobic exercise (30 min, 5 days/week).',
      'Reduce caffeine and alcohol, which can worsen tinnitus for some people.',
      'Consider Mindfulness-Based Cognitive Therapy (MBCT) for tinnitus.',
    ],
    references: [
      'McKenna et al. 2017 (DOI: 10.1159/000478267)',
      'NICE Guideline NG155 (2020)',
    ],
  };
}

function audiologyRec(level: string): TreatmentRecommendation {
  const severe = level === 'suspected-moderate-severe' || level === 'confirmed';
  return {
    id: 'audiology',
    category: 'Hearing Assessment',
    title: 'Audiology and Hearing Aid Assessment',
    description:
      'Hearing loss frequently co-occurs with tinnitus. Treating hearing loss with hearing aids can improve tinnitus distress and reduce the perceived loudness of tinnitus in some people. A full audiological assessment is recommended.',
    evidenceTier: 'moderate',
    priority: severe ? 'high' : 'medium',
    actionItems: [
      'Request a referral for a full audiological assessment (pure-tone audiogram).',
      severe
        ? 'Given the degree of suspected hearing loss, hearing aids should be discussed with an audiologist.'
        : 'Even mild hearing loss can contribute to tinnitus; discuss options with an audiologist.',
      'Hearing aids with built-in sound generators are an option for combined hearing loss and tinnitus.',
    ],
    references: [
      'Hoare et al. Cochrane 2014 (DOI: 10.1002/14651858.CD010151.pub2)',
      'Scherer & Formby JAMA Otolaryngology 2019 (DOI: 10.1001/jamaoto.2019.0821)',
    ],
  };
}

function soundEnrichmentRec(): TreatmentRecommendation {
  return {
    id: 'sound-enrichment',
    category: 'Sound Therapy',
    title: 'Sound Enrichment / Background Noise',
    description:
      'Adding low-level background sound (nature sounds, white noise, music) reduces the contrast between tinnitus and silence, making tinnitus less noticeable. This is called sound enrichment or sound therapy.',
    evidenceTier: 'moderate',
    priority: 'medium',
    actionItems: [
      'Use the Sound Enrichment mode in this app.',
      'Choose a sound at a level just below the tinnitus — not to mask it completely.',
      'Try different sounds: pink noise, white noise, brown noise.',
      'Use sound enrichment during quiet activities and at bedtime.',
    ],
    references: [
      'Sereda et al. Cochrane 2018 (DOI: 10.1002/14651858.CD013094.pub2)',
      'Phillips & McFerran Cochrane 2010 (DOI: 10.1002/14651858.CD007330.pub2)',
    ],
  };
}

function notchedNoiseRec(frequency: number): TreatmentRecommendation {
  return {
    id: 'notched-noise',
    category: 'Experimental Sound Therapy',
    title: `Notched Noise Therapy (centred at ${Math.round(frequency)} Hz)`,
    description:
      'Notched music/noise therapy removes a band of sound centred on the tinnitus frequency, aiming to reduce lateral inhibition at that frequency in the auditory cortex. Results from small studies are promising but evidence remains preliminary. This is an experimental approach not yet in mainstream guidelines.',
    evidenceTier: 'experimental',
    priority: 'low',
    actionItems: [
      'Use the Notched Noise mode in this app (frequency pre-set to your saved match).',
      'Listen for 1–2 hours per day during other activities.',
      'Combine with, not instead of, first-line approaches.',
      'Manage expectations: benefit, if any, may take weeks to months.',
      'Stop if any discomfort or worsening occurs.',
    ],
    references: [
      'Okamoto et al. PNAS 2010 (DOI: 10.1073/pnas.0911268107)',
    ],
  };
}

function mindfulnessRec(): TreatmentRecommendation {
  return {
    id: 'mindfulness',
    category: 'Mindfulness',
    title: 'Mindfulness-Based Practice',
    description:
      'Mindfulness practice teaches non-judgmental awareness of sensations including tinnitus. Studies show improvements in tinnitus distress, anxiety, and quality of life. MBCT specifically adapted for tinnitus has evidence of benefit.',
    evidenceTier: 'moderate',
    priority: 'medium',
    actionItems: [
      'Work through the Mindfulness module in this app.',
      'Aim for at least 10 minutes of practice daily.',
      'Consider a formal MBCT-for-tinnitus programme if available locally.',
    ],
    references: [
      'McKenna et al. 2017 (DOI: 10.1159/000478267)',
    ],
  };
}

export function generateTreatmentPlan(
  intake: IntakeData,
  match: TinnitusMatch | null,
): TreatmentPlan {
  const recs: TreatmentRecommendation[] = [];
  const category = getDistressCategory(intake.distressScore);

  if (hasAnyRedFlag(intake)) {
    recs.push(urgentReferralRec(intake));
  }

  recs.push(educationRec());

  if (intake.distressScore >= 16 || intake.distressLevel >= 5) {
    recs.push(cbtRec());
  }

  if (intake.sleepImpact >= 4 || intake.distressScreening.sleep >= 2) {
    recs.push(sleepRec());
  }

  if (intake.distressScore >= 12) {
    recs.push(stressRec());
    recs.push(mindfulnessRec());
  }

  if (intake.hearingLoss !== 'none') {
    recs.push(audiologyRec(intake.hearingLoss));
  }

  recs.push(soundEnrichmentRec());

  if (match !== null) {
    recs.push(notchedNoiseRec(match.frequency));
  }

  return {
    generatedAt: new Date().toISOString(),
    basedOnIntake: true,
    basedOnFrequency: match !== null,
    distressCategory: category,
    recommendations: recs,
  };
}
