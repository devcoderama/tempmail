const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/ws') {
      return new Response('Not Found', { status: 404 });
    }

    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      return jsonResponse({ error: 'Missing email' }, 400);
    }

    const roomId = env.INBOX_ROOM.idFromName(email);
    const room = env.INBOX_ROOM.get(roomId);
    return room.fetch(request);
  },

  async email(message, env) {
    const email = (message.to || '').trim().toLowerCase();
    if (!email) return;

    const rawBody = await new Response(message.raw).text();
    const parts = rawBody.split(/\r?\n\r?\n/);
    const bodyOnly = parts.length > 1 ? parts.slice(1).join('\n\n') : rawBody;
    const payload = {
      to: message.to,
      from: message.from,
      subject: message.headers.get('subject'),
      text: bodyOnly,
      html: bodyOnly,
      headers: Object.fromEntries(message.headers),
      created_at: new Date().toISOString(),
    };

    const roomId = env.INBOX_ROOM.idFromName(email);
    const room = env.INBOX_ROOM.get(roomId);
    await room.fetch('https://inbox/notify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export class InboxRoom {
  constructor() {
    this.sessions = new Set();
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.add(server);
      server.addEventListener('close', () => this.sessions.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === 'POST') {
      const payload = await request.text();
      for (const session of this.sessions) {
        try {
          session.send(payload);
        } catch {
          this.sessions.delete(session);
        }
      }
      return new Response('OK', { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
}
