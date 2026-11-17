// Python Legends' own student accounts — separate from DigiClass's login.
// A name + PIN the student picks the first time they log in (the PIN is
// never sent back or stored in the clear; the backend only ever sees it
// once per request, over HTTPS, and stores a salted hash). Logging in from
// any device with the same name + PIN resumes the same progress, because
// progress is read from/written to the same backend DigiClass itself
// already uses for its own class data — a Google Apps Script web app over
// a teacher's Google Sheet. See digiclass's sheet-script-template.gs for
// the plclaim/plload/plsave actions this calls.
//
// This is intentionally the same backend, not a new one: one fewer thing
// for the teacher to stand up and maintain. It is a *separate* roster
// ("PL Students"/"PL Progress" sheets) from DigiClass's own student list,
// so a Python Legends account has nothing to do with a student's DigiClass
// identity.

import type { ProgressState } from '../progress/progressService';

// Re-exported under this module's own name so callers reading accountService
// don't need to know it's literally progressService's own state shape —
// they're the same thing because a round trip through the backend (save,
// then a later load) must be lossless.
export type SavedProgress = ProgressState;

export interface AccountIdentity {
  sid: string;
  name: string;
}

// Same Apps Script deployment DigiClass's own DC_CLASS.endpoint points at
// (see digiclass/src/app.js) — not a secret; access is gated by PIN, not by
// hiding this URL.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzpEpFmRbIbacu4-BgICaT3ZN8TIwOgti8pT76gmNmftQbSbJoErzM86G4ikxHgZEfFcg/exec';

const IDENTITY_KEY = 'python-legends:account:v1';

export type LoginError = 'short' | 'pin' | 'busy' | 'network' | 'unknown';

function get(query: string): Promise<any> {
  return fetch(`${ENDPOINT}?${query}&t=${Date.now()}`).then((r) => r.json());
}

// Plain text/plain content-type, exactly like DigiClass's own queue/flush —
// a JSON content-type here would trigger a CORS preflight that Apps Script
// web apps don't handle, and the request would just fail silently.
function post(body: unknown): Promise<any> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

export const accountService = {
  getSavedIdentity(): AccountIdentity | null {
    try {
      const raw = localStorage.getItem(IDENTITY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logOut() {
    try {
      localStorage.removeItem(IDENTITY_KEY);
    } catch {
      // Best-effort.
    }
  },

  /** Logs in (or creates the account, first time) with a name + PIN.
   *  Throws a LoginError on anything that stops login from succeeding. */
  async logIn(name: string, pin: string): Promise<AccountIdentity> {
    let json: any;
    try {
      json = await get(`action=plclaim&name=${encodeURIComponent(name)}&pin=${encodeURIComponent(pin)}`);
    } catch {
      throw 'network' as LoginError;
    }
    if (json?.error) throw (json.error as LoginError) ?? 'unknown';
    if (!json?.sid) throw 'unknown' as LoginError;
    const identity: AccountIdentity = { sid: json.sid, name };
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // Best-effort; the session still works, just won't be remembered on reload.
    }
    return identity;
  },

  /** The student's progress as last saved on the server, or null if this
   *  is a brand-new account with nothing saved yet. Never throws — a
   *  network failure just means "nothing to hydrate with," and the game
   *  falls back to whatever's in localStorage already. */
  async loadProgress(sid: string): Promise<SavedProgress | null> {
    try {
      const json = await get(`action=plload&sid=${encodeURIComponent(sid)}`);
      return json?.ok ? (json.progress ?? null) : null;
    } catch {
      return null;
    }
  },

  /** Fire-and-forget push of the current progress snapshot. Never throws —
   *  a save that fails (offline, server hiccup) just means the next
   *  completion event will push a fresher snapshot anyway. */
  saveProgress(sid: string, progress: SavedProgress) {
    post({ kind: 'plsave', sid, progress }).catch(() => {
      // Swallowed deliberately — see doc comment above.
    });
  },
};
