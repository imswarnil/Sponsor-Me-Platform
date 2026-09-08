import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder so a stray lockfile in a parent
  // directory cannot make Next infer the wrong root (which 404s every route).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },

  /* ── Why PPR is off ────────────────────────────────────────────────────────
     It buys this app nothing and costs it a real invariant.

     NOTHING to gain — every page reads the session (the header) or the
     database per request, so the static shells Next generated were all ZERO
     BYTES. There was no prerendered content to serve.

     SOMETHING to lose — PPR flushes that shell with a 200 before the route's
     own code runs, so `redirect()` in a gate can no longer set the status; it
     arrives inside the RSC stream instead. `/studio` answered 307 in dev and
     200 on the Worker for the same signed-out request. Nothing leaked, but a
     gated URL returning 200 to every crawler and uptime check is a bad signal,
     and dev disagreeing with production about a status code is a trap.

     Turn it back on only alongside a Suspense boundary around anything that
     reads cookies, and re-check the status codes on /studio and /dashboard. */

  async headers() {
    /* The app and marketing routes: block framing, sniffing and leaky
       referrers, and pin HTTPS. */
    const secure = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
      },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }
    ];

    return [
      {
        /* The widget is meant to be framed by anyone — that is the product.
           So `frame-ancestors *` here, and only here. Note this is also why
           /embed must never render anything session-dependent: a page that can
           be framed by any site must not know who is looking at it. */
        source: '/embed/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' }
        ]
      },
      { source: '/((?!embed/).*)', headers: secure }
    ];
  }
};

export default nextConfig;
