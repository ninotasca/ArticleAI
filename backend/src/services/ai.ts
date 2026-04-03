import OpenAI from 'openai';
import type { Article } from '../types.js';

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!apiKey) {
  console.warn('⚠️  OPENAI_API_KEY must be set in environment');
}

const openai = new OpenAI({ apiKey: apiKey || 'missing' });

function interpolateTemplate(template: string, article: Article): string {
  return template
    .replace(/\{\{title\}\}/g, article.title || '')
    .replace(/\{\{deck\}\}/g, article.deck || '')
    .replace(/\{\{body\}\}/g, article.body || '')
    .replace(/\{\{id\}\}/g, article.id || '');
}

export async function runPrompt(
  template: string,
  article: Article
): Promise<string> {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const content = interpolateTemplate(template, article);

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '[No response]';
}

/**
 * Run all prompts for a single article (sequentially to be gentle on rate limits)
 */
export async function runPromptsForArticle(
  prompts: Array<{ id: string; template: string }>,
  article: Article
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const prompt of prompts) {
    try {
      results[prompt.id] = await runPrompt(prompt.template, article);
    } catch (error) {
      results[prompt.id] = `[Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  return results;
}
