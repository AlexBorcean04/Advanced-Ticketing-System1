import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
    },
    lockedBy: { type: String, default: null },
    lockedUntil: { type: Date, default: null },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    seats: [seatSchema],
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
