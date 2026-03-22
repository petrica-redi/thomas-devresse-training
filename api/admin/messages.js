const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const messages = await loadCollection('messages');

  if (req.method === 'GET') {
    return res.json(messages);
  }

  if (req.method === 'PUT') {
    const { id, read } = req.body || {};
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found' });
    if (read !== undefined) messages[idx].read = read;
    await saveCollection('messages', messages);
    return res.json(messages[idx]);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const filtered = messages.filter(m => m.id !== id);
    await saveCollection('messages', filtered);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
