// First-party analytics collector — Vercel serverless function at /api/track.
//
// The inline tracker in src/layouts/Base.astro POSTs batches here via
// sendBeacon (text/plain body, so no CORS preflight). Same origin as the page,
// so ad blockers don't see a third-party call. Everything is best-effort: a
// failure here must never surface to the visitor, so we swallow and 204.
//
// Storage is Turso (libsql). Locally, TURSO_DATABASE_URL can be a file: URL —
// scripts/dev-api.ts runs this handler on :3999 and astro dev proxies /api to it.
import { createClient, type Client, type InArgs } from '@libsql/client';

const allowedOrigin = (o: string) => o === 'https://book.sdgaz.com' || /^http:\/\/localhost:\d+$/.test(o);

// Event names the tracker emits (GA4 naming). Anything else is dropped server-side.
const TYPES = new Set([
  'page_view', 'scroll', 'section_view', 'click', 'book_click', 'call_click',
  'booking_complete', 'user_engagement',
]);

const MAX_EVENTS = 50;
const MAX_BODY = 32_000;

let _db: Client | null = null;
let _ready: Promise<void> | null = null;

function db(): Client {
  if (_db) return _db;
  const url = process.env.TURSO_DATABASE_URL || 'file:.data/landing-events.db';
  _db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return _db;
}

function ensureSchema(): Promise<void> {
  if (_ready) return _ready;
  _ready = db().batch([
    `CREATE TABLE IF NOT EXISTS landing_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sid         TEXT NOT NULL,
      vid         TEXT,
      type        TEXT NOT NULL,
      ts          TEXT NOT NULL,
      ms          INTEGER,
      path        TEXT,
      section     TEXT,
      label       TEXT,
      value       REAL,
      src         TEXT,
      med         TEXT,
      camp        TEXT,
      gclid       INTEGER NOT NULL DEFAULT 0,
      device      TEXT,
      frame       INTEGER NOT NULL DEFAULT 0,
      internal    INTEGER NOT NULL DEFAULT 0,
      data        TEXT,
      received_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_le_ts   ON landing_events (ts)`,
    `CREATE INDEX IF NOT EXISTS idx_le_sid  ON landing_events (sid)`,
    `CREATE INDEX IF NOT EXISTS idx_le_type ON landing_events (type, ts)`,
  ], 'write')
    // Migration for tables created before the `internal` column existed.
    .then(() => db().execute(`ALTER TABLE landing_events ADD COLUMN internal INTEGER NOT NULL DEFAULT 0`).catch(() => undefined))
    .then(() => undefined);
  return _ready;
}

const str = (v: unknown, max = 200): string | null =>
  typeof v === 'string' && v.length ? v.slice(0, max) : null;
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export async function POST(req: Request): Promise<Response> {
  const origin = req.headers.get('origin') ?? '';
  if (origin && !allowedOrigin(origin)) return new Response(null, { status: 204 });

  let payload: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return new Response(null, { status: 204 });
    payload = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }

  const sid = str(payload.sid, 40);
  const events = Array.isArray(payload.ev) ? payload.ev.slice(0, MAX_EVENTS) : [];
  if (!sid || events.length === 0) return new Response(null, { status: 204 });

  // Per-batch context, denormalized onto every row so queries never join.
  const base = {
    vid:    str(payload.vid, 40),
    path:   str(payload.path, 200),
    src:    str(payload.src, 80),
    med:    str(payload.med, 80),
    camp:   str(payload.camp, 120),
    gclid:  payload.gclid ? 1 : 0,
    device: str(payload.dev, 16),
    frame:  payload.frame ? 1 : 0,
    internal: payload.internal ? 1 : 0,
  };
  const receivedAt = new Date().toISOString();

  const rows: InArgs[] = [];
  for (const e of events as Record<string, unknown>[]) {
    const type = str(e.t, 16);
    const ts = str(e.ts, 40);
    if (!type || !TYPES.has(type) || !ts) continue;
    const { t: _t, ts: _ts, ms: _ms, sec: _sec, label: _label, v: _v, ...extra } = e;
    rows.push([
      sid, base.vid, type, ts, num(e.ms),
      base.path, str(e.sec, 80), str(e.label, 120), num(e.v),
      base.src, base.med, base.camp, base.gclid, base.device, base.frame, base.internal,
      Object.keys(extra).length ? JSON.stringify(extra).slice(0, 1000) : null,
      receivedAt,
    ]);
  }
  if (rows.length === 0) return new Response(null, { status: 204 });

  try {
    await ensureSchema();
    await db().batch(
      rows.map((args) => ({
        sql: `INSERT INTO landing_events
          (sid, vid, type, ts, ms, path, section, label, value, src, med, camp, gclid, device, frame, internal, data, received_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args,
      })),
      'write',
    );
  } catch (err) {
    console.error('[track] insert failed', err);
  }
  return new Response(null, { status: 204 });
}
