const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const content = await loadCollection('content');
      res.status(200).json(content);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load content' });
    }
    return;
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    try {
      const content = await loadCollection('content');
      const merged = { ...content, ...body };
      await saveCollection('content', merged);
      res.status(200).json(merged);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save content' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
