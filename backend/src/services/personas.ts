import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Persona } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const tableName = 'NorthstarAIPersonas';

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

interface PersonaRow {
  id: string;
  title: string;
  persona: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: PersonaRow): Persona {
  return {
    id: row.id,
    title: row.title,
    persona: row.persona,
  };
}

export async function getAllPersonas(): Promise<Persona[]> {
  const { data, error } = await getClient()
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function createPersona(
  persona: Omit<Persona, 'id'>
): Promise<Persona> {
  const { data, error } = await getClient()
    .from(tableName)
    .insert({
      title: persona.title,
      persona: persona.persona,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function updatePersona(
  id: string,
  persona: Partial<Omit<Persona, 'id'>>
): Promise<Persona> {
  const updateData: Record<string, string> = {};
  if (persona.title !== undefined) updateData.title = persona.title;
  if (persona.persona !== undefined) updateData.persona = persona.persona;
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

export async function deletePersona(id: string): Promise<void> {
  const { error } = await getClient()
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Supabase error: ${error.message}`);
}
