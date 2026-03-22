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
  const { items, mode, customerEmail } = req.body;

  if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

  try {
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://devresse.fit';

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          ...(item.description && { description: item.description }),
          ...(item.image && { images: [item.image] }),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    const sessionConfig = {
      payment_method_types: ['card', 'bancontact', 'ideal'],
      line_items: lineItems,
      mode: mode || 'payment',
      success_url: `${origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?checkout=cancelled`,
      locale: 'auto',
      ...(customerEmail && { customer_email: customerEmail }),
    };

    if (mode !== 'subscription') {
      const hasPhysical = items.some(i => i.requiresShipping);
      if (hasPhysical) {
        sessionConfig.shipping_address_collection = { allowed_countries: ['BE', 'NL', 'FR', 'DE', 'LU'] };
        sessionConfig.shipping_options = [
          { shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 495, currency: 'eur' }, display_name: 'Standard Shipping', delivery_estimate: { minimum: { unit: 'business_day', value: 1 }, maximum: { unit: 'business_day', value: 3 } } } },
          { shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'eur' }, display_name: 'Free Shipping (€75+)', delivery_estimate: { minimum: { unit: 'business_day', value: 1 }, maximum: { unit: 'business_day', value: 3 } } } },
        ];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
};
