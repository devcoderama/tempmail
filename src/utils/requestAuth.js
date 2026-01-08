const SIGNATURE_VERSION = '1';

const getEnv = (key) => import.meta.env[key] || '';

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hmacSha256 = async (secret, message) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
};

export const buildAuthHeaders = async ({ path, payload = '', bearerToken } = {}) => {
  const secret = getEnv('VITE_TOKEN_HMAC_SECRET') || getEnv('VITE_APP_SIGNATURE_SECRET');
  const token = bearerToken || getEnv('VITE_APP_BEARER_TOKEN');
  const appVersion = getEnv('VITE_APP_VERSION') || '1';

  const timestamp = Date.now().toString();
  const message = `${path}.${timestamp}.${payload}`;
  const signature = await hmacSha256(secret, message);

  return {
    Authorization: `Bearer ${token}`,
    'x-timestamp': timestamp,
    'x-signature': signature,
    'x-signature-version': SIGNATURE_VERSION,
    'x-version-app': appVersion,
  };
};
