const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (req.method === 'GET') {
    try {
      const services = await loadCollection('services');
      res.status(200).json(services);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load services' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const services = Array.isArray(body.services) ? body.services : await loadCollection('services');
      await saveCollection('services', services);
      res.status(200).json(services);
    } catch (e) {
      res.status(500).json({ error: 'Failed to save services' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
