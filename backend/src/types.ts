export interface Article {
  id: number;
  title: string;
  deck: string;
  body: string;
}

/** Raw row shape from Supabase (uppercase columns) */
export interface ArticleRow {
  ID: number;
  Title: string;
  Deck: string;
  Body: string;
}

export interface Prompt {
  id: string;
  name: string;
  template: string;
  targetField: 'title' | 'deck' | 'body';
}

export interface ComparisonRequest {
  prompts: Prompt[];
  articleIds: number[];
}

export interface ComparisonResultRow {
  article: Article;
  results: Record<string, string>; // promptId -> AI output
}

export interface ComparisonResponse {
  results: ComparisonResultRow[];
  meta: {
    totalArticles: number;
    totalPrompts: number;
    duration: number;
  };
}
