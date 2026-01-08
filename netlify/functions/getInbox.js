import { ensureSchema, normalizeEmail, sql } from './_db.js';
import { verifyAuth } from './_auth.js';

export default async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const token = (url.searchParams.get('token') || '').trim();
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const auth = verifyAuth(req, {
    payload: url.searchParams.toString(),
    expectedToken: token,
  });
  if (!auth.ok) {
    return new Response(auth.message, { status: auth.status });
  }

  await ensureSchema();
  const tokenRow =
    await sql`SELECT email_address FROM temp_mails WHERE access_token = ${token}`;
  if (tokenRow.length === 0) {
    return new Response('Invalid token', { status: 400 });
  }

  const email = normalizeEmail(tokenRow[0].email_address);

  const limitParam = Number(url.searchParams.get('limit') || 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  const rows = await sql`
    SELECT id, to_email, from_email, subject, body_text, body_html, headers, created_at
    FROM inbox_messages
    WHERE to_email = ${email}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return new Response(JSON.stringify({ email_address: email, inbox: rows }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
