# supabase/

Supabase CLI project config for local dev. Supabase is **DB + Storage only** — auth stays
with Better Auth, and **Drizzle owns the schema** (CLAUDE.md §7). Do not author schema changes
through the Supabase dashboard or `supabase migration`; generate them with `drizzle-kit` in
`packages/db` instead.

## First-time setup
```bash
# Install the CLI (once): https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <your-project-ref>   # hosted project
# or run a full local stack:
supabase start                                    # prints local URL + keys → put in .env
```

## Storage
Create the `creatives` bucket (used in Phase 2) in the dashboard or:
```bash
supabase storage create creatives
```

`config.toml` is committed; secrets are not — they live in `.env`.
