import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchArticleById, fetchArticleSample, fetchBuiltPrompts, runAiTest } from '../api';
import type { Article, BuiltPrompt, TitleReview } from '../types';

interface Suggestion {
  title: string;
  description: string;
  kind?: string;
  severity?: 'critical' | 'moderate' | 'minor';
}

interface AnalysisResult {
  titleAnalysis: string;
  titleSuggestions: Suggestion[];
  bodyAnalysis: string;
  bodySuggestions: Suggestion[];
  titleReview: TitleReview | null;
}

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

function buildMessageSchedule(): Array<{ message: string; delay: number }> {
  return [
    { message: pickRandom(MESSAGES_STARTUP), delay: 0 },
    { message: getAnalyzingMessage('headline'), delay: 5000 },
    { message: getAnalyzingMessage('body'), delay: 10000 },
    { message: getAnalyzingMessage('metadata'), delay: 15000 },
    { message: pickRandom(MESSAGES_FINISHING), delay: 20000 },
  ];
}

const ESTIMATED_SECONDS = 30;

function normalizeTitleReview(parsed: any): TitleReview | null {
  const review = parsed?.titleReview;
  if (!review || !review.overallStatus) return null;

  return {
    overallStatus: review.overallStatus,
    summaryReason: review.summaryReason || '',
    chipRatings: {
      seo: review.chipRatings?.seo || 'yellow',
      clarity: review.chipRatings?.clarity || 'yellow',
      brandFit: review.chipRatings?.brandFit || 'yellow',
    },
    collapsed: {
      defaultCollapsed: Boolean(review.collapsed?.defaultCollapsed),
    },
    detail: {
      editorNote: review.detail?.editorNote || '',
      whyThisMatters: review.detail?.whyThisMatters ?? null,
    },
    suggestedTitles: Array.isArray(review.suggestedTitles)
      ? review.suggestedTitles.map((item: any) => ({
          title: item.title || '',
          whyItWorks: item.whyItWorks || '',
          kind: item.kind || 'editorial',
          recommended: Boolean(item.recommended),
        }))
      : [],
    followUpControls: {
      allowGenerateMore: review.followUpControls?.allowGenerateMore !== false,
      suggestedModes: review.followUpControls?.suggestedModes || ['seo', 'buzzy', 'restrained', 'trade'],
      placeholderPrompt: review.followUpControls?.placeholderPrompt || 'Ask for another direction...',
    },
  };
}

function parseAiOutput(raw: string): AnalysisResult {
  const fallback: AnalysisResult = {
    titleAnalysis: raw,
    titleSuggestions: [],
    bodyAnalysis: '',
    bodySuggestions: [],
    titleReview: null,
  };

  try {
    let jsonStr = raw.trim();
    const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();

    const parsed = JSON.parse(jsonStr);
    const titleReview = normalizeTitleReview(parsed);

    return {
      titleAnalysis:
        parsed.title?.analysis ?? parsed.titleAnalysis ?? parsed.headline?.analysis ?? titleReview?.detail.editorNote ?? '',
      titleSuggestions: (
        parsed.title?.suggestions ??
        parsed.titleSuggestions ??
        parsed.headline?.suggestions ??
        titleReview?.suggestedTitles?.map((s) => ({ title: s.title, description: s.whyItWorks })) ??
        []
      ).map((s: Record<string, string>) => ({
        title: s.title || s.suggestion || s.name || String(s),
        description: s.description || s.reason || s.explanation || '',
      })),
      bodyAnalysis: parsed.body?.analysis ?? parsed.bodyAnalysis ?? '',
      bodySuggestions: (
        parsed.body?.suggestions ?? parsed.bodySuggestions ?? []
      ).map((s: Record<string, string>) => ({
        title: s.title || s.suggestion || s.name || String(s),
        description: s.description || s.reason || s.explanation || '',
        kind: s.kind || undefined,
        severity: s.severity || undefined,
      })),
      titleReview,
    };
  } catch {
    return fallback;
  }
}

function buildTopPickPrompt(basePrompt: string): string {
  return `${basePrompt}

IMPORTANT: You must respond with ONLY valid JSON (no markdown, no code blocks, no extra text).

When rating chipRatings:
- seo: Does the title use relevant search terms a B2B travel industry reader would search for?
- clarity: Is the main subject immediately clear to the reader?
- brandFit: Does the title match the publication's editorial voice — credible, trade-appropriate, not clickbait?

Use this exact JSON structure:
{
  "titleReview": {
    "overallStatus": "good_to_go | worth_revisiting | needs_work",
    "summaryReason": "One concise sentence explaining the top-line reason.",
    "chipRatings": {
      "seo": "green | yellow | red",
      "clarity": "green | yellow | red",
      "brandFit": "green | yellow | red"
    },
    "collapsed": {
      "defaultCollapsed": false
    },
    "detail": {
      "editorNote": "A short, non-preachy explanation of what is working or what should change.",
      "whyThisMatters": "Optional short sentence. Use null if not needed."
    },
    "suggestedTitles": [
      {
        "title": "Suggested title text",
        "whyItWorks": "One short sentence explaining why this is a strong option.",
        "kind": "editorial | seo | buzzy | restrained | trade",
        "recommended": true
      }
    ],
    "followUpControls": {
      "allowGenerateMore": true,
      "suggestedModes": ["seo", "buzzy", "restrained", "trade"],
      "placeholderPrompt": "Ask for another direction..."
    }
  },
  "body": {
    "analysis": "Your analysis of the article body — what works, what could improve",
    "suggestions": [
      {
        "title": "Short suggestion name",
        "description": "Details of what to improve and why",
        "kind": "clarity | seo | structure | tone | fact",
        "severity": "critical | moderate | minor"
      }
    ]
  }
}`;
}

function buildTopPickFollowUpPrompt(article: Article, review: TitleReview, mode: string, userPrompt: string): string {
  return `You are generating additional article title options for a B2B travel industry editor.

Current title: ${article.title}
Deck: ${article.deck}
Body: ${article.body}

Existing review summary: ${review.summaryReason}
Existing editor note: ${review.detail.editorNote}
Requested direction: ${mode}
Editor follow-up request: ${userPrompt || 'None'}

Return ONLY valid JSON with this exact structure:
{
  "suggestedTitles": [
    {
      "title": "Suggested title text",
      "whyItWorks": "One short sentence explaining why this option is useful.",
      "kind": "editorial | seo | buzzy | restrained | trade",
      "recommended": false
    }
  ]
}

Rules:
- Return 2 to 4 title options.
- Keep them credible and trade-appropriate.
- Do not use clickbait.
- Make the options clearly distinct where possible.
- Match the requested direction.
`;
}

function getStatusAppearance(status: TitleReview['overallStatus']) {
  if (status === 'good_to_go') {
    return { label: 'Good to go', bg: '#f0fdf4', text: '#166534', border: '#86efac' };
  }
  if (status === 'needs_work') {
    return { label: 'Needs Work', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  }
  return { label: 'Worth Revisiting', bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
}

function getChipAppearance(value: 'green' | 'yellow' | 'red') {
  if (value === 'green') return { bg: '#f0fdf4', text: '#166534', border: '#86efac' };
  if (value === 'red') return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
  return { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
}

export function SimulateArticle() {
  const [searchParams] = useSearchParams();
  const articleIdParam = searchParams.get('article');
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [builtPrompts, setBuiltPrompts] = useState<BuiltPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [phase, setPhase] = useState<'editing' | 'analyzing' | 'analyzed'>('editing');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [titleExpanded, setTitleExpanded] = useState(true);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpMode, setFollowUpMode] = useState('seo');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [bodyRefineQuestion, setBodyRefineQuestion] = useState('');
  const [bodyRefineAnswer, setBodyRefineAnswer] = useState('');
  const [bodyRefineLoading, setBodyRefineLoading] = useState(false);

  type MetaSection = 'summary' | 'seoTitle' | 'keywordTopics';
  const [metaSection, setMetaSection] = useState<MetaSection>('summary');
  const [metaPrompt, setMetaPrompt] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaResults, setMetaResults] = useState<string[]>([]);
  const [metaDismissed, setMetaDismissed] = useState<Set<number>>(new Set());
  const [metaAccepted, setMetaAccepted] = useState<number | null>(null);

  const [takeoverMessage, setTakeoverMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const abortRef = useRef(false);
  const messageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (articleIdParam) {
      loadArticleById(parseInt(articleIdParam));
    } else {
      loadRandomArticle();
    }
  }, [articleIdParam]);

  useEffect(() => {
    fetchBuiltPrompts()
      .then((bps) => {
        setBuiltPrompts(bps);
        if (bps.length > 0) setSelectedPromptId(bps[0].id);
      })
      .catch(() => {});
  }, []);

  async function loadArticleById(id: number) {
    setArticleLoading(true);
    setPhase('editing');
    setAnalysis(null);
    setError(null);
    setFollowUpPrompt('');
    try {
      const fetched = await fetchArticleById(id);
      setArticle(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setArticleLoading(false);
    }
  }

  async function loadRandomArticle() {
    setArticleLoading(true);
    setPhase('editing');
    setAnalysis(null);
    setError(null);
    setFollowUpPrompt('');
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

  const cleanupTakeover = useCallback(() => {
    messageTimersRef.current.forEach(clearTimeout);
    messageTimersRef.current = [];
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  async function handleAnalyze() {
    if (!article || !selectedPromptId) return;
    const prompt = builtPrompts.find((bp) => bp.id === selectedPromptId);
    if (!prompt) return;

    abortRef.current = false;
    setShowCancelConfirm(false);
    setPhase('analyzing');
    setElapsedSeconds(0);
    setError(null);

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

    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const wrappedPrompt = buildTopPickPrompt(prompt.assembledPrompt);
      const { result } = await runAiTest(wrappedPrompt, article.id);
      if (abortRef.current) return;

      cleanupTakeover();
      const parsed = parseAiOutput(result);
      setAnalysis(parsed);
      setTitleExpanded(!(parsed.titleReview?.collapsed.defaultCollapsed ?? false));
      setBodyExpanded(false);
      setBodyRefineQuestion('');
      setBodyRefineAnswer('');
      setMetaPrompt('');
      setMetaResults([]);
      setMetaDismissed(new Set());
      setMetaAccepted(null);
      setWizardStep(1);
      setFollowUpMode(parsed.titleReview?.followUpControls.suggestedModes?.[0] || 'seo');
      setPhase('analyzed');
    } catch (err) {
      if (abortRef.current) return;
      cleanupTakeover();
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setPhase('editing');
    }
  }

  async function handleGenerateMoreTitles() {
    if (!article || !analysis?.titleReview) return;
    setFollowUpLoading(true);
    setError(null);
    try {
      const prompt = buildTopPickFollowUpPrompt(article, analysis.titleReview, followUpMode, followUpPrompt);
      const { result } = await runAiTest(prompt, article.id);
      const parsed = parseAiOutput(result);
      const extra = parsed.titleReview?.suggestedTitles || [];
      const raw = (() => {
        try {
          const obj = JSON.parse(result);
          return Array.isArray(obj.suggestedTitles) ? obj.suggestedTitles : [];
        } catch {
          return [];
        }
      })();

      const appended = raw.length > 0
        ? raw.map((item: any) => ({
            title: item.title || '',
            whyItWorks: item.whyItWorks || '',
            kind: item.kind || followUpMode || 'editorial',
            recommended: Boolean(item.recommended),
          }))
        : extra;

      setAnalysis((current) => {
        if (!current?.titleReview) return current;
        return {
          ...current,
          titleReview: {
            ...current.titleReview,
            suggestedTitles: [...current.titleReview.suggestedTitles, ...appended],
          },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate more titles');
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleBodyRefine() {
    if (!article || !analysis || !bodyRefineQuestion.trim()) return;
    setBodyRefineLoading(true);
    setBodyRefineAnswer('');
    try {
      const prompt = `You are an editorial assistant. The editor has this body analysis:\n\n${analysis.bodyAnalysis}\n\nSuggestions:\n${analysis.bodySuggestions.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}\n\nThe editor asks: "${bodyRefineQuestion}"\n\nProvide a concise, actionable response (2-4 sentences).`;
      const { result } = await runAiTest(prompt, article.id);
      setBodyRefineAnswer(result.trim());
    } catch (err) {
      setBodyRefineAnswer('Sorry, something went wrong. Please try again.');
    } finally {
      setBodyRefineLoading(false);
    }
  }

  async function handleMetaRefine() {
    if (!article || !metaPrompt.trim()) return;
    setMetaLoading(true);
    setMetaResults([]);
    setMetaDismissed(new Set());
    setMetaAccepted(null);
    const sectionLabels: Record<string, string> = {
      summary: 'article summary',
      seoTitle: 'SEO title',
      keywordTopics: 'keyword topics list',
    };
    try {
      const prompt = `You are an editorial metadata assistant for a B2B travel industry publication.

The article title is: "${article.title}"
The editor wants to improve the ${sectionLabels[metaSection]}.
Their request: "${metaPrompt}"

Generate exactly 3 distinct options for the ${sectionLabels[metaSection]}. Return ONLY a JSON array of 3 strings, no commentary.
Example format: ["Option 1 text", "Option 2 text", "Option 3 text"]`;
      const { result } = await runAiTest(prompt, article.id);
      // Try to extract a JSON array from the result
      const match = result.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          setMetaResults(parsed.slice(0, 3).map(String));
          setMetaLoading(false);
          return;
        }
      }
      // Fallback: split by newlines
      const lines = result.split('\n').map((l) => l.replace(/^[\d.\-*"]+\s*/, '').trim()).filter(Boolean).slice(0, 3);
      setMetaResults(lines.length >= 2 ? lines : [result.trim()]);
    } catch {
      setMetaResults(['Unable to generate suggestions. Please try again.']);
    } finally {
      setMetaLoading(false);
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
  const titleReview = analysis?.titleReview;
  const titleStatus = titleReview ? getStatusAppearance(titleReview.overallStatus) : null;

  return (
    <div className="simulate">
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
        <button className="btn btn-secondary" onClick={loadRandomArticle} disabled={articleLoading}>
          {articleLoading ? 'Loading...' : 'Fetch New Article'}
        </button>
      </div>

      {error && <div className="sim-error">{error}</div>}

      {article && !articleLoading && (
        <div className="sim-cms">
          <div className="sim-cms-header">
            <h2 className="sim-cms-title">Create Article</h2>
            <div className="sim-breadcrumb">
              Home &rsaquo; Articles &rsaquo; <strong>Create Article</strong>
            </div>
          </div>

          <div className="sim-steps">
            <div className="sim-steps-left">
              <span className={`sim-step${wizardStep === 1 ? ' active' : wizardStep > 1 ? ' done' : ''}`}>
                {wizardStep > 1 ? '✓ ' : ''}1. Article Content
              </span>
              <span className={`sim-step${wizardStep === 2 ? ' active' : wizardStep > 2 ? ' done' : ''}`}>
                {wizardStep > 2 ? '✓ ' : ''}2. Metadata
              </span>
              <span className={`sim-step${wizardStep === 3 ? ' active' : ''}`}>3. Review</span>
            </div>
            <div className="sim-draft-badge">
              <span className="sim-draft-dot"></span> Draft
            </div>
          </div>

          {wizardStep === 1 && <div className="sim-content">
            <div className="sim-left">
              <div className="sim-field">
                <label>
                  Headline <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <input
                  type="text"
                  className="sim-input"
                  value={article.title}
                  onChange={() => {}}
                  readOnly={phase !== 'analyzed'}
                />
              </div>

              {phase === 'analyzed' && titleReview && titleStatus && (
                <div className="sim-top-pick-box">
                  <div className="sim-top-pick-header">
                    <div className="sim-top-pick-statuses">
                      {(['good_to_go', 'worth_revisiting', 'needs_work'] as const).map((status) => {
                        const appearance = getStatusAppearance(status);
                        return (
                          <span
                            key={status}
                            className="sim-top-pick-pill"
                            style={titleReview.overallStatus === status ? {
                              background: appearance.bg,
                              color: appearance.text,
                              borderColor: appearance.text,
                              outline: `2px solid ${appearance.text}`,
                              fontWeight: 800,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            } : {
                              background: appearance.bg,
                              color: appearance.text,
                              borderColor: appearance.border,
                              opacity: 0.2,
                              fontWeight: 700,
                            }}
                          >
                            {appearance.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className="sim-top-pick-signals">
                      {(['seo', 'clarity', 'brandFit'] as const).map((key) => {
                        const chip = getChipAppearance(titleReview.chipRatings[key]);
                        const label = key === 'seo' ? 'SEO' : key === 'brandFit' ? 'Brand Fit' : 'Clarity';
                        return (
                          <span
                            key={key}
                            className="sim-top-pick-chip"
                            style={{ background: chip.bg, color: chip.text, borderColor: chip.border }}
                          >
                            {label}
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="sim-top-pick-collapse"
                        onClick={() => setTitleExpanded((value) => !value)}
                        aria-label={titleExpanded ? 'Collapse title review' : 'Expand title review'}
                        title={titleExpanded ? 'Collapse title review' : 'Expand title review'}
                      >
                        {titleExpanded ? '▴' : '▾'}
                      </button>
                    </div>
                  </div>

                  {titleExpanded && (
                    <div className="sim-top-pick-body">
                      <div className="sim-top-pick-summary">{titleReview.summaryReason}</div>

                      <div className="sim-top-pick-suggestions">
                        {titleReview.suggestedTitles.map((suggestion, index) => (
                          <div key={`${suggestion.title}-${index}`} className="sim-top-pick-suggestion-card">
                            <div>
                              <div className="sim-top-pick-suggestion-title">{suggestion.title}</div>
                              <div className="sim-top-pick-suggestion-why">{suggestion.whyItWorks}</div>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => setArticle((current) => current ? { ...current, title: suggestion.title } : current)}
                            >
                              Use title
                            </button>
                          </div>
                        ))}
                      </div>

                      {titleReview.followUpControls.allowGenerateMore && (
                        <div className="sim-top-pick-more">
                          <div className="sim-top-pick-more-title">Ask for more</div>
                          <div className="sim-top-pick-more-controls">
                            <select value={followUpMode} onChange={(e) => setFollowUpMode(e.target.value)}>
                              {titleReview.followUpControls.suggestedModes.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                              ))}
                            </select>
                            <textarea
                              rows={3}
                              value={followUpPrompt}
                              onChange={(e) => setFollowUpPrompt(e.target.value)}
                              placeholder={titleReview.followUpControls.placeholderPrompt}
                            />
                            <button type="button" className="btn-secondary" onClick={handleGenerateMoreTitles} disabled={followUpLoading}>
                              {followUpLoading ? 'Generating…' : 'Generate more'}
                            </button>
                          </div>
                          {followUpLoading && (
                            <div className="sim-top-pick-loading">
                              <div className="spinner" />
                              <span>Thinking through more title options…</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="sim-field">
                <label>
                  Subtitle{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <textarea className="sim-textarea" rows={3} value={article.deck} readOnly />
              </div>

              <div className="sim-field">
                <label>
                  Author <span className="sim-required">*</span>
                </label>
                <div className="sim-author-row">
                  <div className="sim-tag">
                    Ashley Burnett <span className="sim-tag-x">&times;</span>
                  </div>
                  <input type="text" className="sim-input sim-author-input" placeholder="Add author..." readOnly />
                  <button className="sim-custom-btn" type="button">+ Custom</button>
                </div>
              </div>

              {phase === 'analyzed' && analysis && (analysis.bodyAnalysis || analysis.bodySuggestions.length > 0) && (
                <div className="sim-field">
                  <label>Body Analysis</label>
                  <div style={{ border: '1px solid #c4b5fd', borderRadius: '10px', background: '#f5f3ff', overflow: 'hidden' }}>
                    {/* Always-visible header: full summary + plain text item list */}
                    <div style={{ padding: '0.75rem 0.9rem 0.6rem' }}>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#4c1d95', fontWeight: 500, lineHeight: 1.5 }}>
                        {analysis.bodyAnalysis}
                      </p>
                      {analysis.bodySuggestions.length > 0 && (
                        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.5 }}>
                          {analysis.bodySuggestions.map((s) => s.title).join(' · ')}
                        </p>
                      )}
                    </div>
                    {analysis.bodySuggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBodyExpanded(!bodyExpanded)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', background: bodyExpanded ? '#ddd6fe' : '#ede9fe', border: 'none', borderTop: '1px solid #ddd6fe', color: '#6d28d9', fontSize: '0.76rem', fontWeight: 700, padding: '0.4rem', cursor: 'pointer', letterSpacing: '0.02em' }}
                      >
                        {bodyExpanded ? <>Hide <span>▴</span></> : <>View {analysis.bodySuggestions.length} Suggestion{analysis.bodySuggestions.length !== 1 ? 's' : ''} and Refine with AI <span>▾</span></>}
                      </button>
                    )}
                    {/* Expanded: individual suggestion cards + Refine with AI */}
                    {bodyExpanded && analysis.bodySuggestions.length > 0 && (
                      <>
                        <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', display: 'grid', gap: '0.55rem' }}>
                          {analysis.bodySuggestions.map((s, i) => {
                            const sev = s.severity;
                            const chipColors = sev === 'critical'
                              ? { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' }
                              : { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' };
                            const kindMap: Record<string, string> = { clarity: 'Clarity', seo: 'SEO', structure: 'Structure', tone: 'Tone', fact: 'Fact-check' };
                            const kindLabelText = s.kind ? (kindMap[s.kind] ?? s.kind) : 'Note';
                            return (
                              <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #ddd6fe' }}>
                                <div style={{ width: '90px', flexShrink: 0, marginTop: '0.1rem' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.22rem 0.55rem', borderRadius: '999px', background: chipColors.bg, border: `1px solid ${chipColors.border}`, fontSize: '0.74rem', fontWeight: 700, color: chipColors.text }}>
                                    {kindLabelText}
                                  </span>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#312e81' }}>{s.title}</div>
                                  {s.description && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', lineHeight: 1.45 }}>{s.description}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Refine with AI */}
                        <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.8rem 0.9rem', background: '#fff' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Refine with AI</div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <textarea
                              rows={2}
                              placeholder="Ask about these suggestions…"
                              value={bodyRefineQuestion}
                              onChange={(e) => setBodyRefineQuestion(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBodyRefine(); } }}
                              style={{ flex: 1, resize: 'vertical', fontSize: '0.84rem', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #ddd6fe', outline: 'none', fontFamily: 'inherit' }}
                            />
                            <button
                              type="button"
                              onClick={handleBodyRefine}
                              disabled={bodyRefineLoading || !bodyRefineQuestion.trim()}
                              style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, cursor: bodyRefineQuestion.trim() && !bodyRefineLoading ? 'pointer' : 'default', opacity: bodyRefineQuestion.trim() && !bodyRefineLoading ? 1 : 0.5, flexShrink: 0 }}
                            >
                              {bodyRefineLoading ? '…' : 'Ask'}
                            </button>
                          </div>
                          {bodyRefineAnswer && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.84rem', color: '#312e81', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                              {bodyRefineAnswer}
                            </div>
                          )}
                          {bodyRefineLoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                              <div className="spinner" style={{ width: 14, height: 14 }} /> Working on it…
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="sim-field">
                <label>
                  Body <span className="sim-required">*</span>
                </label>

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
                  <div className="sim-editor-body">{article.body || 'Start adding your content here'}</div>
                  <div className="sim-editor-footer">Words: {wordCount} &nbsp; Characters: {charCount}</div>
                </div>
              </div>
            </div>

            <div className="sim-right">
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

              <div className="sim-field">
                <label>
                  Primary Section <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                {phase === 'analyzed' ? (
                  <div className="sim-tag-container">
                    <div className="sim-tag sim-tag-blue">
                      Custom Content &rarr; Advertorials <span className="sim-tag-x">&times;</span>
                    </div>
                  </div>
                ) : (
                  <input type="text" className="sim-input" placeholder="Type to search sections..." readOnly />
                )}
              </div>

              <div className="sim-field">
                <label>
                  Publish Timeline <span className="sim-required">*</span>{' '}
                  <span className="sim-info-icon">&#9432;</span>
                </label>
                <div className="sim-timeline-btns">
                  <button className="sim-timeline-btn" type="button">Schedule Date &amp; Time</button>
                  <button className="sim-timeline-btn active" type="button">After Final Review</button>
                </div>
              </div>

              {phase === 'analyzed' && (
                <button className="sim-preview-btn" type="button">&#x1F4CB; Preview Article</button>
              )}
            </div>
          </div>}

          {/* ── Step 2: Metadata ── */}
          {wizardStep === 2 && article && (
            <div className="sim-content">
              <div className="sim-left">
                <div className="sim-field">
                  <label>Summary <span className="sim-required">*</span> <span className="sim-info-icon">&#9432;</span></label>
                  <textarea
                    className="sim-textarea"
                    rows={5}
                    defaultValue={`${article.title} explores key developments in the travel industry. This article provides essential context and insights for industry professionals and decision-makers.`}
                  />
                </div>
                <div className="sim-field">
                  <label>SEO Title <span className="sim-info-icon">&#9432;</span></label>
                  <input type="text" className="sim-input" defaultValue={article.title} />
                </div>
                <div className="sim-field">
                  <label>SEO Meta Description <span className="sim-info-icon">&#9432;</span></label>
                  <textarea
                    className="sim-textarea"
                    rows={4}
                    defaultValue={`Explore the latest on ${article.title}. Essential reading for travel industry professionals.`}
                  />
                </div>

                {/* ── Refine with AI ── */}
                <div style={{ border: '1px solid #c4b5fd', borderRadius: '10px', background: '#f5f3ff', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <div style={{ padding: '0.75rem 0.9rem 0.65rem', borderBottom: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Refine with AI</div>
                    {/* Section selector */}
                    <select
                      value={metaSection}
                      onChange={(e) => { setMetaSection(e.target.value as MetaSection); setMetaResults([]); setMetaAccepted(null); setMetaDismissed(new Set()); }}
                      style={{ width: '100%', marginBottom: '0.7rem', padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #ddd6fe', background: '#fff', color: '#4c1d95', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="summary">Summary</option>
                      <option value="seoTitle">SEO Title</option>
                      <option value="keywordTopics">Keyword Topics</option>
                    </select>
                    {/* Prompt input */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <textarea
                        rows={2}
                        placeholder={
                          metaSection === 'summary' ? 'e.g. Make it more concise and trade-focused…'
                          : metaSection === 'seoTitle' ? 'e.g. Include "incentive travel" as a keyword…'
                          : 'e.g. Add wellness and MICE-related topics…'
                        }
                        value={metaPrompt}
                        onChange={(e) => setMetaPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMetaRefine(); } }}
                        style={{ flex: 1, resize: 'vertical', fontSize: '0.84rem', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #ddd6fe', outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                      />
                      <button
                        type="button"
                        onClick={handleMetaRefine}
                        disabled={metaLoading || !metaPrompt.trim()}
                        style={{ background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, cursor: metaPrompt.trim() && !metaLoading ? 'pointer' : 'default', opacity: metaPrompt.trim() && !metaLoading ? 1 : 0.5, flexShrink: 0 }}
                      >
                        {metaLoading ? '…' : 'Generate'}
                      </button>
                    </div>
                  </div>

                  {/* Results */}
                  {metaLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', fontSize: '0.82rem', padding: '0.75rem 0.9rem' }}>
                      <div className="spinner" style={{ width: 14, height: 14 }} /> Generating options…
                    </div>
                  )}
                  {!metaLoading && metaResults.length > 0 && (
                    <div style={{ padding: '0.65rem 0.9rem', display: 'grid', gap: '0.5rem' }}>
                      {metaResults.map((r, i) => {
                        if (metaDismissed.has(i)) return null;
                        const isAccepted = metaAccepted === i;
                        return (
                          <div
                            key={i}
                            style={{ background: isAccepted ? '#f0fdf4' : '#fff', border: `1px solid ${isAccepted ? '#86efac' : '#ddd6fe'}`, borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}
                          >
                            <div style={{ flex: 1, fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.5 }}>{r}</div>
                            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, marginTop: '0.1rem' }}>
                              {!isAccepted ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setMetaAccepted(i)}
                                    style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Use this
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMetaDismissed((prev) => new Set([...prev, i]))}
                                    style={{ background: 'none', border: '1px solid #e2e8f0', color: '#94a3b8', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 700 }}>✓ Applied</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="sim-right">
                <div className="sim-field">
                  <label>Additional Sections <span className="sim-info-icon">&#9432;</span></label>
                  <div className="sim-tag-container">
                    {['Content Location → Asia SoPaci…', 'Destinations → AsiaSoPacific', 'Travel Types → Luxury', 'Travel Types → Spa Report'].map((t) => (
                      <span key={t} className="sim-tag">{t} <span className="sim-tag-x">×</span></span>
                    ))}
                    <span className="sim-tag-add">Add more…</span>
                    <button type="button" className="sim-tag-clear">Clear All</button>
                  </div>
                </div>
                <div className="sim-field">
                  <label>Distribution Taxonomy <span className="sim-info-icon">&#9432;</span></label>
                  <div className="sim-tag-container">
                    {['RSS Feeds → Social Media', 'RSS Feeds → StoryPorts', 'Widgets → Home · Top Carousel', 'Widgets → Landing · Top Carou…'].map((t) => (
                      <span key={t} className="sim-tag">{t} <span className="sim-tag-x">×</span></span>
                    ))}
                    <span className="sim-tag-add">Add more…</span>
                    <button type="button" className="sim-tag-clear">Clear All</button>
                  </div>
                </div>
                <div className="sim-field">
                  <label>Keyword Topics <span className="sim-info-icon">&#9432;</span></label>
                  <div className="sim-tag-container">
                    {['Australia', 'Culinary', 'Events', 'Group Travel', 'Hotels and Resorts', 'United Airlines', 'Wellness'].map((t) => (
                      <span key={t} className="sim-tag">{t} <span className="sim-tag-x">×</span></span>
                    ))}
                    <span className="sim-tag-add">Add more…</span>
                    <button type="button" className="sim-tag-clear">Clear All</button>
                  </div>
                </div>
                <div className="sim-field">
                  <label>URL Slug <span className="sim-required">*</span> <span className="sim-info-icon">&#9432;</span></label>
                  <input
                    type="text"
                    className="sim-input"
                    defaultValue={article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
                    style={{ color: '#94a3b8' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="sim-cms-footer">
            <button className="sim-quit-btn" type="button" onClick={loadRandomArticle}>Quit</button>
            <div className="sim-footer-right">
              {wizardStep === 1 && (
                <button className="sim-analyze-btn" type="button" onClick={handleAnalyze} disabled={phase === 'analyzing' || !selectedPromptId || builtPrompts.length === 0}>
                  Analyze
                </button>
              )}
              {wizardStep === 2 && (
                <button className="sim-quit-btn" type="button" onClick={() => setWizardStep(1)}>← Back</button>
              )}
              {wizardStep === 1 && phase === 'analyzed' && (
                <button className="sim-next-btn" type="button" onClick={() => setWizardStep(2)}>Next</button>
              )}
              {wizardStep === 2 && (
                <button className="sim-next-btn" type="button" onClick={() => setWizardStep(3)}>Next</button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="takeover-overlay">
          <div className="takeover-content">
            <div className="takeover-logo">
              <img src="/northstar-logo.svg" alt="Northstar" />
            </div>
            <h3 className="takeover-title">Analyzing Article</h3>
            <p className="takeover-message" key={takeoverMessage}>{takeoverMessage}</p>
            <div className="takeover-time">
              <span>This should take less than {ESTIMATED_SECONDS} seconds</span>
            </div>
            <div className="takeover-progress-bar">
              <div className="takeover-progress-fill" style={{ width: `${Math.min((elapsedSeconds / ESTIMATED_SECONDS) * 100, 95)}%` }} />
            </div>
            <button className="takeover-cancel-btn" type="button" onClick={handleCancelRequest}>Cancel Analysis</button>
          </div>

          {showCancelConfirm && (
            <div className="takeover-confirm-overlay">
              <div className="takeover-confirm-dialog">
                <h4>Cancel AI Analysis?</h4>
                <p>Are you sure you want to cancel this AI process? Any results that have not been completed will be lost.</p>
                <div className="takeover-confirm-btns">
                  <button className="takeover-confirm-back" type="button" onClick={handleCancelDismiss}>Keep Analyzing</button>
                  <button className="takeover-confirm-yes" type="button" onClick={handleCancelConfirm}>Yes, Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
