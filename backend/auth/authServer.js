require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── Register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { User } = req.app.locals.models;
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { User } = req.app.locals.models;
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(401).json({ error: 'Use OAuth to login' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── OAuth callback (Google) ───────────────────────────────────────
router.post('/oauth/google', async (req, res) => {
  try {
    const { User } = req.app.locals.models;
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) return res.status(400).json({ error: 'Google auth data required' });

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ name, email: email.toLowerCase(), googleId, avatar });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get profile ───────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { User } = req.app.locals.models;
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ─── Update profile ────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { User } = req.app.locals.models;

    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      decoded.id, { name, avatar }, { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Change password ───────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const { User } = req.app.locals.models;

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(decoded.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
