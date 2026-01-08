import { readStore } from './_store.js';

export default async (req) => {
  const url = new URL(req.url);
  const token = (url.searchParams.get('token') || '').trim();

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const store = await readStore();
  const inbox = store.inboxByToken[token] || [];

  return new Response(JSON.stringify({ inbox }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
