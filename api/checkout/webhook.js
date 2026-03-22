const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) return res.status(500).json({ error: 'Stripe not configured' });

  const stripe = new Stripe(key);

  let event;
  try {
    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature failed' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('[Stripe] Payment completed:', {
        id: session.id,
        email: session.customer_email,
        amount: session.amount_total,
        metadata: session.metadata,
      });
      break;
    }
    case 'payment_intent.succeeded': {
      console.log('[Stripe] PaymentIntent succeeded:', event.data.object.id);
      break;
    }
    default:
      console.log('[Stripe] Unhandled event:', event.type);
  }

  res.status(200).json({ received: true });
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(JSON.stringify(req.body));
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports.config = { api: { bodyParser: false } };
