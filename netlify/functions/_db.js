import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing database connection string');
}

const sql = neon(connectionString);
let schemaReady = false;

export const ensureSchema = async () => {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS temp_mails (
      email_address TEXT PRIMARY KEY,
      access_token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
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

export { sql };
