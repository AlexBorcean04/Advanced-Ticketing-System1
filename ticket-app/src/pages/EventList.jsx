import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import EventCard from '../components/EventCard.jsx';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <section className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent-500/80">
            Premium Ticketing
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Discover curated experiences with real-time seat intelligence.
          </h1>
          <p className="text-white/60 text-lg">
            Browse upcoming shows, lock your seats instantly, and complete checkout with a smooth,
            modern flow.
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Live Metrics</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/60">Events</p>
              <p className="text-2xl font-semibold mt-2">{events.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/60">Availability</p>
              <p className="text-2xl font-semibold mt-2">Live</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Upcoming events</h2>
          <span className="text-sm text-white/60">Updated in real time</span>
        </div>

        {status === 'loading' && (
          <div className="glass-panel rounded-2xl p-8 text-white/60">Loading events...</div>
        )}
        {status === 'error' && (
          <div className="glass-panel rounded-2xl p-8 text-red-200">
            Unable to load events. Please try again.
          </div>
        )}
        {status === 'success' && events.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 text-white/60">
            No events yet. Check back soon.
          </div>
        )}
        {status === 'success' && events.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EventList;
