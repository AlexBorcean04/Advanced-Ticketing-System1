import { Trash2, CreditCard } from 'lucide-react';

const formatTime = (ms) => {
  if (!ms || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const CartPanel = ({
  selectedSeats,
  onRemoveSeat,
  onClear,
  onCheckout,
  timeLeft,
  canCheckout,
}) => {
  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Hold</h3>
          <p className="text-xs text-white/60">Complete checkout before time runs out.</p>
        </div>
        <div className="text-sm font-semibold bg-accent-500/20 text-accent-500 border border-accent-500/40 px-3 py-1 rounded-full">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
        {selectedSeats.length === 0 ? (
          <div className="text-sm text-white/60">Select seats to start a hold.</div>
        ) : (
          selectedSeats.map((seat) => (
            <div
              key={seat}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">Seat {seat}</p>
                <p className="text-xs text-white/60">Premium row</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSeat(seat)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label={`Remove seat ${seat}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onCheckout}
          disabled={selectedSeats.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold transition"
        >
          <CreditCard size={16} />
          {canCheckout ? 'Checkout' : 'Login to checkout'}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={selectedSeats.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-3 text-sm font-medium text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear all
        </button>
        {!canCheckout && (
          <p className="text-xs text-white/60">
            Sign in or create an account to complete checkout.
          </p>
        )}
      </div>
    </div>
  );
};

export default CartPanel;
