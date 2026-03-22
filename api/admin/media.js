const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const media = await loadCollection('media');
      res.status(200).json(media);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load media' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }
    try {
      const media = await loadCollection('media');
      const filtered = media.filter((m) => m.id !== id);
      await saveCollection('media', filtered);
      res.status(200).json({ removed: id });
    } catch (e) {
      res.status(500).json({ error: 'Failed to remove' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
