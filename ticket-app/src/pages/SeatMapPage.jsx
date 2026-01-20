import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import SeatMap from '../components/SeatMap.jsx';
import CartPanel from '../components/CartPanel.jsx';
import useSeatStore from '../store/seatStore.js';
import { getSocket, disconnectSocket } from '../lib/socket.js';

const getUserId = () => {
  const key = 'seat_user_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const newId = crypto?.randomUUID
    ? crypto.randomUUID()
    : `user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, newId);
  return newId;
};

const normalizeSeats = (seats) => {
  const now = Date.now();
  return seats.map((seat) => {
    if (seat.status === 'locked' && seat.lockedUntil && new Date(seat.lockedUntil).getTime() < now) {
      return { ...seat, status: 'available', lockedBy: null, lockedUntil: null };
    }
    return seat;
  });
};

const SeatMapPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(0);
  const userId = useMemo(() => getUserId(), []);
  const socket = useMemo(() => getSocket(), []);

  const { selectedSeats, setSelectedSeats, holdExpiresAt, setHoldExpiresAt, clearHold } =
    useSeatStore();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent({ ...data, seats: normalizeSeats(data.seats) });
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };
    fetchEvent();
    setSelectedSeats([]);
    clearHold();
  }, [id, setSelectedSeats, clearHold]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleSeatLocked = ({ eventId, seatId, userId: lockerId, lockedUntil }) => {
      if (eventId !== id) return;
      setEvent((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) =>
          seat.id === seatId
            ? { ...seat, status: 'locked', lockedBy: lockerId, lockedUntil }
            : seat
        );
        return { ...prev, seats: updatedSeats };
      });

      if (lockerId === userId) {
        setSelectedSeats((prev) => {
          if (prev.includes(seatId)) return prev;
          const next = [...prev, seatId];
          return next;
        });
        if (!holdExpiresAt) {
          setHoldExpiresAt(new Date(lockedUntil).getTime());
        }
      }
    };

    const handleSeatUnlocked = ({ eventId, seatId }) => {
      if (eventId !== id) return;
      setEvent((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) =>
          seat.id === seatId
            ? { ...seat, status: 'available', lockedBy: null, lockedUntil: null }
            : seat
        );
        return { ...prev, seats: updatedSeats };
      });
      setSelectedSeats((prev) => prev.filter((seat) => seat !== seatId));
    };

    const handleSeatBooked = ({ eventId, seatIds }) => {
      if (eventId !== id) return;
      setEvent((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((seat) =>
          seatIds.includes(seat.id)
            ? { ...seat, status: 'booked', lockedBy: null, lockedUntil: null }
            : seat
        );
        return { ...prev, seats: updatedSeats };
      });
      setSelectedSeats((prev) => prev.filter((seat) => !seatIds.includes(seat)));
    };

    socket.on('seat_locked', handleSeatLocked);
    socket.on('seat_unlocked', handleSeatUnlocked);
    socket.on('seat_booked', handleSeatBooked);

    return () => {
      socket.off('seat_locked', handleSeatLocked);
      socket.off('seat_unlocked', handleSeatUnlocked);
      socket.off('seat_booked', handleSeatBooked);
      disconnectSocket();
    };
  }, [socket, id, userId, setSelectedSeats, setHoldExpiresAt, holdExpiresAt]);

  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(0);
      return undefined;
    }
    const interval = setInterval(() => {
      const diff = holdExpiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  useEffect(() => {
    if (timeLeft <= 0 && selectedSeats.length > 0) {
      socket.emit('release_seats', { eventId: id, seatIds: selectedSeats, userId });
      setSelectedSeats([]);
      clearHold();
    }
  }, [timeLeft, selectedSeats, socket, id, userId, clearHold, setSelectedSeats]);

  useEffect(() => {
    const handleUnload = () => {
      if (selectedSeats.length > 0) {
        socket.emit('release_seats', { eventId: id, seatIds: selectedSeats, userId });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [selectedSeats, socket, id, userId]);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      clearHold();
    }
  }, [selectedSeats, clearHold]);

  const handleSeatClick = (seat) => {
    if (!event) return;
    if (seat.status === 'booked') return;

    const isLockedByUser = seat.status === 'locked' && seat.lockedBy === userId;
    if (isLockedByUser) {
      socket.emit('unselect_seat', { eventId: id, seatId: seat.id, userId });
      return;
    }
    if (seat.status === 'locked' && seat.lockedBy !== userId) {
      return;
    }
    socket.emit('select_seat', { eventId: id, seatId: seat.id, userId });
  };

  const handleRemoveSeat = (seatId) => {
    socket.emit('unselect_seat', { eventId: id, seatId, userId });
  };

  const handleClear = () => {
    if (selectedSeats.length === 0) return;
    socket.emit('release_seats', { eventId: id, seatIds: selectedSeats, userId });
    setSelectedSeats([]);
    clearHold();
  };

  const handleCheckout = async () => {
    if (selectedSeats.length === 0) return;
    try {
      await api.post('/checkout', { eventId: id, seatIds: selectedSeats, userId });
      setSelectedSeats([]);
      clearHold();
    } catch (error) {
      // no-op
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="glass-panel rounded-3xl p-8">Loading event...</div>
      </div>
    );
  }

  if (status === 'error' || !event) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="glass-panel rounded-3xl p-8 text-red-200">
          Unable to load event.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-36 md:pb-12">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-500/80">Seat Map</p>
        <h1 className="text-3xl font-semibold mt-2">{event.title}</h1>
        <p className="text-white/60">{new Date(event.date).toLocaleString()}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <SeatMap seats={event.seats} onSeatClick={handleSeatClick} userId={userId} />

        <div className="hidden md:block md:sticky md:top-28">
          <CartPanel
            selectedSeats={selectedSeats}
            onRemoveSeat={handleRemoveSeat}
            onClear={handleClear}
            onCheckout={handleCheckout}
            timeLeft={timeLeft}
          />
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4">
        <CartPanel
          selectedSeats={selectedSeats}
          onRemoveSeat={handleRemoveSeat}
          onClear={handleClear}
          onCheckout={handleCheckout}
          timeLeft={timeLeft}
        />
      </div>
    </div>
  );
};

export default SeatMapPage;
