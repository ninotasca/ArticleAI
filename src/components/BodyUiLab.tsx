import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types & mock data
// ---------------------------------------------------------------------------

type Severity = 'critical' | 'moderate' | 'minor';
type SuggestionKind = 'structure' | 'clarity' | 'seo' | 'tone' | 'fact';

interface BodySuggestion {
  id: string;
  kind: SuggestionKind;
  severity: Severity;
  title: string;
  description: string;
  fix?: string; // optional short rewrite/action
}

interface BodyAnalysis {
  overallStatus: 'strong' | 'solid' | 'needs_work';
  summary: string;
  editorNote: string;
  suggestions: BodySuggestion[];
  dimensionRatings: {
    structure: 'green' | 'yellow' | 'red';
    clarity: 'green' | 'yellow' | 'red';
    seo: 'green' | 'yellow' | 'red';
    tone: 'green' | 'yellow' | 'red';
  };
}

const MOCK_BODY_TEXT = `Air Canada and its pilots union have reached a tentative agreement, ending weeks of tense negotiations that threatened to disrupt summer travel across Canada and internationally.

The deal, announced late Tuesday, was brokered with the help of federal mediators and covers compensation, scheduling, and work-rule changes. Details of the agreement have not been released pending ratification by union members.

The tentative agreement comes after pilots rejected a previous offer last month. Travel industry observers said the timing was critical, as the summer booking season is already underway for corporate travel managers and incentive planners across North America.

CUPE, which represents Air Canada's flight attendants, reached its own agreement earlier in the year.`;

const MOCK_ANALYSIS: BodyAnalysis = {
  overallStatus: 'solid',
  summary: 'Solid reporting with clear structure. A few areas could sharpen the trade-industry angle and improve search findability.',
  editorNote: 'The lede and context are well-handled. The third paragraph buries the trade angle — incentive planners and corporate travel managers should be foregrounded earlier. The CUPE reference at the end feels like an afterthought; either expand it or cut it.',
  dimensionRatings: {
    structure: 'green',
    clarity: 'yellow',
    seo: 'yellow',
    tone: 'green',
  },
  suggestions: [
    {
      id: 's1',
      kind: 'clarity',
      severity: 'critical',
      title: 'Trade angle buried in paragraph 3',
      description: 'The impact on corporate travel managers and incentive planners doesn\'t appear until the third paragraph. For a B2B trade audience, this is the most relevant hook and should come much earlier.',
      fix: 'Move the corporate travel / incentive planner impact to the second paragraph, immediately after the lede.',
    },
    {
      id: 's2',
      kind: 'seo',
      severity: 'critical',
      title: 'Missing key search terms',
      description: '"Labor agreement" and "pilot strike" are the terms readers are searching for. The article uses "tentative agreement" but never "labor agreement" in full — a missed SEO opportunity.',
      fix: 'Add "labor agreement" explicitly in the first two paragraphs.',
    },
    {
      id: 's3',
      kind: 'structure',
      severity: 'minor',
      title: 'CUPE reference needs context or should be cut',
      description: 'The final sentence about CUPE feels orphaned. It adds a data point but no editorial insight. Either give it a full sentence of context (why it matters now) or remove it.',
      fix: 'Either expand: "That deal took four months to ratify — a timeline that may inform expectations here." Or cut entirely.',
    },
    {
      id: 's4',
      kind: 'clarity',
      severity: 'minor',
      title: '"Work-rule changes" is vague',
      description: 'The phrase "compensation, scheduling, and work-rule changes" reads like boilerplate. If any specifics are available, name them. If not, cut "work-rule changes" — it adds noise without meaning.',
    },
    {
      id: 's5',
      kind: 'tone',
      severity: 'minor',
      title: 'Attribution for "travel industry observers" is weak',
      description: '"Travel industry observers said…" is vague attribution that undermines credibility in a trade publication. Name the source or attribute to a specific firm or analyst.',
      fix: 'Replace with a named source or remove the attribution and state the impact directly.',
    },
  ],
};

type VariantId =
  | 'top-pick'
  | 'compact-banner'
  | 'editorial-card'
  | 'dimension-chips'
  | 'checklist'
  | 'severity-triage'
  | 'progressive-expand'
  | 'one-at-a-time'
  | 'score-card'
  | 'inline-annotations'
  | 'summary-first'
  | 'quiet-default'
  | 'focused-feedback'
  | 'followup-b'
  | 'followup-c';

interface Variant {
  id: VariantId;
  name: string;
  badge: string;
  rationale: string;
}

const VARIANTS: Variant[] = [
  {
    id: 'followup-b',
    name: 'Follow-up B — Single Response',
    badge: 'Simple',
    rationale: 'One textarea, one AI response at a time. New question replaces the previous answer. Clean and low-clutter — the editor stays focused on one exchange.',
  },
  {
    id: 'followup-c',
    name: 'Follow-up C — Quick Prompts + Freeform',
    badge: 'Guided',
    rationale: 'Preset chips surfaced from the actual suggestions (e.g. "Fix the SEO angle") sit above a freeform textarea. Quick for editors who aren\'t sure what to ask; freeform for everything else. Responses shown as a running thread.',
  },
  {
    id: 'top-pick',
    name: 'Top Pick',
    badge: 'Recommended',
    rationale: 'Compact banner with no overall status label — just the summary and a count. Suggestion chips show the topic (Clarity, SEO, etc.) but are coloured by severity: yellow for moderate issues, red for critical ones.',
  },
  {
    id: 'compact-banner',
    name: 'Compact Banner',
    badge: 'Low footprint',
    rationale: 'A single-line strip above the body with a status dot and summary. Expands on click. Minimal disruption to the editing flow.',
  },
  {
    id: 'editorial-card',
    name: 'Editorial Card',
    badge: 'Balanced',
    rationale: 'A card with the editor note up front, followed by suggestion cards. Feels like a senior editor\'s handwritten notes — editorial, not dashboardy.',
  },
  {
    id: 'dimension-chips',
    name: 'Dimension Chips',
    badge: 'At-a-glance',
    rationale: 'Four traffic-light chips (Structure, Clarity, SEO, Tone) give a quick dimensional read before the editor digs into details.',
  },
  {
    id: 'checklist',
    name: 'Action Checklist',
    badge: 'Task-oriented',
    rationale: 'Suggestions as checkable tasks. Editors can tick off items as they address them, giving a sense of progress through the feedback.',
  },
  {
    id: 'severity-triage',
    name: 'Severity Triage',
    badge: 'Priority-first',
    rationale: 'Groups feedback into Critical, Moderate, and Minor buckets. Lets editors tackle the most impactful changes first without wading through everything.',
  },
  {
    id: 'progressive-expand',
    name: 'Progressive Expand',
    badge: 'Trust-building',
    rationale: 'Starts with just the summary line and a count of suggestions. Each click reveals one more layer of detail. Good for editors who find AI feedback overwhelming.',
  },
  {
    id: 'one-at-a-time',
    name: 'One at a Time',
    badge: 'Focused',
    rationale: 'Shows a single suggestion with Prev / Next navigation. Keeps the editor focused on one change at a time. Works well for shorter feedback cycles.',
  },
  {
    id: 'score-card',
    name: 'Score Card',
    badge: 'Productized',
    rationale: 'Leads with an overall body score (0–100) broken down by dimension. Familiar to editors who are used to SEO tools. Suggestions sit below the scorecard.',
  },
  {
    id: 'inline-annotations',
    name: 'Inline Annotations',
    badge: 'Editorial feel',
    rationale: 'Suggestions are styled as numbered margin notes — like tracked changes or editorial comments. Strong editorial metaphor that feels natural in a CMS.',
  },
  {
    id: 'summary-first',
    name: 'Summary First',
    badge: 'TL;DR up front',
    rationale: 'Opens with a two-sentence editorial verdict, then lists suggestions below. Editors who are short on time get the key message immediately.',
  },
  {
    id: 'quiet-default',
    name: 'Quiet Default',
    badge: 'Non-intrusive',
    rationale: 'Only surfaces feedback if there\'s something worth fixing. If the body is strong, shows nothing or a single "Looks good" line. Avoids AI feedback fatigue.',
  },
  {
    id: 'focused-feedback',
    name: 'Focused Feedback',
    badge: 'Top issue only',
    rationale: 'Shows only the single most impactful suggestion, with an option to load more. Forces the AI to prioritise — editors appreciate when the AI doesn\'t cry wolf.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chipColor(rating: 'green' | 'yellow' | 'red') {
  if (rating === 'green') return { bg: '#f0fdf4', text: '#166534', border: '#86efac' };
  if (rating === 'red') return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  return { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
}

function kindLabel(kind: SuggestionKind) {
  return { structure: 'Structure', clarity: 'Clarity', seo: 'SEO', tone: 'Tone', fact: 'Fact-check' }[kind];
}

function kindColor(kind: SuggestionKind) {
  const map: Record<SuggestionKind, { bg: string; text: string; border: string }> = {
    structure: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    clarity:   { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' },
    seo:       { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    tone:      { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
    fact:      { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  };
  return map[kind];
}

function severityLabel(s: Severity) {
  return { critical: 'Critical', moderate: 'Moderate', minor: 'Minor' }[s];
}

function severityColor(s: Severity) {
  if (s === 'critical') return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  if (s === 'moderate') return { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
  return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
}

function statusAppearance(status: BodyAnalysis['overallStatus']) {
  if (status === 'strong') return { label: 'Strong', bg: '#f0fdf4', text: '#166534', border: '#86efac' };
  if (status === 'needs_work') return { label: 'Needs Work', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  return { label: 'Solid', bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
}

const SHELL_STYLE: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#fff',
  marginTop: '1rem',
};

const BODY_PREVIEW_STYLE: React.CSSProperties = {
  padding: '1rem',
  fontSize: '0.88rem',
  color: '#374151',
  lineHeight: 1.65,
  borderTop: '1px solid #e2e8f0',
  background: '#fafafa',
  whiteSpace: 'pre-line',
  maxHeight: '160px',
  overflow: 'hidden',
  WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
};

const CHIP_STYLE = (c: { bg: string; text: string; border: string }): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.22rem 0.55rem',
  borderRadius: '999px',
  background: c.bg,
  border: `1px solid ${c.border}`,
  fontSize: '0.74rem',
  fontWeight: 700,
  color: c.text,
});

// ---------------------------------------------------------------------------
// Variant renderers
// ---------------------------------------------------------------------------

function severityChipColor(severity: Severity) {
  if (severity === 'critical') return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  return { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' }; // moderate + minor both yellow
}

function TopPick({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      {/* Always-visible header: full summary + plain text item list */}
      <div style={{ padding: '0.75rem 0.9rem 0.6rem' }}>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#4c1d95', fontWeight: 500, lineHeight: 1.5 }}>
          {analysis.summary}
        </p>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.5 }}>
          {analysis.suggestions.map((s) => s.title).join(' · ')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', background: open ? '#ddd6fe' : '#ede9fe', border: 'none', borderTop: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '0.76rem', fontWeight: 700, padding: '0.4rem', cursor: 'pointer', letterSpacing: '0.02em' }}
      >
        {open ? <>Hide suggestions <span>▴</span></> : <>{analysis.suggestions.length} suggestion{analysis.suggestions.length !== 1 ? 's' : ''} <span>▾</span></>}
      </button>
      {/* Expanded: individual suggestion cards */}
      {open && (
        <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', display: 'grid', gap: '0.55rem' }}>
          {analysis.suggestions.map((s) => {
            const sc = severityChipColor(s.severity);
            return (
              <div key={s.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <div style={{ width: '72px', flexShrink: 0, marginTop: '0.1rem' }}>
                  <span style={CHIP_STYLE(sc)}>{kindLabel(s.kind)}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function CompactBanner({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  const status = statusAppearance(analysis.overallStatus);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.9rem', cursor: 'pointer', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
          <span style={{ ...CHIP_STYLE(chipColor(analysis.dimensionRatings.clarity)), flexShrink: 0 }}>{status.label}</span>
          <span style={{ fontSize: '0.84rem', color: '#4c1d95', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {analysis.summary}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>{analysis.suggestions.length} suggestions</span>
          <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', display: 'grid', gap: '0.55rem' }}>
          {analysis.suggestions.map((s) => {
            const kc = kindColor(s.kind);
            return (
              <div key={s.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <span style={{ ...CHIP_STYLE(kc), flexShrink: 0, marginTop: '0.1rem' }}>{kindLabel(s.kind)}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function EditorialCard({ analysis }: { analysis: BodyAnalysis }) {
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.85rem 0.95rem', borderBottom: '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#4c1d95', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Body Analysis</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(['structure', 'clarity', 'seo', 'tone'] as const).map((dim) => {
              const c = chipColor(analysis.dimensionRatings[dim]);
              return <span key={dim} style={CHIP_STYLE(c)}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>;
            })}
          </div>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#4c1d95', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{analysis.editorNote}"</p>
      </div>
      <div style={{ padding: '0.8rem 0.95rem', display: 'grid', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Suggestions</div>
        {analysis.suggestions.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', gap: '0.7rem', padding: '0.65rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe', alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>
              {s.fix && <div style={{ fontSize: '0.77rem', color: '#059669', marginTop: '0.3rem', fontWeight: 600 }}>→ {s.fix}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function DimensionChips({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.7rem 0.95rem', borderBottom: open ? '1px solid #ddd6fe' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['structure', 'clarity', 'seo', 'tone'] as const).map((dim) => {
            const c = chipColor(analysis.dimensionRatings[dim]);
            return (
              <span key={dim} style={{ ...CHIP_STYLE(c), gap: '0.3rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.text, display: 'inline-block', flexShrink: 0 }} />
                {dim.charAt(0).toUpperCase() + dim.slice(1)}
              </span>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          {open ? 'Hide' : `${analysis.suggestions.length} suggestions`}
          <span>{open ? '▴' : '▾'}</span>
        </button>
      </div>
      {open && (
        <div style={{ padding: '0.8rem 0.95rem', display: 'grid', gap: '0.5rem', borderBottom: '1px solid #ddd6fe' }}>
          {analysis.suggestions.map((s) => {
            const kc = kindColor(s.kind);
            return (
              <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>{s.description}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function ActionChecklist({ analysis }: { analysis: BodyAnalysis }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const done = Object.values(checked).filter(Boolean).length;
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.95rem', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.88rem' }}>Body Feedback</span>
        <span style={{ fontSize: '0.78rem', color: done === analysis.suggestions.length ? '#166534' : '#7c3aed', fontWeight: 600 }}>
          {done}/{analysis.suggestions.length} addressed
        </span>
      </div>
      <div style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.45rem' }}>
        {analysis.suggestions.map((s) => {
          const done = checked[s.id];
          return (
            <div
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: done ? '#f0fdf4' : '#fff', border: `1px solid ${done ? '#86efac' : '#ddd6fe'}`, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <span style={{ flexShrink: 0, width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${done ? '#16a34a' : '#a78bfa'}`, background: done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.1rem' }}>
                {done && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
              </span>
              <div style={{ opacity: done ? 0.5 : 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81', textDecoration: done ? 'line-through' : 'none' }}>{s.title}</div>
                <div style={{ fontSize: '0.77rem', color: '#64748b', marginTop: '0.12rem', lineHeight: 1.4 }}>{s.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function SeverityTriage({ analysis }: { analysis: BodyAnalysis }) {
  const groups: Record<Severity, BodySuggestion[]> = { critical: [], moderate: [], minor: [] };
  analysis.suggestions.forEach((s) => groups[s.severity].push(s));
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.95rem', borderBottom: '1px solid #ddd6fe' }}>
        <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.88rem' }}>Body Review</span>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#6d28d9', lineHeight: 1.45 }}>{analysis.summary}</p>
      </div>
      <div style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.75rem' }}>
        {(['critical', 'moderate', 'minor'] as Severity[]).map((sev) => {
          const items = groups[sev];
          if (!items.length) return null;
          const sc = severityColor(sev);
          return (
            <div key={sev}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <span style={CHIP_STYLE(sc)}>{severityLabel(sev)}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{items.length} item{items.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {items.map((s) => (
                  <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.12rem', lineHeight: 1.4 }}>{s.description}</div>
                    {s.fix && <div style={{ fontSize: '0.77rem', color: '#059669', marginTop: '0.3rem', fontWeight: 600 }}>→ {s.fix}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function ProgressiveExpand({ analysis }: { analysis: BodyAnalysis }) {
  const [level, setLevel] = useState(0); // 0=summary only, 1=+note, 2=+suggestions
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.95rem', borderBottom: level > 0 ? '1px solid #ddd6fe' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '0.86rem', color: '#4c1d95', fontWeight: 500, lineHeight: 1.45, flex: 1 }}>{analysis.summary}</p>
        {level < 2 && (
          <button type="button" onClick={() => setLevel((l) => Math.min(l + 1, 2))} style={{ background: 'none', border: '1px solid #a78bfa', color: '#6d28d9', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            {level === 0 ? `Show editor note` : `Show ${analysis.suggestions.length} suggestions`}
          </button>
        )}
      </div>
      {level >= 1 && (
        <div style={{ padding: '0.75rem 0.95rem', borderBottom: level >= 2 ? '1px solid #ddd6fe' : 'none' }}>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#4c1d95', fontStyle: 'italic', lineHeight: 1.5 }}>"{analysis.editorNote}"</p>
        </div>
      )}
      {level >= 2 && (
        <div style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.5rem', borderBottom: '1px solid #ddd6fe' }}>
          {analysis.suggestions.map((s) => {
            const kc = kindColor(s.kind);
            return (
              <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#312e81' }}>{s.title}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{s.description}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function OneAtATime({ analysis }: { analysis: BodyAnalysis }) {
  const [index, setIndex] = useState(0);
  const s = analysis.suggestions[index];
  const kc = kindColor(s.kind);
  const sc = severityColor(s.severity);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.95rem', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
          <span style={CHIP_STYLE(sc)}>{severityLabel(s.severity)}</span>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{index + 1} of {analysis.suggestions.length}</span>
      </div>
      <div style={{ padding: '0.85rem 0.95rem', borderBottom: '1px solid #ddd6fe' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#312e81', marginBottom: '0.4rem' }}>{s.title}</div>
        <div style={{ fontSize: '0.84rem', color: '#4c1d95', lineHeight: 1.55 }}>{s.description}</div>
        {s.fix && <div style={{ fontSize: '0.82rem', color: '#059669', marginTop: '0.5rem', fontWeight: 600 }}>Suggested fix: {s.fix}</div>}
      </div>
      <div style={{ padding: '0.65rem 0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd6fe' }}>
        <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)} style={{ background: 'none', border: '1px solid #c4b5fd', color: index === 0 ? '#c4b5fd' : '#6d28d9', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: index === 0 ? 'default' : 'pointer' }}>← Prev</button>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {analysis.suggestions.map((_, i) => (
            <span key={i} onClick={() => setIndex(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === index ? '#6d28d9' : '#ddd6fe', display: 'inline-block', cursor: 'pointer' }} />
          ))}
        </div>
        <button type="button" disabled={index === analysis.suggestions.length - 1} onClick={() => setIndex((i) => i + 1)} style={{ background: 'none', border: '1px solid #c4b5fd', color: index === analysis.suggestions.length - 1 ? '#c4b5fd' : '#6d28d9', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: index === analysis.suggestions.length - 1 ? 'default' : 'pointer' }}>Next →</button>
      </div>
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function ScoreCard({ analysis }: { analysis: BodyAnalysis }) {
  const scores: Record<string, number> = { structure: 82, clarity: 68, seo: 71, tone: 88 };
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.85rem 0.95rem', borderBottom: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4c1d95', lineHeight: 1 }}>{overall}</div>
          <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body Score</div>
        </div>
        <div style={{ flex: 1, display: 'grid', gap: '0.35rem', minWidth: '180px' }}>
          {Object.entries(scores).map(([dim, score]) => {
            const c = chipColor(analysis.dimensionRatings[dim as keyof typeof analysis.dimensionRatings]);
            return (
              <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', width: '58px', flexShrink: 0 }}>{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: '#ede9fe', overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', background: c.text, borderRadius: '99px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, width: '26px', textAlign: 'right' }}>{score}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '0.6rem 0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: open ? '1px solid #ddd6fe' : 'none' }}>
        <span style={{ fontSize: '0.82rem', color: '#4c1d95' }}>{analysis.suggestions.length} suggestions to improve this score</span>
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>{open ? 'Hide ▴' : 'Show ▾'}</button>
      </div>
      {open && (
        <div style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.45rem', borderBottom: '1px solid #ddd6fe' }}>
          {analysis.suggestions.map((s) => {
            const kc = kindColor(s.kind);
            return (
              <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#312e81' }}>{s.title}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{s.description}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function InlineAnnotations({ analysis }: { analysis: BodyAnalysis }) {
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd' }}>
      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ flex: 1, padding: '1rem', fontSize: '0.86rem', color: '#374151', lineHeight: 1.7, borderRight: '1px solid #e2e8f0', background: '#fff' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Body</div>
          {MOCK_BODY_TEXT.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: '0 0 0.9em', position: 'relative' }}>
              {para}
              {i === 1 && <sup style={{ marginLeft: '2px', color: '#7c3aed', fontWeight: 800, fontSize: '0.7rem' }}>①</sup>}
              {i === 2 && <sup style={{ marginLeft: '2px', color: '#7c3aed', fontWeight: 800, fontSize: '0.7rem' }}>②</sup>}
            </p>
          ))}
        </div>
        <div style={{ width: '220px', flexShrink: 0, padding: '1rem', background: '#f5f3ff', display: 'grid', gap: '0.65rem', alignContent: 'start' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Editor Notes</div>
          {analysis.suggestions.slice(0, 3).map((s, i) => {
            const kc = kindColor(s.kind);
            return (
              <div key={s.id} style={{ padding: '0.55rem 0.65rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  {i < 3 && <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.72rem' }}>{['①', '②', '③'][i]}</span>}
                  <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#312e81', marginBottom: '0.15rem', lineHeight: 1.3 }}>{s.title}</div>
                <div style={{ color: '#64748b', lineHeight: 1.4 }}>{s.description.slice(0, 90)}…</div>
              </div>
            );
          })}
          {analysis.suggestions.length > 3 && (
            <div style={{ fontSize: '0.76rem', color: '#7c3aed', fontWeight: 600 }}>+{analysis.suggestions.length - 3} more suggestions</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryFirst({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  const status = statusAppearance(analysis.overallStatus);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.85rem 0.95rem', borderBottom: '1px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ ...CHIP_STYLE({ bg: status.bg, text: status.text, border: status.border }), borderColor: status.text, outline: `2px solid ${status.text}`, fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>{status.label}</span>
          <button type="button" onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
            {open ? 'Hide detail ▴' : `${analysis.suggestions.length} suggestions ▾`}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#4c1d95', lineHeight: 1.5 }}>{analysis.editorNote}</p>
      </div>
      {open && (
        <div style={{ padding: '0.75rem 0.95rem', display: 'grid', gap: '0.45rem', borderBottom: '1px solid #ddd6fe' }}>
          {analysis.suggestions.map((s) => {
            const kc = kindColor(s.kind);
            const sc = severityColor(s.severity);
            return (
              <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                  <span style={CHIP_STYLE(sc)}>{severityLabel(s.severity)}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#312e81' }}>{s.title}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{s.description}</div>
                {s.fix && <div style={{ fontSize: '0.77rem', color: '#059669', marginTop: '0.3rem', fontWeight: 600 }}>→ {s.fix}</div>}
              </div>
            );
          })}
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function QuietDefault({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  // Only 1 moderate/critical issue to surface quietly
  const topIssue = analysis.suggestions.find((s) => s.severity !== 'minor');
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #ddd6fe' }}>
      {!open ? (
        <div style={{ padding: '0.65rem 0.95rem', background: '#f5f3ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a16207', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: '0.83rem', color: '#4c1d95' }}>{topIssue?.title ?? 'Body looks good'}</span>
          </div>
          <button type="button" onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            All feedback ▾
          </button>
        </div>
      ) : (
        <div style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
          <div style={{ padding: '0.65rem 0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#4c1d95' }}>All Body Feedback</span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>Collapse ▴</button>
          </div>
          <div style={{ padding: '0 0.95rem 0.75rem', display: 'grid', gap: '0.45rem' }}>
            {analysis.suggestions.map((s) => {
              const kc = kindColor(s.kind);
              return (
                <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                    <span style={CHIP_STYLE(kc)}>{kindLabel(s.kind)}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#312e81' }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{s.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

function FocusedFeedback({ analysis }: { analysis: BodyAnalysis }) {
  const [showAll, setShowAll] = useState(false);
  const top = analysis.suggestions[0];
  const kc = kindColor(top.kind);
  const sc = severityColor(top.severity);
  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.85rem 0.95rem', borderBottom: '1px solid #ddd6fe' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.45rem' }}>Top priority</div>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <span style={CHIP_STYLE(kc)}>{kindLabel(top.kind)}</span>
          <span style={CHIP_STYLE(sc)}>{severityLabel(top.severity)}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#312e81', marginBottom: '0.3rem' }}>{top.title}</div>
        <div style={{ fontSize: '0.84rem', color: '#4c1d95', lineHeight: 1.5 }}>{top.description}</div>
        {top.fix && <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.4rem', fontWeight: 600 }}>→ {top.fix}</div>}
      </div>
      {!showAll ? (
        <div style={{ padding: '0.6rem 0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd6fe' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{analysis.suggestions.length - 1} more suggestions</span>
          <button type="button" onClick={() => setShowAll(true)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Show all ▾</button>
        </div>
      ) : (
        <div style={{ borderBottom: '1px solid #ddd6fe' }}>
          <div style={{ padding: '0.5rem 0.95rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAll(false)} style={{ background: 'none', border: 'none', color: '#6d28d9', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Collapse ▴</button>
          </div>
          <div style={{ padding: '0 0.95rem 0.75rem', display: 'grid', gap: '0.45rem' }}>
            {analysis.suggestions.slice(1).map((s) => {
              const kc2 = kindColor(s.kind);
              return (
                <div key={s.id} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                    <span style={CHIP_STYLE(kc2)}>{kindLabel(s.kind)}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#312e81' }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{s.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock AI responses for follow-up demos
// ---------------------------------------------------------------------------

const MOCK_RESPONSES: Record<string, string> = {
  lede: `Here's a rewritten lede that foregrounds the trade angle:\n\n"Corporate travel managers and incentive planners breathing a sigh of relief: Air Canada and its pilots union have reached a tentative agreement, ending weeks of tense negotiations that threatened to disrupt summer group travel across Canada.\n\nThe deal, announced late Tuesday and brokered with the help of federal mediators, covers compensation, scheduling, and work-rule changes. Details have not been released pending ratification by union members."`,
  seo: `To strengthen search findability, the article needs the phrase "labor agreement" to appear explicitly in the first two paragraphs — not just "tentative agreement." Here's a suggested revision for the second paragraph:\n\n"The tentative labor agreement, announced late Tuesday, was brokered with the help of federal mediators and covers compensation, scheduling, and work-rule changes."\n\nAdding "labor agreement" here picks up the highest-volume search term without changing the editorial tone.`,
  cupe: `The CUPE reference works better with a single sentence of context to explain its relevance now:\n\n"CUPE, which represents Air Canada's flight attendants, reached its own agreement earlier in the year after a four-month ratification process — a timeline that may inform how long this pilots' deal takes to formally close."\n\nIf that context isn't available or verified, cut the reference entirely. A dangling data point undermines rather than supports the piece.`,
  default: `That's a reasonable question. Based on the article, the strongest improvement would be moving the trade-industry angle into the second paragraph. Right now the piece reads as general business news rather than B2B travel content. Foregrounding the impact on corporate travel managers and incentive planners will make it immediately relevant to your audience and improve time-on-page for trade readers.`,
};

function getMockResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('lede') || q.includes('lead') || q.includes('rewrite')) return MOCK_RESPONSES.lede;
  if (q.includes('seo') || q.includes('search')) return MOCK_RESPONSES.seo;
  if (q.includes('cupe') || q.includes('ending') || q.includes('last')) return MOCK_RESPONSES.cupe;
  return MOCK_RESPONSES.default;
}

// ---------------------------------------------------------------------------
// Follow-up Option B — Single active response
// ---------------------------------------------------------------------------

function FollowUpB({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  function submit(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResponse('');
    window.setTimeout(() => {
      setResponse(getMockResponse(q));
      setLoading(false);
    }, 1400);
  }

  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.9rem 0.6rem' }}>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#4c1d95', fontWeight: 500, lineHeight: 1.5 }}>{analysis.summary}</p>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.5 }}>
          {analysis.suggestions.map((s) => s.title).join(' · ')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', background: open ? '#ddd6fe' : '#ede9fe', border: 'none', borderTop: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '0.76rem', fontWeight: 700, padding: '0.4rem', cursor: 'pointer', letterSpacing: '0.02em' }}
      >
        {open ? <>Hide <span>▴</span></> : <>View {analysis.suggestions.length} Suggestions and Refine with AI <span>▾</span></>}
      </button>
      {open && (
        <>
          <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', display: 'grid', gap: '0.55rem' }}>
            {analysis.suggestions.map((s) => {
              const sc = severityChipColor(s.severity);
              return (
                <div key={s.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                  <div style={{ width: '72px', flexShrink: 0, marginTop: '0.1rem' }}>
                    <span style={CHIP_STYLE(sc)}>{kindLabel(s.kind)}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Refine with AI */}
          <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', background: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Refine with AI</div>
            <textarea
              rows={2}
              placeholder="e.g. Rewrite the lede with the trade angle up front…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(question); } }}
              style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #ddd6fe', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => submit(question)}
                disabled={loading || !question.trim()}
                style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, cursor: question.trim() && !loading ? 'pointer' : 'default', opacity: question.trim() && !loading ? 1 : 0.5 }}
              >
                {loading ? 'Thinking…' : 'Ask'}
              </button>
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> Working on it…
              </div>
            )}
            {response && !loading && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.84rem', color: '#312e81', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {response}
              </div>
            )}
          </div>
        </>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Follow-up Option C — Quick prompts + freeform thread
// ---------------------------------------------------------------------------

interface Exchange { question: string; answer: string; }

function FollowUpC({ analysis }: { analysis: BodyAnalysis }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);

  // Derive quick prompts from the top suggestions
  const quickPrompts = analysis.suggestions.slice(0, 3).map((s) => {
    if (s.kind === 'clarity') return `Help me fix: ${s.title}`;
    if (s.kind === 'seo') return `How do I improve the SEO here?`;
    return `Rewrite suggestion: ${s.title}`;
  });

  function submit(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    const asked = q;
    setQuestion('');
    window.setTimeout(() => {
      setThread((t) => [...t, { question: asked, answer: getMockResponse(asked) }]);
      setLoading(false);
    }, 1400);
  }

  return (
    <div style={{ ...SHELL_STYLE, border: '1px solid #c4b5fd', background: '#f5f3ff' }}>
      <div style={{ padding: '0.75rem 0.9rem 0.6rem' }}>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#4c1d95', fontWeight: 500, lineHeight: 1.5 }}>{analysis.summary}</p>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.5 }}>
          {analysis.suggestions.map((s) => s.title).join(' · ')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', background: open ? '#ddd6fe' : '#ede9fe', border: 'none', borderTop: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '0.76rem', fontWeight: 700, padding: '0.4rem', cursor: 'pointer', letterSpacing: '0.02em' }}
      >
        {open ? <>Hide <span>▴</span></> : <>View {analysis.suggestions.length} Suggestions and Refine with AI <span>▾</span></>}
      </button>
      {open && (
        <>
          <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', display: 'grid', gap: '0.55rem' }}>
            {analysis.suggestions.map((s) => {
              const sc = severityChipColor(s.severity);
              return (
                <div key={s.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                  <div style={{ width: '72px', flexShrink: 0, marginTop: '0.1rem' }}>
                    <span style={CHIP_STYLE(sc)}>{kindLabel(s.kind)}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Ask AI area */}
          <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', background: '#fff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Refine with AI</div>
            {/* Quick prompt chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => submit(p)}
                  disabled={loading}
                  style={{ background: '#ede9fe', border: '1px solid #c4b5fd', color: '#6d28d9', borderRadius: '999px', padding: '0.25rem 0.7rem', fontSize: '0.76rem', fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Freeform input */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                rows={2}
                placeholder="Or ask anything else…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(question); } }}
                style={{ flex: 1, resize: 'vertical', fontSize: '0.84rem', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #ddd6fe', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => submit(question)}
                disabled={loading || !question.trim()}
                style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, cursor: question.trim() && !loading ? 'pointer' : 'default', opacity: question.trim() && !loading ? 1 : 0.5, flexShrink: 0 }}
              >
                {loading ? '…' : 'Ask'}
              </button>
            </div>
            {/* Thread */}
            {(thread.length > 0 || loading) && (
              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
                {thread.map((ex, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.3rem' }}>{ex.question}</div>
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.84rem', color: '#312e81', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {ex.answer}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontSize: '0.82rem' }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Working on it…
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <div style={BODY_PREVIEW_STYLE}>{MOCK_BODY_TEXT}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant dispatcher
// ---------------------------------------------------------------------------

function renderVariant(id: VariantId, analysis: BodyAnalysis) {
  switch (id) {
    case 'followup-b':         return <FollowUpB analysis={analysis} />;
    case 'followup-c':         return <FollowUpC analysis={analysis} />;
    case 'top-pick':           return <TopPick analysis={analysis} />;
    case 'compact-banner':     return <CompactBanner analysis={analysis} />;
    case 'editorial-card':     return <EditorialCard analysis={analysis} />;
    case 'dimension-chips':    return <DimensionChips analysis={analysis} />;
    case 'checklist':          return <ActionChecklist analysis={analysis} />;
    case 'severity-triage':    return <SeverityTriage analysis={analysis} />;
    case 'progressive-expand': return <ProgressiveExpand analysis={analysis} />;
    case 'one-at-a-time':      return <OneAtATime analysis={analysis} />;
    case 'score-card':         return <ScoreCard analysis={analysis} />;
    case 'inline-annotations': return <InlineAnnotations analysis={analysis} />;
    case 'summary-first':      return <SummaryFirst analysis={analysis} />;
    case 'quiet-default':      return <QuietDefault analysis={analysis} />;
    case 'focused-feedback':   return <FocusedFeedback analysis={analysis} />;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BodyUiLab() {
  const [selectedId, setSelectedId] = useState<VariantId>('followup-b');
  const selected = VARIANTS.find((v) => v.id === selectedId)!;

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>Body Analysis UI Lab</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Design concepts for the body analysis box that appears above the article body in Simulate Lantern. Each variant shows different ways to surface AI feedback on article body content.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Design Picker</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Select a concept to preview it in detail below.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              style={{
                textAlign: 'left',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: selectedId === v.id ? '2px solid #7c3aed' : '1px solid var(--border)',
                background: selectedId === v.id ? '#f5f3ff' : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>{v.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{v.badge}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>{selected.name}</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{selected.rationale}</p>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>BODY</label>
          {renderVariant(selectedId, MOCK_ANALYSIS)}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>All Concepts</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Stacked preview of every body analysis direction.</p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {VARIANTS.map((v) => (
            <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', background: '#fcfcfd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                  <strong>{v.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.badge}</div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setSelectedId(v.id)}>Open this design</button>
              </div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>BODY</label>
              {renderVariant(v.id, MOCK_ANALYSIS)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
