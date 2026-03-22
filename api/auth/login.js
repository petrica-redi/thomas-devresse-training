const { login, COOKIE_NAME } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const raw = req.body || '{}';
    const { email, password } = typeof raw === 'string' ? (raw ? JSON.parse(raw) : {}) : raw;
    const result = await login(email, password);
    if (result && result.error) {
      res.status(500).json({ error: result.error });
      return;
    }
    if (!result || !result.token) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const isProd = process.env.VERCEL_ENV === 'production';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${isProd ? '; Secure' : ''}`);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
};
