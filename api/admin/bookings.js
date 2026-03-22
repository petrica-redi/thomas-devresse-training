const { requireAuth } = require('../lib/auth');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const data = await loadSiteData();
  if (!data.bookings) data.bookings = [];

  if (req.method === 'GET') {
    return res.json(data.bookings);
  }

  if (req.method === 'PUT') {
    const { id, status, notes } = req.body || {};
    const idx = data.bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
    if (status) data.bookings[idx].status = status;
    if (notes !== undefined) data.bookings[idx].notes = notes;
    data.bookings[idx].updatedAt = new Date().toISOString();
    await saveSiteData(data);
    return res.json(data.bookings[idx]);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    data.bookings = data.bookings.filter(b => b.id !== id);
    await saveSiteData(data);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
