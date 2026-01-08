import { ensureSchema, normalizeEmail, sql } from './_db.js';
import { verifyAuth } from './_auth.js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();
  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const token = (payload.token || '').trim();
  const emailId = (payload.id || '').trim();
  if (!token || !emailId) {
    return new Response('Missing token or id', { status: 400 });
  }

  const auth = verifyAuth(req, { payload: rawBody, expectedToken: token });
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
  const result = await sql`
    DELETE FROM inbox_messages
    WHERE id = ${emailId}
      AND to_email = ${email}
    RETURNING id
  `;

  if (result.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(JSON.stringify({ deleted: emailId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
