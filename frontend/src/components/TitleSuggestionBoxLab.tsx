import { useMemo, useState } from 'react';
import titleReport from '../titlePromptLabData.json';

type Variant = {
  id: string;
  name: string;
  family: string;
  badge: string;
  scoreType: 'none' | 'single' | 'multi' | 'traffic';
  verdict: 'green' | 'yellow' | 'red';
  rationale: string;
  notes: string[];
  suggestions: string[];
  canPromptMore?: boolean;
  hasDropdown?: boolean;
};

const baseTitle = 'Air Canada and Pilots Union Reach a Tentative Agreement';
const exampleAnalysis = (() => {
  const report = titleReport as any;
  const firstVariant = report?.variants?.[0];
  const firstResult = firstVariant?.results?.[0];
  return {
    title: firstResult?.originalTitle || baseTitle,
    analysis: firstResult?.analysis || 'Assessment: Clear and serviceable, but it could better foreground the industry significance and search terms. Suggested Title: Air Canada and Pilots Union Reach Tentative Labor Agreement',
  };
})();

const variants: Variant[] = [
  {
    id: 'v1',
    name: 'Compact verdict bar',
    family: 'minimal',
    badge: 'Default-friendly',
    scoreType: 'traffic',
    verdict: 'green',
    rationale: 'Fast scan: signal, short note, one apply button.',
    notes: ['Good to go', 'Small SEO tweak possible'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    hasDropdown: true,
  },
  {
    id: 'v2',
    name: 'Editorial card with primary action',
    family: 'editorial',
    badge: 'Most balanced',
    scoreType: 'single',
    verdict: 'yellow',
    rationale: 'Feels like a helpful editor, not a dashboard.',
    notes: ['Worth revising', 'Title is accurate, but the strongest search terms could be tighter.'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    canPromptMore: true,
  },
  {
    id: 'v3',
    name: 'Three-tier traffic light',
    family: 'status',
    badge: 'At-a-glance',
    scoreType: 'traffic',
    verdict: 'yellow',
    rationale: 'Works well if you want simple red/yellow/green language.',
    notes: ['Worth considering', 'Solid headline, but slightly broad for search and trade clarity.'],
    suggestions: ['Air Canada Pilots Reach Tentative Labor Deal with Airline'],
    hasDropdown: true,
  },
  {
    id: 'v4',
    name: 'Score + chips + alternates',
    family: 'score-heavy',
    badge: 'Productized',
    scoreType: 'multi',
    verdict: 'yellow',
    rationale: 'Good when stakeholders want dimensions like SEO and clarity.',
    notes: ['SEO 7/10', 'Clarity 8/10', 'Specificity 6/10', 'Brand fit 8/10'],
    suggestions: [
      'Air Canada and Pilots Union Reach Tentative Labor Agreement',
      'Tentative Labor Deal Reached Between Air Canada and Pilots Union',
    ],
    canPromptMore: true,
  },
  {
    id: 'v5',
    name: 'Quiet default / no notes state',
    family: 'threshold',
    badge: 'Trust-building',
    scoreType: 'none',
    verdict: 'green',
    rationale: 'Ideal when the AI should stay quiet unless there is a real issue.',
    notes: ['No Notes - Works great'],
    suggestions: ['Keep current title'],
  },
  {
    id: 'v6',
    name: 'Why revise only',
    family: 'minimal',
    badge: 'Reason first',
    scoreType: 'none',
    verdict: 'yellow',
    rationale: 'Puts the why ahead of the AI showing off.',
    notes: ['Worth revising', 'It undersells the labor angle and misses a stronger search phrase.'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    canPromptMore: true,
  },
  {
    id: 'v7',
    name: 'SEO alternate shelf',
    family: 'alternatives',
    badge: 'SEO-forward',
    scoreType: 'none',
    verdict: 'yellow',
    rationale: 'Best if editors want one editorial option and one SEO option side by side.',
    notes: ['Worth revising', 'Current title is clear, but the SEO version could name the labor agreement more directly.'],
    suggestions: [
      'Air Canada and Pilots Union Reach Tentative Labor Agreement',
      'Air Canada Pilots Union Reaches Tentative Labor Agreement',
    ],
    hasDropdown: true,
  },
  {
    id: 'v8',
    name: 'Inline apply pills',
    family: 'interaction',
    badge: 'Fastest interaction',
    scoreType: 'traffic',
    verdict: 'green',
    rationale: 'Very easy to test multiple titles without a lot of UI chrome.',
    notes: ['Good to go', 'Optional refinements below'],
    suggestions: [
      'Air Canada and Pilots Union Reach Tentative Labor Agreement',
      'Tentative Labor Agreement Reached by Air Canada and Pilots Union',
      'Air Canada Pilots Reach Tentative Labor Agreement',
    ],
  },
  {
    id: 'v9',
    name: 'Editor assistant thread',
    family: 'chatty',
    badge: 'Conversational',
    scoreType: 'none',
    verdict: 'yellow',
    rationale: 'Good if you want an editor to ask follow-ups inside the same box.',
    notes: ['Worth revisiting', 'I can give you tighter, SEO-friendlier, or slightly punchier options.'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    canPromptMore: true,
    hasDropdown: true,
  },
  {
    id: 'v10',
    name: 'Severity banner + drawer',
    family: 'status',
    badge: 'Clear hierarchy',
    scoreType: 'traffic',
    verdict: 'red',
    rationale: 'Useful if you want the design to clearly distinguish bigger title problems.',
    notes: ['Needs work', 'Current title is accurate but too generic for search and not sharp enough for trade readers.'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
  },
  {
    id: 'v11',
    name: 'Side-by-side suggestion chooser',
    family: 'chooser',
    badge: 'Compare options',
    scoreType: 'single',
    verdict: 'yellow',
    rationale: 'Nice when you want editors to compare multiple options quickly before applying one.',
    notes: ['Overall 78/100', 'The current title works, but the alternatives are a little more precise.'],
    suggestions: [
      'Air Canada and Pilots Union Reach Tentative Labor Agreement',
      'Tentative Labor Agreement Reached by Air Canada and Pilots Union',
      'Air Canada Pilots Union Reaches Tentative Labor Deal',
    ],
    hasDropdown: true,
  },
  {
    id: 'v12',
    name: 'Dropdown-driven “more like this”',
    family: 'generation',
    badge: 'Interactive',
    scoreType: 'multi',
    verdict: 'green',
    rationale: 'Strong option if you want the box itself to become a title ideation tool.',
    notes: ['SEO 8/10', 'Clarity 8/10', 'Specificity 7/10', 'Brand fit 8/10'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    canPromptMore: true,
    hasDropdown: true,
  },
];

export function TitleSuggestionBoxLab() {
  const [activeTitle, setActiveTitle] = useState(exampleAnalysis.title);
  const [selectedVariantId, setSelectedVariantId] = useState('v2');

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || variants[0],
    [selectedVariantId]
  );

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>🎨 Title Suggestion Box Lab</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Design concepts for the Simulate Lantern title-analysis box. Focused on what an editor might actually want to see after clicking Analyze.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Design Picker</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Switch between concepts below. Each one shows the title field and the post-analysis box only.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedVariantId(variant.id)}
              style={{
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: selectedVariant.id === variant.id ? '2px solid #7c3aed' : '1px solid var(--border)',
                background: selectedVariant.id === variant.id ? '#f5f3ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>{variant.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{variant.badge}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>{selectedVariant.name}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{selectedVariant.rationale}</p>

        <div className="tsb-shell" style={{ marginTop: '1rem' }}>
          <label className="tsb-label">Headline</label>
          <input className="tsb-input" value={activeTitle} readOnly />
          {renderVariant(selectedVariant, activeTitle, setActiveTitle)}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>All Concepts</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Quick stacked preview of all title-box directions.
        </p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {variants.map((variant) => (
            <div key={`preview-${variant.id}`} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: '#fcfcfd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{variant.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{variant.badge}</div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setSelectedVariantId(variant.id)}>Open this design</button>
              </div>
              <div className="tsb-shell" style={{ marginTop: '0.9rem' }}>
                <label className="tsb-label">Headline</label>
                <input className="tsb-input" value={exampleAnalysis.title} readOnly />
                {renderVariant(variant, exampleAnalysis.title, () => {})}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderVariant(variant: Variant, title: string, setActiveTitle: (title: string) => void) {
  const accent = getAccent(variant.verdict);
  return (
    <div style={{ marginTop: '0.75rem', borderRadius: '14px', border: `1px solid ${accent.border}`, background: accent.bg, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.9rem 1rem', borderBottom: `1px solid ${accent.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: '#fff', border: `1px solid ${accent.border}`, fontSize: '0.78rem', fontWeight: 700, color: accent.text }}>
            <span>{accent.icon}</span>
            <span>{accent.label}</span>
          </span>
          <span style={{ fontSize: '0.82rem', color: accent.text, fontWeight: 600 }}>{variant.badge}</span>
        </div>
        {renderScore(variant)}
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ color: '#312e81', fontWeight: 700, marginBottom: '0.45rem' }}>AI take</div>
        <div style={{ color: '#4338ca', fontSize: '0.93rem', lineHeight: 1.55 }}>{variant.notes[0]}</div>
        {variant.notes[1] && <div style={{ color: '#5b21b6', fontSize: '0.84rem', marginTop: '0.45rem', lineHeight: 1.5 }}>{variant.notes[1]}</div>}

        <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.65rem' }}>
          {variant.suggestions.map((suggestion, index) => (
            <div key={`${variant.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem 0.85rem', borderRadius: '10px', background: '#fff', border: `1px solid ${accent.border}` }}>
              <div>
                <div style={{ fontWeight: 700, color: '#312e81' }}>{suggestion}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>{suggestion === 'Keep current title' ? 'No better alternative needed here.' : title === suggestion ? 'This matches the current field.' : 'Candidate title generated by the AI.'}</div>
              </div>
              <button type="button" className="btn-primary" onClick={() => setActiveTitle(suggestion === 'Keep current title' ? title : suggestion)}>
                {suggestion === 'Keep current title' ? 'Keep' : 'Use title'}
              </button>
            </div>
          ))}
        </div>

        {(variant.canPromptMore || variant.hasDropdown) && (
          <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: `1px dashed ${accent.border}` }}>
            <div style={{ fontWeight: 700, color: '#312e81', marginBottom: '0.55rem' }}>Ask for more</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {variant.hasDropdown && (
                <select style={{ maxWidth: '220px' }} defaultValue="seo">
                  <option value="seo">More SEO-friendly</option>
                  <option value="buzzy">More buzzy</option>
                  <option value="restrained">More restrained</option>
                  <option value="trade">More trade-specific</option>
                </select>
              )}
              {variant.canPromptMore && (
                <input type="text" placeholder="Ask for another direction…" style={{ flex: '1 1 260px' }} readOnly />
              )}
              <button type="button" className="btn-secondary">Generate more</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderScore(variant: Variant) {
  if (variant.scoreType === 'none') return null;
  if (variant.scoreType === 'single') {
    return <div style={scorePillStyle}>Score: 78</div>;
  }
  if (variant.scoreType === 'multi') {
    return (
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <div style={chipStyle}>SEO 8</div>
        <div style={chipStyle}>Clarity 8</div>
        <div style={chipStyle}>Specificity 7</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
      <span style={trafficDot('#22c55e')}></span>
      <span style={trafficDot('#f59e0b')}></span>
      <span style={trafficDot('#ef4444')}></span>
    </div>
  );
}

function getAccent(verdict: Variant['verdict']) {
  if (verdict === 'green') return { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '🟢', label: 'Good to go' };
  if (verdict === 'red') return { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '🔴', label: 'Needs work' };
  return { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '🟡', label: 'Worth revisiting' };
}

const chipStyle: React.CSSProperties = {
  padding: '0.22rem 0.5rem',
  borderRadius: '999px',
  background: '#fff',
  border: '1px solid #c4b5fd',
  fontSize: '0.74rem',
  fontWeight: 700,
  color: '#5b21b6',
};

const scorePillStyle: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  borderRadius: '999px',
  background: '#fff',
  border: '1px solid #c4b5fd',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#5b21b6',
};

const trafficDot = (color: string): React.CSSProperties => ({
  width: '10px',
  height: '10px',
  borderRadius: '999px',
  background: color,
  display: 'inline-block',
});
