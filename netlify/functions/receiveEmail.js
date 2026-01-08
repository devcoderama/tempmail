import { ensureSchema, normalizeEmail, sql } from './_db.js';
import { verifyAuth } from './_auth.js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const auth = verifyAuth(req, { payload: rawBody });
  if (!auth.ok) {
    return new Response(auth.message, { status: auth.status });
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const toEmail = normalizeEmail(payload.to);
  if (!toEmail) {
    return new Response('Missing recipient', { status: 400 });
  }

  await ensureSchema();
  const id = crypto.randomUUID ? crypto.randomUUID() : `mail_${Date.now()}`;

  await sql`
    INSERT INTO inbox_messages (id, to_email, from_email, subject, body_text, body_html, headers, created_at)
    VALUES (
      ${id},
      ${toEmail},
      ${payload.from || ''},
      ${payload.subject || ''},
      ${payload.text || ''},
      ${payload.html || ''},
      ${payload.headers || {}},
      ${payload.created_at ? new Date(payload.created_at).toISOString() : new Date().toISOString()}
    )
  `;

  return new Response('OK', { status: 200 });
};
