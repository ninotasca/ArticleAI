import OpenAI from 'openai';
import type { Article } from './supabase.js';

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function interpolate(template: string, article: Article): string {
  return template
    .replace(/\{\{title\}\}/g, article.title || '')
    .replace(/\{\{deck\}\}/g, article.deck || '')
    .replace(/\{\{body\}\}/g, article.body || '')
    .replace(/\{\{id\}\}/g, String(article.id));
}

export async function runPrompt(template: string, article: Article): Promise<string> {
  const content = interpolate(template, article);
  const response = await getClient().chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
    max_tokens: 1000,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || '[No response]';
}

export async function runPromptsForArticle(
  prompts: Array<{ id: string; template: string }>,
  article: Article
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const prompt of prompts) {
    try {
      results[prompt.id] = await runPrompt(prompt.template, article);
    } catch (err) {
      results[prompt.id] = `[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`;
    }
  }
  return results;
}
