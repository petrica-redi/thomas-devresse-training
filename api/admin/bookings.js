const { requireAuth } = require('../lib/auth');
const { loadCollection, saveCollection } = require('../lib/store');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const bookings = await loadCollection('bookings');

  if (req.method === 'GET') {
    return res.json(bookings);
  }

  if (req.method === 'PUT') {
    const { id, status, notes } = req.body || {};
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
    if (status) bookings[idx].status = status;
    if (notes !== undefined) bookings[idx].notes = notes;
    bookings[idx].updatedAt = new Date().toISOString();
    await saveCollection('bookings', bookings);
    return res.json(bookings[idx]);
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const filtered = bookings.filter(b => b.id !== id);
    await saveCollection('bookings', filtered);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
