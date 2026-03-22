const { getTokenFromRequest, verifyToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = getTokenFromRequest(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.status(200).json({ email: payload.email });
};
