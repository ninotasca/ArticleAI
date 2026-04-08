import type { Prompt, ComparisonResult, Article, Persona, BuiltPrompt } from './types';

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

export async function fetchArticleById(id: number): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles/${id}`);
  const data = await handleResponse<{ article: Article }>(res);
  return data.article;
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
  articleIds: number[]
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

/* ── Prompt CRUD ── */

export async function fetchPrompts(): Promise<Prompt[]> {
  const res = await fetch(`${API_BASE}/prompts`);
  const data = await handleResponse<{ prompts: Prompt[] }>(res);
  return data.prompts;
}

export async function createPromptApi(
  prompt: Omit<Prompt, 'id'>
): Promise<Prompt> {
  const res = await fetch(`${API_BASE}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt),
  });
  const data = await handleResponse<{ prompt: Prompt }>(res);
  return data.prompt;
}

export async function updatePromptApi(
  id: string,
  prompt: Partial<Omit<Prompt, 'id'>>
): Promise<Prompt> {
  const res = await fetch(`${API_BASE}/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt),
  });
  const data = await handleResponse<{ prompt: Prompt }>(res);
  return data.prompt;
}

export async function deletePromptApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to delete prompt');
  }
}

/* ── Persona CRUD ── */

export async function fetchPersonas(): Promise<Persona[]> {
  const res = await fetch(`${API_BASE}/personas`);
  const data = await handleResponse<{ personas: Persona[] }>(res);
  return data.personas;
}

export async function createPersonaApi(
  persona: Omit<Persona, 'id'>
): Promise<Persona> {
  const res = await fetch(`${API_BASE}/personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(persona),
  });
  const data = await handleResponse<{ persona: Persona }>(res);
  return data.persona;
}

export async function updatePersonaApi(
  id: string,
  persona: Partial<Omit<Persona, 'id'>>
): Promise<Persona> {
  const res = await fetch(`${API_BASE}/personas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(persona),
  });
  const data = await handleResponse<{ persona: Persona }>(res);
  return data.persona;
}

export async function deletePersonaApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/personas/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to delete persona');
  }
}

/* ── Built Prompt CRUD ── */

export async function fetchBuiltPrompts(): Promise<BuiltPrompt[]> {
  const res = await fetch(`${API_BASE}/built-prompts`);
  const data = await handleResponse<{ builtPrompts: BuiltPrompt[] }>(res);
  return data.builtPrompts;
}

export async function createBuiltPromptApi(
  bp: Omit<BuiltPrompt, 'id'>
): Promise<BuiltPrompt> {
  const res = await fetch(`${API_BASE}/built-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bp),
  });
  const data = await handleResponse<{ builtPrompt: BuiltPrompt }>(res);
  return data.builtPrompt;
}

export async function updateBuiltPromptApi(
  id: string,
  bp: Partial<Omit<BuiltPrompt, 'id'>>
): Promise<BuiltPrompt> {
  const res = await fetch(`${API_BASE}/built-prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bp),
  });
  const data = await handleResponse<{ builtPrompt: BuiltPrompt }>(res);
  return data.builtPrompt;
}

export async function deleteBuiltPromptApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/built-prompts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to delete built prompt');
  }
}
