const { loadCollection, saveCollection } = require('../lib/store');
const { notifyContact } = require('../lib/notify');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, message, subject } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const messages = await loadCollection('messages');

  const msg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name, email, phone: phone || '',
    subject: subject || 'Website Contact',
    message, read: false,
    createdAt: new Date().toISOString(),
  };

  messages.unshift(msg);
  await saveCollection('messages', messages);
  notifyContact(msg).catch(() => {});
  res.json({ ok: true, message: 'Message sent successfully' });
};
