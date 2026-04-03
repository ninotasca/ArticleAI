import type { Prompt, ComparisonResult, Article } from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    let message: string;
    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.error || errorText;
    } catch {
      message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchArticleSample(
  count: number
): Promise<{ articles: Article[] }> {
  const res = await fetch(`${API_BASE}/articles/sample?count=${count}`);
  return handleResponse(res);
}

export async function fetchArticles(
  limit = 50,
  offset = 0
): Promise<{ articles: Article[]; total: number }> {
  const res = await fetch(
    `${API_BASE}/articles?limit=${limit}&offset=${offset}`
  );
  return handleResponse(res);
}

export async function runComparison(
  prompts: Prompt[],
  articleIds: string[]
): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompts, articleIds }),
  });
  return handleResponse(res);
}

export async function healthCheck(): Promise<{
  status: string;
  env: { supabase: boolean; openai: boolean };
}> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function runAiTest(
  prompt: string,
  articleId?: number
): Promise<{ article: Article; result: string }> {
  const res = await fetch(`${API_BASE}/ai-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, articleId }),
  });
  return handleResponse(res);
}
