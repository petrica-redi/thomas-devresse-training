const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const data = await loadSiteData();
      res.status(200).json(data.content || {});
    } catch (e) {
      res.status(500).json({ error: 'Failed to load content' });
    }
    return;
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    try {
      const data = await loadSiteData();
      data.content = { ...(data.content || {}), ...body };
      await saveSiteData(data);
      res.status(200).json(data.content);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save content' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
