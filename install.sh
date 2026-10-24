#!/usr/bin/env sh
# One-line install: curl -fsSL https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main/install.sh | sh
set -e
RAW="https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main"
command -v node >/dev/null 2>&1 || { echo "Node.js is required (https://nodejs.org)"; exit 1; }
DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$DIR"
curl -fsSL "$RAW/statusline.js" -o "$DIR/statusline.js"
node "$DIR/statusline.js" --install
