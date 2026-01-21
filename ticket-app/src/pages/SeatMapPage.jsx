import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api.js';
import SeatMap from '../components/SeatMap.jsx';
import CartPanel from '../components/CartPanel.jsx';
import useSeatStore from '../store/seatStore.js';
import { getSocket, disconnectSocket } from '../lib/socket.js';
import { getUserProfile, isUserAuthed } from '../lib/userAuth.js';

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

const getSeatHolderId = () => {
  const profile = getUserProfile();
  if (profile?.id) {
    localStorage.setItem('seat_user_id', profile.id);
    return profile.id;
  }
  return getUserId();
};

const HOLD_DURATION_MS = 5 * 60 * 1000;

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
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(0);
  const userId = useMemo(() => getSeatHolderId(), []);
  const socket = useMemo(() => getSocket(), []);
  const canCheckout = isUserAuthed();

  const { selectedSeats, setSelectedSeats, holdExpiresAt, setHoldExpiresAt, clearHold } =
    useSeatStore();

  const derivedSelectedSeats = useMemo(() => {
    if (!event) return selectedSeats;
    const lockedByUser = event.seats
      .filter((seat) => seat.status === 'locked' && seat.lockedBy === userId)
      .map((seat) => seat.id);
    return lockedByUser.length > 0 ? lockedByUser : selectedSeats;
  }, [event, selectedSeats, userId]);

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
    if (!event) return;
    const lockedByUser = event.seats
      .filter((seat) => seat.status === 'locked' && seat.lockedBy === userId)
      .map((seat) => seat.id);
    const derivedSet = new Set(lockedByUser);
    const setsMatch =
      selectedSeats.length === lockedByUser.length &&
      selectedSeats.every((seatId) => derivedSet.has(seatId));
    if (!setsMatch) {
      setSelectedSeats(lockedByUser);
    }
    if (!holdExpiresAt && lockedByUser.length > 0) {
      const latestLock = event.seats
        .filter((seat) => lockedByUser.includes(seat.id) && seat.lockedUntil)
        .map((seat) => new Date(seat.lockedUntil).getTime())
        .reduce((max, value) => Math.max(max, value), 0);
      if (latestLock) {
        setHoldExpiresAt(latestLock);
      }
    }
  }, [event, userId, selectedSeats, setSelectedSeats, holdExpiresAt, setHoldExpiresAt]);

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
    if (timeLeft <= 0 && derivedSelectedSeats.length > 0) {
      socket.emit('release_seats', { eventId: id, seatIds: derivedSelectedSeats, userId });
      setSelectedSeats([]);
      clearHold();
    }
  }, [timeLeft, derivedSelectedSeats, socket, id, userId, clearHold, setSelectedSeats]);

  useEffect(() => {
    const handleUnload = () => {
      if (derivedSelectedSeats.length > 0) {
        socket.emit('release_seats', { eventId: id, seatIds: derivedSelectedSeats, userId });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [derivedSelectedSeats, socket, id, userId]);

  useEffect(() => {
    if (derivedSelectedSeats.length === 0) {
      clearHold();
    }
  }, [derivedSelectedSeats, clearHold]);

  const handleSeatClick = (seat) => {
    if (!event) return;
    if (seat.status === 'booked') return;

    const isLockedByUser = seat.status === 'locked' && seat.lockedBy === userId;
    if (isLockedByUser) {
      setEvent((prev) => {
        if (!prev) return prev;
        const updatedSeats = prev.seats.map((item) =>
          item.id === seat.id
            ? { ...item, status: 'available', lockedBy: null, lockedUntil: null }
            : item
        );
        return { ...prev, seats: updatedSeats };
      });
      setSelectedSeats((prev) => prev.filter((seatId) => seatId !== seat.id));
      socket.emit('unselect_seat', { eventId: id, seatId: seat.id, userId });
      return;
    }
    if (seat.status === 'locked' && seat.lockedBy !== userId) {
      return;
    }
    const lockedUntil = new Date(Date.now() + HOLD_DURATION_MS).toISOString();
    setEvent((prev) => {
      if (!prev) return prev;
      const updatedSeats = prev.seats.map((item) =>
        item.id === seat.id
          ? { ...item, status: 'locked', lockedBy: userId, lockedUntil }
          : item
      );
      return { ...prev, seats: updatedSeats };
    });
    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) return prev;
      return [...prev, seat.id];
    });
    if (!holdExpiresAt) {
      setHoldExpiresAt(new Date(lockedUntil).getTime());
    }
    socket.emit('select_seat', { eventId: id, seatId: seat.id, userId });
  };

  const handleRemoveSeat = (seatId) => {
    socket.emit('unselect_seat', { eventId: id, seatId, userId });
  };

  const handleClear = () => {
    if (derivedSelectedSeats.length === 0) return;
    socket.emit('release_seats', { eventId: id, seatIds: derivedSelectedSeats, userId });
    setSelectedSeats([]);
    clearHold();
  };

  const handleCheckout = async () => {
    if (!canCheckout) {
      navigate('/login');
      return;
    }
    if (derivedSelectedSeats.length === 0) return;
    try {
      await api.post('/checkout', { eventId: id, seatIds: derivedSelectedSeats });
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
            selectedSeats={derivedSelectedSeats}
            onRemoveSeat={handleRemoveSeat}
            onClear={handleClear}
            onCheckout={handleCheckout}
            timeLeft={timeLeft}
            canCheckout={canCheckout}
          />
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 left-4 right-4">
        <CartPanel
          selectedSeats={derivedSelectedSeats}
          onRemoveSeat={handleRemoveSeat}
          onClear={handleClear}
          onCheckout={handleCheckout}
          timeLeft={timeLeft}
          canCheckout={canCheckout}
        />
      </div>
    </div>
  );
};

export default SeatMapPage;
