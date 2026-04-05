import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const tableName = 'NorthstarAIBuiltPrompts';

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

export interface BuiltPromptRow {
  id: string;
  name: string;
  brand_voice_instructions: string;
  brand_voice_id: string | null;
  title_prompt_id: string | null;
  body_prompt_id: string | null;
  additional_instructions: string;
  output_rules: string;
  assembled_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface BuiltPrompt {
  id: string;
  name: string;
  brandVoiceInstructions: string;
  brandVoiceId: string | null;
  titlePromptId: string | null;
  bodyPromptId: string | null;
  additionalInstructions: string;
  outputRules: string;
  assembledPrompt: string;
}

function mapRow(row: BuiltPromptRow): BuiltPrompt {
  return {
    id: row.id,
    name: row.name,
    brandVoiceInstructions: row.brand_voice_instructions,
    brandVoiceId: row.brand_voice_id,
    titlePromptId: row.title_prompt_id,
    bodyPromptId: row.body_prompt_id,
    additionalInstructions: row.additional_instructions,
    outputRules: row.output_rules,
    assembledPrompt: row.assembled_prompt,
  };
}

export async function getAllBuiltPrompts(): Promise<BuiltPrompt[]> {
  const { data, error } = await getClient()
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return (data || []).map(mapRow);
}

export async function createBuiltPrompt(
  bp: Omit<BuiltPrompt, 'id'>
): Promise<BuiltPrompt> {
  const { data, error } = await getClient()
    .from(tableName)
    .insert({
      name: bp.name,
      brand_voice_instructions: bp.brandVoiceInstructions,
      brand_voice_id: bp.brandVoiceId,
      title_prompt_id: bp.titlePromptId,
      body_prompt_id: bp.bodyPromptId,
      additional_instructions: bp.additionalInstructions,
      output_rules: bp.outputRules,
      assembled_prompt: bp.assembledPrompt,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return mapRow(data);
}

export async function updateBuiltPrompt(
  id: string,
  bp: Partial<Omit<BuiltPrompt, 'id'>>
): Promise<BuiltPrompt> {
  const updateData: Record<string, string | null> = {};
  if (bp.name !== undefined) updateData.name = bp.name;
  if (bp.brandVoiceInstructions !== undefined)
    updateData.brand_voice_instructions = bp.brandVoiceInstructions;
  if (bp.brandVoiceId !== undefined)
    updateData.brand_voice_id = bp.brandVoiceId;
  if (bp.titlePromptId !== undefined)
    updateData.title_prompt_id = bp.titlePromptId;
  if (bp.bodyPromptId !== undefined)
    updateData.body_prompt_id = bp.bodyPromptId;
  if (bp.additionalInstructions !== undefined)
    updateData.additional_instructions = bp.additionalInstructions;
  if (bp.outputRules !== undefined) updateData.output_rules = bp.outputRules;
  if (bp.assembledPrompt !== undefined)
    updateData.assembled_prompt = bp.assembledPrompt;
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

export async function deleteBuiltPrompt(id: string): Promise<void> {
  const { error } = await getClient()
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Supabase error: ${error.message}`);
}
