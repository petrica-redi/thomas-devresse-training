const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (req.method === 'GET') {
    try {
      const data = await loadSiteData();
      res.status(200).json(data.services || []);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load services' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const data = await loadSiteData();
      data.services = Array.isArray(body.services) ? body.services : (data.services || []);
      await saveSiteData(data);
      res.status(200).json(data.services);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save services' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
