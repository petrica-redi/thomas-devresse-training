const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const data = await loadSiteData();
  if (!data.orders) data.orders = [];

  if (req.method === 'GET') {
    return res.json(data.orders);
  }

  if (req.method === 'PUT') {
    const { id, status, trackingNumber, notes } = req.body || {};
    const idx = data.orders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    if (status) data.orders[idx].status = status;
    if (trackingNumber !== undefined) data.orders[idx].trackingNumber = trackingNumber;
    if (notes !== undefined) data.orders[idx].notes = notes;
    data.orders[idx].updatedAt = new Date().toISOString();
    await saveSiteData(data);
    return res.json(data.orders[idx]);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
