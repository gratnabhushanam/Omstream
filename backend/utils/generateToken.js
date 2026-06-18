const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');

const resolveJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (secret) return secret;
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') return null;
  return 'gita_wisdom_super_secret_key';
};

const generateAccessToken = (id) => {
  const secret = resolveJwtSecret();
  if (!secret) throw new Error('JWT_SECRET must be set in production');
  return jwt.sign({ id: String(id) }, secret, { expiresIn: '15m' }); // 15-minute expiry
};

const generateRefreshToken = async (id) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7-day expiry

  // Delete any existing refresh tokens for this user first to enforce clean sessions
  await RefreshToken.deleteMany({ userId: String(id) });

  await RefreshToken.create({
    userId: String(id),
    token,
    expiryDate
  });

  return token;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  resolveJwtSecret
};
