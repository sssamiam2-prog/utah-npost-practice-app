'use strict';

window.WritingAI = (() => {
  async function gradeBatch(items) {
    const auth = window.PracticeAuth;
    const cfg = window.APP_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Online grading is not configured yet.');

    let token = cfg.supabaseAnonKey;
    if (auth?.isSignedIn?.()) {
      token = (await auth.getAccessToken()) || token;
    }

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
