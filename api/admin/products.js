const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData, getDefaultData } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (req.method === 'GET') {
    try {
      const data = await loadSiteData();
      res.status(200).json(data.products || getDefaultData().products);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load products' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const data = await loadSiteData();
      data.products = body.products || data.products || getDefaultData().products;
      await saveSiteData(data);
      res.status(200).json(data.products);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save products' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
