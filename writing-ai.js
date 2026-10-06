'use strict';

window.WritingAI = (() => {
  async function gradeBatch(items) {
    const auth = window.PracticeAuth;
    if (!auth?.configured?.()) throw new Error('Sign-in is not configured yet.');
    if (!auth.isSignedIn?.()) throw new Error('Sign in to use AI writing feedback.');

    const token = await auth.getAccessToken();
    if (!token) throw new Error('Your session expired. Sign in again.');

    const cfg = window.APP_CONFIG || {};
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/functions/v1/grade-writing`;
    const anon = cfg.supabaseAnonKey;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: anon,
      },
      body: JSON.stringify({ items }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Grading failed (${res.status})`);
    return data.results || [];
  }

  return { gradeBatch };
})();
