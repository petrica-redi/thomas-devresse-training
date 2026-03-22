const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const data = await loadSiteData();
  if (!data.subscribers) data.subscribers = [];

  if (req.method === 'GET') {
    return res.json(data.subscribers);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    data.subscribers = data.subscribers.filter(s => s.id !== id);
    await saveSiteData(data);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
