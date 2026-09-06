#!/usr/bin/env bash
#
# Re-check the `live` flags in lib/properties.ts against real DNS.
#
# `live: false` is what stops the UI rendering a link to a host that does not
# resolve. It is a fact about the world, so it goes stale on its own — run this
# after any DNS change and correct the file by hand.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$ROOT/lib/properties.ts"
RESOLVER=1.1.1.1

# Every `host: '...'` in the properties file, in order.
hosts=$(grep -oE "host: '[^']+'" "$FILE" | sed "s/host: '//;s/'//")

printf '%-34s %-8s %s\n' HOST DNS 'live: in lib/properties.ts'
mismatch=0
for h in $hosts; do
  # Strip any path (the GitHub profile entry carries one).
  bare="${h%%/*}"
  if [ -n "$(dig +short @"$RESOLVER" "$bare" 2>/dev/null)" ]; then dns=up; else dns=down; fi

  # The `live:` belonging to this host is the next one after it in the file.
  declared=$(grep -A 6 "host: '$h'" "$FILE" | grep -m1 -oE 'live: (true|false)' | awk '{print $2}')
  [ "$declared" = true ] && want=up || want=down

  flag=''
  if [ "$dns" != "$want" ]; then flag='  <-- MISMATCH'; mismatch=1; fi
  printf '%-34s %-8s %s%s\n' "$bare" "$dns" "live: $declared" "$flag"
done

if [ "$mismatch" = 1 ]; then
  echo
  echo "DNS and lib/properties.ts disagree — update the file." >&2
  exit 1
fi
