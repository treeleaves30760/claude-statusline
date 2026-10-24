# One-line install: irm https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'
$raw = 'https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required (https://nodejs.org)' }
$dir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME '.claude' }
New-Item -ItemType Directory -Force $dir | Out-Null
$dest = Join-Path $dir 'statusline.js'
Invoke-WebRequest -UseBasicParsing "$raw/statusline.js" -OutFile $dest
node $dest --install
