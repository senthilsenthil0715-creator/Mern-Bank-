import { useCallback, useEffect, useState } from 'react';
import { api, groupAcc, money } from '../api';
import { useAuth } from '../auth.jsx';
import Crest from './Crest.jsx';

function Notice({ note }) {
  return note ? <div className={`alert ${note.type}`}>{note.text}</div> : null;
}

function MoneyForm({ kind, label, onDone }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const u = await api(`/${kind}`, 'POST', { amount });
      onDone(u);
      setAmount('');
      setNote({ type: 'success', text: `${label} of ${money(amount)} completed.` });
    } catch (err) {
      setNote({ type: 'error', text: err.message });
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <h3>{label}</h3>
      <label>Amount (USD)
        <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <Notice note={note} />
      <button className="btn gold">{label}</button>
    </form>
  );
}

function Transfer({ onDone }) {
  const [f, setF] = useState({ toAccount: '', amount: '', note: '' });
  const [note, setNote] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      onDone(await api('/transfer', 'POST', f));
      setNote({ type: 'success', text: `${money(f.amount)} sent to ${groupAcc(f.toAccount.replace(/\s/g, ''))}.` });
      setF({ toAccount: '', amount: '', note: '' });
    } catch (err) {
      setNote({ type: 'error', text: err.message });
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <h3>Send money</h3>
      <label>Recipient account number
        <input value={f.toAccount} onChange={set('toAccount')} required inputMode="numeric" />
      </label>
      <label>Amount (USD)
        <input type="number" min="0.01" step="0.01" value={f.amount} onChange={set('amount')} required />
      </label>
      <label>Reference (optional)
        <input value={f.note} onChange={set('note')} maxLength={80} />
      </label>
      <Notice note={note} />
      <button className="btn gold">Send money</button>
    </form>
  );
}

function History({ txns, acc }) {
  if (!txns.length)
    return <div className="panel empty">No transactions yet. Make a deposit to get started.</div>;
  return (
    <div className="panel table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Details</th><th>Type</th><th className="right">Amount</th></tr></thead>
        <tbody>
          {txns.map((t) => {
            const out = t.type === 'withdraw' || (t.type === 'transfer' && t.fromAcc === acc);
            return (
              <tr key={t._id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td>{t.note}{t.type === 'transfer' && <span className="muted"> · {groupAcc(out ? t.toAcc : t.fromAcc)}</span>}</td>
                <td className="cap">{t.type}</td>
                <td className={`right ${out ? 'neg' : 'pos'}`}>{out ? '−' : '+'}{money(t.amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => { api('/admin/users').then(setUsers).catch((e) => setErr(e.message)); }, []);
  const toggle = async (id) => {
    try {
      const u = await api(`/admin/users/${id}/freeze`, 'PATCH');
      setUsers(users.map((x) => (x.id === id ? u : x)));
    } catch (e) { setErr(e.message); }
  };
  const total = users.reduce((s, u) => s + u.balance, 0);
  return (
    <>
      <div className="stats">
        <div className="panel stat"><span>Clients</span><strong>{users.length}</strong></div>
        <div className="panel stat"><span>Total holdings</span><strong>{money(total)}</strong></div>
      </div>
      {err && <div className="alert error">{err}</div>}
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Client</th><th>Account</th><th className="right">Balance</th><th>Status</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}<div className="muted small">{u.email}</div></td>
                <td>{groupAcc(u.accountNumber)}</td>
                <td className="right">{money(u.balance)}</td>
                <td>{u.frozen ? <span className="tag bad">Frozen</span> : <span className="tag ok">Active</span>}</td>
                <td className="right">
                  {u.role === 'admin' ? <span className="muted small">Administrator</span> :
                    <button className="btn ghost sm" onClick={() => toggle(u.id)}>{u.frozen ? 'Unfreeze' : 'Freeze'}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [txns, setTxns] = useState([]);

  const loadTxns = useCallback(() => api('/transactions').then(setTxns).catch(() => {}), []);
  useEffect(() => { loadTxns(); }, [loadTxns]);

  const done = (u) => { setUser(u); loadTxns(); };

  const tabs = [
    ['overview', 'Overview'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw'],
    ['transfer', 'Transfer'], ['history', 'Statement'],
    ...(user.role === 'admin' ? [['admin', 'Administration']] : []),
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><Crest size={34} /><span>Sovereign Bank</span></div>
        <div className="who">
          <span>{user.name}</span>
          <button className="btn ghost sm" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="content">
        <section className="hero">
          <div className="card-gold">
            <div className="card-top"><span>Sovereign Private Account</span><Crest size={30} /></div>
            <div className="balance-label">Available balance</div>
            <div className="balance">{money(user.balance)}</div>
            <div className="card-bottom">
              <div><small>Account number</small><div className="acc">{groupAcc(user.accountNumber)}</div></div>
              <div className="right"><small>Holder</small><div>{user.name}</div></div>
            </div>
          </div>
          <div className="welcome">
            <h2>Good day, {user.name.split(' ')[0]}.</h2>
            <p className="muted">Your account is {user.frozen ? 'currently frozen. Please contact the bank.' : 'in good standing and ready for use.'}</p>
          </div>
        </section>

        <nav className="tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </nav>

        {tab === 'overview' && (
          <>
            <h3 className="section-title">Recent activity</h3>
            <History txns={txns.slice(0, 5)} acc={user.accountNumber} />
          </>
        )}
        {tab === 'deposit' && <MoneyForm kind="deposit" label="Deposit" onDone={done} />}
        {tab === 'withdraw' && <MoneyForm kind="withdraw" label="Withdraw" onDone={done} />}
        {tab === 'transfer' && <Transfer onDone={done} />}
        {tab === 'history' && <History txns={txns} acc={user.accountNumber} />}
        {tab === 'admin' && user.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
