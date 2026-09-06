#!/usr/bin/env bash
#
# The one place this project's dev server is defined.
#
#   ./scripts/dev.sh fg        run in the foreground  (what `npm run dev` does)
#   ./scripts/dev.sh start     run in the background   (`npm run serve`)
#   ./scripts/dev.sh stop|restart|status|logs
#   ./scripts/dev.sh port      print the port, for other scripts to read
#
# PORT BELOW IS THE SINGLE SOURCE OF TRUTH. package.json reads it from here
# rather than repeating the number, because when it was written in both places
# the two drifted apart twice in one afternoon (3200 → 3300 → 3500) and the
# background server ended up on a different port from `npm run dev`.
#
# Every project under ~/Swarnil claims a fixed port so two of them can run at
# once without one silently stealing the other's. Ours is 3500 — clear of 3000
# (salesforce.imswarnil.com on Nuxt, nac.imswarnil.com on Next), 3100 (job.),
# 3111, 3400 (imswarnil.github.io), 4001 and 8080-8099.
#
# ONLY ONE `next dev` CAN RUN PER DIRECTORY. Next takes an exclusive lock on
# .next/dev/lock, so a forgotten background server makes `npm run dev` fail with
# "Unable to acquire lock" — which does not say who is holding it. Every entry
# point here checks for that first and names the culprit.
#
# The PID and the log live in .dev/ (gitignored).

set -euo pipefail

PORT=3500
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.dev"
PID_FILE="$RUN_DIR/server.pid"
LOG_FILE="$RUN_DIR/server.log"
URL="http://localhost:$PORT"

mkdir -p "$RUN_DIR"

# The PID we started, if it is still alive. Empty otherwise (and the stale file
# is cleared, so a crashed server never blocks the next start).
running_pid() {
  [ -f "$PID_FILE" ] || return 0
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "$pid"
  else
    rm -f "$PID_FILE"
  fi
}

# Whoever is listening on our port — ours or a stranger's.
# `|| true` matters: lsof exits non-zero when nothing matches, which under
# `set -e` would abort the script every time the port is simply free.
port_pids() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | sort -u || true; }

port_owner_desc() {
  local pid="$1"
  local cwd
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | tail -1 | sed 's/^n//' || true)"
  echo "pid $pid${cwd:+ in $cwd}"
}

# Any `next dev` already running in THIS directory, whoever started it — the
# background server from `npm run serve`, or a `pnpm run dev` left open in
# another terminal. Next allows exactly one, so this is what has to be reported
# before anything tries to start a second.
dev_pids_here() {
  local out=''
  local p cwd
  for p in $(pgrep -f 'next dev|next-server' 2>/dev/null || true); do
    cwd="$(lsof -a -p "$p" -d cwd -Fn 2>/dev/null | tail -1 | sed 's/^n//' || true)"
    [ "$cwd" = "$ROOT" ] && out="$out $p"
  done
  echo "$out" | tr -s ' ' '\n' | sed '/^$/d' || true
}

# Next's lock error names a file, not a process. Say who is actually holding it.
report_existing() {
  local existing="$1"
  echo "a dev server is already running in this directory:" >&2
  for p in $existing; do echo "  $(port_owner_desc "$p")" >&2; done
  echo >&2
  echo "Next allows only one per directory (.next/dev/lock)." >&2
  echo "Stop it first:  npm run stop" >&2
}

# `npm run dev` — foreground, this shell, Ctrl-C to quit. Same port as every
# other entry point, and it refuses rather than dying on Next's opaque lock error.
cmd_fg() {
  local existing
  existing="$(dev_pids_here)"
  if [ -n "$existing" ]; then
    report_existing "$existing"
    return 1
  fi

  local squatters
  squatters="$(port_pids)"
  if [ -n "$squatters" ]; then
    echo "port $PORT is taken by something else:" >&2
    for p in $squatters; do echo "  $(port_owner_desc "$p")" >&2; done
    echo "refusing to start — free the port, or change PORT in scripts/dev.sh" >&2
    return 1
  fi

  # A lock left behind by a killed server would otherwise block a clean start.
  [ -n "$(dev_pids_here)" ] || rm -f "$ROOT/.next/dev/lock"

  exec npx next dev --turbopack --port "$PORT"
}

cmd_start() {
  local pid
  pid="$(running_pid)"
  if [ -n "$pid" ]; then
    echo "already running — $URL (pid $pid)"
    return 0
  fi

  # Catches a foreground `npm run dev` in another terminal, which has no PID
  # file here but still owns the lock.
  local existing
  existing="$(dev_pids_here)"
  if [ -n "$existing" ]; then
    report_existing "$existing"
    return 1
  fi

  local squatters
  squatters="$(port_pids)"
  if [ -n "$squatters" ]; then
    echo "port $PORT is taken by something else:" >&2
    for p in $squatters; do echo "  $(port_owner_desc "$p")" >&2; done
    echo "refusing to start — free the port, or change PORT in scripts/dev.sh" >&2
    return 1
  fi

  rm -f "$ROOT/.next/dev/lock"
  : > "$LOG_FILE"
  # setsid-less nohup: survives this shell, still killable by PID.
  nohup npx next dev --turbopack --port "$PORT" >>"$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  # Wait for it to actually answer rather than reporting success optimistically.
  for _ in $(seq 1 60); do
    if curl -sS -o /dev/null -m 2 "$URL" 2>/dev/null; then
      echo "started — $URL (pid $(cat "$PID_FILE"))"
      return 0
    fi
    if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "server exited during startup; last lines:" >&2
      tail -20 "$LOG_FILE" >&2
      rm -f "$PID_FILE"
      return 1
    fi
    sleep 1
  done

  echo "started but not answering after 60s — check: ./scripts/dev.sh logs" >&2
  return 1
}

# `npx next dev` is a wrapper: it spawns next-server, which spawns build
# workers. Killing the wrapper alone leaves those alive holding
# .next/dev/lock, and the next start dies with "unable to acquire lock" —
# so take the whole tree, deepest first.
kill_tree() {
  local pid="$1" child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}

cmd_stop() {
  local pid stopped=0
  pid="$(running_pid)"
  if [ -n "$pid" ]; then
    kill_tree "$pid"
    stopped=1
  fi

  # Also catch a server started by hand (`pnpm run dev` in a VS Code terminal),
  # which has no PID file here. Scoped to THIS directory — including one left on
  # an old port after PORT changed, since that still holds the lock — and to our
  # own port. Never anything belonging to a sibling project.
  for p in $(dev_pids_here) $(port_pids); do
    kill_tree "$p"
    stopped=1
  done

  for _ in $(seq 1 10); do
    [ -z "$(port_pids)$(dev_pids_here)" ] && break
    sleep 1
  done
  for p in $(dev_pids_here) $(port_pids); do kill -9 "$p" 2>/dev/null || true; done

  rm -f "$PID_FILE" "$ROOT/.next/dev/lock"
  [ "$stopped" = 1 ] && echo "stopped" || echo "not running"
}

cmd_status() {
  local pid
  pid="$(running_pid)"
  if [ -n "$pid" ]; then
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$URL" 2>/dev/null || echo '---')"
    echo "running  pid $pid  $URL  (HTTP $code)"
  else
    # A foreground `npm run dev` is a perfectly normal way to be running; it
    # just has no PID file here, so report it rather than saying "stopped".
    local existing squatters
    existing="$(dev_pids_here)"
    squatters="$(port_pids)"
    if [ -n "$existing" ]; then
      echo "running in the foreground (not started by this script):"
      for p in $existing; do echo "  $(port_owner_desc "$p")"; done
    elif [ -n "$squatters" ]; then
      echo "not ours, but port $PORT is busy:"
      for p in $squatters; do echo "  $(port_owner_desc "$p")"; done
    else
      echo "stopped  (port $PORT free)"
    fi
  fi
}

case "${1:-status}" in
  fg)      cmd_fg ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_stop; cmd_start ;;
  status)  cmd_status ;;
  logs)    tail -f "$LOG_FILE" ;;
  port)    echo "$PORT" ;;
  *) echo "usage: $0 {fg|start|stop|restart|status|logs|port}" >&2; exit 2 ;;
esac
