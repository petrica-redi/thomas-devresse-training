const Stripe = require('stripe');
const { loadCollection, saveCollection } = require('../lib/store');
const { notifyBooking, notifyOrder } = require('../lib/notify');

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const meta = session.metadata || {};

        if (meta.type === 'booking') {
          const bookings = await loadCollection('bookings');
          const booking = {
            id: session.id,
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent,
            name: meta.clientName || '',
            email: session.customer_email || meta.clientEmail || '',
            phone: meta.clientPhone || '',
            sessionType: meta.sessionType || '',
            duration: meta.duration || '',
            price: (session.amount_total || 0) / 100,
            date: meta.date || '',
            time: meta.time || '',
            status: 'confirmed',
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          bookings.unshift(booking);
          await saveCollection('bookings', bookings);
          notifyBooking(booking).catch(() => {});
          console.log('[Stripe] Booking saved:', session.id, meta.sessionType, meta.date, meta.time);
        } else {
          let items = [];
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 50 });
            items = lineItems.data.map(li => ({
              name: li.description || li.price?.product?.name || 'Item',
              quantity: li.quantity,
              unitPrice: (li.price?.unit_amount || 0) / 100,
              total: (li.amount_total || 0) / 100,
            }));
          } catch (e) {
            console.error('[Stripe] Could not fetch line items:', e.message);
          }

          const shipping = session.shipping_details || session.shipping || null;
          const orders = await loadCollection('orders');
          const order = {
            id: session.id,
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent,
            customerName: shipping?.name || session.customer_details?.name || meta.customerName || '',
            email: session.customer_email || session.customer_details?.email || '',
            phone: session.customer_details?.phone || '',
            items,
            total: (session.amount_total || 0) / 100,
            currency: session.currency || 'eur',
            status: 'paid',
            shippingAddress: shipping?.address ? {
              line1: shipping.address.line1,
              line2: shipping.address.line2,
              city: shipping.address.city,
              postal_code: shipping.address.postal_code,
              country: shipping.address.country,
            } : null,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          orders.unshift(order);
          await saveCollection('orders', orders);
          notifyOrder(order).catch(() => {});
          console.log('[Stripe] Order saved:', session.id, items.length, 'items, €' + (session.amount_total || 0) / 100);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const meta = session.metadata || {};
        if (meta.type === 'booking') {
          const bookings = await loadCollection('bookings');
          const idx = bookings.findIndex(b => b.stripeSessionId === session.id);
          if (idx !== -1) {
            bookings[idx].status = 'expired';
            await saveCollection('bookings', bookings);
          }
        }
        console.log('[Stripe] Session expired:', session.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const pi = charge.payment_intent;

        const orders = await loadCollection('orders');
        const order = orders.find(o => o.stripePaymentIntent === pi);
        if (order) {
          order.status = 'refunded';
          order.refundedAt = new Date().toISOString();
          await saveCollection('orders', orders);
          console.log('[Stripe] Order refunded:', order.id);
        }

        const bookings = await loadCollection('bookings');
        const booking = bookings.find(b => b.stripePaymentIntent === pi);
        if (booking) {
          booking.status = 'refunded';
          booking.refundedAt = new Date().toISOString();
          await saveCollection('bookings', bookings);
          console.log('[Stripe] Booking refunded:', booking.id);
        }
        break;
      }

      default:
        console.log('[Stripe] Event:', event.type);
    }
  } catch (err) {
    console.error('[Stripe] Webhook processing error:', err);
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
