# r2/ — Cloudflare R2 (file storage)

Everything related to Cloudflare R2 lives in this folder, kept deliberately separate from
the app code so storage concerns never leak into the Next.js tree.

R2 is the planned home for every binary the platform touches:

- **Ad creative** uploaded by sponsors (logos, banners, images) — replaces hotlinking
  arbitrary external image URLs, which is both a reliability and a security win.
- **Media kit assets** (Swarnil's own logos, screenshots, rate-card PDF).
- **Invoices / receipts** generated after a Dodo Payments checkout.

## Planned layout

```
r2/
  README.md          ← this file
  cors.json          ← CORS policy for the bucket (allow sponsor.imswarnil.com only)
  scripts/           ← upload/sync scripts (wrangler r2 object put, presigned-URL helper)
  assets/            ← local staging area for files to sync up (gitignored if large)
```

## Conventions (decide once, follow always)

- One bucket: `sponsor-imswarnil` (prod). Add `-dev` suffix for a dev bucket only if needed.
- Key scheme: `creative/<sponsorshipId>/<filename>`, `mediakit/<filename>`,
  `invoices/<year>/<paymentId>.pdf`.
- Public access via a custom domain (e.g. `files.imswarnil.com` → R2 public bucket) for
  creative + media kit; invoices stay private, served via presigned URLs only.
- Uploads go through presigned PUT URLs minted server-side after auth — the bucket
  credentials never reach the browser.
- Validate content-type and size (≤ 2 MB images) before minting an upload URL.
