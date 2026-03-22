const { loadSiteData, saveSiteData } = require('../lib/store');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, message, subject } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const data = await loadSiteData();
  if (!data.messages) data.messages = [];

  data.messages.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    email,
    phone: phone || '',
    subject: subject || 'Website Contact',
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });

  await saveSiteData(data);
  res.json({ ok: true, message: 'Message sent successfully' });
};
