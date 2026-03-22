const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (req.method === 'GET') {
    try {
      const products = await loadCollection('products');
      res.status(200).json(products);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load products' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const products = body.products || await loadCollection('products');
      await saveCollection('products', products);
      res.status(200).json(products);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save products' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
