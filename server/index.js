import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import checkoutRoutes from './routes/checkout.js';
import { handleSocket } from './utils/socket.js';
import { releaseExpiredLocks } from './utils/lockCleanup.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : '*';

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'DELETE'],
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());
app.set('io', io);

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  handleSocket(io, socket);
});

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('Missing MONGO_URI environment variable. Check server/.env.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    const port = process.env.PORT || 5000;
    const host = process.env.HOST || '0.0.0.0';
    server.listen(port, host, () => {
      console.log(`Server running on http://${host}:${port}`);
    });
    setInterval(() => releaseExpiredLocks(io), 30000);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
