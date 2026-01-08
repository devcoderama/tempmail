import { createHmac, timingSafeEqual } from 'node:crypto';

const VERSION = '1';
const getHeader = (req, name) => req.headers.get(name) || '';

export const verifyAuth = (req, { payload = '', expectedToken } = {}) => {
  const secret = process.env.TOKEN_HMAC_SECRET;
  const appToken = process.env.APP_BEARER_TOKEN;
  const appVersion = process.env.APP_VERSION || '';

  if (!secret) {
    return { ok: false, status: 500, message: 'Missing TOKEN_HMAC_SECRET' };
  }

  const auth = getHeader(req, 'authorization');
  const timestamp = getHeader(req, 'x-timestamp');
  const signature = getHeader(req, 'x-signature');
  const signatureVersion = getHeader(req, 'x-signature-version');
  const versionApp = getHeader(req, 'x-version-app');

  if (!auth || !timestamp || !signature || !signatureVersion || !versionApp) {
    return { ok: false, status: 401, message: 'Missing auth headers' };
  }

  if (appVersion && versionApp !== appVersion) {
    return { ok: false, status: 400, message: 'Invalid app version' };
  }

  const bearer = auth.replace(/^Bearer\s+/i, '');
  if (expectedToken) {
    if (bearer !== expectedToken) {
      return { ok: false, status: 401, message: 'Invalid token' };
    }
  } else if (appToken) {
    if (bearer !== appToken) {
      return { ok: false, status: 401, message: 'Invalid token' };
    }
  } else {
    return { ok: false, status: 500, message: 'Missing APP_BEARER_TOKEN' };
  }

  if (signatureVersion !== VERSION) {
    return { ok: false, status: 400, message: 'Invalid signature version' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 400, message: 'Invalid timestamp' };
  }

  const skewMs = Math.abs(Date.now() - ts);
  if (skewMs > 5 * 60 * 1000) {
    return { ok: false, status: 401, message: 'Timestamp expired' };
  }

  const url = new URL(req.url);
  const base = `${url.pathname}.${timestamp}.${payload}`;
  const expected = createHmac('sha256', secret).update(base).digest('hex');

  const safeExpected = Buffer.from(expected, 'utf-8');
  const safeActual = Buffer.from(signature, 'utf-8');
  if (safeExpected.length !== safeActual.length || !timingSafeEqual(safeExpected, safeActual)) {
    return { ok: false, status: 401, message: 'Invalid signature' };
  }

  return { ok: true };
};
