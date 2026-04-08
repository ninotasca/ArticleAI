import { getSupabase } from './supabase.js';

const TABLE = 'NorthstarAIPrompts';

export interface Prompt {
  id: string;
  name: string;
  template: string;
  targetField: 'title' | 'deck' | 'body';
}

interface PromptRow {
  id: string;
  name: string;
  template: string;
  target_field: string;
}

function mapRow(row: PromptRow): Prompt {
  return {
    id: row.id,
    name: row.name,
    template: row.template,
    targetField: row.target_field as Prompt['targetField'],
  };
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function createPrompt(prompt: Omit<Prompt, 'id'>): Promise<Prompt> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ name: prompt.name, template: prompt.template, target_field: prompt.targetField })
    .select()
    .single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function updatePrompt(id: string, prompt: Partial<Omit<Prompt, 'id'>>): Promise<Prompt> {
  const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
  if (prompt.name !== undefined) updateData.name = prompt.name;
  if (prompt.template !== undefined) updateData.template = prompt.template;
  if (prompt.targetField !== undefined) updateData.target_field = prompt.targetField;

  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
}
