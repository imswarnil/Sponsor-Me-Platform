import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder so a stray lockfile in a parent
  // directory can't make Next infer the wrong root (which 404s every route).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname)
  },
  experimental: {
    ppr: true,
    clientSegmentCache: true
  },

  /* Old URLs from the marketplace-shaped version of this app. They were public
     for a while — the embed snippets and any link someone saved still point at
     them, so they redirect rather than 404. */
  async redirects() {
    return [
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
