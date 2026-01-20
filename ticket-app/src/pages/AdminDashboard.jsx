import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, LogOut, Plus, ArrowUpRight } from 'lucide-react';
import api from '../lib/api.js';
import { clearToken } from '../lib/auth.js';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', date: '' });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/events', {
        title: form.title,
        date: form.date,
      });
      setForm({ title: '', date: '' });
      fetchEvents();
    } catch (err) {
      setError('Unable to create event. Check credentials.');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/events/${id}`);
    fetchEvents();
  };

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="glass-panel rounded-3xl p-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent-500/80">Admin</p>
              <h1 className="text-3xl font-semibold">Event control center</h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm bg-white/10 border border-white/10 px-4 py-2 rounded-full hover:bg-white/20"
              aria-label="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <form className="grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="title">
                Event title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="City Lights Festival"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="date">
                Event date
              </label>
              <input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent-500 hover:bg-accent-600 px-5 py-3 text-sm font-semibold"
              >
                <Plus size={16} />
                Create event
              </button>
              {error && <p className="text-sm text-red-300">{error}</p>}
            </div>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 w-full lg:w-[420px]">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          {status === 'loading' && <p className="text-white/60">Loading events...</p>}
          {status === 'error' && (
            <p className="text-red-300">Unable to load events. Try again.</p>
          )}
          <div className="space-y-4 max-h-[520px] overflow-y-auto scrollbar-thin">
            {events.map((event) => (
              <div key={event._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-white/60 mt-1">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(event._id)}
                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Link
                  to={`/events/${event._id}`}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-accent-500"
                >
                  View seat map
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
            {status === 'success' && events.length === 0 && (
              <p className="text-white/60">No events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
