const { put, list } = require('@vercel/blob');

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
  const { put } = require('@vercel/blob');
  const blob = await put(SITE_DATA_KEY, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });
  return blob;
}

async function loadSiteDataFromVercel() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return getDefaultData();
  try {
    const { blobs } = await list({ prefix: SITE_DATA_KEY });
    if (blobs.length === 0) return getDefaultData();
    const res = await fetch(blobs[0].url);
    if (!res.ok) return getDefaultData();
    const data = await res.json();
    return { ...getDefaultData(), ...data };
  } catch (e) {
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
