#!/usr/bin/env bash
# Reaches a running app the way an AI assistant does: starts `<program> mcp`, speaks MCP
# over its stdin and stdout, and checks the app answers with its tools. The app must
# already be running. Used by the Windows and macOS test builds.
set -euo pipefail

program="${1:?usage: mcp-smoke.sh PROGRAM LOG}"
log="${2:?usage: mcp-smoke.sh PROGRAM LOG}"
mkdir -p "$(dirname "$log")"

# Assistants keep stdin open while they wait for answers, so this does too. A watchdog
# stops the relay if it hangs; macOS has no `timeout`.
{
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"ci","version":"1"}}}'
  printf '%s\n' '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
  printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_documents","arguments":{}}}'
  sleep 10
} | "$program" mcp > "$log" 2>&1 &
relay=$!
( sleep 60; kill "$relay" 2>/dev/null ) &
watchdog=$!
wait "$relay" || true
kill "$watchdog" 2>/dev/null || true

cat "$log"

grep -q '"serverInfo"' "$log" || { echo "::error::The app didn't answer initialize"; exit 1; }
grep -q '"list_documents"' "$log" || { echo "::error::The app didn't list its tools"; exit 1; }
# The AI assistants setting is off on a fresh install, so the call is refused, in words.
grep -q "isn't letting AI assistants use your documents" "$log" || { echo "::error::The tool call wasn't answered"; exit 1; }
echo "An assistant reached the app."
