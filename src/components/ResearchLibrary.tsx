const references = [
  {
    tier: 'Guideline',
    title: 'AAO-HNSF Clinical Practice Guideline: Tinnitus (2014)',
    summary: 'Recommends education, audiologic evaluation when indicated, CBT for persistent bothersome tinnitus, hearing-aid evaluation with hearing loss, and sound therapy as an option. Recommends against routine drugs/supplements/TMS for tinnitus alone.',
    citation: 'Tunkel et al. DOI: 10.1177/0194599814545325',
    url: 'https://doi.org/10.1177/0194599814545325',
  },
  {
    tier: 'Guideline',
    title: 'NICE NG155: Tinnitus assessment and management (2020)',
    summary: 'UK guidance for assessment, red flags, information/support, amplification devices, and psychologically informed management.',
    citation: 'NICE Guideline NG155',
    url: 'https://www.nice.org.uk/guidance/ng155',
  },
  {
    tier: 'High evidence',
    title: 'Cognitive behavioural therapy for tinnitus',
    summary: 'CBT probably reduces negative tinnitus impact and distress. It is not primarily a loudness-reduction treatment.',
    citation: 'Fuller et al. Cochrane 2020. DOI: 10.1002/14651858.CD012614.pub2',
    url: 'https://doi.org/10.1002/14651858.CD012614.pub2',
  },
  {
    tier: 'High evidence',
    title: 'Specialised CBT-based tinnitus care versus usual care',
    summary: 'Large RCT showing specialised CBT-based care improved tinnitus severity and quality of life compared with usual care.',
    citation: 'Cima et al. Lancet 2012. DOI: 10.1016/S0140-6736(12)60469-3',
    url: 'https://doi.org/10.1016/S0140-6736(12)60469-3',
  },
  {
    tier: 'Digital CBT',
    title: 'Guided internet CBT vs face-to-face clinical care',
    summary: 'Guided internet-delivered CBT was effective and clinically relevant for tinnitus distress management.',
    citation: 'Beukes et al. JAMA Otolaryngology 2018. DOI: 10.1001/jamaoto.2018.2238',
    url: 'https://doi.org/10.1001/jamaoto.2018.2238',
  },
  {
    tier: 'Mixed evidence',
    title: 'Tinnitus retraining therapy / habituation',
    summary: 'TRT combines directive counselling and sound therapy. Evidence for the full protocol is limited/mixed; habituation principles remain clinically useful but should not be overclaimed.',
    citation: 'Phillips & McFerran Cochrane 2010 DOI: 10.1002/14651858.CD007330.pub2; Scherer et al. JAMA Otolaryngology 2019 DOI: 10.1001/jamaoto.2019.0821',
    url: 'https://doi.org/10.1001/jamaoto.2019.0821',
  },
  {
    tier: 'Optional aid',
    title: 'Sound therapy / sound enrichment',
    summary: 'Can help some users reduce contrast with silence, support sleep, and make tinnitus less intrusive. Certainty is low to moderate and no sound type is clearly superior.',
    citation: 'Sereda et al. Cochrane 2018. DOI: 10.1002/14651858.CD013094.pub2',
    url: 'https://doi.org/10.1002/14651858.CD013094.pub2',
  },
  {
    tier: 'Experimental',
    title: 'Tailor-made notched music/noise',
    summary: 'Small studies suggest possible benefit, but evidence is preliminary and pitch matching is imprecise. QuietPath labels this as experimental and optional.',
    citation: 'Okamoto et al. PNAS 2010. DOI: 10.1073/pnas.0911268107',
    url: 'https://doi.org/10.1073/pnas.0911268107',
  },
  {
    tier: 'Adjunct',
    title: 'Mindfulness-Based Cognitive Therapy',
    summary: 'MBCT adapted for tinnitus can reduce tinnitus severity/distress and depression symptoms for some people.',
    citation: 'McKenna et al. 2017. DOI: 10.1159/000478267',
    url: 'https://doi.org/10.1159/000478267',
  },
  {
    tier: 'When hearing loss present',
    title: 'Hearing aids / amplification',
    summary: 'Evidence is limited but guidelines support audiology and amplification where hearing loss coexists with tinnitus.',
    citation: 'Hoare et al. Cochrane 2014. DOI: 10.1002/14651858.CD010151.pub2',
    url: 'https://doi.org/10.1002/14651858.CD010151.pub2',
  },
];

export default function ResearchLibrary() {
  return (
    <div>
      <div className="section-header">
        <h2>Research Library</h2>
        <p>What QuietPath is based on — and where evidence is strong, mixed, or experimental.</p>
      </div>

      <div className="card" style={{ background: 'var(--primary-light)' }}>
        <div className="card-title">Evidence stance</div>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
          QuietPath prioritises CBT-informed coping, education, sleep/stress regulation, safe sound enrichment,
          and referral prompts. It does <strong>not</strong> claim to cure tinnitus. Frequency matching and notched
          noise are included as optional experimental tools, because the clinical evidence is less certain.
        </p>
      </div>

      <div className="reference-grid">
        {references.map((ref) => (
          <article className="reference-card" key={ref.title}>
            <span className="badge badge-moderate">{ref.tier}</span>
            <h3>{ref.title}</h3>
            <p>{ref.summary}</p>
            <a href={ref.url} target="_blank" rel="noreferrer">{ref.citation}</a>
          </article>
        ))}
      </div>
    </div>
  );
}
