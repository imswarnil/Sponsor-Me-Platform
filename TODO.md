# TODO — advertise-with-me-platform

The old spec-track build plan (monorepo, Booking state machine, ad-server, widget package)
this file used to track was deleted along with the unused scaffold — see CLAUDE.md §0 for
why. This is the real, current open list.

## Auth
- [ ] Create a Google Cloud OAuth Client ID/Secret and enable the Google provider in Supabase
      (dashboard steps: `.claude/skills/supabase/SKILL.md`). App-side code is already done.
- [ ] Email verification on signup (currently auto-confirms).
- [ ] Decide whether to keep both `sponsor.imswarnil.com` and `advertise.imswarnil.com` live
      long-term, or retire the old one.

## Channel analytics
- [ ] Once YouTube Data API / Ghost Admin API details are available, wire real sync into
      `/studio/channels` (currently a placeholder — `bms_channel_connection` has no
      credentials or live data yet).

## Hardening
- [ ] Action-level rate limiting (needs Redis/Upstash or similar).
- [ ] A strict `script-src` CSP.

## Cleanup
- [ ] `lib/proto/session.ts` is dormant (JWT-in-cookie session helper, superseded by Supabase
      Auth, zero call sites) — delete if it keeps showing up in searches.
