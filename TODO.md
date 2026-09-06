# TODO — sponsor.imswarnil.com

The real, current open list. See CLAUDE.md for how anything here actually works.

## Blocking
- [ ] DNS: neither `sponsor.imswarnil.com` nor `advertise.imswarnil.com` resolves. Decide
      which name the platform gets and create the record.
- [ ] Add the production origin to Neon Auth's trusted domains once that name exists
      (`neonctl neon-auth domain add <origin> --project-id ancient-recipe-82156884`).
      Sign-in works on localhost and will fail in production without it.
- [ ] Set the Neon and GitHub env vars in whatever hosting replaces Vercel.

## Auth follow-ups
- [ ] Password reset emails need a sender configured in Neon Auth — the flow is wired but no
      mail will arrive without one.
- [ ] Re-add social sign-in via `getAuth().signIn.social` if wanted; the old Google button was
      removed because its provider was never enabled and it only ever errored.

## GitHub Sponsors
- [ ] Create at least one tier on github.com/sponsors/imswarnil — the listing is public but
      has no tiers, so nobody can sponsor. Everything app-side is already wired (CLAUDE.md §10).
- [ ] Set `GITHUB_TOKEN` in whatever hosting environment replaces Vercel. Without it the
      sponsor sections render nothing (by design).
- [ ] Optional: a signed `sponsorship` webhook so GitHub sponsors land in
      `bms_sponsorship_history`. Needs a public URL first.

## Channel analytics
- [ ] Once YouTube Data API details are available, wire real sync into `/studio/channels`.
      Ghost is already live (`lib/ghost.ts` — real post/member counts).

## Hardening
- [ ] Email verification on signup.
- [ ] Action-level rate limiting (needs Redis/Upstash or similar). The demo sign-in action is
      an unauthenticated endpoint that mints sessions — exactly the shape that gets hammered.
- [ ] A strict `script-src` CSP.

## Done
- [x] Own port (3500), defined once in `scripts/dev.sh`, with start/stop/restart/status and
      a guard that names whoever already holds Next's dev lock.
- [x] Removed the empty `apps/`/`packages/` monorepo leftovers, the stub `pnpm-workspace.yaml`,
      `.env.local`, and the dead `lib/proto/session.ts`.
- [x] `lib/properties.ts` — every site a sponsorship covers, with a DNS check
      (`npm run check:hosts`).
- [x] GitHub Sponsors, read-only, on `/`, `/placements` and `/studio`.
- [x] Design system re-synced: one face (Inter), mono for code only.
- [x] Supabase → Neon Auth migration (REBUILD.md steps 2–3): `lib/auth/`, the proxy route, the
      profile bootstrap that replaces `handle_new_user()`, and `force-dynamic` on the authed
      segments.
- [x] Neon project `sponsor-imswarnil` created, auth enabled, schema pushed, FK applied.
- [x] `scripts/seed.mjs` — admin + demo sponsor + five open placements, idempotent.
- [x] Verified end to end: admin → /studio, demo → /sponsor, demo blocked from /studio.
