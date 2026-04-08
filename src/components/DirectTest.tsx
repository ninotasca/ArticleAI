import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchArticleById, fetchArticleSample, fetchBuiltPrompts, runAiTest } from '../api';
import type { Article, BuiltPrompt } from '../types';

export function DirectTest() {
  const [searchParams] = useSearchParams();
  const articleIdParam = searchParams.get('article');
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [builtPrompts, setBuiltPrompts] = useState<BuiltPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load article on mount — use ?article=ID if provided, otherwise random
  useEffect(() => {
    if (articleIdParam) {
      loadArticleById(parseInt(articleIdParam));
    } else {
      loadRandomArticle();
    }
  }, [articleIdParam]);

  // Load built prompts on mount
  useEffect(() => {
    fetchBuiltPrompts()
      .then((bps) => {
        setBuiltPrompts(bps);
        if (bps.length > 0) setSelectedPromptId(bps[0].id);
      })
      .catch((err) => console.error('Failed to load built prompts:', err));
  }, []);

  async function loadArticleById(id: number) {
    setArticleLoading(true);
    setOutput(null);
    setError(null);
    try {
      const article = await fetchArticleById(id);
      setArticle(article);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setArticleLoading(false);
    }
  }

  async function loadRandomArticle() {
    setArticleLoading(true);
    setOutput(null);
    setError(null);
    try {
      const { articles } = await fetchArticleSample(1);
      if (articles.length > 0) {
        setArticle(articles[0]);
      } else {
        setError('No articles found in database.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setArticleLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!article || !selectedPromptId) return;

    const selectedPrompt = builtPrompts.find((bp) => bp.id === selectedPromptId);
    if (!selectedPrompt) return;

    setAnalyzing(true);
    setOutput(null);
    setError(null);

    try {
      const { result } = await runAiTest(
        selectedPrompt.assembledPrompt,
        article.id
      );
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  const selectedPrompt = builtPrompts.find((bp) => bp.id === selectedPromptId);

  return (
    <div className="direct-test">
      <h2 className="section-title">Single Article Test</h2>
      <p className="section-desc">
        Test a built prompt against a single article. Select a prompt, then click Analyze.
      </p>

      {/* ── Article Card ── */}
      <div className="card direct-test-article">
        <div className="direct-test-article-header">
          <h3>Article</h3>
          <button
            className="btn btn-secondary"
            onClick={loadRandomArticle}
            disabled={articleLoading}
          >
            {articleLoading ? 'Loading...' : 'Fetch Another Article'}
          </button>
        </div>

        {articleLoading && (
          <div className="direct-test-loading">Loading article...</div>
        )}

        {!articleLoading && article && (
          <div className="direct-test-article-body">
            <div className="direct-test-field">
              <label>ID</label>
              <span>{article.id}</span>
            </div>
            <div className="direct-test-field">
              <label>Title</label>
              <span>{article.title}</span>
            </div>
            {article.deck && (
              <div className="direct-test-field">
                <label>Deck</label>
                <span>{article.deck}</span>
              </div>
            )}
            <div className="direct-test-field">
              <label>Body</label>
              <div className="direct-test-body-text">{article.body}</div>
            </div>
          </div>
        )}

        {!articleLoading && !article && error && (
          <div className="direct-test-error">{error}</div>
        )}
      </div>

      {/* ── Prompt Selection + Analyze ── */}
      <div className="card direct-test-controls">
        <h3>Prompt</h3>

        {builtPrompts.length === 0 ? (
          <p className="direct-test-empty">
            No built prompts found. Create one in Prompt Builder first.
          </p>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="prompt-select">Select Built Prompt</label>
              <select
                id="prompt-select"
                value={selectedPromptId}
                onChange={(e) => {
                  setSelectedPromptId(e.target.value);
                  setOutput(null);
                }}
              >
                {builtPrompts.map((bp) => (
                  <option key={bp.id} value={bp.id}>
                    {bp.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPrompt && (
              <details className="direct-test-prompt-preview">
                <summary>Preview assembled prompt</summary>
                <pre>{selectedPrompt.assembledPrompt}</pre>
              </details>
            )}

            <button
              className="btn btn-primary direct-test-analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing || !article || !selectedPromptId}
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </>
        )}
      </div>

      {/* ── Output ── */}
      {error && !articleLoading && article && (
        <div className="card direct-test-output direct-test-output-error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {output && (
        <div className="card direct-test-output">
          <h3>AI Output</h3>
          <div className="direct-test-output-text">{output}</div>
        </div>
      )}
    </div>
  );
}
