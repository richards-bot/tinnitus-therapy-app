import type { IntakeData, TinnitusMatch, TreatmentPlan as TreatmentPlanType, EvidenceTier, Priority } from '../types';
import { generateTreatmentPlan } from '../services/plan-generator';
import { saveTreatmentPlan } from '../utils/storage';
import { formatFrequency } from '../utils/audio';

interface Props {
  intake: IntakeData | null;
  match: TinnitusMatch | null;
  plan: TreatmentPlanType | null;
  onGenerated: (plan: TreatmentPlanType) => void;
  onNavigateTherapy: () => void;
}

function tierBadge(tier: EvidenceTier) {
  const map: Record<EvidenceTier, { cls: string; label: string }> = {
    high: { cls: 'badge badge-high', label: 'Evidence: Strong' },
    moderate: { cls: 'badge badge-moderate', label: 'Evidence: Moderate' },
    experimental: { cls: 'badge badge-experimental', label: 'Experimental' },
    'expert-opinion': { cls: 'badge badge-expert-opinion', label: 'Expert Consensus' },
  };
  const m = map[tier];
  return <span className={m.cls}>{m.label}</span>;
}

function priorityBadge(priority: Priority) {
  const map: Record<Priority, { cls: string; label: string }> = {
    urgent: { cls: 'badge badge-urgent', label: 'Urgent' },
    high: { cls: 'badge badge-high-priority', label: 'High priority' },
    medium: { cls: 'badge badge-medium-priority', label: 'Medium priority' },
    low: { cls: 'badge badge-low-priority', label: 'Lower priority' },
  };
  const m = map[priority];
  return <span className={m.cls}>{m.label}</span>;
}

export default function TreatmentPlan({ intake, match, plan, onGenerated, onNavigateTherapy }: Props) {
  function handleGenerate() {
    if (!intake) return;
    const p = generateTreatmentPlan(intake, match);
    saveTreatmentPlan(p);
    onGenerated(p);
  }

  if (!intake) {
    return (
      <div>
        <div className="section-header">
          <h2>My Plan</h2>
        </div>
        <div className="alert alert-info">
          Complete the <strong>Assessment</strong> first to generate your personalised plan.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2>My Plan</h2>
        <p>Evidence-based recommendations tailored to your assessment.</p>
      </div>

      {!match && (
        <div className="alert alert-info">
          <strong>Tip:</strong> Complete the Pitch Finder to unlock personalised notched noise therapy
          in your plan.
        </div>
      )}

      {match && (
        <div className="alert alert-success">
          Tinnitus frequency saved: <strong>{formatFrequency(match.frequency)}</strong> — notched
          noise therapy is included in your plan.
        </div>
      )}

      {plan ? (
        <div>
          <div className="card" style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div className="card-title">Your QuietPath Plan</div>
                <div className="card-subtitle">
                  Generated {new Date(plan.generatedAt).toLocaleDateString()} ·{' '}
                  distress level:{' '}
                  <strong style={{ textTransform: 'capitalize' }}>{plan.distressCategory}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleGenerate}>
                  Regenerate
                </button>
                <button className="btn btn-primary btn-sm" onClick={onNavigateTherapy}>
                  Open Therapy →
                </button>
              </div>
            </div>
          </div>

          {plan.recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`rec-card${rec.priority === 'urgent' ? ' urgent' : ''}`}
            >
              {rec.priority === 'urgent' && (
                <div className="alert alert-urgent" style={{ marginBottom: '0.75rem' }}>
                  <strong>⚠ Action required:</strong> Please seek medical evaluation.
                </div>
              )}
              <div className="rec-category">{rec.category}</div>
              <div className="rec-header">
                <div className="rec-title">{rec.title}</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {priorityBadge(rec.priority)}
                  {tierBadge(rec.evidenceTier)}
                </div>
              </div>
              <p className="rec-desc">{rec.description}</p>
              <ul className="rec-actions">
                {rec.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              {rec.references.length > 0 && (
                <div className="rec-refs">
                  {rec.references.map((ref, i) => (
                    <span key={i} className="rec-ref">{ref}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="card" style={{ background: 'var(--surface2)', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong>Disclaimer:</strong> This plan is for self-management support only. It does not
              replace professional audiological or psychological care. Evidence tiers reflect the
              current research literature at time of writing; recommendations may change as evidence
              evolves. Consult a healthcare professional before starting any new therapeutic programme.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Ready to generate your plan</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Your assessment has been completed. Click below to generate a personalised evidence-based
            plan based on your responses.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
            Generate My Plan
          </button>
        </div>
      )}
    </div>
  );
}
