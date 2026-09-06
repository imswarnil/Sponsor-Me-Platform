/**
 * Sanitise a `next=` redirect target taken from the URL.
 *
 * The value is attacker-controlled: anyone can send someone a link to
 * `/login?next=<anything>`. Both `//evil.com` and `https://evil.com` are values
 * `router.push()` will happily follow off-site, which turns a login form into
 * an open redirect — the classic setup for a credible phishing hop.
 *
 * Only a same-site absolute path survives. Everything else becomes `/home`,
 * which resolves to wherever the signed-in user belongs.
 */
export function safeNext(raw: string | null | undefined, fallback = '/home') {
  if (!raw) return fallback;
  // Must be an absolute path...
  if (!raw.startsWith('/')) return fallback;
  // ...but not a protocol-relative URL, which is also "absolute path"-shaped.
  if (raw.startsWith('//')) return fallback;
  // `/\evil.com` is normalised to `//evil.com` by some browsers.
  if (raw.startsWith('/\\')) return fallback;
  return raw;
}
