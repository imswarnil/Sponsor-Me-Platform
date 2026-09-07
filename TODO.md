# TODO — sponsor.imswarnil.com

The real, current open list. See CLAUDE.md for how anything here actually works.

## Deploy — in this order, it does not work out of order

The app builds and runs on the real Cloudflare runtime today (`npm run preview` → workerd
on :8788, verified serving live Neon + Ghost data). What is left is account state, not code.

1. [ ] **DNS first.** A Worker Route attaches to a record that already exists; it does not
       create one. In the `imswarnil.com` zone add a **proxied** (orange-cloud) record for
       `sponsor`, and a second one for `advertise`. Neither name resolved as of 2026-09-07.
2. [ ] **`wrangler secret put`** for each required name — `DATABASE_URL` (pooled),
       `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `CREATOR_EMAIL`. The full list with
       what each one degrades to is the comment at the bottom of `wrangler.jsonc`.
       `CREATOR_EMAIL` is the one that must not be skipped: unset, admin falls back to the
       oldest account (CLAUDE.md §3). Leave `DEMO_EMAIL`/`DEMO_PASSWORD` unset.
3. [ ] **Trust the origin in Neon Auth**, or every sign-in fails in production while
       working perfectly on localhost:
       `neonctl neon-auth domain add https://sponsor.imswarnil.com --project-id ancient-recipe-82156884`
4. [ ] `npm run cf:deploy`.
5. [ ] **Cloudflare Redirect Rule** on the zone: `advertise.imswarnil.com/*` → 308
       `https://sponsor.imswarnil.com/$1`. This is not in the app — a Next `has: host`
       redirect does not fire through the OpenNext adapter (CLAUDE.md §8), and
       `advertise` is deliberately not a Worker route.
6. [ ] Re-run `npm run check:hosts` once both records exist, so `lib/properties.ts` and
       reality agree.

### Worth deciding before or soon after
- [ ] **Next is pinned to a canary** (`15.6.0-canary.59`) — it was required by
      `experimental.ppr`, and PPR is now off (CLAUDE.md §8). Nothing left in the app needs
      canary, so moving to the latest stable 15.x would take a production deploy off a
      pre-release. Not done here because a Next upgrade wants its own pass.
- [ ] No CI deploy — `cf:deploy` is run by hand. A GitHub Action on `main` needs a
      `CLOUDFLARE_API_TOKEN` secret.

## Points economy (what "ready to deploy" currently means)

Every price is points; nothing charges a card. A new `bms_profile` starts with 1,000 points
and there is no way to buy more, so the whole thing is a working preview of the real flow.
That is stated on `/`, `/placements`, `/members`, `/how-it-works` and `/s/[publicId]` by
`components/marketing/points-note.tsx`.

- [x] **Dodo Payments infrastructure.** `lib/dodo.ts` — lazy client (prefers
      `DODO_PAYMENTS_KEY_LIVE` over `_TEST_MODE` the moment it's set, nothing else to
      change), `createCheckout()`, and `verifyDodoWebhook()` via `standardwebhooks` (the
      `dodopayments` SDK itself has no verification helper in 2.49.0 — confirmed by
      reading its shipped types, not assumed). `scripts/dodo-setup.mjs` created the one
      pay-what-you-want product every checkout charges against (`DODO_PRODUCT_ID`, test
      mode). `app/api/webhooks/dodo/route.ts` verifies and logs `payment.succeeded`.
      Verified end to end against the real test-mode API: checkout session created,
      checkout page actually loads.
- [ ] **Wire it into a purchase.** Nothing calls `createCheckout` yet — `sponsorSlot`
      (`lib/proto/actions.ts`) and `joinAsMember` (`lib/proto/membership.ts`) still charge
      points synchronously in one request. A real checkout is asynchronous (redirect to
      Dodo → webhook confirms later), so this is a flow change, not just a swap:
  - Decide what carries the buyer's form fields (ad creative, display name/Instagram/blurb
    for a membership) to the webhook — `metadata` on the checkout session can hold them,
    so the webhook does the same "create the row" work `joinAsMember` does today, once
    payment is confirmed instead of once points move.
  - No anonymous checkout — a payer must already be a signed-in profile
    (`createCheckout`'s `metadata.profileId`).
  - Deleting `PointsNote` is how the site stops saying "this isn't real money" — do that
    the same day this lands, not before.
  - Register `https://sponsor.imswarnil.com/api/webhooks/dodo` in the Dodo dashboard and
    set `DODO_PAYMENTS_WEBHOOK_KEY` from what it gives you — the route 401s without it.

## R2 (Cloudflare object storage) — not started

Sponsor ad creative today is a pasted external image URL. R2 replaces that with real
uploads once it's worth building: one bucket (`sponsor-imswarnil`, `-dev` suffix only if
needed), presigned PUT URLs minted server-side after auth (credentials never reach the
browser), content-type/size validated before minting, served from a separate domain
(e.g. `files.imswarnil.com`) so uploaded content never executes on the app origin. Key
scheme: `creative/<sponsorshipId>/<filename>`, `mediakit/<filename>`,
`invoices/<year>/<paymentId>.pdf`.

## Auth follow-ups
- [ ] Password reset emails need a sender configured in Neon Auth — the flow is wired but no
      mail will arrive without one.
- [ ] Re-add social sign-in via `getAuth().signIn.social` if wanted; the old Google button was
      removed because its provider was never enabled and it only ever errored.

## GitHub Sponsors
- [ ] Create at least one tier on github.com/sponsors/imswarnil — the listing is public but
      has no tiers, so nobody can sponsor. Everything app-side is already wired (CLAUDE.md §10).
- [ ] Set `GITHUB_TOKEN` as a Worker secret. Without it the sponsor sections render nothing,
      by design.
- [ ] Optional: a signed `sponsorship` webhook so GitHub sponsors land in
      `bms_sponsorship_history`. Needs a public URL — which step 1 above provides.

## Channel analytics
- [ ] Once YouTube Data API details are available, wire real sync into `/studio/channels`.
      Ghost is already live (`lib/ghost.ts` — real post/member counts).

## Hardening
- [ ] Email verification on signup.
- [ ] Action-level rate limiting. Cloudflare has this built in now that the app is a Worker,
      which is cheaper than the Redis/Upstash this line used to call for.
- [ ] A strict `script-src` CSP.

## Done
- [x] **Homepage and full-site redesign.** One shell for every public page
      (`app/(marketing)/layout.tsx`) instead of four copied header bars and three missing
      footers; the homepage leads with the two doors rather than selling only placements;
      `/how-it-works` covers both routes; the footer restates the fork as two columns.
- [x] **Cloudflare Workers deployment path** — `@opennextjs/cloudflare` + `wrangler.jsonc` +
      `open-next.config.ts`, `npm run preview` / `cf:deploy`. Vercel config removed.
- [x] PPR turned off — it was breaking the status code of every auth gate on the Worker
      (200 instead of 307) and generating zero-byte shells. All six gates verified 307.
- [x] `robots.ts`, `sitemap.ts` and `metadataBase` — the site had no canonical URL, so every
      og/canonical tag was emitted relative.
- [x] Own port (3500), defined once in `scripts/dev.sh`, with start/stop/restart/status and
      a guard that names whoever already holds Next's dev lock.
- [x] Removed the empty `apps/`/`packages/` monorepo leftovers and the dead
      `lib/proto/session.ts`. (`pnpm-workspace.yaml` stays — it is pnpm's settings file,
      not a workspace declaration. Read the comment at the top before deleting it again.)
- [x] `lib/properties.ts` — every site a sponsorship covers, with a DNS check
      (`npm run check:hosts`).
- [x] GitHub Sponsors, read-only, on `/`, `/placements` and `/studio`.
- [x] Design system re-synced: one face (Inter), mono for code only.
- [x] Supabase → Neon Auth migration: `lib/auth/`, the proxy route, the
      profile bootstrap that replaces `handle_new_user()`, and `force-dynamic` on the authed
      segments.
- [x] Neon project `sponsor-imswarnil` created, auth enabled, schema pushed, FK applied.
- [x] `scripts/seed.mjs` — admin + demo sponsor + five open placements, idempotent.
- [x] Verified end to end: admin → /studio, demo → /sponsor, demo blocked from /studio.
