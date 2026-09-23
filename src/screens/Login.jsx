import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { Field } from '../components/ui.jsx';

const friendly = (code) => ({
  'auth/invalid-credential': 'That email and password don’t match.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/user-disabled': 'This account has been switched off.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Try again when you have signal.'
}[code] || 'Something went wrong (' + code + ').');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (err) { setError(friendly(err.code)); }
    setBusy(false);
  };
  const reset = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Type your email first, then tap this again.'); return; }
    try { await sendPasswordResetEmail(auth, email.trim()); setInfo('Check your inbox for a link to set a new password.'); }
    catch (err) { setError(friendly(err.code)); }
  };

  return (
    <form className="auth" onSubmit={submit}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">Chiabel Travels</span>
        <h1 className="h1 big">Welcome back</h1>
        <p className="sub">Sign in to see your trip. Everything you add syncs to both your phones.</p>
      </div>
      <Field label="Email" id="email">
        <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password" id="password">
        <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {error && <p className="error" role="alert">{error}</p>}
      {info && <p className="small" role="status" style={{ color: 'var(--good)' }}>{info}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <button type="button" className="btn quiet" onClick={reset}>Forgot password</button>
    </form>
  );
}
