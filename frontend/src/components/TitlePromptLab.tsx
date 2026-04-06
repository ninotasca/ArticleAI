import { useEffect, useState } from 'react';

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

export function TitlePromptLab() {
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/experiments/title-prompts/latest.json')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load report: ${res.status}`);
        return res.json();
      })
      .then((data) => setReport(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card">Loading title prompt lab…</div>;
  }

  if (error) {
    return <div className="card">Error loading title prompt lab: {error}</div>;
  }

  if (!report) {
    return <div className="card">No report found.</div>;
  }

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>🧪 Title Prompt Lab</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Persona: <strong>{report.persona.title}</strong> · Articles tested: <strong>{report.articleCount}</strong>
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          This page shows prompt variants, instructions, and live experiment outputs captured from the local ArticleAI backend.
        </p>
      </div>

      {report.variants.map((variant) => (
        <div key={variant.slug} className="card" style={{ marginTop: '1rem' }}>
          <h3>{variant.label}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Mode: {variant.mode}</p>

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
