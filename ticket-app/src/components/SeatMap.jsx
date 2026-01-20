import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

const seatStyles = {
  available: 'fill-[#1c2333] stroke-white/20 hover:fill-accent-500/70',
  locked: 'fill-[#2e2f3a] stroke-white/10',
  selected: 'fill-[#7c5cff] stroke-white/30',
  booked: 'fill-[#ff5678] stroke-white/30',
};

const SeatMap = ({ seats, onSeatClick, userId }) => {
  return (
    <TransformWrapper minScale={0.7} maxScale={2.4} initialScale={1}>
      {({ zoomIn, zoomOut, resetTransform }) => (
        <div className="glass-panel rounded-3xl p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Seat Map</h2>
              <p className="text-sm text-white/60">Zoom and tap to select seats.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={zoomIn}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={zoomOut}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={resetTransform}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center"
                aria-label="Reset zoom"
              >
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-night-800/70 border border-white/10 overflow-hidden">
            <TransformComponent wrapperClass="w-full" contentClass="w-full">
              <svg
                viewBox="0 0 640 480"
                className="w-full h-[420px]"
                role="img"
                aria-label="Seat map"
              >
                <rect x="120" y="20" width="400" height="50" rx="20" fill="#101727" stroke="#3b3f52" />
                <text x="320" y="50" textAnchor="middle" fill="#b7bcd0" fontSize="14">
                  Stage
                </text>

                {seats.map((seat) => {
                  const isLockedByUser = seat.lockedBy === userId;
                  const styleKey = seat.status === 'locked' && isLockedByUser ? 'selected' : seat.status;
                  return (
                    <g key={seat.id}>
                      <circle
                        cx={seat.x}
                        cy={seat.y}
                        r="13"
                        className={`transition ${seatStyles[styleKey]}`}
                        onClick={() => onSeatClick(seat)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            onSeatClick(seat);
                          }
                        }}
                        aria-label={`Seat ${seat.id} ${styleKey}`}
                      />
                      <text
                        x={seat.x}
                        y={seat.y + 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#e5e7ff"
                      >
                        {seat.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </TransformComponent>
          </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#1c2333] border border-white/20" />
          Available
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#7c5cff]" />
          Selected
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#2e2f3a]" />
          Locked
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5678]" />
          Booked
        </div>
      </div>
        </div>
      )}
    </TransformWrapper>
  );
};

export default SeatMap;
