const { Resend } = require('resend');

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'thom.devresse@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@devresse.fit';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendNotification({ subject, html, replyTo }) {
  const resend = getResend();
  if (!resend) {
    console.log('[Notify] Resend not configured, skipping email:', subject);
    return null;
  }
  try {
    const result = await resend.emails.send({
      from: `Devresse Training <${FROM_EMAIL}>`,
      to: [NOTIFY_EMAIL],
      subject,
      html,
      ...(replyTo && { replyTo }),
    });
    console.log('[Notify] Email sent:', subject, result.id || '');
    return result;
  } catch (err) {
    console.error('[Notify] Email failed:', err.message);
    return null;
  }
}

async function notifyBooking(booking) {
  const isFree = booking.free || booking.price === 0;
  const isDemo = booking.demo;
  return sendNotification({
    subject: `${isDemo ? '[DEMO] ' : ''}New Booking: ${booking.sessionType} — ${booking.date} at ${booking.time}`,
    replyTo: booking.email,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#c41e2a;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">${isDemo ? '🔶 Demo ' : ''}New Booking Received</h2>
        </div>
        <div style="background:#1a1a1a;color:#e5e5e5;padding:24px;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:120px">Session</td><td style="padding:8px 0;font-weight:700">${booking.sessionType} — ${booking.duration}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Date & Time</td><td style="padding:8px 0;font-weight:700">${booking.date} at ${booking.time}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Client</td><td style="padding:8px 0">${booking.name || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${booking.email}" style="color:#60a5fa">${booking.email}</a></td></tr>
            ${booking.phone ? `<tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0"><a href="tel:${booking.phone}" style="color:#60a5fa">${booking.phone}</a></td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#888">Price</td><td style="padding:8px 0;font-weight:700;color:#c41e2a">${isFree ? 'Free Consultation' : '€' + (booking.price || 0)}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Status</td><td style="padding:8px 0"><span style="background:rgba(52,211,153,.15);color:#34d399;padding:3px 10px;border-radius:12px;font-size:13px;font-weight:700">${booking.status}</span></td></tr>
          </table>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #333;font-size:13px;color:#888">
            <a href="https://devresse.fit/admin" style="color:#c41e2a;text-decoration:none;font-weight:700">Open Admin Panel →</a>
          </div>
        </div>
      </div>`,
  });
}

async function notifyContact(msg) {
  return sendNotification({
    subject: `New Message: ${msg.subject || 'Website Contact'} — from ${msg.name}`,
    replyTo: msg.email,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#c41e2a;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">New Contact Message</h2>
        </div>
        <div style="background:#1a1a1a;color:#e5e5e5;padding:24px;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:120px">From</td><td style="padding:8px 0;font-weight:700">${msg.name}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${msg.email}" style="color:#60a5fa">${msg.email}</a></td></tr>
            ${msg.phone ? `<tr><td style="padding:8px 0;color:#888">Phone</td><td style="padding:8px 0">${msg.phone}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#888">Subject</td><td style="padding:8px 0">${msg.subject || 'Website Contact'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#111;border-radius:6px;border-left:3px solid #c41e2a;line-height:1.6">
            ${msg.message.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #333;font-size:13px;color:#888">
            <a href="mailto:${msg.email}" style="color:#c41e2a;text-decoration:none;font-weight:700">Reply to ${msg.name} →</a> &nbsp;|&nbsp;
            <a href="https://devresse.fit/admin" style="color:#888;text-decoration:none">Admin Panel</a>
          </div>
        </div>
      </div>`,
  });
}

async function notifyOrder(order) {
  const isDemo = order.demo;
  const itemList = (order.items || []).map(i => `<tr><td style="padding:6px 0">${i.name}</td><td style="padding:6px 0;text-align:center">${i.quantity}</td><td style="padding:6px 0;text-align:right">€${(i.total || i.unitPrice * i.quantity).toFixed(2)}</td></tr>`).join('');
  return sendNotification({
    subject: `${isDemo ? '[DEMO] ' : ''}New Order: €${(order.total || 0).toFixed(2)} — ${(order.items || []).length} items`,
    replyTo: order.email,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#c41e2a;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;font-size:18px">${isDemo ? '🔶 Demo ' : ''}New Order Received</h2>
        </div>
        <div style="background:#1a1a1a;color:#e5e5e5;padding:24px;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:120px">Customer</td><td style="padding:8px 0;font-weight:700">${order.customerName || order.email || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${order.email}" style="color:#60a5fa">${order.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888">Total</td><td style="padding:8px 0;font-weight:700;color:#c41e2a;font-size:18px">€${(order.total || 0).toFixed(2)}</td></tr>
          </table>
          ${itemList ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;border-top:1px solid #333"><thead><tr><th style="padding:8px 0;text-align:left;color:#888;font-size:12px">Item</th><th style="padding:8px 0;text-align:center;color:#888;font-size:12px">Qty</th><th style="padding:8px 0;text-align:right;color:#888;font-size:12px">Price</th></tr></thead><tbody>${itemList}</tbody></table>` : ''}
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #333;font-size:13px;color:#888">
            <a href="https://devresse.fit/admin" style="color:#c41e2a;text-decoration:none;font-weight:700">Open Admin Panel →</a>
          </div>
        </div>
      </div>`,
  });
}

async function notifySubscriber(sub) {
  return sendNotification({
    subject: `New Subscriber: ${sub.email}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a1a;color:#e5e5e5;padding:24px;border-radius:8px;border-left:4px solid #c41e2a">
          <h3 style="margin:0 0 8px;font-size:16px">📬 New Newsletter Subscriber</h3>
          <p style="margin:0;font-size:14px"><strong>${sub.email}</strong> just subscribed via ${sub.source || 'website'}.</p>
          <p style="margin:12px 0 0;font-size:12px;color:#888"><a href="https://devresse.fit/admin" style="color:#c41e2a;text-decoration:none">View in Admin →</a></p>
        </div>
      </div>`,
  });
}

module.exports = { sendNotification, notifyBooking, notifyContact, notifyOrder, notifySubscriber };
