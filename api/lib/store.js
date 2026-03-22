const { put, head } = require('@vercel/blob');

const SITE_DATA_KEY = 'site-data.json';

function getDefaultData() {
  return {
    content: {},
    products: {
      nutrition: [],
      gear: [],
      videos: [],
      gallery: [],
    },
    services: [],
    media: [],
    bookings: [],
    subscribers: [],
    messages: [],
    orders: [],
  };
}

async function saveSiteData(data) {
  const blob = await put(SITE_DATA_KEY, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  return blob;
}

async function loadSiteDataFromVercel() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return getDefaultData();
  try {
    const meta = await head(SITE_DATA_KEY);
    const res = await fetch(meta.url + '?t=' + Date.now());
    if (!res.ok) return getDefaultData();
    const data = await res.json();
    return { ...getDefaultData(), ...data };
  } catch (e) {
    if (e?.code === 'blob_not_found' || e?.message?.includes('not found')) {
      return getDefaultData();
    }
    console.error('store load', e);
    return getDefaultData();
  }
}

module.exports = {
  loadSiteData: loadSiteDataFromVercel,
  saveSiteData,
  getDefaultData,
  SITE_DATA_KEY,
};
