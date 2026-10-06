# Utah NPOST Practice Center

Timed, four-section **practice** exams modeled on Utah’s NPOST structure (math, reading, grammar, incident-report writing). Five full forms · 75 questions each · 70% section benchmarks.

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

## Sign-in and cloud sync (Supabase)

The app is ready for Supabase; **`config.js` is empty until a project exists.**

Your Cursor MCP was pointing at project `ezcmgehexkzhjzfxsptb`, which **does not exist** (no DNS). Create a new project once, then wire it up:

### Automated (recommended)

1. Create a token: [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. In PowerShell from this folder:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"
.\scripts\setup-supabase.ps1
```

3. In the Supabase dashboard: **Authentication → URL Configuration** — set site + redirect URL to  
   `https://sssamiam2-prog.github.io/utah-npost-practice-app/`  
   Enable **Email** and/or **Google** under Providers.
4. Commit and push `config.js` (anon key is safe to publish; access is enforced by Row Level Security).

### Manual

1. New project at [supabase.com/dashboard](https://supabase.com/dashboard/projects)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy URL + anon key into `config.js`
4. Update `~/.cursor/mcp.json` → `project_ref=<your-new-ref>`

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
| `data/exams.json` | Five practice forms |
| `styles.css` | Layout and theme |

## Official NPOST references

- [Utah Tech POST – NPOST](https://post.utahtech.edu/npost/)
- [Utah Highway Patrol – NPOST overview](https://joinuhp.utah.gov/npost/)

For official study guides and licensed practice tests, use [ApplyToServe](https://www.applytoserve.com/study/).
