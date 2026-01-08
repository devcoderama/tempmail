import { readStore, writeStore, normalizeEmail } from './_store.js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const token = (payload.access_token || payload.token || '').trim();
  const email = normalizeEmail(payload.email_address || payload.email || '');

  if (!token || !email) {
    return new Response('Missing token or email', { status: 400 });
  }

  const store = await readStore();
  store.emailToToken[email] = token;
  store.tempMailByToken[token] = {
    email_address: email,
    created_at: new Date().toISOString(),
  };
  await writeStore(store);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
