# IDEA — "Be My Sponsor" at full scale

*Parked for later. First we build and run the single-creator version for Swarnil
(see `REBUILD.md`). This doc exists so the thinking isn't lost. Everything here is a
hypothesis until the personal version proves the sponsorship flow end-to-end.*

## The idea

A self-serve sponsorship storefront **any creator can own**. Not a marketplace where
sponsors browse thousands of creators — the inverse: every creator gets their own branded
page (`sponsor.<their-domain>` or `<name>.besponsor.app`) listing *their* placements — blog
sidebar, YouTube mention, newsletter block, README badge, ambassador shout-out — with
transparent pricing and instant checkout. "Sponsor me" becomes a link in a bio, a line in a
video description, a badge in a README.

The wedge: sponsorships today are cold emails, DMs, and spreadsheets. Media kits are stale
PDFs. Small/mid creators have no rate card and no checkout. This productizes the thing
Patreon/BuyMeACoffee don't touch — **brand money, per-placement, with dates and deliverables**
— without the enterprise weight of a marketplace like Passionfroot.

## Audience

**Sellers (the customers):**
- Devs with popular open-source repos and technical blogs (README badges, docs sponsorship) —
  the beachhead, because Swarnil is one and the widget/badge story is strongest here.
- Newsletter writers (1k–50k subs) — established sponsorship culture, no tooling at the low end.
- YouTubers / streamers below agency size (10k–500k).
- Podcasters, course creators, indie hackers with an audience.

**Buyers (their sponsors):** dev-tool and SaaS marketing teams doing long-tail creator buys;
small brands; and — the underserved segment the "ambassador" placement serves — the
creator's *own audience members* who want to support them visibly.

## Monetization

1. **Take rate on transactions** — 5–10% platform fee on each sponsorship (Dodo Payments as
   merchant of record makes global tax/compliance tractable). Free to set up a page; we earn
   only when the creator earns. This is the core model.
2. **Pro subscription** (~$9–19/mo): custom domain, 0–2% reduced fee, analytics
   (views/clicks per placement), multiple pages, API access, email reports.
3. **Later, buyer-side:** a paid dashboard for brands managing sponsorships across many
   creators (campaign view, invoicing roll-up) — only once enough creators are on.
4. **Never:** selling audience data, forced exclusivity, pay-to-rank discovery.

## Features (in order of proof, not ambition)

**v1 — the storefront (what the personal build already proves)**
- Creator page with placements, custom date-range booking, real payments, auto-expiry.
- Embeddable widget + README badge with live "sponsored by" state.
- Self-serve sponsor dashboard: creative upload (R2), dates, receipts.
- Ambassador tier: audience members sponsor with their name/links — the "supporter wall".

**v2 — what makes it a product, not a template**
- Multi-tenant onboarding: sign up → connect payout → publish page in <10 minutes.
- Availability calendar per placement; booking overlap prevention; waitlists.
- Verified analytics: YouTube/Ghost/GitHub API connections so reach numbers are pulled,
  never typed (the no-fabricated-figures rule from the personal build, productized —
  this is a trust differentiator, make it the brand).
- Creative approval flow (creator approves ad before it goes live), content guidelines,
  auto takedown at expiry.
- Notifications + transactional email; payout ledger.

**v3 — network effects**
- Brand accounts: sponsor many creators in one checkout ("sponsor this stack of 10
  Salesforce bloggers").
- Discovery directory (opt-in, ranked by real availability — not pay-to-rank).
- Standardized placement types → comparable pricing across creators.
- Team/agency seats; API + Zapier.

## How to make it succeed

- **Dogfood as marketing.** sponsor.imswarnil.com *is* the demo. Every sponsored slot on
  Swarnil's properties shows "via Be My Sponsor". Public build-in-the-open posts.
- **Beachhead discipline.** Only dev-creators until 50–100 active pages. The README badge is
  the viral loop — every sponsored repo advertises the platform to other maintainers.
- **Time-to-first-dollar is the metric.** Onboarding fails unless a creator can go from
  signup to a purchasable placement in one sitting. Track signup → published page →
  first paid sponsorship.
- **Trust as the moat:** verified metrics only, merchant-of-record payments, creator
  approval on all creative, clean takedowns. Sponsors get receipts and proof-of-placement
  screenshots; creators get guaranteed payment upfront (funds captured at booking).
- **Pricing guidance** from aggregate data ("placements like yours sell for X") once there's
  data — solves the "I have no idea what to charge" cold-start for creators.
- **Risks to respect:** chicken-and-egg (mitigated by creators bringing their own sponsors
  at first — the tool is useful at n=1, that's the whole point of the personal build);
  ad-fraud/low-quality creative (approval flow + validation); platform ToS of embed targets;
  payments compliance (why merchant-of-record, not raw Stripe Connect, at the start).

## Sequencing

1. Run the personal version for real — Swarnil's actual sponsors, actual money (now).
2. Extract learnings: which placements sell, what sponsors ask, where the flow leaks.
3. Hand-onboard 3–5 friendly creators on forked copies — still not multi-tenant.
4. Only then build multi-tenant v2, with the schema redesigned for orgs from scratch
   (do **not** grow the single-tenant `bms_*` schema into it).
