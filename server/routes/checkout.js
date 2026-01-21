import express from 'express';
import Event from '../models/Event.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

router.post('/', userAuth, async (req, res) => {
  try {
    const { eventId, seatIds } = req.body;
    const userId = req.user?.id;
    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0 || !userId) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        seats: {
          $all: seatIds.map((seatId) => ({
            $elemMatch: { id: seatId, status: 'locked', lockedBy: userId },
          })),
        },
      },
      {
        $set: {
          'seats.$[seat].status': 'booked',
          'seats.$[seat].lockedBy': null,
          'seats.$[seat].lockedUntil': null,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'seat.id': { $in: seatIds } }],
      }
    );

    if (!event) {
      return res.status(409).json({ message: 'Seats not locked by user' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('seat_booked', { eventId, seatIds });
    }

    return res.json({ message: 'Seats booked', seatIds });
  } catch (error) {
    return res.status(500).json({ message: 'Checkout failed' });
  }
});

export default router;
