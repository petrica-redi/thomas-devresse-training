const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const data = await loadSiteData();
  if (!data.messages) data.messages = [];

  if (req.method === 'GET') {
    return res.json(data.messages);
  }

  if (req.method === 'PUT') {
    const { id, read } = req.body || {};
    const idx = data.messages.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found' });
    if (read !== undefined) data.messages[idx].read = read;
    await saveSiteData(data);
    return res.json(data.messages[idx]);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    data.messages = data.messages.filter(m => m.id !== id);
    await saveSiteData(data);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
