import { useMemo } from 'react';
import reportData from '../bodyPromptLabData.json';

interface ExperimentRow {
  articleId: number;
  originalTitle: string;
  deck: string;
  analysis: string;
}

interface ExperimentVariant {
  slug: string;
  label: string;
  mode: string;
  instructions: string;
  results: ExperimentRow[];
}

interface ExperimentReport {
  persona: { id: string; title: string };
  articleCount: number;
  variants: ExperimentVariant[];
}

interface RankedVariant extends ExperimentVariant {
  rank: number;
  like: string;
  dislike: string;
  example: ExperimentRow | null;
}

const RANKING_NOTES: Record<string, { like: string; dislike: string }> = {
  'body-minimal-threshold': {
    like: 'Best default posture for professionals. It only speaks when something is meaningfully off.',
    dislike: 'May still need stronger prompting if you want more body-level brand-voice coaching later.',
  },
  'body-no-suggestions-unless-needed': {
    like: 'Builds trust by not inventing work. Good if you want the AI to stay quiet unless it matters.',
    dislike: 'Can be slightly too passive if you later want stronger developmental feedback.',
  },
  'body-professional-nod': {
    like: 'Good product shape. The verdict is easy to scan and the tone can feel respectful.',
    dislike: 'Sometimes a little generic unless the model has a strong signal.',
  },
  'body-brand-voice-first': {
    like: 'Centers the most important requirement: brand voice alignment.',
    dislike: 'If overused, it may underweight clarity and structural issues.',
  },
  'body-gross-misunderstanding-only': {
    like: 'Excellent anti-nitpicking guardrail.',
    dislike: 'Probably too strict to be the only mode if you want help beyond major errors.',
  },
  'body-reader-trust': {
    like: 'Useful frame for B2B editorial quality. Helps catch moments that weaken authority.',
    dislike: 'Trust can be a slightly fuzzy concept unless paired with examples.',
  },
  'body-voice-and-precision': {
    like: 'Good blend of tone and editorial sharpness.',
    dislike: 'Can overlap with brand-voice-first without a huge behavioral difference.',
  },
  'body-copy-desk-light': {
    like: 'Nice restrained copy-desk posture for polish issues.',
    dislike: 'Could become more line-edit-y than you want if left as a default.',
  },
  'body-clarity-and-flow': {
    like: 'Helpful when the piece is hard to follow, not just off-brand.',
    dislike: 'Less tied to your central brand-voice goal.',
  },
  'body-sparse-brand-check': {
    like: 'Very easy to scan in a UI.',
    dislike: 'Often too compressed to be genuinely useful.',
  },
  'body-structure-focus': {
    like: 'Good specialist mode for coherence issues.',
    dislike: 'Too narrow for the primary default.',
  },
  'body-severity-bands': {
    like: 'Gives product-friendly severity signaling.',
    dislike: 'The severity band itself may feel artificial to editors.',
  },
};

const PREFERRED_ORDER = [
  'body-minimal-threshold',
  'body-no-suggestions-unless-needed',
  'body-professional-nod',
  'body-brand-voice-first',
  'body-gross-misunderstanding-only',
  'body-reader-trust',
  'body-voice-and-precision',
  'body-copy-desk-light',
  'body-clarity-and-flow',
  'body-sparse-brand-check',
  'body-structure-focus',
  'body-severity-bands',
];

export function BodyPromptLab() {
  const report = useMemo(() => reportData as ExperimentReport, []);

  const rankedVariants = useMemo<RankedVariant[]>(() => {
    const variantMap = new Map(report.variants.map((variant) => [variant.slug, variant]));
    const ordered = [
      ...PREFERRED_ORDER.filter((slug) => variantMap.has(slug)).map((slug) => variantMap.get(slug)!),
      ...report.variants.filter((variant) => !PREFERRED_ORDER.includes(variant.slug)),
    ];

    return ordered.map((variant, index) => ({
      ...variant,
      rank: index + 1,
      like: RANKING_NOTES[variant.slug]?.like || 'Potentially useful, but not yet clearly differentiated.',
      dislike: RANKING_NOTES[variant.slug]?.dislike || 'Needs sharper product intent or a more distinct behavior.',
      example: variant.results[0] ?? null,
    }));
  }, [report]);

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>🧪 Body Prompt Lab</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Persona: <strong>{report.persona.title}</strong> · Articles tested: <strong>{report.articleCount}</strong>
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          Conservative body-analysis prompt variants focused on professionalism, brand voice, and only surfacing meaningful issues.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Summary & Ranking</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ranked from strongest default candidate to weakest based on usefulness for experienced editors.
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {rankedVariants.map((variant) => (
            <div key={`summary-${variant.slug}`} style={summaryCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Rank #{variant.rank}</div>
                  <h4 style={{ margin: 0 }}>{variant.label}</h4>
                </div>
                <a href={`#body-variant-${variant.slug}`} style={{ fontWeight: 600 }}>Jump to full results ↓</a>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div><strong>What I like:</strong> {variant.like}</div>
                <div style={{ marginTop: '0.35rem' }}><strong>What I dislike:</strong> {variant.dislike}</div>
              </div>

              {variant.example && (
                <div style={{ marginTop: '0.85rem', padding: '0.85rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '0.4rem' }}><strong>Example Article:</strong> {variant.example.originalTitle}</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
                    {variant.example.analysis}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {rankedVariants.map((variant) => (
        <div id={`body-variant-${variant.slug}`} key={variant.slug} className="card" style={{ marginTop: '1rem', scrollMarginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Rank #{variant.rank}</div>
              <h3 style={{ margin: 0 }}>{variant.label}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Mode: {variant.mode}</p>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div><strong>What I like:</strong> {variant.like}</div>
            <div style={{ marginTop: '0.35rem' }}><strong>What I dislike:</strong> {variant.dislike}</div>
          </div>

          <details style={{ margin: '0.75rem 0 1rem 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Show Prompt Instructions</summary>
            <pre
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '1rem',
                whiteSpace: 'pre-wrap',
                marginTop: '0.75rem',
              }}
            >
              {variant.instructions}
            </pre>
          </details>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Article</th>
                  <th style={thStyle}>Original Title</th>
                  <th style={thStyle}>Analysis</th>
                </tr>
              </thead>
              <tbody>
                {variant.results.map((row) => (
                  <tr key={`${variant.slug}-${row.articleId}`}>
                    <td style={tdStyle}>
                      <strong>{row.articleId}</strong>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{row.originalTitle}</div>
                      {row.deck && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{row.deck}</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
                        {row.analysis}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
};

const tdStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
};

const summaryCardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '1rem',
  background: '#fff',
};
