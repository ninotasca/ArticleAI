import { useState } from 'react';
import type { Prompt, Article, ComparisonResult } from '../types';
import { fetchArticleSample, runComparison } from '../api';

interface Props {
  prompts: Prompt[];
  onResult: (result: ComparisonResult) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
}

export function ComparisonRunner({
  prompts,
  onResult,
  isRunning,
  setIsRunning,
}: Props) {
  const [targetField, setTargetField] = useState<'title' | 'deck' | 'body'>(
    'title'
  );
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(
    new Set()
  );
  const [articleCount, setArticleCount] = useState(10);
  const [sampledArticles, setSampledArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSampling, setIsSampling] = useState(false);

  const filteredPrompts = prompts.filter((p) => p.targetField === targetField);

  const togglePrompt = (id: string) => {
    const next = new Set(selectedPromptIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPromptIds(next);
  };

  const selectAll = () => {
    setSelectedPromptIds(new Set(filteredPrompts.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedPromptIds(new Set());
  };

  const handleSample = async () => {
    try {
      setError(null);
      setIsSampling(true);
      const { articles } = await fetchArticleSample(articleCount);
      setSampledArticles(articles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to sample articles'
      );
    } finally {
      setIsSampling(false);
    }
  };

  const handleRun = async () => {
    if (selectedPromptIds.size === 0 || sampledArticles.length === 0) return;

    setIsRunning(true);
    setError(null);

    try {
      const selectedPrompts = prompts.filter((p) =>
        selectedPromptIds.has(p.id)
      );
      const articleIds = sampledArticles.map((a) => a.id);
      const result = await runComparison(selectedPrompts, articleIds);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsRunning(false);
    }
  };

  const totalCalls = selectedPromptIds.size * sampledArticles.length;

  return (
    <div className="comparison-runner">
      <h2>⚡ Run Comparison</h2>

      {error && <div className="error-banner">❌ {error}</div>}

      {/* ── Step 1: Target Field ── */}
      <div className="step card">
        <h3>
          <span className="step-num">1</span> Select Target Field
        </h3>
        <p className="step-desc">
          Choose which article field your prompts are evaluating.
        </p>
        <div className="field-selector">
          {(['title', 'deck', 'body'] as const).map((field) => {
            const count = prompts.filter(
              (p) => p.targetField === field
            ).length;
            return (
              <button
                key={field}
                className={`field-btn ${targetField === field ? 'active' : ''}`}
                onClick={() => {
                  setTargetField(field);
                  setSelectedPromptIds(new Set());
                }}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <span className="field-count">{count} prompts</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Select Prompts ── */}
      <div className="step card">
        <h3>
          <span className="step-num">2</span> Select Prompts to Compare
        </h3>
        {filteredPrompts.length === 0 ? (
          <p className="empty-state">
            No prompts targeting <strong>{targetField}</strong>. Create some in
            the Prompts tab first.
          </p>
        ) : (
          <>
            <div className="select-actions">
              <button className="btn-link" onClick={selectAll}>
                Select all
              </button>
              <button className="btn-link" onClick={deselectAll}>
                Deselect all
              </button>
            </div>
            <div className="prompt-checkboxes">
              {filteredPrompts.map((prompt) => (
                <label key={prompt.id} className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={selectedPromptIds.has(prompt.id)}
                    onChange={() => togglePrompt(prompt.id)}
                  />
                  <div>
                    <strong>{prompt.name}</strong>
                    <small>
                      {prompt.template.length > 100
                        ? prompt.template.substring(0, 100) + '…'
                        : prompt.template}
                    </small>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Step 3: Sample Articles ── */}
      <div className="step card">
        <h3>
          <span className="step-num">3</span> Sample Articles
        </h3>
        <p className="step-desc">
          Pull a random set of articles from your database to test against.
        </p>
        <div className="sample-controls">
          <div className="form-group">
            <label>Number of Articles</label>
            <input
              type="number"
              min={1}
              max={100}
              value={articleCount}
              onChange={(e) => setArticleCount(parseInt(e.target.value) || 10)}
            />
          </div>
          <button
            className="btn-secondary"
            onClick={handleSample}
            disabled={isSampling}
          >
            {isSampling ? '⏳ Sampling…' : '🎲 Sample Articles'}
          </button>
        </div>

        {sampledArticles.length > 0 && (
          <div className="sampled-articles">
            <h4>
              Sampled Articles ({sampledArticles.length})
              <button className="btn-link resample" onClick={handleSample}>
                🔄 Re-sample
              </button>
            </h4>
            <div className="article-preview-list">
              {sampledArticles.map((article, i) => (
                <div key={article.id} className="article-preview">
                  <span className="article-num">{i + 1}</span>
                  <span className="article-title">
                    {article.title || '(no title)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Step 4: Run ── */}
      <div className="step card run-step">
        <button
          className="btn-primary btn-lg"
          onClick={handleRun}
          disabled={
            isRunning ||
            selectedPromptIds.size === 0 ||
            sampledArticles.length === 0
          }
        >
          {isRunning ? (
            <>
              ⏳ Running {selectedPromptIds.size} prompts ×{' '}
              {sampledArticles.length} articles…
            </>
          ) : (
            <>
              🚀 Run Comparison
              {totalCalls > 0 && (
                <span className="call-count">
                  ({totalCalls} AI call{totalCalls !== 1 ? 's' : ''})
                </span>
              )}
            </>
          )}
        </button>
        {isRunning && (
          <div className="running-hint">
            <div className="spinner" />
            Processing {totalCalls} AI calls… This may take a minute.
          </div>
        )}
      </div>
    </div>
  );
}
