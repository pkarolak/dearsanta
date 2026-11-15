# Drogi Mikołaju!

A Secret Santa draw hosted by Santa himself. The Elf Chief (the session owner) gathers the elves,
keeps couples apart with exclusion rules and sets a budget. Santa then runs the ceremony on a big
screen, on remote elves' devices, or as a short personal message for people who join in their own time.

- **Live ceremony** – a big screen with a QR code, elves join from their phones, the chief lets them in
  and moves Santa from chapter to chapter. Anyone can switch to "not in the room" and get Santa's
  broadcast next to their own controls.
- **In their own time** – invitations by e-mail, elves create their profiles, the chief unlocks the
  draw and everyone gets an e-mail leading to Santa's personal reveal.
- Fair draw: nobody draws themselves, exclusions (one-way or both ways) are honoured, impossible
  rule sets are detected up front with the names that need loosening, and each draw is uniformly random
  and stored with a sha256 fingerprint.
- Profiles and avatars belong to an e-mail address and are reused across sessions.
- E-mails (invitations with Google / Apple calendar links, thank-you notes, "it's time", results,
  magic sign-in links) and the whole UI in Polish, English, German, Spanish and Portuguese.

## Running locally

Needs Node 20.9+ and nothing else: no accounts, no Docker.

```bash
npm install
cp .env.example .env.local   # optional, every value has a local fallback
npm run dev
```

Open http://localhost:3000. Locally the app uses:

| Concern  | Local fallback                                        | Production                     |
| -------- | ----------------------------------------------------- | ------------------------------ |
| Database | Embedded Postgres (PGlite) in `.data/pglite`          | Supabase Postgres              |
| E-mail   | Captured in the dev inbox at http://localhost:3000/dev/mail | Resend                   |
| Voice    | The browser's speech synthesis                        | ElevenLabs, cached in Postgres |

To try it with phones on the same Wi-Fi, open the app via your computer's LAN address
(for example `http://192.168.1.20:3000`). QR codes use the address you opened the app with.

### Tests

```bash
npm test             # unit tests: the draw, calendar files, translation parity
npx playwright install chromium
npm run test:e2e     # a full live ceremony and a full own-time session in real browsers
```

The end-to-end run saves screenshots to `e2e/screens`.

## Environment variables

| Variable              | Required in production | Notes |
| --------------------- | ---------------------- | ----- |
| `APP_URL`             | yes | Public URL used in e-mails and calendar invites, e.g. `https://drogimikolaju.pl`. |
| `AUTH_SECRET`         | yes | Signs cookies and magic links. `openssl rand -base64 32`. |
| `DATABASE_URL`        | yes | Supabase connection pooler URL (Transaction mode, port 6543). |
| `RESEND_API_KEY`      | yes | Without it e-mails only reach the dev inbox. |
| `MAIL_FROM`           | yes | e.g. `Drogi Mikołaju! <kontakt@drogimikolaju.pl>`, on a domain verified in Resend. |
| `ELEVENLABS_API_KEY`  | no  | Santa's natural voice. Without it the browser voice reads the subtitles. |
| `ELEVENLABS_VOICE_ID` | no  | Defaults to the premade "Bill" voice. |
| `ELEVENLABS_MODEL_ID` | no  | Defaults to `eleven_multilingual_v2`, which speaks all five languages. |
| `ENABLE_DEV_INBOX`    | no  | Set to `true` to keep `/dev/mail` in a production build without Resend (demos only). |

## Hosting (all free tiers)

Recommended setup: **Vercel** for the app, **Supabase** for Postgres, **Resend** for e-mail and
optionally **ElevenLabs** for the voice. There is no separate realtime service: devices follow
the ceremony through a Server-Sent Events stream that watches a version number in Postgres.

1. **Supabase** – create a free project. Under *Connect* copy the **Transaction pooler** URI
   (port 6543) for `DATABASE_URL`, and the **Session pooler** URI (port 5432) for migrations. Then run:

   ```bash
   DATABASE_URL="postgres://...:5432/postgres" npm run db:migrate
   ```

   Run it again after pulling new files in `supabase/migrations`. Row-level security is enabled on
   every table with no policies, so the public Supabase API exposes nothing: the app only talks to
   the database from the server.
2. **Resend** – create a free account, verify a domain you own (a few DNS records) and create an
   API key. Without a verified domain Resend only delivers to your own address.
3. **ElevenLabs** (optional) – a free account gives roughly 10 000 characters a month. Every spoken
   line is cached in Postgres, so the fixed parts of the script (about 1 700 characters per language)
   are generated once; only lines with names or budgets cost characters again. When the quota runs out,
   Santa falls back to the browser voice by himself.
4. **Vercel** – push the repository to a git host, import it in Vercel (the framework is
   detected automatically, no `vercel.json` needed), add the variables above and deploy. Set
   `APP_URL` to the final domain.

Things to know about the free tiers:

- Vercel Hobby is for personal, non-commercial use. A company-wide Secret Santa should use Pro, or
  host elsewhere (any Node host works: `npm run build && npm start`, e.g. Render or Fly.io).
- Supabase pauses free projects after a week without activity. Open the dashboard and restore the
  project before the big night if it has been quiet.
- Each open device keeps one events stream and polls Postgres a little faster than once a second,
  which the free tiers handle comfortably for families and teams of a few dozen people.

## Project map

- `src/lib/draw.ts` – feasibility check (Hopcroft–Karp), uniform random draw, commitment hash.
- `src/lib/actions.ts` – every server action: creating and joining, the chief's controls, the ceremony.
- `src/lib/state.ts` – the per-viewer state each device receives (nobody sees anyone else's match).
- `src/lib/ceremony/` – ceremony chapters and Santa's script.
- `src/lib/tts.ts`, `src/lib/audio/` – Santa's voice, the music box carols and the workshop sounds.
- `src/lib/mail/` – e-mail templates and sending; `src/lib/calendar.ts` – `.ics` and Google Calendar links.
- `messages/*.json` – translations; `supabase/migrations/` – the database schema.
