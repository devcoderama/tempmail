const base64UrlEncode = (value) =>
  btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const withPadding = padded + '='.repeat(padLength);
  return decodeURIComponent(escape(atob(withPadding)));
};

const randomSuffix = () => {
  if (crypto?.randomUUID) return crypto.randomUUID().split('-')[0];
  return Math.random().toString(36).slice(2, 10);
};

export const generateTokenForEmail = (email) => {
  const encoded = base64UrlEncode(email);
  return `BLK.${encoded}.${randomSuffix()}`;
};

export const decodeTokenToEmail = (token) => {
  if (!token) return '';
  const parts = token.split('.');
  if (parts.length < 3 || parts[0] !== 'BLK') return '';
  try {
    return base64UrlDecode(parts[1]);
  } catch {
    return '';
  }
};
