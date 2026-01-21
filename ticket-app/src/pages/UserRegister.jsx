import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { setUserProfile, setUserToken } from '../lib/userAuth.js';

const UserRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setUserToken(data.token);
      setUserProfile(data.user);
      navigate('/');
    } catch (err) {
      setError('Unable to create account. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="glass-panel rounded-3xl p-8 md:p-12 max-w-lg mx-auto">
        <div className="space-y-3 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-accent-500/80">Join NovaSeat</p>
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="text-white/60">Save your seat holds and finish checkout faster.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-white/70" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Alex Morgan"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Create a password"
              required
            />
          </div>
          {error && <div className="text-sm text-red-300">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-full bg-accent-500 hover:bg-accent-600 py-3 text-sm font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-white/60 mt-6">
          Already have an account?{' '}
          <Link className="text-accent-500 hover:text-accent-400" to="/login">
            Log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default UserRegister;
