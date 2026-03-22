const { loadSiteData, saveSiteData } = require('../lib/store');
const { notifySubscriber } = require('../lib/notify');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const data = await loadSiteData();
  if (!data.subscribers) data.subscribers = [];

  const exists = data.subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.json({ ok: true, message: 'Already subscribed' });
  }

  const sub = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    source: 'website',
  };

  data.subscribers.push(sub);
  await saveSiteData(data);
  notifySubscriber(sub).catch(() => {});
  res.json({ ok: true, message: 'Subscribed successfully' });
};
