const { put, head } = require('@vercel/blob');

const BLOB_OPTS = { access: 'public', contentType: 'application/json', addRandomSuffix: false };

const COLLECTIONS = {
  content: 'td-content.json',
  products: 'td-products.json',
  services: 'td-services.json',
  media: 'td-media.json',
  bookings: 'td-bookings.json',
  subscribers: 'td-subscribers.json',
  messages: 'td-messages.json',
  orders: 'td-orders.json',
};

const DEFAULTS = {
  content: {},
  products: { nutrition: [], gear: [], videos: [], gallery: [] },
  services: [],
  media: [],
  bookings: [],
  subscribers: [],
  messages: [],
  orders: [],
};

async function readBlob(key) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const meta = await head(key);
    const res = await fetch(meta.url + '?t=' + Date.now());
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    if (e?.code === 'blob_not_found' || String(e?.message || '').includes('not found')) return null;
    console.error('readBlob', key, e);
    return null;
  }
}

async function writeBlob(key, data) {
  return put(key, JSON.stringify(data), BLOB_OPTS);
}

async function loadSiteData() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ...DEFAULTS };
  const results = await Promise.allSettled(
    Object.entries(COLLECTIONS).map(async ([field, key]) => {
      const data = await readBlob(key);
      return [field, data];
    })
  );
  const out = { ...DEFAULTS };
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value[1] !== null) {
      out[r.value[0]] = r.value[1];
    }
  }
  return out;
}

async function saveSiteData(data) {
  const writes = [];
  for (const [field, key] of Object.entries(COLLECTIONS)) {
    if (data[field] !== undefined) {
      writes.push(writeBlob(key, data[field]));
    }
  }
  await Promise.allSettled(writes);
}

async function loadCollection(name) {
  const key = COLLECTIONS[name];
  if (!key) return DEFAULTS[name] ?? null;
  const data = await readBlob(key);
  return data ?? DEFAULTS[name] ?? null;
}

async function saveCollection(name, data) {
  const key = COLLECTIONS[name];
  if (!key) throw new Error('Unknown collection: ' + name);
  return writeBlob(key, data);
}

function getDefaultData() {
  return { ...DEFAULTS };
}

module.exports = {
  loadSiteData,
  saveSiteData,
  loadCollection,
  saveCollection,
  getDefaultData,
  COLLECTIONS,
};
