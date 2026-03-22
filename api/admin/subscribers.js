const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const subscribers = await loadCollection('subscribers');

  if (req.method === 'GET') {
    return res.json(subscribers);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const filtered = subscribers.filter(s => s.id !== id);
    await saveCollection('subscribers', filtered);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
