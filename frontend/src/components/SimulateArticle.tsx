import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchArticleSample, fetchBuiltPrompts, runAiTest } from '../api';
import type { Article, BuiltPrompt } from '../types';

/* ── Types for parsed AI output ── */
interface Suggestion {
  title: string;
  description: string;
}

interface AnalysisResult {
  titleAnalysis: string;
  titleSuggestions: Suggestion[];
  bodyAnalysis: string;
  bodySuggestions: Suggestion[];
}

/* ═══ Dynamic Takeover Messages (Appendix A) ═══ */

const MESSAGES_STARTUP = [
  'Warming up the AI...',
  'Waking the AI model from its slumber...',
  'Powering up the reading machine...',
  'Pulling the AI off the bench...',
  'Dusting off the neural nets...',
  'Flipping the AI switch...',
  'Coaxing the AI model to life...',
  'Spinning up the analysis engine...',
  'Rousing the AI from its nap...',
  'Getting the AI machine out of bed...',
  'Breathing life into the AI model...',
  'Nudging the AI awake...',
  'Firing up the reading engine...',
  'Convincing the AI model to clock in...',
  'Booting the brain...',
  'Cranking the AI into gear...',
  'Summoning the AI model...',
  'Putting the AI to work...',
  'Giving the machine its marching orders...',
  'Turning the AI key...',
];

const MESSAGES_ANALYZING_TEMPLATES = [
  'Redlining your [CONTENT]...',
  'Pencil-pushing through your [CONTENT]...',
  'Squiggle-checking your [CONTENT]...',
  'Giving your [CONTENT] the red pen treatment...',
  'Manuscrutinizing your [CONTENT]...',
  'Wordwading through your [CONTENT]...',
  'Proofing your [CONTENT] with care...',
  'Doing a proper once-over on your [CONTENT]...',
  'Nitpick-reading your [CONTENT]...',
  'Editorsploring your [CONTENT]...',
  'Skimulating your [CONTENT] for ideas...',
  'Giving your [CONTENT] a thoughtful scrub...',
  'Markupping your [CONTENT]...',
  'Suggesti-scanning your [CONTENT]...',
  'Running a fine-toothed comb through your [CONTENT]...',
  'Proof-fossicking through your [CONTENT]...',
  'Doing the editorial honors on your [CONTENT]...',
  'Scrutineering your [CONTENT] for gems...',
  'Thoughtchewing your [CONTENT] for a fresh take...',
];

const MESSAGES_FINISHING = [
  'Polishing up the final suggestions...',
  'Wrapping up the analysis...',
  'Adding the finishing touches...',
  'Tidying up the recommendations...',
  'Putting a bow on the results...',
  'Almost there, just dotting the i\'s...',
  'Compiling your personalized feedback...',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAnalyzingMessage(content: string): string {
  return pickRandom(MESSAGES_ANALYZING_TEMPLATES).replace('[CONTENT]', content);
}

/** Message schedule: startup → title → body → metadata → finishing */
function buildMessageSchedule(): Array<{ message: string; delay: number }> {
  return [
    { message: pickRandom(MESSAGES_STARTUP), delay: 0 },
    { message: getAnalyzingMessage('headline'), delay: 5000 },
    { message: getAnalyzingMessage('body'), delay: 10000 },
    { message: getAnalyzingMessage('metadata'), delay: 15000 },
    { message: pickRandom(MESSAGES_FINISHING), delay: 20000 },
  ];
}

const ESTIMATED_SECONDS = 20;

/* ── Parse AI response into structured suggestions ── */
function parseAiOutput(raw: string): AnalysisResult {
  const fallback: AnalysisResult = {
    titleAnalysis: raw,
    titleSuggestions: [],
    bodyAnalysis: '',
    bodySuggestions: [],
  };

  try {
    // Strip markdown code fences if present
    let jsonStr = raw.trim();
    const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();

    const parsed = JSON.parse(jsonStr);

    return {
      titleAnalysis:
        parsed.title?.analysis ?? parsed.titleAnalysis ?? parsed.headline?.analysis ?? '',
      titleSuggestions: (
        parsed.title?.suggestions ??
        parsed.titleSuggestions ??
        parsed.headline?.suggestions ??
        []
      ).map((s: Record<string, string>) => ({
        title: s.title || s.suggestion || s.name || String(s),
        description: s.description || s.reason || s.explanation || '',
      })),
      bodyAnalysis:
        parsed.body?.analysis ?? parsed.bodyAnalysis ?? '',
      bodySuggestions: (
        parsed.body?.suggestions ??
        parsed.bodySuggestions ??
        []
      ).map((s: Record<string, string>) => ({
        title: s.title || s.suggestion || s.name || String(s),
        description: s.description || s.reason || s.explanation || '',
      })),
    };
  } catch {
    return fallback;
  }
}

/* ════════════════════════════════════════════════════════ */

export function SimulateArticle() {
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [builtPrompts, setBuiltPrompts] = useState<BuiltPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [phase, setPhase] = useState<'editing' | 'analyzing' | 'analyzed'>('editing');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [titleExpanded, setTitleExpanded] = useState(true);
  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Takeover state */
  const [takeoverMessage, setTakeoverMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const abortRef = useRef(false);
  const messageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load article + built prompts on mount ── */
  useEffect(() => {
    loadRandomArticle();
  }, []);

  useEffect(() => {
    fetchBuiltPrompts()
      .then((bps) => {
        setBuiltPrompts(bps);
        if (bps.length > 0) setSelectedPromptId(bps[0].id);
      })
      .catch(() => {});
  }, []);

  async function loadRandomArticle() {
    setArticleLoading(true);
    setPhase('editing');
    setAnalysis(null);
    setError(null);
    try {
      const { articles } = await fetchArticleSample(1);
      if (articles.length > 0) setArticle(articles[0]);
      else setError('No articles found in database.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setArticleLoading(false);
    }
  }

  /** Clean up all takeover timers */
  const cleanupTakeover = useCallback(() => {
    messageTimersRef.current.forEach(clearTimeout);
    messageTimersRef.current = [];
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  /* ── Run analysis with takeover UX ── */
  async function handleAnalyze() {
    if (!article || !selectedPromptId) return;
    const prompt = builtPrompts.find((bp) => bp.id === selectedPromptId);
    if (!prompt) return;

    abortRef.current = false;
    setShowCancelConfirm(false);
    setPhase('analyzing');
    setElapsedSeconds(0);
    setError(null);

    // Start message schedule
    const schedule = buildMessageSchedule();
    setTakeoverMessage(schedule[0].message);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < schedule.length; i++) {
      const t = setTimeout(() => {
        if (!abortRef.current) setTakeoverMessage(schedule[i].message);
      }, schedule[i].delay);
      timers.push(t);
    }
    messageTimersRef.current = timers;

    // Elapsed seconds counter
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const wrappedPrompt = `${prompt.assembledPrompt}

IMPORTANT: You must respond with ONLY valid JSON (no markdown, no code blocks, no extra text) using this exact structure:
{
  "title": {
    "analysis": "Your analysis of the article headline — what works, what could improve",
    "suggestions": [
      { "title": "Suggested alternative headline", "description": "Brief explanation of why this works better" }
    ]
  },
  "body": {
    "analysis": "Your analysis of the article body — what works, what could improve",
    "suggestions": [
      { "title": "Short suggestion name", "description": "Details of what to improve and why" }
    ]
  }
}`;

      const { result } = await runAiTest(wrappedPrompt, article.id);

      if (abortRef.current) return;  // cancelled while waiting

      cleanupTakeover();
      const parsed = parseAiOutput(result);
      setAnalysis(parsed);
      setTitleExpanded(true);
      setBodyExpanded(true);
      setPhase('analyzed');
    } catch (err) {
      if (abortRef.current) return;
      cleanupTakeover();
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setPhase('editing');
    }
  }

  function handleCancelRequest() {
    setShowCancelConfirm(true);
  }

  function handleCancelConfirm() {
    abortRef.current = true;
    cleanupTakeover();
    setShowCancelConfirm(false);
    setPhase('editing');
  }

  function handleCancelDismiss() {
    setShowCancelConfirm(false);
  }

  const wordCount = article?.body ? article.body.split(/\s+/).filter(Boolean).length : 0;
  const charCount = article?.body ? article.body.length : 0;

  /* ════════════════════════════════════════════════════════ */

  return (
    <div className="simulate">
      {/* ── Controls Bar (above the CMS) ── */}
      <div className="sim-controls">
        <div className="sim-controls-left">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Built Prompt</label>
            <select
              value={selectedPromptId}
              onChange={(e) => setSelectedPromptId(e.target.value)}
              disabled={builtPrompts.length === 0}
            >
              {builtPrompts.length === 0 && <option>No built prompts available</option>}
              {builtPrompts.map((bp) => (
                <option key={bp.id} value={bp.id}>{bp.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadRandomArticle}
          disabled={articleLoading}
        >
          {articleLoading ? 'Loading...' : 'Fetch New Article'}
        </button>
      </div>

      {error && <div className="sim-error">{error}</div>}

      {/* ── Lantern CMS Simulation ── */}
      {article && !articleLoading && (
        <div className="sim-cms">
          {/* CMS Header */}
          <div className="sim-cms-header">
            <h2 className="sim-cms-title">Create Article</h2>
            <div className="sim-breadcrumb">
              Home &rsaquo; Articles &rsaquo; <strong>Create Article</strong>
            </div>
          </div>

          {/* Steps Bar */}
          <div className="sim-steps">
            <div className="sim-steps-left">
              <span className="sim-step active">1. Article Content</span>
              <span className="sim-step">2. Metadata</span>
              <span className="sim-step">3. Review</span>
            </div>
            <div className="sim-draft-badge">
              <span className="sim-draft-dot"></span> Draft
            </div>
          </div>

          {/* Two-Column Content */}
          <div className="sim-content">
            {/* ── Left Column ── */}
            <div className="sim-left">
              {/* Headline */}
              <div className="sim-field">
                <label>
                  Headline <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <input
                  type="text"
                  className="sim-input"
                  value={article.title}
                  readOnly
                />
              </div>

              {/* Title Analysis Box (post-analysis) */}
              {phase === 'analyzed' && analysis &&
                (analysis.titleAnalysis || analysis.titleSuggestions.length > 0) && (
                <div className="sim-analysis-box">
                  <div
                    className="sim-analysis-header"
                    onClick={() => setTitleExpanded(!titleExpanded)}
                  >
                    <span>Article Analyzed</span>
                    <span className="sim-analysis-chevron">
                      {titleExpanded ? '\u25B4' : '\u25BE'}
                    </span>
                  </div>
                  {titleExpanded && (
                    <div className="sim-analysis-body">
                      {analysis.titleAnalysis && (
                        <p className="sim-analysis-text">{analysis.titleAnalysis}</p>
                      )}
                      {analysis.titleSuggestions.length > 0 && (
                        <>
                          <div className="sim-suggestions-label">TITLE SUGGESTIONS</div>
                          <ul className="sim-suggestions-list">
                            {analysis.titleSuggestions.map((s, i) => (
                              <li key={i}>
                                <span className="sim-suggestion-title">{s.title}</span>
                                {s.description && (
                                  <span className="sim-suggestion-desc">{s.description}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitle */}
              <div className="sim-field">
                <label>
                  Subtitle{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <textarea
                  className="sim-textarea"
                  rows={3}
                  value={article.deck}
                  readOnly
                />
              </div>

              {/* Author (hardcoded) */}
              <div className="sim-field">
                <label>
                  Author <span className="sim-required">*</span>
                </label>
                <div className="sim-author-row">
                  <div className="sim-tag">
                    Ashley Burnett <span className="sim-tag-x">&times;</span>
                  </div>
                  <input
                    type="text"
                    className="sim-input sim-author-input"
                    placeholder="Add author..."
                    readOnly
                  />
                  <button className="sim-custom-btn" type="button">+ Custom</button>
                </div>
              </div>

              {/* Body */}
              <div className="sim-field">
                <label>
                  Body <span className="sim-required">*</span>
                </label>

                {/* Body Analysis Box (post-analysis) */}
                {phase === 'analyzed' && analysis &&
                  (analysis.bodyAnalysis || analysis.bodySuggestions.length > 0) && (
                  <div className="sim-analysis-box">
                    <div
                      className="sim-analysis-header"
                      onClick={() => setBodyExpanded(!bodyExpanded)}
                    >
                      <span>Body Analyzed</span>
                      <span className="sim-analysis-chevron">
                        {bodyExpanded ? '\u25B4' : '\u25BE'}
                      </span>
                    </div>
                    {bodyExpanded && (
                      <div className="sim-analysis-body">
                        {analysis.bodyAnalysis && (
                          <p className="sim-analysis-text">{analysis.bodyAnalysis}</p>
                        )}
                        {analysis.bodySuggestions.length > 0 && (
                          <>
                            <div className="sim-suggestions-label">BODY SUGGESTIONS</div>
                            <ul className="sim-suggestions-list">
                              {analysis.bodySuggestions.map((s, i) => (
                                <li key={i}>
                                  <span className="sim-suggestion-title">{s.title}</span>
                                  {s.description && (
                                    <span className="sim-suggestion-desc">{s.description}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fake Rich-Text Editor */}
                <div className="sim-editor">
                  <div className="sim-editor-menu">
                    <span>File</span>
                    <span>Edit</span>
                    <span>View</span>
                    <span>Insert</span>
                    <span>Format</span>
                    <span>Help</span>
                  </div>
                  <div className="sim-editor-toolbar">
                    <span className="sim-tb-btn">&#x2398;</span>
                    <span className="sim-tb-btn">&#x21BA;</span>
                    <span className="sim-tb-btn">&#x21BB;</span>
                    <span className="sim-tb-sep" />
                    <span className="sim-tb-btn"><b>B</b></span>
                    <span className="sim-tb-btn"><i>I</i></span>
                    <span className="sim-tb-btn" style={{ textDecoration: 'underline' }}>U</span>
                    <span className="sim-tb-btn">&#128279;</span>
                    <span className="sim-tb-sep" />
                    <span className="sim-tb-select">Insert &darr;</span>
                    <span className="sim-tb-select">Paragraph &darr;</span>
                    <span className="sim-tb-select">Styles &darr;</span>
                  </div>
                  <div className="sim-editor-body">
                    {article.body || 'Start adding your content here'}
                  </div>
                  <div className="sim-editor-footer">
                    Words: {wordCount} &nbsp; Characters: {charCount}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="sim-right">
              {/* Article Layout */}
              <div className="sim-field">
                <label>
                  Article Layout <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <div className="sim-tag-container">
                  <div className="sim-tag sim-tag-blue">
                    Article <span className="sim-tag-x">&times;</span>
                  </div>
                </div>
              </div>

              {/* Hero Image */}
              <div className="sim-field">
                <label>
                  Hero Image{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                {phase === 'analyzed' ? (
                  <div className="sim-hero-filled">
                    <div className="sim-hero-img">
                      <div className="sim-hero-img-inner">
                        <span className="sim-hero-placeholder-icon">&#x1F5BC;</span>
                      </div>
                      <span className="sim-hero-remove">&times;</span>
                    </div>
                    <div className="sim-hero-meta">
                      <div className="sim-field-inline">
                        <label>Caption</label>
                        <span>Melbourne is a great entryway into an incentive adventure.</span>
                      </div>
                      <div className="sim-field-inline">
                        <label>Credit</label>
                        <span>gb27photo/Adobe Stock</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sim-hero-upload">
                    <div className="sim-hero-upload-icon">&#x1F5BC;</div>
                    <div className="sim-hero-upload-text">Click to upload hero image</div>
                    <div className="sim-hero-upload-size">780 &times; 400px</div>
                  </div>
                )}
              </div>

              {/* Primary Section */}
              <div className="sim-field">
                <label>
                  Primary Section <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                {phase === 'analyzed' ? (
                  <div className="sim-tag-container">
                    <div className="sim-tag sim-tag-blue">
                      Custom Content &rarr; Advertorials{' '}
                      <span className="sim-tag-x">&times;</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    className="sim-input"
                    placeholder="Type to search sections..."
                    readOnly
                  />
                )}
              </div>

              {/* Publish Timeline */}
              <div className="sim-field">
                <label>
                  Publish Timeline <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <div className="sim-timeline-btns">
                  <button className="sim-timeline-btn" type="button">
                    Schedule Date &amp; Time
                  </button>
                  <button className="sim-timeline-btn active" type="button">
                    After Final Review
                  </button>
                </div>
              </div>

              {phase === 'analyzed' && (
                <button className="sim-preview-btn" type="button">
                  &#x1F4CB; Preview Article
                </button>
              )}
            </div>
          </div>

          {/* CMS Footer */}
          <div className="sim-cms-footer">
            <button className="sim-quit-btn" type="button" onClick={loadRandomArticle}>
              Quit
            </button>
            <div className="sim-footer-right">
              <button
                className="sim-analyze-btn"
                type="button"
                onClick={handleAnalyze}
                disabled={phase === 'analyzing' || !selectedPromptId || builtPrompts.length === 0}
              >
                Analyze
              </button>
              {phase === 'analyzed' && (
                <button className="sim-next-btn" type="button">Next</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Analyzing Takeover Overlay ── */}
      {phase === 'analyzing' && (
        <div className="takeover-overlay">
          <div className="takeover-content">
            {/* Spinning Northstar Logo */}
            <div className="takeover-logo">
              <img src="/northstar-logo.svg" alt="Northstar" />
            </div>

            {/* Dynamic message */}
            <h3 className="takeover-title">Analyzing Article</h3>
            <p className="takeover-message" key={takeoverMessage}>
              {takeoverMessage}
            </p>

            {/* Time estimate + elapsed */}
            <div className="takeover-time">
              <span>This should take less than {ESTIMATED_SECONDS} seconds</span>
              <span className="takeover-elapsed">{elapsedSeconds}s elapsed</span>
            </div>

            {/* Progress bar */}
            <div className="takeover-progress-bar">
              <div
                className="takeover-progress-fill"
                style={{
                  width: `${Math.min((elapsedSeconds / ESTIMATED_SECONDS) * 100, 95)}%`,
                }}
              />
            </div>

            {/* Cancel button */}
            <button
              className="takeover-cancel-btn"
              type="button"
              onClick={handleCancelRequest}
            >
              Cancel Analysis
            </button>
          </div>

          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div className="takeover-confirm-overlay">
              <div className="takeover-confirm-dialog">
                <h4>Cancel AI Analysis?</h4>
                <p>
                  Are you sure you want to cancel this AI process? Any results
                  that have not been completed will be lost.
                </p>
                <div className="takeover-confirm-btns">
                  <button
                    className="takeover-confirm-back"
                    type="button"
                    onClick={handleCancelDismiss}
                  >
                    Keep Analyzing
                  </button>
                  <button
                    className="takeover-confirm-yes"
                    type="button"
                    onClick={handleCancelConfirm}
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
