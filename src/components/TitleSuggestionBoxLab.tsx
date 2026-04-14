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
    id: 'nino-edits',
    name: 'Top Pick',
    family: 'nino',
    badge: 'Focused direction',
    scoreType: 'multi',
    verdict: 'yellow',
    rationale: 'Built directly from Nino’s notes: purple AI bubble, verdict pills, traffic-light chips, collapsible lower half, tighter spacing, and a better ask-for-more workflow.',
    notes: ['Worth revisiting', 'Current title is solid, but a more explicit labor-agreement framing would improve search clarity and trade specificity.'],
    suggestions: [
      'Air Canada and Pilots Union Reach Tentative Labor Agreement',
      'Tentative Labor Agreement Reached Between Air Canada and Pilots Union',
    ],
    canPromptMore: true,
    hasDropdown: true,
  },
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
    notes: ['SEO 7/10', 'Clarity 8/10', 'Brand fit 6/10', 'Brand fit 8/10'],
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
    notes: ['SEO 8/10', 'Clarity 8/10', 'Brand fit 7/10', 'Brand fit 8/10'],
    suggestions: ['Air Canada and Pilots Union Reach Tentative Labor Agreement'],
    canPromptMore: true,
    hasDropdown: true,
  },
];

export function TitleSuggestionBoxLab() {
  const [activeTitle, setActiveTitle] = useState(exampleAnalysis.title);
  const [selectedVariantId, setSelectedVariantId] = useState('nino-edits');
  const [generatedByVariant, setGeneratedByVariant] = useState<Record<string, string[]>>({});
  const [toneByVariant, setToneByVariant] = useState<Record<string, string>>({});
  const [promptByVariant, setPromptByVariant] = useState<Record<string, string>>({});
  const [loadingByVariant, setLoadingByVariant] = useState<Record<string, boolean>>({});
  const [collapsedByVariant, setCollapsedByVariant] = useState<Record<string, boolean>>({ 'nino-edits': false });

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || variants[0],
    [selectedVariantId]
  );

  const generateMore = (variant: Variant) => {
    const tone = toneByVariant[variant.id] || 'seo';
    const customPrompt = (promptByVariant[variant.id] || '').trim().toLowerCase();
    setLoadingByVariant((current) => ({ ...current, [variant.id]: true }));
    window.setTimeout(() => {
      const next = buildGeneratedSuggestions(activeTitle, tone, customPrompt);
      setGeneratedByVariant((current) => ({ ...current, [variant.id]: [...(current[variant.id] || []), ...next] }));
      setLoadingByVariant((current) => ({ ...current, [variant.id]: false }));
    }, 1200);
  };

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
          {renderVariant(
            selectedVariant,
            activeTitle,
            setActiveTitle,
            generatedByVariant[selectedVariant.id] || [],
            toneByVariant[selectedVariant.id] || 'seo',
            promptByVariant[selectedVariant.id] || '',
            loadingByVariant[selectedVariant.id] || false,
            collapsedByVariant[selectedVariant.id] || false,
            (value) => setToneByVariant((current) => ({ ...current, [selectedVariant.id]: value })),
            (value) => setPromptByVariant((current) => ({ ...current, [selectedVariant.id]: value })),
            () => generateMore(selectedVariant),
            () => setCollapsedByVariant((current) => ({ ...current, [selectedVariant.id]: !current[selectedVariant.id] }))
          )}
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
                {renderVariant(
                  variant,
                  variant.id === 'nino-edits' ? activeTitle : exampleAnalysis.title,
                  variant.id === 'nino-edits' ? setActiveTitle : () => {},
                  generatedByVariant[variant.id] || [],
                  toneByVariant[variant.id] || 'seo',
                  promptByVariant[variant.id] || '',
                  loadingByVariant[variant.id] || false,
                  collapsedByVariant[variant.id] || false,
                  (value) => setToneByVariant((current) => ({ ...current, [variant.id]: value })),
                  (value) => setPromptByVariant((current) => ({ ...current, [variant.id]: value })),
                  () => generateMore(variant),
                  () => setCollapsedByVariant((current) => ({ ...current, [variant.id]: !current[variant.id] }))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderVariant(
  variant: Variant,
  title: string,
  setActiveTitle: (title: string) => void,
  generatedSuggestions: string[],
  selectedTone: string,
  customPrompt: string,
  isLoading: boolean,
  isCollapsed: boolean,
  onToneChange: (value: string) => void,
  onPromptChange: (value: string) => void,
  onGenerateMore: () => void,
  onToggleCollapsed: () => void
) {
  const accent = getAccent(variant.verdict);
  const allSuggestions = [...variant.suggestions, ...generatedSuggestions];

  return (
    <div style={{ marginTop: '0.75rem', borderRadius: '14px', border: '1px solid #c4b5fd', background: '#f5f3ff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', padding: '0.8rem 0.95rem', borderBottom: isCollapsed ? 'none' : '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={variant.verdict === 'green' ? { ...verdictPillStyle('#16a34a', '#f0fdf4'), borderColor: '#16a34a', outline: '2px solid #16a34a', fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' } : { ...verdictPillStyle('#16a34a', '#f0fdf4'), opacity: 0.2, fontWeight: 700 }}>Good to go</span>
          <span style={variant.verdict === 'yellow' ? { ...verdictPillStyle('#a16207', '#fef3c7'), borderColor: '#a16207', outline: '2px solid #a16207', fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' } : { ...verdictPillStyle('#a16207', '#fef3c7'), opacity: 0.2, fontWeight: 700 }}>Worth Revisiting</span>
          <span style={variant.verdict === 'red' ? { ...verdictPillStyle('#b91c1c', '#fef2f2'), borderColor: '#b91c1c', outline: '2px solid #b91c1c', fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' } : { ...verdictPillStyle('#b91c1c', '#fef2f2'), opacity: 0.2, fontWeight: 700 }}>Needs Work</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {renderSignalChip('SEO', 'yellow')}
          {renderSignalChip('Clarity', variant.verdict === 'red' ? 'red' : 'green')}
          {renderSignalChip('Brand Fit', variant.verdict === 'green' ? 'green' : 'yellow')}
          <button
            type="button"
            onClick={onToggleCollapsed}
            style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0.15rem 0.2rem' }}
            aria-label={isCollapsed ? 'Expand details' : 'Collapse details'}
            title={isCollapsed ? 'Expand details' : 'Collapse details'}
          >
            {isCollapsed ? '▾' : '▴'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ padding: '0.8rem 0.95rem' }}>
          <div style={{ color: '#4c1d95', fontSize: '0.9rem', lineHeight: 1.45 }}>{variant.notes[1] || variant.notes[0]}</div>

          <>
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.55rem' }}>
          {allSuggestions.map((suggestion, index) => (
            <div key={`${variant.id}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', alignItems: 'flex-start', padding: '0.65rem 0.75rem', borderRadius: '10px', background: '#fff', border: '1px solid #ddd6fe' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#312e81' }}>{suggestion}</div>
                <div style={{ color: '#64748b', fontSize: '0.77rem', marginTop: '0.18rem', lineHeight: 1.4 }}>{getSuggestionWhy(index, suggestion, title)}</div>
              </div>
              <button type="button" className="btn-primary" onClick={() => setActiveTitle(suggestion === 'Keep current title' ? title : suggestion)}>
                {suggestion === 'Keep current title' ? 'Keep' : 'Use title'}
              </button>
            </div>
          ))}
        </div>

        {(variant.canPromptMore || variant.hasDropdown) && (
          <div style={{ marginTop: '0.95rem', paddingTop: '0.95rem', borderTop: '2px solid #6d28d9' }}>
            <div style={{ fontWeight: 700, color: '#312e81', marginBottom: '0.55rem' }}>Ask for more</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {variant.hasDropdown && (
                <select style={{ maxWidth: '220px' }} value={selectedTone} onChange={(e) => onToneChange(e.target.value)}>
                  <option value="seo">More SEO-friendly</option>
                  <option value="buzzy">More buzzy</option>
                  <option value="restrained">More restrained</option>
                  <option value="trade">More trade-specific</option>
                </select>
              )}
              {variant.canPromptMore && (
                <textarea
                  placeholder="Ask for another direction…"
                  style={{ flex: '1 1 320px', minHeight: '72px', resize: 'vertical' }}
                  value={customPrompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                />
              )}
              <button type="button" className="btn-secondary" onClick={onGenerateMore} disabled={isLoading}>
                {isLoading ? 'Generating…' : 'Generate more'}
              </button>
            </div>
            {isLoading && (
              <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6d28d9', fontSize: '0.82rem' }}>
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Thinking through more title options…</span>
              </div>
            )}
          </div>
        )}
          </>
        </div>
      )}
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
        <div style={chipStyle}>Brand Fit 7</div>
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

function getSuggestionWhy(index: number, suggestion: string, currentTitle: string): string {
  if (suggestion === 'Keep current title') return 'No stronger change appears necessary.';
  if (suggestion === currentTitle) return 'This keeps the current wording in the field.';
  const reasons = [
    'Makes the main subject clearer and strengthens search intent.',
    'Feels more explicit and trade-friendly without getting buzzy.',
    'Surfaces the labor-agreement angle faster for busy readers.',
    'Improves specificity while keeping the editorial tone professional.',
  ];
  return reasons[index % reasons.length];
}

function buildGeneratedSuggestions(currentTitle: string, tone: string, customPrompt: string): string[] {
  const subject = currentTitle.replace(/["']/g, '').trim();

  const seo = [
    `${subject} Tentative Labor Agreement Explained`,
    `Air Canada Pilots Union Reaches Tentative Labor Agreement`,
  ];
  const buzzy = [
    `Air Canada and Pilots Edge Toward Labor Peace with Tentative Deal`,
    `Tentative Deal Marks a Key Labor Moment for Air Canada and Its Pilots`,
  ];
  const restrained = [
    `${subject} with a Sharper Labor Angle`,
    `Air Canada and Pilots Union Reach Tentative Labor Agreement`,
  ];
  const trade = [
    `Air Canada, Pilots Union Reach Tentative Labor Agreement`,
    `Tentative Labor Agreement Reached Between Air Canada and Pilots Union`,
  ];

  let suggestions = seo;
  if (tone === 'buzzy') suggestions = buzzy;
  else if (tone === 'restrained') suggestions = restrained;
  else if (tone === 'trade') suggestions = trade;

  if (customPrompt.includes('short')) {
    suggestions = suggestions.map((s) => s.replace('Tentative ', '').slice(0, 68));
  }
  if (customPrompt.includes('seo')) {
    suggestions = seo;
  }
  if (customPrompt.includes('buzzy')) {
    suggestions = buzzy;
  }
  if (customPrompt.includes('trade')) {
    suggestions = trade;
  }
  if (customPrompt.includes('restrained') || customPrompt.includes('conservative')) {
    suggestions = restrained;
  }

  return suggestions;
}

function renderSignalChip(label: string, color: 'green' | 'yellow' | 'red') {
  const palette = color === 'green'
    ? { bg: '#f0fdf4', text: '#166534', border: '#86efac' }
    : color === 'red'
      ? { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' }
      : { bg: '#fffbeb', text: '#a16207', border: '#fcd34d' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.24rem 0.52rem', borderRadius: '999px', background: palette.bg, border: `1px solid ${palette.border}`, fontSize: '0.76rem', fontWeight: 700, color: palette.text }}>
      <span>{label}</span>
    </span>
  );
}

function verdictPillStyle(text: string, bg: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.6rem',
    borderRadius: '999px',
    background: bg,
    border: '1px solid rgba(15,23,42,0.08)',
    fontSize: '0.77rem',
    fontWeight: 700,
    color: text,
  };
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
