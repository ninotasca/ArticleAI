import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
export const articleTable = process.env.SUPABASE_TABLE || 'articles';

export interface Article {
  id: number;
  title: string;
  deck: string;
  body: string;
}

interface ArticleRow {
  ID: number;
  Title: string;
  Deck: string;
  Body: string;
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.ID,
    title: row.Title || '',
    deck: row.Deck || '',
    body: row.Body || '',
  };
}

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }
  return createClient(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

export async function getArticles(limit = 50, offset = 0): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from(articleTable)
    .select('ID, Title, Deck, Body')
    .range(offset, offset + limit - 1);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapArticle);
}

export async function getArticleCount(): Promise<number> {
  const { count, error } = await getSupabase()
    .from(articleTable)
    .select('ID', { count: 'exact', head: true });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return count || 0;
}

export async function getArticlesByIds(ids: number[]): Promise<Article[]> {
  const { data, error } = await getSupabase()
    .from(articleTable)
    .select('ID, Title, Deck, Body')
    .in('ID', ids);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapArticle);
}

export async function getRandomArticles(count: number): Promise<Article[]> {
  const { data: allRecords, error } = await getSupabase()
    .from(articleTable)
    .select('ID');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  if (!allRecords || allRecords.length === 0) return [];

  const shuffled = [...allRecords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedIds = shuffled.slice(0, count).map((r) => r.ID);
  return getArticlesByIds(selectedIds);
}
