import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfigured' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid password' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: '12h',
  });
  return res.json({ token });
});

export default router;
