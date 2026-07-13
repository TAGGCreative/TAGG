#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.taggcreative.cms-media-processor.plist"
NODE="$(command -v node)"
LOG_DIR="$HOME/Library/Logs/TAGG-CMS"

if [[ -z "${NODE}" ]]; then
  echo "Node.js is required before installing the TAGG CMS helper."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"
sed -e "s|__NODE__|$NODE|g" -e "s|__ROOT__|$ROOT|g" -e "s|__LOG_DIR__|$LOG_DIR|g" \
  "$ROOT/scripts/com.taggcreative.cms-media-processor.plist.template" > "$PLIST"

launchctl bootout "gui/$(id -u)/com.taggcreative.cms-media-processor" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/com.taggcreative.cms-media-processor"
echo "TAGG CMS media helper installed and running."
