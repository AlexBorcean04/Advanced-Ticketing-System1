import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import checkoutRoutes from './routes/checkout.js';
import { handleSocket } from './utils/socket.js';
import { releaseExpiredLocks } from './utils/lockCleanup.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'DELETE'],
  },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.set('io', io);

app.use('/api/admin', adminRoutes);
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    setInterval(() => releaseExpiredLocks(io), 30000);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
