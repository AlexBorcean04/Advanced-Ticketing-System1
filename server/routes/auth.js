import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    process.env.USER_JWT_SECRET || process.env.ADMIN_JWT_SECRET,
    { expiresIn: '12h' }
  );

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

export default router;
