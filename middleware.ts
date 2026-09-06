import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Refreshes the Supabase auth session cookie on navigation (Edge-safe — no Node deps).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // Touch the session so it refreshes; do not gate routes here (pages handle their own auth).
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Run on everything except static assets, the widget file, and the embeddable iframe.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|widget.js|embed/).*)']
};
