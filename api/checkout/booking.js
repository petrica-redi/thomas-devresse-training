const Stripe = require('stripe');
const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionType, duration, price, date, time, name, email, phone } = req.body;

  if (!sessionType || !date || !time || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const data = await loadSiteData();
  if (!data.bookings) data.bookings = [];

  const conflict = data.bookings.find(
    b => b.date === date && b.time === time && b.status !== 'cancelled' && b.status !== 'expired' && b.status !== 'refunded'
  );
  if (conflict) {
    return res.status(409).json({ error: 'This time slot is already booked. Please choose another.' });
  }

  const priceNum = parseFloat(String(price).replace(/[^0-9.]/g, ''));

  if (!priceNum || String(price).toLowerCase().includes('free')) {
    const bookingId = 'free_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    data.bookings.unshift({
      id: bookingId,
      name: name || '',
      email,
      phone: phone || '',
      sessionType,
      duration,
      price: 0,
      date,
      time,
      status: 'confirmed',
      free: true,
      createdAt: new Date().toISOString(),
    });
    await saveSiteData(data);
    return res.status(200).json({ ok: true, free: true, id: bookingId });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = new Stripe(key);

  try {
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://devresse.fit';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'bancontact'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${sessionType} — ${duration}`,
            description: `${date} at ${time} with Thomas Devresse`,
          },
          unit_amount: Math.round(priceNum * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email,
      success_url: `${origin}?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?booking=cancelled#booking`,
      locale: 'auto',
      metadata: {
        type: 'booking',
        sessionType,
        duration,
        date,
        time,
        clientName: name || '',
        clientEmail: email,
        clientPhone: phone || '',
      },
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe booking error:', err);
    res.status(500).json({ error: err.message });
  }
};
