const { loadCollection } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = new URL(req.url, 'http://x');
  const date = url.searchParams.get('date');

  if (!date) return res.status(400).json({ error: 'Date parameter required' });

  const allSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const bookings = await loadCollection('bookings');
  const dayBookings = bookings.filter(
    b => b.date === date && b.status !== 'cancelled' && b.status !== 'expired' && b.status !== 'refunded'
  );

  const bookedTimes = new Set(dayBookings.map(b => b.time));
  const available = allSlots.map(s => ({ time: s, available: !bookedTimes.has(s) }));

  res.json({ date, slots: available });
};
