import express from 'express';
import Event from '../models/Event.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { generateSeats } from '../utils/seatGenerator.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch event' });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date required' });
    }
    const seats = generateSeats();
    const event = await Event.create({ title, date, seats });
    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create event' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json({ message: 'Event deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete event' });
  }
});

export default router;
