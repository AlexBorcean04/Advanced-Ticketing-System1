import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';
import SeatMap from '../components/SeatMap.jsx';
import CartPanel from '../components/CartPanel.jsx';
import useSeatStore from '../store/seatStore.js';
import { getSocket } from '../lib/socket.js';
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
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState('idle');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [showCheckoutToast, setShowCheckoutToast] = useState(false);
  const userId = useMemo(() => getSeatHolderId(), []);
  const socket = useMemo(() => getSocket(), []);
  const [socketConnected, setSocketConnected] = useState(socket?.connected ?? false);
  const [socketError, setSocketError] = useState('');
  const canCheckout = isUserAuthed();

  const { selectedSeats, setSelectedSeats, holdExpiresAt, setHoldExpiresAt, clearHold } =
    useSeatStore();

  const derivedSelectedSeats = useMemo(() => {
    if (selectedSeats.length > 0) return selectedSeats;
    if (!event) return [];
    return event.seats
      .filter((seat) => seat.status === 'locked' && seat.lockedBy === userId)
      .map((seat) => seat.id);
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
    if (!socket.connected) {
      socket.connect();
    }

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
        setHoldExpiresAt((prev) => prev ?? new Date(lockedUntil).getTime());
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
    const handleConnect = () => {
      setSocketConnected(true);
      setSocketError('');
    };
    const handleDisconnect = () => setSocketConnected(false);
    const handleConnectError = (error) => {
      setSocketConnected(false);
      if (error?.message) {
        setSocketError(error.message);
      }
    };
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    setSocketConnected(socket.connected);

    return () => {
      socket.off('seat_locked', handleSeatLocked);
      socket.off('seat_unlocked', handleSeatUnlocked);
      socket.off('seat_booked', handleSeatBooked);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket, id, userId, setSelectedSeats, setHoldExpiresAt]);

  useEffect(() => {
    if (!event || derivedSelectedSeats.length === 0) return;
    const latestLock = event.seats
      .filter((seat) => derivedSelectedSeats.includes(seat.id) && seat.lockedUntil)
      .map((seat) => new Date(seat.lockedUntil).getTime())
      .reduce((max, value) => Math.max(max, value), 0);
    if (!latestLock) return;
    setHoldExpiresAt((prev) => (prev && prev >= latestLock ? prev : latestLock));
  }, [event, derivedSelectedSeats, setHoldExpiresAt]);

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
    if (!holdExpiresAt) return;
    if (timeLeft <= 0 && derivedSelectedSeats.length > 0) {
      socket.emit('release_seats', { eventId: id, seatIds: derivedSelectedSeats, userId });
      setSelectedSeats([]);
      clearHold();
    }
  }, [
    timeLeft,
    holdExpiresAt,
    derivedSelectedSeats,
    socket,
    id,
    userId,
    clearHold,
    setSelectedSeats,
  ]);

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
    if (derivedSelectedSeats.length === 0 && holdExpiresAt) {
      clearHold();
    }
  }, [derivedSelectedSeats, holdExpiresAt, clearHold]);

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
    setSelectedSeats((prev) => prev.filter((seat) => seat !== seatId));
    socket.emit('unselect_seat', { eventId: id, seatId, userId });
  };

  const handleClear = () => {
    if (derivedSelectedSeats.length === 0) return;
    setSelectedSeats([]);
    socket.emit('release_seats', { eventId: id, seatIds: derivedSelectedSeats, userId });
    clearHold();
    setCheckoutStatus('idle');
    setCheckoutMessage('');
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    if (derivedSelectedSeats.length === 0) return;
    if (!socketConnected) {
      setCheckoutStatus('error');
      setCheckoutMessage('Seat sync is offline. Reconnect and reselect seats.');
      return;
    }
    try {
      setCheckoutStatus('loading');
      setCheckoutMessage('');
      await api.post('/checkout', { eventId: id, seatIds: derivedSelectedSeats });
      setSelectedSeats([]);
      clearHold();
      setCheckoutStatus('success');
      setCheckoutMessage('Seats booked successfully.');
      setShowCheckoutToast(true);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setCheckoutMessage('Please log in to complete checkout.');
      } else if (status === 409) {
        setCheckoutMessage('Seats are no longer locked for you. Please reselect.');
      } else {
        setCheckoutMessage('Checkout failed. Please try again.');
      }
      setCheckoutStatus('error');
    }
  };

  useEffect(() => {
    if (!showCheckoutToast) return undefined;
    const timeout = setTimeout(() => {
      setShowCheckoutToast(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [showCheckoutToast]);

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
      {showCheckoutToast && (
        <div className="fixed top-24 right-6 z-50">
          <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-emerald-200 border border-emerald-400/30 shadow-lg">
            Checkout complete! Seats booked.
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent-500/80">Seat Map</p>
          <h1 className="text-3xl font-semibold mt-2">{event.title}</h1>
          <p className="text-white/60">{new Date(event.date).toLocaleString()}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <span
            className={`h-2 w-2 rounded-full ${
              socketConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {socketConnected ? 'Live seat sync' : 'Seat sync reconnecting...'}
        </div>
        {!socketConnected && socketError && (
          <p className="text-xs text-amber-200 mt-2">
            Socket error: {socketError}
          </p>
        )}
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
            syncConnected={socketConnected}
            checkoutStatus={checkoutStatus}
            checkoutMessage={checkoutMessage}
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
          syncConnected={socketConnected}
          checkoutStatus={checkoutStatus}
          checkoutMessage={checkoutMessage}
        />
      </div>
    </div>
  );
};

export default SeatMapPage;
