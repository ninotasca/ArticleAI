module.exports = function handler(_req, res) {
  res.status(200).json({
    status: 'ok',
    env: {
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
    runtime: 'node-js',
  });
};
