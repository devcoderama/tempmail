import { neon } from '@neondatabase/serverless';

const sql = neon();
let schemaReady = false;

export const ensureSchema = async () => {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      from_email TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      headers JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS inbox_messages_to_created
    ON inbox_messages (to_email, created_at DESC);
  `;
  schemaReady = true;
};

export const normalizeEmail = (value = '') => value.trim().toLowerCase();

export const decodeTokenToEmail = (token = '') => {
  const parts = token.split('.');
  if (parts.length < 3 || parts[0] !== 'BLK') return '';
  const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (encoded.length % 4)) % 4);
  try {
    return Buffer.from(encoded + pad, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

export { sql };
