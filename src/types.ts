export interface Article {
  id: number;
  title: string;
  deck: string;
  body: string;
}

export interface Prompt {
  id: string;
  name: string;
  template: string;
  targetField: 'title' | 'deck' | 'body';
}

export interface Persona {
  id: string;
  title: string;
  persona: string;
}

export interface BuiltPrompt {
  id: string;
  name: string;
  brandVoiceInstructions: string;
  brandVoiceId: string | null;
  titlePromptId: string | null;
  bodyPromptId: string | null;
  additionalInstructions: string;
  outputRules: string;
  assembledPrompt: string;
}

export interface ComparisonResultRow {
  article: Article;
  results: Record<string, string>; // promptId -> AI output
}

export interface ComparisonResult {
  results: ComparisonResultRow[];
  meta: {
    totalArticles: number;
    totalPrompts: number;
    duration: number;
  };
}

export interface TitleReviewSuggestion {
  title: string;
  whyItWorks: string;
  kind: 'editorial' | 'seo' | 'buzzy' | 'restrained' | 'trade';
  recommended: boolean;
}

export interface TitleReview {
  overallStatus: 'good_to_go' | 'worth_revisiting' | 'needs_work';
  summaryReason: string;
  chipRatings: {
    seo: 'green' | 'yellow' | 'red';
    clarity: 'green' | 'yellow' | 'red';
    brandFit: 'green' | 'yellow' | 'red';
  };
  collapsed: {
    defaultCollapsed: boolean;
  };
  detail: {
    editorNote: string;
    whyThisMatters: string | null;
  };
  suggestedTitles: TitleReviewSuggestion[];
  followUpControls: {
    allowGenerateMore: boolean;
    suggestedModes: string[];
    placeholderPrompt: string;
  };
}
