// Local stand-in for Vercel's /api runtime. Runs api/track.ts on :3999;
// astro.config.mjs proxies /api/* here during `npm run dev`.
//
//   node scripts/dev-api.ts
//
// Writes to .data/landing-events.db unless TURSO_DATABASE_URL is set.
import { createServer } from 'node:http';
import { POST } from '../api/track.ts';

const PORT = 3999;

createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url?.startsWith('/api/track')) {
    res.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  const out = await POST(new Request(`http://localhost:${PORT}${req.url}`, {
    method: 'POST', headers, body: Buffer.concat(chunks),
  }));
  res.writeHead(out.status).end();
}).listen(PORT, () => console.log(`[dev-api] /api/track on :${PORT}`));
