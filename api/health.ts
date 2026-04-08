import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    env: {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
    runtime: 'node',
  });
}
