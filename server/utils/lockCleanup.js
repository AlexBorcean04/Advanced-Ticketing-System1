import Event from '../models/Event.js';

export const releaseExpiredLocks = async (io) => {
  const now = new Date();
  try {
    const events = await Event.find({
      seats: { $elemMatch: { status: 'locked', lockedUntil: { $lt: now } } },
    });

    if (events.length === 0) {
      return;
    }

    await Event.updateMany(
      { 'seats.status': 'locked', 'seats.lockedUntil': { $lt: now } },
      {
        $set: {
          'seats.$[seat].status': 'available',
          'seats.$[seat].lockedBy': null,
          'seats.$[seat].lockedUntil': null,
        },
      },
      {
        arrayFilters: [
          { 'seat.status': 'locked', 'seat.lockedUntil': { $lt: now } },
        ],
      }
    );

    if (io) {
      events.forEach((event) => {
        const expiredSeats = event.seats
          .filter((seat) => seat.status === 'locked' && seat.lockedUntil < now)
          .map((seat) => seat.id);
        expiredSeats.forEach((seatId) => {
          io.emit('seat_unlocked', { eventId: event.id, seatId });
        });
      });
    }
  } catch (error) {
    console.error('Failed to release expired locks', error);
  }
};
