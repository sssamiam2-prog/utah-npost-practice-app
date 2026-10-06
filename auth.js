'use strict';

window.PracticeAuth = (() => {
  const cfg = window.APP_CONFIG || {};
  let client = null;
  let user = null;
  let syncTimer = null;
  let pendingState = null;
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });

  function bar() {
    return document.getElementById('auth-bar');
  }

  function configured() {
    return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  }

  /** Stable redirect URL (must match Supabase Auth → URL Configuration exactly). */
  function oauthRedirectUrl() {
    let path = window.location.pathname.replace(/\/index\.html$/i, '');
    if (!path.endsWith('/')) path += '/';
    return `${window.location.origin}${path}`;
  }

  function stripAuthParamsFromUrl() {
    const clean = oauthRedirectUrl();
    if (window.location.href !== clean) {
      window.history.replaceState({}, document.title, clean);
    }
  }

  function readOAuthErrorFromUrl() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const raw = hash.get('error_description') || hash.get('error')
      || query.get('error_description') || query.get('error');
    if (!raw) return null;
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
      return raw;
    }
  }

  function renderBar() {
    const el = bar();
    if (!el) return;
    if (!configured()) {
      el.innerHTML = '<span class="auth-msg">Progress saves on this device. Add Supabase keys in config.js to enable sign-in and cloud sync.</span>';
      return;
    }
    if (user) {
      const email = user.email || 'Signed in';
      el.innerHTML = `<span class="auth-msg">Signed in as ${escapeHtml(email)} · progress syncs to your account</span><button type="button" class="auth-btn" id="auth-sign-out">Sign out</button>`;
      document.getElementById('auth-sign-out')?.addEventListener('click', signOut);
      return;
    }
    el.innerHTML = `<span class="auth-msg">Sign in to resume on any device</span>
      <button type="button" class="auth-btn primary" id="auth-google">Continue with Google</button>
      <button type="button" class="auth-btn" id="auth-email-toggle">Email</button>`;
    document.getElementById('auth-google')?.addEventListener('click', signInGoogle);
    document.getElementById('auth-email-toggle')?.addEventListener('click', showEmailForm);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showEmailForm() {
    const el = bar();
    if (!el) return;
    el.innerHTML = `<form class="auth-form" id="auth-email-form">
      <input type="email" id="auth-email" placeholder="Email" required autocomplete="email">
      <input type="password" id="auth-password" placeholder="Password" required autocomplete="current-password" minlength="6">
      <button type="submit" class="auth-btn primary">Sign in</button>
      <button type="button" class="auth-btn" id="auth-sign-up">Create account</button>
      <button type="button" class="auth-btn quiet" id="auth-back">Back</button>
    </form>`;
    document.getElementById('auth-email-form').addEventListener('submit', (e) => {
      e.preventDefault();
      signInEmail(document.getElementById('auth-email').value, document.getElementById('auth-password').value);
    });
    document.getElementById('auth-sign-up').addEventListener('click', () => {
      signUpEmail(document.getElementById('auth-email').value, document.getElementById('auth-password').value);
    });
    document.getElementById('auth-back').addEventListener('click', renderBar);
  }

  async function signInGoogle() {
    if (!client) return;
    stripAuthParamsFromUrl();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: oauthRedirectUrl(),
        skipBrowserRedirect: false,
      },
    });
    if (error) announceAuth(error.message);
  }

  async function signInEmail(email, password) {
    if (!client) return;
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) announceAuth(error.message);
  }

  async function signUpEmail(email, password) {
    if (!client) return;
    const { error } = await client.auth.signUp({ email, password });
    if (error) announceAuth(error.message);
    else announceAuth('Check your email to confirm your account, then sign in.');
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
  }

  function announceAuth(msg) {
    const el = bar();
    if (!el) return;
    const note = document.createElement('p');
    note.className = 'auth-error';
    note.textContent = msg;
    el.appendChild(note);
  }

  async function pullRemoteState() {
    if (!client || !user) return null;
    const { data, error } = await client.from('practice_state').select('state, updated_at').eq('user_id', user.id).maybeSingle();
    if (error) {
      console.warn('Cloud sync read failed', error);
      return null;
    }
    if (!data?.state) return null;
    const remote = data.state;
    if (Number.isFinite(data.updated_at)) {
      const t = new Date(data.updated_at).getTime();
      if (Number.isFinite(t)) remote.updatedAt = Math.max(remote.updatedAt || 0, t);
    }
    return remote;
  }

  async function pushRemoteState(state) {
    if (!client || !user || !state) return;
    const payload = {
      user_id: user.id,
      state,
      updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
    };
    const { error } = await client.from('practice_state').upsert(payload, { onConflict: 'user_id' });
    if (error) console.warn('Cloud sync write failed', error);
  }

  function queueSync(state) {
    if (!client || !user) return;
    pendingState = state;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      if (pendingState) pushRemoteState(pendingState);
    }, 400);
  }

  async function mergeAfterLogin(localState, validState) {
    const remote = await pullRemoteState();
    if (remote && validState(remote)) {
      if (!localState || (remote.updatedAt || 0) > (localState.updatedAt || 0)) return remote;
    }
    if (localState && validState(localState)) {
      await pushRemoteState(localState);
    }
    return localState;
  }

  async function init(validState, getLocalState, setMergedState) {
    renderBar();
    if (!configured()) {
      readyResolve();
      return;
    }
    if (!window.supabase?.createClient) {
      console.warn('Supabase library not loaded');
      readyResolve();
      return;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
      },
    });

    const hadAuthCallback = window.location.search.includes('code=')
      || /(?:^|[#&])(error|access_token)=/.test(window.location.hash);
    const oauthErr = readOAuthErrorFromUrl();

    const { data: { session }, error: sessionError } = await client.auth.getSession();
    user = session?.user ?? null;

    if (hadAuthCallback || oauthErr) stripAuthParamsFromUrl();

    renderBar();
    if (oauthErr) {
      announceAuth(`${oauthErr} Click “Continue with Google” to try again.`);
    } else if (sessionError && hadAuthCallback) {
      announceAuth(`${sessionError.message} Click “Continue with Google” to try again.`);
    }
    if (user) {
      const merged = await mergeAfterLogin(getLocalState(), validState);
      if (merged) setMergedState(merged);
    }
    client.auth.onAuthStateChange(async (_event, session) => {
      user = session?.user ?? null;
      renderBar();
      if (user) {
        const merged = await mergeAfterLogin(getLocalState(), validState);
        if (merged) setMergedState(merged);
      }
    });
    readyResolve();
  }

  readyResolve();

  return {
    ready,
    init,
    queueSync,
    isSignedIn: () => Boolean(user),
    configured,
  };
})();
