import { useState } from 'react';
import { accountService, type AccountIdentity, type LoginError } from '../account/accountService';
import './login-screen.css';

const ERROR_MESSAGE: Record<LoginError, string> = {
  short: 'Enter your name and a PIN of at least 4 digits.',
  pin: "That PIN doesn't match this name — try again, or ask your teacher to reset it.",
  busy: 'Too many tries — wait a few minutes and try again.',
  network: "Couldn't reach the server. Check your connection and try again.",
  unknown: 'Something went wrong. Try again in a moment.',
};

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (identity: AccountIdentity) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const identity = await accountService.logIn(name.trim(), pin.trim());
      onLoggedIn(identity);
    } catch (err) {
      setError(ERROR_MESSAGE[(err as LoginError) in ERROR_MESSAGE ? (err as LoginError) : 'unknown']);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>🐍 Python Legends</h1>
        <p className="login-tag">PLAY. EXPLORE. CODE. CONQUER.</p>
        <form className="login-form" onSubmit={submit}>
          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              maxLength={40}
              required
            />
          </label>
          <label>
            Your PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              minLength={4}
              maxLength={20}
              required
            />
          </label>
          <p className="login-hint">
            First time? Just pick a PIN (4+ digits) — it's remembered as yours from now on. This
            account is just for the game, separate from your DigiClass login.
          </p>
          {error && <p className="login-error">{error}</p>}
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Play'}
          </button>
        </form>
      </div>
    </div>
  );
}
