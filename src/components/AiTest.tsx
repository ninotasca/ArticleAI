import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Article } from '../types';
import { fetchArticleById, fetchArticleSample, runAiTest } from '../api';

export function AiTest() {
  const [searchParams] = useSearchParams();
  const articleIdParam = searchParams.get('article');

  useEffect(() => {
    if (articleIdParam) {
      handleLoadArticleById(parseInt(articleIdParam));
    }
  }, [articleIdParam]);
  const [article, setArticle] = useState<Article | null>(null);
  const [prompt, setPrompt] = useState(
    'Based on the following article, provide a brief summary:\n\n{{body}}'
  );
  const [result, setResult] = useState<string | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [runningPrompt, setRunningPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadArticleById = async (id: number) => {
    setLoadingArticle(true);
    setError(null);
    setResult(null);
    try {
      const fetched = await fetchArticleById(id);
      setArticle(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleLoadArticle = async () => {
    setLoadingArticle(true);
    setError(null);
    setResult(null);
    try {
      const { articles } = await fetchArticleSample(1);
      if (articles.length > 0) {
        setArticle(articles[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleRunPrompt = async () => {
    if (!article || !prompt.trim()) return;
    setRunningPrompt(true);
    setError(null);
    setResult(null);
    try {
      const res = await runAiTest(prompt, article.id);
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setRunningPrompt(false);
    }
  };

  return (
    <div className="ai-test">
      <h2>🤖 AI Quick Test</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Load a random article, write a prompt using placeholders, and see the AI
        response.
      </p>

      {error && <div className="error-banner">❌ {error}</div>}

      {/* Step 1: Load an article */}
      <div className="step card">
        <h3>
          <span className="step-num">1</span> Load a Random Article
        </h3>
        <button
          className="btn-primary"
          onClick={handleLoadArticle}
          disabled={loadingArticle}
          style={{ marginTop: '0.75rem' }}
        >
          {loadingArticle ? '⏳ Loading…' : '🎲 Load Random Article'}
        </button>

        {article && (
          <div className="loaded-article" style={{ marginTop: '1rem' }}>
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Title
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {article.title}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Deck
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#475569',
                  }}
                >
                  {article.deck || '(empty)'}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Body (preview)
                </label>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#64748b',
                    fontSize: '0.8125rem',
                    maxHeight: '150px',
                    overflow: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  {article.body}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Write prompt */}
      <div className="step card">
        <h3>
          <span className="step-num">2</span> Write Your Prompt
        </h3>
        <p className="step-desc">
          Use <code>{'{{title}}'}</code>, <code>{'{{deck}}'}</code>,{' '}
          <code>{'{{body}}'}</code> as placeholders. They'll be replaced with
          the article's actual content before sending to the AI.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          style={{ width: '100%', marginTop: '0.5rem' }}
          placeholder="e.g., Summarize this article: {{body}}"
        />
        <div style={{ marginTop: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginRight: '0.5rem',
            }}
          >
            Quick prompts:
          </span>
          <button
            className="btn-link"
            style={{ marginRight: '0.75rem' }}
            onClick={() =>
              setPrompt(
                'Summarize the following article in 2-3 sentences:\n\n{{body}}'
              )
            }
          >
            Summarize
          </button>
          <button
            className="btn-link"
            style={{ marginRight: '0.75rem' }}
            onClick={() =>
              setPrompt(
                'Rate this article title from 1-10 for SEO quality and reader engagement. Explain your rating and suggest improvements:\n\nTitle: "{{title}}"\n\nArticle body for context:\n{{body}}'
              )
            }
          >
            Rate Title
          </button>
          <button
            className="btn-link"
            style={{ marginRight: '0.75rem' }}
            onClick={() =>
              setPrompt(
                'Evaluate this article deck/subtitle for clarity and engagement. Does it complement the title well? Suggest improvements:\n\nTitle: "{{title}}"\nDeck: "{{deck}}"\n\nArticle body for context:\n{{body}}'
              )
            }
          >
            Evaluate Deck
          </button>
          <button
            className="btn-link"
            onClick={() =>
              setPrompt(
                'Suggest 3 alternative titles for this article that would improve SEO and click-through rates:\n\nCurrent title: "{{title}}"\n\nArticle:\n{{body}}'
              )
            }
          >
            Suggest Titles
          </button>
        </div>
      </div>

      {/* Step 3: Run */}
      <div className="step card" style={{ textAlign: 'center' }}>
        <button
          className="btn-primary btn-lg"
          onClick={handleRunPrompt}
          disabled={!article || !prompt.trim() || runningPrompt}
        >
          {runningPrompt ? '⏳ Running AI…' : '🚀 Run Prompt'}
        </button>
        {runningPrompt && (
          <div className="running-hint">
            <div className="spinner" />
            Waiting for AI response…
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>✨ AI Response</h3>
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: '0.875rem',
            }}
          >
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
