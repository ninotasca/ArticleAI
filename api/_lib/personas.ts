import { getSupabase } from './supabase.js';

const TABLE = 'NorthstarAIPersonas';

export interface Persona {
  id: string;
  title: string;
  persona: string;
}

interface PersonaRow {
  id: string;
  title: string;
  persona: string;
}

function mapRow(row: PersonaRow): Persona {
  return { id: row.id, title: row.title, persona: row.persona };
}

export async function getAllPersonas(): Promise<Persona[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function createPersona(persona: Omit<Persona, 'id'>): Promise<Persona> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ title: persona.title, persona: persona.persona })
    .select()
    .single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function updatePersona(id: string, persona: Partial<Omit<Persona, 'id'>>): Promise<Persona> {
  const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
  if (persona.title !== undefined) updateData.title = persona.title;
  if (persona.persona !== undefined) updateData.persona = persona.persona;

  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function deletePersona(id: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Supabase error: ${error.message}`);
}
