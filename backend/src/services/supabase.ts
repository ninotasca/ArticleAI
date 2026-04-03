import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Article, ArticleRow } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const tableName = process.env.SUPABASE_TABLE || 'articles';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment');
}

function getClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.'
    );
  }
  return supabase;
}

/** Map uppercase DB columns to our lowercase Article type */
function mapRow(row: ArticleRow): Article {
  return {
    id: row.ID,
    title: row.Title || '',
    deck: row.Deck || '',
    body: row.Body || '',
  };
}

export async function getArticles(limit = 50, offset = 0): Promise<Article[]> {
  const { data, error } = await getClient()
    .from(tableName)
    .select('ID, Title, Deck, Body')
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getArticlesByIds(ids: number[]): Promise<Article[]> {
  const { data, error } = await getClient()
    .from(tableName)
    .select('ID, Title, Deck, Body')
    .in('ID', ids);

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function getRandomArticles(count: number): Promise<Article[]> {
  // Fetch all IDs then shuffle & pick N
  const { data: allRecords, error } = await getClient()
    .from(tableName)
    .select('ID');

  if (error) throw new Error(`Supabase error: ${error.message}`);
  if (!allRecords || allRecords.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...allRecords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedIds = shuffled.slice(0, count).map((r) => r.ID);
  return getArticlesByIds(selectedIds);
}

export async function getArticleCount(): Promise<number> {
  const { count, error } = await getClient()
    .from(tableName)
    .select('ID', { count: 'exact', head: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return count || 0;
}
