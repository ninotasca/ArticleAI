import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isSupabaseConfigured } from './_lib/supabase';
import { isOpenAIConfigured } from './_lib/ai';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    env: {
      supabase: isSupabaseConfigured(),
      openai: isOpenAIConfigured(),
    },
  });
}
