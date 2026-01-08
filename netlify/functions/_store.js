import { readFile, writeFile } from 'node:fs/promises';

const STORE_PATH = '/tmp/botlynk-mail.json';

const defaultStore = {
  emailToToken: {},
  inboxByToken: {},
  tempMailByToken: {},
};

export const readStore = async () => {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return { ...defaultStore };
  }
};

export const writeStore = async (store) => {
  await writeFile(STORE_PATH, JSON.stringify(store), 'utf-8');
};

export const normalizeEmail = (email = '') => email.trim().toLowerCase();
