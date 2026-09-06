import { getAuth } from '@/lib/auth/server';

/**
 * Proxies the browser's auth calls through to the Neon-hosted auth server,
 * attaching and reading the signed session cookie on *this* origin. Without it
 * the cookie would be cross-site and the session would not stick.
 *
 * The handler is resolved per request rather than at module scope so that
 * `next build` can import this route with no auth environment present — see
 * the note in lib/auth/server.ts.
 */
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return getAuth().handler().GET(request, context);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return getAuth().handler().POST(request, context);
}
