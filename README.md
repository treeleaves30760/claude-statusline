# claude-statusline

A Claude Code status line showing model, folder + git branch, context usage, 5-hour usage and weekly usage — with a weekly pace projection that warns you if you're on track to run out before the reset.

```
Opus 5.5 │ my-project ⎇ main │ ctx ███░░░░░ 32%/200k │ 5h █████░░░ 57% (2h9m) │ week ███░░░░░ 40% (3d11h) ⚠ 2d6h後用完
```

- `(2h9m)` — time until that window resets
- `→78%` — projected weekly usage at reset if you keep the current pace
- `⚠ 2d6h後用完` — at the current pace you'll hit 100% in that long, before the reset

5h / weekly usage only appear when signed in with a Claude Pro/Max subscription, after the first response in a session.

## Install

Requires Node.js. Restart Claude Code afterwards.

**macOS / Linux / Git Bash**

```sh
curl -fsSL https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main/install.sh | sh
```

**Windows PowerShell**

```powershell
irm https://raw.githubusercontent.com/treeleaves30760/claude-statusline/main/install.ps1 | iex
```

The installer downloads `statusline.js` to `~/.claude/` (or `$CLAUDE_CONFIG_DIR`) and sets `statusLine` in `settings.json`, backing up the old file to `settings.json.bak`. Re-run it to update.
