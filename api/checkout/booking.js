const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = new Stripe(key);
  const { sessionType, duration, price, date, time, name, email, phone } = req.body;

  if (!sessionType || !date || !time || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const priceNum = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (!priceNum || priceNum <= 0) {
    return res.status(400).json({ error: 'Free consultations do not require payment', free: true });
  }

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
        clientPhone: phone || '',
      },
    });

    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe booking error:', err);
    res.status(500).json({ error: err.message });
  }
};
