import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Prompt } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const tableName = 'NorthstarAIPrompts';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

function getClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

interface PromptRow {
  id: string;
  name: string;
  template: string;
  target_field: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: PromptRow): Prompt {
  return {
    id: row.id,
    name: row.name,
    template: row.template,
    targetField: row.target_field as 'title' | 'deck' | 'body',
  };
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const { data, error } = await getClient()
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function createPrompt(
  prompt: Omit<Prompt, 'id'>
): Promise<Prompt> {
  const { data, error } = await getClient()
    .from(tableName)
    .insert({
      name: prompt.name,
      template: prompt.template,
      target_field: prompt.targetField,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function updatePrompt(
  id: string,
  prompt: Partial<Omit<Prompt, 'id'>>
): Promise<Prompt> {
  const updateData: Record<string, string> = {};
  if (prompt.name !== undefined) updateData.name = prompt.name;
  if (prompt.template !== undefined) updateData.template = prompt.template;
  if (prompt.targetField !== undefined)
    updateData.target_field = prompt.targetField;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await getClient()
    .from(tableName)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await getClient()
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Supabase error: ${error.message}`);
}
