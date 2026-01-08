const STORAGE_KEYS = {
  TempMail: 'base44.TempMail',
  Email: 'base44.Email',
};

const load = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const save = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const createId = () => {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now()}`;
};

const applyFilter = (items, filter) => {
  if (!filter) return items;
  return items.filter((item) =>
    Object.entries(filter).every(([key, value]) => item[key] === value)
  );
};

const applyOrder = (items, orderBy) => {
  if (!orderBy) return items;
  const desc = orderBy.startsWith('-');
  const key = desc ? orderBy.slice(1) : orderBy;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
};

const createEntity = (name) => ({
  async create(payload) {
    const items = load(STORAGE_KEYS[name]);
    const now = new Date().toISOString();
    const record = { id: createId(), created_date: now, ...payload };
    items.push(record);
    save(STORAGE_KEYS[name], items);
    return record;
  },
  async filter(filter, orderBy) {
    const items = load(STORAGE_KEYS[name]);
    const filtered = applyFilter(items, filter);
    return applyOrder(filtered, orderBy);
  },
  async update(id, patch) {
    const items = load(STORAGE_KEYS[name]);
    const next = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
    save(STORAGE_KEYS[name], next);
    return next.find((item) => item.id === id);
  },
  async delete(id) {
    const items = load(STORAGE_KEYS[name]);
    const next = items.filter((item) => item.id !== id);
    save(STORAGE_KEYS[name], next);
  },
});

export const base44 = {
  entities: {
    TempMail: createEntity('TempMail'),
    Email: createEntity('Email'),
  },
};
