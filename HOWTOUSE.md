# How to use Be My Sponsor

A practical guide to running your own sponsorship platform. No code required
for day-to-day use — everything here is either a terminal command you copy, or
a page you click.

If something in here doesn't match what you see on screen, the code is the
truth and this file is stale. Tell me and I'll fix it.

---

## 1. What this thing is

It's a website where people can pay to sponsor your work, and a back office for
you to run it. There are exactly **two kinds of people**:

| | Who | Where they live | What they do |
|---|---|---|---|
| **Creator** | You, and only you | `/studio` | List placements, read analytics, see who's sponsoring you and what you've earned |
| **Sponsor** | Everyone else | `/sponsor` | See what they're running, how it's doing, and what they've spent |

Nobody else can ever get into `/studio`. That's enforced by an environment
variable (§3), not by a checkbox someone could tick.

The public side — the homepage, the placement list, the individual placement
pages — is about **you**. There is no "sign up and list your own slots" flow
anywhere on it. The only way into the back office is the small **Admin** link in
the footer.

---

## 2. Running it on your laptop

You need [Node.js](https://nodejs.org) 20+ and pnpm.

```bash
cd "~/Be My Sponsor/be-my-sponsor"
pnpm install
pnpm dev
```

Open <http://localhost:3000>. That's it — the database is the hosted Supabase
project, so there's nothing to start locally.

Other commands you'll want occasionally:

```bash
pnpm build       # production build — run this before you deploy, to catch errors
pnpm typecheck   # checks the code without building
pnpm db:studio   # a visual browser for the database tables
pnpm db:push     # push schema changes to the database (rare — see §10)
```

---

## 3. The one setting that matters

In `.env`:

```
CREATOR_EMAIL=imswarnil@gmail.com
```

**This is what makes you the admin.** The account whose email matches this gets
`/studio`. Everyone else gets `/sponsor`.

Two things follow from that:

1. **Sign up with exactly this email.** If you register with a different one,
   you'll land in the sponsor dashboard and wonder where your studio went. The
   fix is to change `CREATOR_EMAIL` to match, or make a new account.
2. **Set it on Vercel too.** `.env` is your laptop only. See §9.

If `CREATOR_EMAIL` is missing entirely, the app falls back to treating the
**oldest account** as the creator. That's fine while you're the only user, and
the studio shows you a warning when it happens — but once a real sponsor signs
up, an unset `CREATOR_EMAIL` is a genuine hole. Set it.

The rest of `.env` (database URLs, Supabase keys) is already filled in and you
shouldn't need to touch it.

---

## 4. First-time setup

1. Start the app (§2).
2. Go to <http://localhost:3000/login>, click **Sign up**.
3. Register with **imswarnil@gmail.com** and a password of 8+ characters.
4. You'll land on `/studio`. If you land on `/sponsor` instead, the email
   didn't match — see §3.

New accounts start with **1000 points**. Points are the stand-in for money
while the flow is being proved out — nothing charges a card, anywhere. See §8.

---

## 5. Listing a placement

A **placement** is one spot, on one channel, at one price. That's the whole
model. `/studio/placements/new`, or the **New placement** button.

You fill in three things:

**Name** — what a sponsor sees. Be concrete: "Newsletter main slot" tells
someone what they're buying, "Slot 2" doesn't.

**Channel** — which surface it runs on. This is the important one:

| Channel | What the sponsor gets | Measured? |
|---|---|---|
| **Blog** | The sidebar slot on every post | ✅ Views and clicks, automatically |
| **YouTube** | A read-out mention plus a description link | ❌ |
| **Newsletter** | A sponsored block inside an issue | ❌ |
| **Instagram** | A story mention or a post | ❌ |
| **Open source** | Logo and link in the README and docs | ❌ |

Only **Blog** placements serve through the embeddable widget, which is the only
thing that can count views and clicks by itself. The other four you place by
hand, so the app doesn't pretend to measure them — it says so on the page
instead of showing a zero that looks like failure. Report those numbers to your
sponsor from YouTube Studio, your newsletter tool, or Instagram insights.

**Price per week** — in points. Sponsors buy 1, 2 or 4 weeks at a time, so this
is the smallest amount anyone can spend.

### Putting a blog placement on your site

Open the placement and copy the snippet from the **Embed** box:

```html
<script src="https://your-site.com/widget.js" data-slot="sl_9fk2a7" async></script>
```

Paste it into your blog's sidebar where you want the spot. It reserves the exact
size before it loads, so your layout never jumps. While the spot is open it
shows a "Sponsor this spot" call-to-action that links back here; the moment
someone sponsors it, their creative appears automatically. You don't touch it
again.

Want to see it working first? `/playground?slot=sl_xxxx` is a fake blog page
that renders the widget exactly as a real site would.

### Editing and removing

On any placement page:

- **Name** — always editable.
- **Channel and price** — locked while somebody is sponsoring it. That's
  deliberate: they paid for a specific thing at a specific price, and moving it
  under them would be a bait and switch. Both unlock when the sponsorship ends.
- **Archive** — takes it off the public list and stops it serving. Reversible.
- **Delete** — permanent, and takes its view/click history with it. Blocked
  while sponsored.

---

## 6. Reading your analytics

**`/studio/analytics`** covers every blog placement at once: total views,
clicks, click-through rate, a 14-day chart, and a table ranked by views.

**A single placement's page** shows the same 14-day chart for just that one.

What counts as what:

- A **view** is one load of the widget. Every time your blog page renders with
  the spot on it, that's a view.
- A **click** is someone tapping the sponsor's ad. It's counted and then the
  visitor is forwarded to the sponsor's link.
- **No cookies, and no cross-site tracking of your readers.** This is a
  selling point on the public site — don't quietly break it later.

The analytics pages only ever show blog placements, because they're the only
ones with real data behind them.

---

## 7. Your sponsors

**`/studio/sponsors`** has two halves:

- **Running now** — who's live, on what, their headline and link, and how long
  they've got left. This is where you check what a sponsor actually submitted
  before it goes out in a video read or a newsletter.
- **Everyone who has sponsored** — the full history, with amounts.

**`/studio/earnings`** is your balance and every points movement, in or out.

**Sponsorships end on their own.** When the weeks someone bought run out, the
placement reopens and their creative stops serving. Nothing renews
automatically, and you don't have to remember to do anything.

You'll get an in-app notification (the bell in the top bar) whenever someone
sponsors something.

---

## 8. What a sponsor sees

Worth walking through once yourself, so you know what you're sending people to.
Use a second account in a private window — you can't sponsor your own placement,
and the app blocks it.

1. They land on your homepage or on a placement's public page.
2. `/placements` lists everything open, grouped by channel, with prices and — for
   blog spots — real view and click numbers. Nothing behind a rate card.
3. They open a placement, see what it is and what it costs.
4. They sign up (email + password, 1000 starting points).
5. They fill in a headline, an optional image URL, and their destination link,
   and pick 1, 2 or 4 weeks.
6. They pay, and land in **their own dashboard** at `/sponsor` with it already
   running.
7. `/sponsor` shows them what's live, its views and clicks, and when it expires.
   `/sponsor/history` is everything they've ever run.

They never see your studio, and they can't list placements of their own.

**Points are not money.** Nothing is charged to a card anywhere in this flow.
When you're ready for real payments that's a separate piece of work — it isn't
half-built and waiting, it simply isn't there.

---

## 9. Deploying

The site is on Vercel and connected to git: **pushing to `main` deploys it.**

```bash
git push origin main
```

**Before your first deploy of this version**, add `CREATOR_EMAIL` to Vercel:

1. Vercel → your project → **Settings** → **Environment Variables**
2. Add `CREATOR_EMAIL` = `imswarnil@gmail.com`, for Production
3. Redeploy

Skip this and the live site falls back to "oldest account is the creator" (§3).

Two things that will break the deploy if they get removed, both learned the hard
way:

- `vercel.json` must keep `framework: nextjs`, or Vercel serves `public/`
  statically and 404s every route.
- The middleware matcher must not be empty, or the deploy fails to finalise.

---

## 10. When you change the database

You mostly won't. If you do edit `lib/proto/schema.ts`:

```bash
pnpm db:push
```

That pushes the change to the live Supabase database. **There's no undo**, so
look at what it says it's going to do before you confirm.

Note that adding a channel to `lib/channels.ts` is *not* a database change —
channels are stored in a column that already exists. New channels need no
migration at all.

---

## 11. Things you'll probably want to do next

Nothing here is broken; these are just the edges I know about.

- **Fill in your channel links.** `lib/site.ts` has `href: null` for YouTube,
  the newsletter and Instagram. They render without a link until you add one.
  Blog and open source already point at real URLs.
- **No audience numbers anywhere.** Deliberate — I wasn't given real ones, and
  putting invented reach figures on a page where people spend money would be
  making things up. Add them when you have them.
- **Real payments.** Points today. This is the big one.
- **Email.** No signup confirmation, no "you've been sponsored" email. The bell
  in the studio is the only notification.
- **Rate limiting on actions.** Auth is rate-limited; app actions aren't. Needs
  Redis or similar.
- **Image uploads.** Sponsors paste an image URL; there's a Supabase storage
  bucket ready but nothing wired to it.

---

## 12. When something goes wrong

**I signed in and got `/sponsor` instead of `/studio`.**
Your account email doesn't match `CREATOR_EMAIL`. Check `.env` (and Vercel),
or sign up again with the right address.

**The studio warns that `CREATOR_EMAIL` is not set.**
Exactly what it says — see §3. It's working, but on a fallback you don't want
in production.

**A placement shows no views or clicks.**
If it isn't a Blog placement, that's correct and expected — it can't be
measured (§5). If it *is* a blog placement, check the `<script>` tag is actually
on a page that's getting traffic.

**An old link 404s.**
It shouldn't — `/browse`, `/app/*`, `/dashboard/*`, `/pricing`, `/sign-in` and
`/sign-up` all redirect to their new homes. If you find one that doesn't, that's
a bug worth reporting.

**The build fails after I've deleted something.**
Try `rm -rf .next` and build again. Next caches generated route types and they
go stale when files move.

---

## Map of the site

```
PUBLIC
  /                      the pitch
  /how-it-works          the long version, for sponsors
  /placements            everything open right now, plus an animated preview per channel
  /s/<publicId>          one placement + the sponsor flow (custom date range)
  /embed/<publicId>      the widget itself (loaded in an iframe)
  /playground            a fake blog, to preview the widget
  /login                 sign in / sign up (email/password or Google)
  /forgot-password       request a password reset email
  /reset-password        set a new password (only reachable via the email link)

YOU
  /studio                overview
  /studio/placements     list, create, manage
  /studio/analytics      views and clicks across everything
  /studio/channels       placeholder: name a YouTube/Ghost/blog/Instagram channel (no live sync yet)
  /studio/sponsors       who's backing you, plus past sponsors
  /studio/earnings       balance and ledger

SPONSORS
  /sponsor               what they're running
  /sponsor/history       what they've spent
```
