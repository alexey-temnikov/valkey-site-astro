#!/usr/bin/env bash
# Sync topic docs from the valkey-doc sibling repo into the Starlight
# content collection. Run automatically as a pre-build step.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="${PROJECT_ROOT}/../valkey-doc/topics"
DEST="${PROJECT_ROOT}/src/content/docs/topics"

if [ ! -d "$SOURCE" ]; then
  echo "ERROR: valkey-doc/topics not found at $SOURCE" >&2
  echo "Clone valkey-io/valkey-doc as a sibling directory." >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$SOURCE"/. "$DEST"/
echo "Synced $(find "$DEST" -name '*.md' | wc -l | tr -d ' ') topics from valkey-doc"
