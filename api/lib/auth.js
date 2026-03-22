const bcrypt = require('bcryptjs');
const { SignJWT, jwtVerify } = require('jose');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'thomas@devresse.fit';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$LHxuZo5JrSJ5BP7/lNVg7elhTb.PGB8ghlam8WkUtOeoCdgwz8ya.';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'td-admin-secret-change-in-production');
const COOKIE_NAME = 'td_admin';

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

async function createToken(email) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.email === ADMIN_EMAIL ? payload : null;
  } catch {
    return null;
  }
}

function getTokenFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

async function requireAuth(req, res) {
  const token = getTokenFromRequest(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return payload;
}

async function login(email, password) {
  if (email !== ADMIN_EMAIL) return null;
  if (!ADMIN_PASSWORD_HASH) {
    return { error: 'Server not configured: set ADMIN_PASSWORD_HASH and JWT_SECRET in environment' };
  }
  const ok = await verifyPassword(password, ADMIN_PASSWORD_HASH);
  if (!ok) return null;
  return { token: await createToken(email) };
}

module.exports = {
  COOKIE_NAME,
  login,
  createToken,
  verifyToken,
  getTokenFromRequest,
  requireAuth,
};
