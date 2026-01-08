import { createHmac, randomBytes } from 'node:crypto';
import { ensureSchema, normalizeEmail, sql } from './_db.js';
import { verifyAuth } from './_auth.js';

const createToken = (email, secret) => {
  const nonce = randomBytes(12).toString('hex');
  const sig = createHmac('sha256', secret).update(`${email}.${nonce}`).digest('hex');
  return `BLK.${nonce}.${sig}`;
};

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

  const email = normalizeEmail(payload.email_address || payload.email || '');
  if (!email) {
    return new Response('Missing email', { status: 400 });
  }

  const secret = process.env.TOKEN_HMAC_SECRET;
  if (!secret) {
    return new Response('Missing TOKEN_HMAC_SECRET', { status: 500 });
  }

  await ensureSchema();
  const exists = await sql`SELECT email_address FROM temp_mails WHERE email_address = ${email}`;
  if (exists.length > 0) {
    return new Response('Email already exists', { status: 409 });
  }

  const token = createToken(email, secret);
  await sql`
    INSERT INTO temp_mails (email_address, access_token)
    VALUES (${email}, ${token})
  `;

  return new Response(JSON.stringify({ email_address: email, access_token: token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
