const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  res.json({
    stripe: !!process.env.STRIPE_SECRET_KEY,
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'none',
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    email: !!(process.env.RESEND_API_KEY || process.env.GMAIL_APP_PASSWORD),
    emailProvider: process.env.RESEND_API_KEY ? 'resend' : process.env.GMAIL_APP_PASSWORD ? 'gmail' : 'none',
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    notifyEmail: process.env.NOTIFY_EMAIL || 'thom.devresse@gmail.com',
  });
};
