const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const extractMimeParts = (rawBody, contentType) => {
  if (!contentType) {
    return { text: rawBody, html: rawBody };
  }

  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
  if (!boundaryMatch) {
    return { text: rawBody, html: rawBody };
  }

  const boundary = boundaryMatch[1];
  const parts = rawBody.split(`--${boundary}`);
  let text = '';
  let html = '';

  for (const part of parts) {
    if (!part || part.startsWith('--')) continue;
    const [headerBlock, bodyBlock = ''] = part.split(/\r?\n\r?\n/);
    const headers = headerBlock.toLowerCase();
    const body = bodyBlock.trim();
    if (!body) continue;

    if (headers.includes('content-type: text/plain')) {
      text = body;
    }
    if (headers.includes('content-type: text/html')) {
      html = body;
    }
  }

  return {
    text: text || rawBody,
    html: html || rawBody,
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/ws') {
      return new Response('Not Found', { status: 404 });
    }

    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      console.log('WS missing email');
      return jsonResponse({ error: 'Missing email' }, 400);
    }

    const roomId = env.INBOX_ROOM.idFromName(email);
    const room = env.INBOX_ROOM.get(roomId);
    console.log('WS connect:', email);
    return room.fetch(request);
  },

  async email(message, env) {
    const email = (message.to || '').trim().toLowerCase();
    if (!email) return;

    const rawBody = await new Response(message.raw).text();
    const contentType = message.headers.get('content-type') || '';
    const { text, html } = extractMimeParts(rawBody, contentType);
    const payload = {
      to: message.to,
      from: message.from,
      subject: message.headers.get('subject'),
      text,
      html,
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
    console.log('Room fetch:', request.method, request.headers.get('Upgrade'));
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sessions.add(server);
      server.addEventListener('close', () => this.sessions.delete(server));
      console.log('WS accepted, sessions:', this.sessions.size);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === 'POST') {
      const payload = await request.text();
      console.log('Notify sessions:', this.sessions.size);
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
