import { Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 hover:border-accent-500/60 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-500/80">
            Live Event
          </p>
          <h3 className="text-xl font-semibold mt-2">{event.title}</h3>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-accent-500/20 flex items-center justify-center">
          <Calendar size={18} className="text-accent-500" />
        </div>
      </div>
      <p className="text-white/60 text-sm">
        {new Date(event.date).toLocaleString()}
      </p>
      <Link
        to={`/events/${event._id}`}
        className="inline-flex items-center justify-between gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-4 py-2 text-sm font-medium transition"
      >
        View Seat Map
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
};

export default EventCard;
