const { requireAuth } = require('../lib/auth');
const { put } = require('@vercel/blob');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { filename, base64 } = body;
  if (!filename || !base64) {
    res.status(400).json({ error: 'Send filename and base64 in JSON body' });
    return;
  }

  try {
    const buf = Buffer.from(base64, 'base64');
    const pathname = `media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const blob = await put(pathname, buf, { access: 'public', contentType: body.mimeType || 'image/jpeg' });
    const data = await loadSiteData();
    data.media = data.media || [];
    data.media.unshift({ id: Date.now().toString(), url: blob.url, filename, pathname, createdAt: new Date().toISOString() });
    await saveSiteData(data);
    res.status(200).json({ url: blob.url, id: data.media[0].id, filename });
  } catch (e) {
    console.error('upload', e);
    res.status(500).json({ error: 'Upload failed' });
  }
};
