import Event from '../models/Event.js';

const HOLD_DURATION_MS = 5 * 60 * 1000;

export const handleSocket = (io, socket) => {
  socket.on('select_seat', async ({ eventId, seatId, userId }) => {
    if (!eventId || !seatId || !userId) {
      return;
    }
    const now = new Date();
    const lockedUntil = new Date(Date.now() + HOLD_DURATION_MS);

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        seats: {
          $elemMatch: {
            id: seatId,
            $or: [
              { status: 'available' },
              { status: 'locked', lockedUntil: { $lt: now } },
            ],
          },
        },
      },
      {
        $set: {
          'seats.$.status': 'locked',
          'seats.$.lockedBy': userId,
          'seats.$.lockedUntil': lockedUntil,
        },
      },
      { new: true }
    );

    if (updatedEvent) {
      io.emit('seat_locked', { eventId, seatId, userId, lockedUntil });
    }
  });

  socket.on('unselect_seat', async ({ eventId, seatId, userId }) => {
    if (!eventId || !seatId || !userId) {
      return;
    }
    const result = await Event.updateOne(
      { _id: eventId },
      {
        $set: {
          'seats.$[seat].status': 'available',
          'seats.$[seat].lockedBy': null,
          'seats.$[seat].lockedUntil': null,
        },
      },
      {
        arrayFilters: [{ 'seat.id': seatId, 'seat.lockedBy': userId }],
      }
    );

    if (result.modifiedCount > 0) {
      io.emit('seat_unlocked', { eventId, seatId });
    }
  });

  socket.on('release_seats', async ({ eventId, seatIds, userId }) => {
    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0 || !userId) {
      return;
    }
    await Event.updateOne(
      { _id: eventId },
      {
        $set: {
          'seats.$[seat].status': 'available',
          'seats.$[seat].lockedBy': null,
          'seats.$[seat].lockedUntil': null,
        },
      },
      {
        arrayFilters: [{ 'seat.id': { $in: seatIds }, 'seat.lockedBy': userId }],
      }
    );

    seatIds.forEach((seatId) => {
      io.emit('seat_unlocked', { eventId, seatId });
    });
  });
};
