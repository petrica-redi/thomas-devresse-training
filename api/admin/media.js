const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const data = await loadSiteData();
      res.status(200).json(data.media || []);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load media' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }
    try {
      const data = await loadSiteData();
      data.media = (data.media || []).filter((m) => m.id !== id);
      await saveSiteData(data);
      res.status(200).json({ removed: id });
    } catch (e) {
      res.status(500).json({ error: 'Failed to remove' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
