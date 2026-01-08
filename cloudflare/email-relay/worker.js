const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const decodeQuotedPrintable = (value) => {
  if (!value) return '';
  const softBreaksRemoved = value.replace(/=\r?\n/g, '');
  return softBreaksRemoved.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
};

const decodeBase64 = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\s+/g, '');
  try {
    return atob(cleaned);
  } catch {
    return value;
  }
};

const parseHeaders = (raw) => {
  const headers = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = '';
  for (const line of lines) {
    if (!line) continue;
    if (/^\s/.test(line) && currentKey) {
      headers[currentKey] += ` ${line.trim()}`;
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    currentKey = line.slice(0, idx).toLowerCase();
    headers[currentKey] = line.slice(idx + 1).trim();
  }
  return headers;
};

const extractBoundary = (contentType, rawBody) => {
  if (contentType) {
    const match = contentType.match(/boundary="?([^";]+)"?/i);
    if (match) return match[1];
  }

  const firstLine = rawBody.split(/\r?\n/)[0] || '';
  if (firstLine.startsWith('--')) {
    return firstLine.slice(2).trim();
  }

  return '';
};

const extractMimeParts = (rawBody, contentType) => {
  const boundary = extractBoundary(contentType, rawBody);
  if (!boundary) {
    return { text: rawBody.trim(), html: '' };
  }

  const parts = rawBody.split(`--${boundary}`);
  let text = '';
  let html = '';

  for (const part of parts) {
    if (!part || part.startsWith('--')) continue;
    const [headerBlock, bodyBlock = ''] = part.split(/\r?\n\r?\n/);
    const headers = parseHeaders(headerBlock || '');
    const body = bodyBlock.trim();
    if (!body) continue;

    const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();
    let decoded = body;
    if (encoding === 'quoted-printable') {
      decoded = decodeQuotedPrintable(body);
    } else if (encoding === 'base64') {
      decoded = decodeBase64(body);
    }
    const partType = (headers['content-type'] || '').toLowerCase();

    if (partType.includes('text/plain')) {
      text = decoded;
    } else if (partType.includes('text/html')) {
      html = decoded;
    }
  }

  return {
    text: text || rawBody.trim(),
    html: html || '',
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
