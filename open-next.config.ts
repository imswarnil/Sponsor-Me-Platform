import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext adapter config.
 *
 * Defaults are right for this app, and the reason is that it caches almost
 * nothing. Every authenticated segment is `force-dynamic` (CLAUDE.md §3) and
 * the public pages read Neon per request, so there is no incremental cache for
 * isolates to disagree about.
 *
 * If a public page ever starts revalidating on a timer — a cached placements
 * catalogue, say — add an incremental cache override here (R2 or KV) so every
 * isolate shares one copy, rather than letting each one keep its own.
 */
export default defineCloudflareConfig();
