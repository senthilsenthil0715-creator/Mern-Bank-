import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import Crest from './Crest.jsx';

export default function Auth({ mode }) {
  const isReg = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      login(await api(`/auth/${mode}`, 'POST', form));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth-hero">
        <Crest size={72} />
        <h1>Sovereign Bank</h1>
        <p>Wealth kept with the dignity it deserves. Private banking, open to you at any hour.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <h2>{isReg ? 'Open your account' : 'Welcome back'}</h2>
        <p className="muted">{isReg ? 'Your account number is issued instantly.' : 'Sign in to your private banking.'}</p>
        {isReg && (
          <label>Full name
            <input value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
        )}
        <label>Email
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set('password')} required minLength={6}
            autoComplete={isReg ? 'new-password' : 'current-password'} />
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn gold" disabled={busy}>{busy ? 'Please wait…' : isReg ? 'Open account' : 'Sign in'}</button>
        <p className="switch">
          {isReg ? <>Already a client? <Link to="/login">Sign in</Link></> : <>New to Sovereign? <Link to="/register">Open an account</Link></>}
        </p>
      </form>
    </main>
  );
}
