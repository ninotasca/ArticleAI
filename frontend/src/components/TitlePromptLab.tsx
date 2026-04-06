import { useMemo } from 'react';
import reportData from '../titlePromptLabData.json';

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
  'editor-nod-keep-or-revise': {
    like: 'Best balance of usefulness and restraint. Gives editors a clear go/no-go signal without turning into a lecture.',
    dislike: 'Can still be a little generic in the reason line if the model gets lazy.',
  },
  'minimal-verdict-threshold': {
    like: 'Very respectful of busy editors. Excellent when you want silence unless there is a meaningful issue.',
    dislike: 'May hide useful optional alternatives because it is intentionally stingy.',
  },
  'editor-nod-seo-alt': {
    like: 'Strong product shape. Gives a clear verdict plus a distinct SEO option without too much noise.',
    dislike: 'Runs the risk of producing an SEO title that feels slightly more mechanical than editorial.',
  },
  'journalist-benchmark': {
    like: 'Tone is closest to an experienced editor helping another experienced editor.',
    dislike: 'Does not naturally surface alternate title styles unless explicitly pushed.',
  },
  'why-revise-only': {
    like: 'Very efficient framing. Gets quickly to whether the title deserves more attention.',
    dislike: 'A bit narrow if you want multiple options or different headline styles.',
  },
  'headline-options-by-trait': {
    like: 'Great for exploration. Lets you compare conservative, SEO, and buzzier directions side by side.',
    dislike: 'More output than a rushed editor may want by default.',
  },
  'sparse-editorial': {
    like: 'Compact and readable. Good fit for an interface that should feel fast and non-annoying.',
    dislike: 'Sometimes too compressed to explain why the revision really matters.',
  },
  'strict-no-change-threshold': {
    like: 'Useful anti-nitpicking control. Encourages the model to leave good titles alone.',
    dislike: 'When it does revise, the explanation can feel underpowered.',
  },
  'conservative-no-notes': {
    like: 'Good default for building trust. “No Notes - Works great” is easy to understand.',
    dislike: 'Less expressive than the stronger verdict-based variants.',
  },
  'seo-first': {
    like: 'Strong at surfacing missed search opportunities and useful industry terms.',
    dislike: 'Can drift toward content-strategy speak if left unchecked.',
  },
  'single-score-with-verdict': {
    like: 'Simple scoring model with a practical takeaway. Easier to digest than multi-score versions.',
    dislike: 'Any single score risks false precision.',
  },
  'conservative-brief': {
    like: 'Safe, readable baseline that rarely does anything too weird.',
    dislike: 'A little bland. Not quite opinionated enough.',
  },
  'deck-aware': {
    like: 'Useful when title/deck coordination is especially important.',
    dislike: 'Too specialized to be the primary default.',
  },
  'conservative-single-score': {
    like: 'Straightforward overall score that can be easy to scan.',
    dislike: 'Less helpful than verdict-based prompts and still suffers from score fuzziness.',
  },
  'multi-score-with-options': {
    like: 'Good if product stakeholders really want structured scoring plus alternates.',
    dislike: 'Getting noisy. Feels more like a product dashboard than editor help.',
  },
  'conservative-multi-score': {
    like: 'Captures multiple dimensions cleanly on paper.',
    dislike: 'Too much overhead for editors who mostly want a judgment call.',
  },
  'risky-punchier': {
    like: 'Can surface stronger angles when a title genuinely undersells the story.',
    dislike: 'Most likely to oversteer and become too interpretive for the article.',
  },
};

const PREFERRED_ORDER = [
  'editor-nod-keep-or-revise',
  'minimal-verdict-threshold',
  'editor-nod-seo-alt',
  'journalist-benchmark',
  'why-revise-only',
  'headline-options-by-trait',
  'sparse-editorial',
  'strict-no-change-threshold',
  'conservative-no-notes',
  'seo-first',
  'single-score-with-verdict',
  'conservative-brief',
  'deck-aware',
  'conservative-single-score',
  'multi-score-with-options',
  'conservative-multi-score',
  'risky-punchier',
];

export function TitlePromptLab() {
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
      like: RANKING_NOTES[variant.slug]?.like || 'Potentially useful, but needs more judgment about when to speak up.',
      dislike: RANKING_NOTES[variant.slug]?.dislike || 'Not yet clearly differentiated enough from the stronger options.',
      example: variant.results[0] ?? null,
    }));
  }, [report]);

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>🧪 Title Prompt Lab</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Persona: <strong>{report.persona.title}</strong> · Articles tested: <strong>{report.articleCount}</strong>
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          Stack-ranked prompt variants for title analysis, with summary notes up top and full results below.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Summary & Ranking</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ranked from strongest default candidate to weakest based on usefulness for busy, experienced editors.
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {rankedVariants.map((variant) => (
            <div key={`summary-${variant.slug}`} style={summaryCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Rank #{variant.rank}</div>
                  <h4 style={{ margin: 0 }}>{variant.label}</h4>
                </div>
                <a href={`#variant-${variant.slug}`} style={{ fontWeight: 600 }}>Jump to full results ↓</a>
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
        <div id={`variant-${variant.slug}`} key={variant.slug} className="card" style={{ marginTop: '1rem', scrollMarginTop: '1rem' }}>
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
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                        }}
                      >
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
