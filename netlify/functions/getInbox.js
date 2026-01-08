import { decodeTokenToEmail, ensureSchema, normalizeEmail, sql } from './_db.js';

export default async (req) => {
  const url = new URL(req.url);
  const token = (url.searchParams.get('token') || '').trim();
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const email = normalizeEmail(decodeTokenToEmail(token));
  if (!email) {
    return new Response('Invalid token', { status: 400 });
  }

  const limitParam = Number(url.searchParams.get('limit') || 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  await ensureSchema();
  const rows = await sql`
    SELECT id, to_email, from_email, subject, body_text, body_html, headers, created_at
    FROM inbox_messages
    WHERE to_email = ${email}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return new Response(JSON.stringify({ inbox: rows }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
