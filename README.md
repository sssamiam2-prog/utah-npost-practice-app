# Utah NPOST Practice Center

Timed, four-section **practice** exams modeled on Utah’s NPOST structure (math, reading, grammar, incident-report writing). Three full forms · 75 questions each · 70% section benchmarks.

**Not affiliated with POST, Utah Tech, or any law-enforcement agency.** Questions are original study material, not copied from official exams.

## Live app

After publishing, the site URL will look like:

`https://<your-github-username>.github.io/utah-npost-practice-app/`

## Run locally

Static files need a local server (exam data is loaded with `fetch`):

```bash
npx --yes serve .
```

Then open the URL shown (usually `http://localhost:3000`).

## Sign-in and cloud sync (optional)

1. Create a [Supabase](https://supabase.com) project (free tier is fine).
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. In **Authentication → Providers**, enable **Email** and/or **Google** (for Google, add your GitHub Pages URL under redirect URLs).
4. Copy **Project URL** and **anon public** key into `config.js` (see `config.example.js`).
5. Redeploy or refresh the site.

Without keys, the app still works; progress stays in the browser only.

## Regenerate exam JSON

```bash
node scripts/generate-exams.mjs
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Shell |
| `app.js` | Exam UI, timers, scoring |
| `auth.js` | Supabase sign-in and sync |
| `config.js` | Supabase URL and anon key |
| `data/exams.json` | Three practice forms |
| `styles.css` | Layout and theme |

## Official NPOST references

- [Utah Tech POST – NPOST](https://post.utahtech.edu/npost/)
- [Utah Highway Patrol – NPOST overview](https://joinuhp.utah.gov/npost/)

For official study guides and licensed practice tests, use [ApplyToServe](https://www.applytoserve.com/study/).
