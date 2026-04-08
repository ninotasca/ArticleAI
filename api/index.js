export default async function handler(req, res) {
  const url = new URL(req.url, 'https://local.test');
  const path = (url.searchParams.get('path') || '').replace(/^\/+/, '');

  if (path === 'health' || path === 'health/') {
    return res.status(200).json({
      status: 'ok',
      env: {
        supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      router: 'api/index.js',
    });
  }

  return res.status(404).json({ error: `API route not found: ${path || '(empty)'}` });
}
