/**
 * Vite plugin that serves the Vercel API functions locally during development.
 * Handles /api/* requests inside the single Vite dev server — no second process needed.
 */
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/** Load .env into process.env so api/_lib modules can read them */
function loadDotEnv(root: string) {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// Ordered most-specific first so /api/articles/sample beats /api/articles/:id
const API_ROUTES: Array<{ pattern: RegExp; module: string; param?: string }> = [
  { pattern: /^\/api\/health$/,                      module: './api/health' },
  { pattern: /^\/api\/articles\/sample$/,            module: './api/articles/sample' },
  { pattern: /^\/api\/articles\/(\d+)$/,             module: './api/articles/[id]', param: 'id' },
  { pattern: /^\/api\/articles$/,                    module: './api/articles/index' },
  { pattern: /^\/api\/ai-test$/,                     module: './api/ai-test' },
  { pattern: /^\/api\/compare$/,                     module: './api/compare' },
  { pattern: /^\/api\/prompts\/([^/]+)$/,            module: './api/prompts/[id]', param: 'id' },
  { pattern: /^\/api\/prompts$/,                     module: './api/prompts/index' },
  { pattern: /^\/api\/personas\/([^/]+)$/,           module: './api/personas/[id]', param: 'id' },
  { pattern: /^\/api\/personas$/,                    module: './api/personas/index' },
  { pattern: /^\/api\/built-prompts\/([^/]+)$/,      module: './api/built-prompts/[id]', param: 'id' },
  { pattern: /^\/api\/built-prompts$/,               module: './api/built-prompts/index' },
];

/** Add res.json / res.status / req.query / req.body shims to match VercelRequest/VercelResponse */
function shimVercel(
  req: IncomingMessage,
  res: ServerResponse,
  extraQuery: Record<string, string> = {},
  body: unknown,
) {
  const parsed = parseUrl(req.url!, true);
  (req as any).query = { ...parsed.query, ...extraQuery };
  (req as any).body = body;

  const r = res as any;
  r.status = (code: number) => { res.statusCode = code; return r; };
  r.json = (data: unknown) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return r;
  };
  r.send = (text: string) => { res.end(text); return r; };
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
    });
  });
}

export function localApiPlugin(): Plugin {
  let viteServer: ViteDevServer;

  return {
    name: 'local-api',

    configureServer(server) {
      viteServer = server;
      loadDotEnv(server.config.root);

      server.middlewares.use(async (req, res, next) => {
        const pathname = parseUrl(req.url!).pathname!;
        if (!pathname.startsWith('/api/')) return next();

        for (const route of API_ROUTES) {
          const match = pathname.match(route.pattern);
          if (!match) continue;

          const extraQuery: Record<string, string> = {};
          if (route.param && match[1]) extraQuery[route.param] = match[1];

          try {
            const body = await readBody(req);
            shimVercel(req, res, extraQuery, body);
            const mod = await viteServer.ssrLoadModule(route.module);
            await mod.default(req, res);
          } catch (err) {
            console.error('[local-api]', err);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Server error' }));
            }
          }
          return;
        }

        // Matched /api/ prefix but no route found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API route not found' }));
      });
    },
  };
}
