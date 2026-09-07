import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder so a stray lockfile in a parent
  // directory can't make Next infer the wrong root (which 404s every route).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname)
  },
  /* ── Why PPR is off ────────────────────────────────────────────────────────
     `experimental.ppr` was on. It bought this app nothing and cost it a real
     invariant, so it is off:

     NOTHING to gain — every page that matters reads the session (the shared
     header) or the database per request, so the static shells Next generated
     were all ZERO BYTES. There was no prerendered content to serve.

     SOMETHING to lose — PPR flushes that shell with a 200 before the route's
     own code runs, so a `redirect()` inside a gate cannot set the status any
     more; it is delivered inside the RSC stream instead. `/studio` answered
     307 → /login in dev and 200 in the Worker build, for the same signed-out
     request. No data leaked (the shell is empty and the redirect is honoured
     by the client), but a gated URL that returns 200 to every crawler, uptime
     check and curl is a bad signal, and dev disagreeing with production about
     a status code is a debugging afternoon waiting to happen.

     Turn it back on only alongside a Suspense boundary around anything that
     reads cookies, and re-check the status codes on /studio and /sponsor.

     `clientSegmentCache` went with it: it is the client half of the same
     experiment and there is no navigation prefetch worth keeping when every
     segment is dynamic anyway. */

  /* Old URLs from the marketplace-shaped version of this app. They were public
     for a while — the embed snippets and any link someone saved still point at
     them, so they redirect rather than 404. */
  async redirects() {
    return [
      /* NOTE — the canonical-host redirect is NOT here, and that is deliberate.
         `advertise.imswarnil.com` → `sponsor.imswarnil.com` was written as a
         Next redirect with `has: [{ type: 'host' }]` and it does not fire
         through the OpenNext adapter: verified against the built Worker with
         both a spoofed Host header and a real request URL, and both returned
         200 instead of 308. A rule that silently does nothing is worse than no
         rule, so it lives one layer up as a Cloudflare Redirect Rule on the
         zone — which runs at the edge before the Worker is even invoked, and
         is where hostname canonicalisation belongs anyway. See CLAUDE.md §8.
         Everything below is a PATH redirect, which the adapter honours — the
         308s on /browse and /pricing are verified against the Worker. */
      { source: '/browse', destination: '/placements', permanent: true },
      { source: '/app', destination: '/studio', permanent: false },
      { source: '/app/slots', destination: '/studio/placements', permanent: false },
      { source: '/app/slots/new', destination: '/studio/placements/new', permanent: false },
      { source: '/app/slots/:id', destination: '/studio/placements/:id', permanent: false },
      { source: '/app/slots/:id/embed', destination: '/studio/placements/:id', permanent: false },
      { source: '/app/wallet', destination: '/studio/earnings', permanent: false },
      { source: '/app/sponsorships', destination: '/sponsor', permanent: false },
      { source: '/app/:path*', destination: '/studio', permanent: false },
      // Retired with the saas-starter scaffolding.
      { source: '/dashboard/:path*', destination: '/studio', permanent: false },
      { source: '/pricing', destination: '/placements', permanent: true },
      { source: '/sign-in', destination: '/login', permanent: true },
      { source: '/sign-up', destination: '/login', permanent: true }
    ];
  },

  async headers() {
    // App/marketing routes: block framing (clickjacking), sniffing, leaky referrers; HSTS.
    const secure = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }
    ];
    return [
      {
        // The widget is meant to be embedded on any site, so allow cross-origin framing here.
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' }
        ]
      },
      {
        source: '/((?!embed/).*)',
        headers: secure
      }
    ];
  }
};

export default nextConfig;
