const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const orders = await loadCollection('orders');

  if (req.method === 'GET') {
    return res.json(orders);
  }

  if (req.method === 'PUT') {
    const { id, status, trackingNumber, notes } = req.body || {};
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });
    if (status) orders[idx].status = status;
    if (trackingNumber !== undefined) orders[idx].trackingNumber = trackingNumber;
    if (notes !== undefined) orders[idx].notes = notes;
    orders[idx].updatedAt = new Date().toISOString();
    await saveCollection('orders', orders);
    return res.json(orders[idx]);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
