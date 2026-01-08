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

  const to = normalizeEmail(payload.to);
  const store = await readStore();
  const token = store.emailToToken[to];

  if (token) {
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mail_${Date.now()}`,
      to,
      from: payload.from,
      subject: payload.subject,
      body_text: payload.text,
      body_html: payload.html,
      headers: payload.headers,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    store.inboxByToken[token] = [entry, ...(store.inboxByToken[token] || [])];
    await writeStore(store);
  }

  return new Response('OK', { status: 200 });
};
