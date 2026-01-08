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

const stripLeadingHeaders = (rawMessage) => {
  if (!rawMessage) return '';
  const match = rawMessage.match(/\r?\n\r?\n/);
  if (!match) return rawMessage.trim();
  return rawMessage.slice(match.index + match[0].length).trim();
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

const decodeBody = (body, headers) => {
  const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();
  if (encoding === 'quoted-printable') return decodeQuotedPrintable(body);
  if (encoding === 'base64') return decodeBase64(body);
  return body;
};

const extractFromRawBody = (rawBody, targetType) => {
  const boundaryMatch = rawBody.match(/^--([^\r\n]+)/m);
  const boundary = boundaryMatch ? boundaryMatch[1] : '';
  if (!boundary) return '';

  const parts = rawBody.split(`--${boundary}`);
  for (const part of parts) {
    if (!part || part.startsWith('--')) continue;
    const trimmed = part.replace(/^\s+/, '');
    const [headerBlock, bodyBlock = ''] = trimmed.split(/\r?\n\r?\n/);
    const headers = parseHeaders(headerBlock || '');
    const body = bodyBlock.trim();
    if (!body) continue;

    const partType = (headers['content-type'] || '').toLowerCase();
    if (partType.startsWith('multipart/')) {
      const nested = extractFromRawBody(body, targetType);
      if (nested) return nested;
      continue;
    }

    if (partType.includes(targetType)) {
      return decodeBody(body, headers);
    }
  }

  return '';
};

const extractParts = (rawBody, contentType) => {
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

    const partType = (headers['content-type'] || '').toLowerCase();
    if (partType.startsWith('multipart/')) {
      const nested = extractParts(body, headers['content-type'] || '');
      if (!html && nested.html) html = nested.html;
      if (!text && nested.text) text = nested.text;
      continue;
    }

    const decoded = decodeBody(body, headers);
    if (partType.includes('text/plain') && !text) text = decoded;
    if (partType.includes('text/html') && !html) html = decoded;
  }

  return { text, html };
};

const extractMimeParts = (rawMessage) => {
  const [rawHeaderBlock, rawBody = ''] = rawMessage.split(/\r?\n\r?\n/);
  const topHeaders = parseHeaders(rawHeaderBlock || '');
  const contentType = topHeaders['content-type'] || '';
  const { text, html } = extractParts(rawBody, contentType);
  const fallbackText = text || extractFromRawBody(rawBody, 'text/plain');
  const fallbackHtml = html || extractFromRawBody(rawBody, 'text/html');
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(fallbackText || '');
  return {
    text: fallbackText || stripLeadingHeaders(rawMessage),
    html: fallbackHtml || (looksLikeHtml ? fallbackText : ''),
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
    const { text, html } = extractMimeParts(rawBody);
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

    if (env.STORE_ENDPOINT) {
      const body = JSON.stringify(payload);
      const timestamp = Date.now().toString();
      const storeUrl = new URL(env.STORE_ENDPOINT);
      const sigPayload = `${storeUrl.pathname}.${timestamp}.${body}`;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.STORE_SIGNATURE_SECRET || ''),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(sigPayload)
      );
      const sigHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      await fetch(env.STORE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.STORE_BEARER_TOKEN}`,
          'x-timestamp': timestamp,
          'x-signature': sigHex,
          'x-signature-version': '1',
          'x-version-app': env.APP_VERSION || '1',
        },
        body,
      });
    }
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
