#!/usr/bin/env bash
# Whether the deploy job runs Bicep. Prints infra=true or infra=false for $GITHUB_OUTPUT.
# Usage: infra-changed.sh <event name> <before sha> <head sha>
set -euo pipefail
event=$1 before=${2:-} head=$3

case "$event" in
  workflow_dispatch) echo infra=true; exit ;;
  push) ;;
  *) echo infra=false; exit ;;
esac

# A first push, or a before commit this clone does not have (force-pushed away): run it to be safe.
if [[ -z "$before" || "$before" =~ ^0+$ ]] || ! git cat-file -e "$before^{commit}" 2>/dev/null; then
  echo infra=true
elif git diff --quiet "$before" "$head" -- infra/; then
  echo infra=false
else
  echo infra=true
fi
