const { requireAuth } = require('../lib/auth');
const { loadSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const data = await loadSiteData();

  const bookings = data.bookings || [];
  const orders = data.orders || [];
  const subscribers = data.subscribers || [];
  const messages = data.messages || [];
  const media = data.media || [];

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const bookingsThisMonth = bookings.filter(b => {
    const d = new Date(b.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const ordersThisMonth = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const revenue = orders
    .filter(o => o.status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueThisMonth = ordersThisMonth
    .filter(o => o.status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const unreadMessages = messages.filter(m => !m.read).length;

  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

  res.json({
    totalBookings: bookings.length,
    bookingsThisMonth: bookingsThisMonth.length,
    pendingBookings,
    totalOrders: orders.length,
    ordersThisMonth: ordersThisMonth.length,
    totalRevenue: revenue,
    revenueThisMonth,
    totalSubscribers: subscribers.length,
    totalMessages: messages.length,
    unreadMessages,
    totalMedia: media.length,
  });
};
