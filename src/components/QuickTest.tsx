import { useState } from 'react';
import type { Article } from '../types';
import { fetchArticleSample } from '../api';

export function QuickTest() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const { articles } = await fetchArticleSample(10);
      setArticles(articles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-test">
      <h2>🧪 Quick Database Test</h2>
      <p style={{ color: '#64748b', marginBottom: '1rem' }}>
        Pull 10 random articles from your Supabase database to verify the
        connection.
      </p>
      <button className="btn-primary" onClick={handleFetch} disabled={loading}>
        {loading ? '⏳ Loading…' : '🎲 Fetch 10 Random Articles'}
      </button>

      {error && (
        <div className="error-banner" style={{ marginTop: '1rem' }}>
          ❌ {error}
        </div>
      )}

      {articles.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
            ✅ Found {articles.length} articles
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 60 }}>ID</th>
                  <th style={{ minWidth: 200 }}>Title</th>
                  <th style={{ minWidth: 200 }}>Deck</th>
                  <th style={{ minWidth: 250 }}>Body (preview)</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>
                      {i + 1}
                    </td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>
                      {a.id}
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.title}</td>
                    <td style={{ color: '#475569' }}>{a.deck}</td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {a.body?.substring(0, 200)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
