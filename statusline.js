#!/usr/bin/env node
// Claude Code status line: model | folder + git branch | context | 5h usage | weekly usage + pace
// Usage:
//   node statusline.js            read status JSON from stdin, print the line (called by Claude Code)
//   node statusline.js --install  register this file as statusLine in ~/.claude/settings.json
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.argv.includes('--install')) {
  install();
} else {
  let input = '';
  process.stdin.on('data', (chunk) => (input += chunk));
  process.stdin.on('end', () => process.stdout.write(render(input)));
}

function install() {
  const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const file = path.join(dir, 'settings.json');
  let settings = {};
  if (fs.existsSync(file)) {
    try {
      settings = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      console.error(`Cannot parse ${file}: ${e.message}. Fix it and re-run.`);
      process.exit(1);
    }
    fs.copyFileSync(file, file + '.bak');
  }
  const script = path.resolve(__filename).replace(/\\/g, '/');
  settings.statusLine = { type: 'command', command: `node "${script}"`, padding: 0 };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
  console.log(`statusLine registered in ${file}. Restart Claude Code to see it.`);
}

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
const color = (p) => (p >= 80 ? c.red : p >= 50 ? c.yellow : c.green);
const pct = (p) => `${color(p)}${Math.round(p)}%${c.reset}`;
const bar = (p, w = 8) => {
  const n = Math.max(0, Math.min(w, Math.round((p / 100) * w)));
  return `${color(p)}${'█'.repeat(n)}${c.dim}${'░'.repeat(w - n)}${c.reset}`;
};
const toSec = (ts) => (ts > 1e12 ? ts / 1000 : ts);
const dur = (sec) => {
  const m = Math.floor(sec / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  return d > 0 ? `${d}d${h % 24}h` : h > 0 ? `${h}h${m % 60}m` : `${m}m`;
};

function gitBranch(cwd) {
  const git = (args) =>
    execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 1000 }).toString().trim();
  try {
    return git(['branch', '--show-current']) || git(['rev-parse', '--short', 'HEAD']);
  } catch {
    return '';
  }
}

// Linear projection of the weekly window: at the current burn rate, do we hit 100% before it resets?
function weeklyPace(used, resetsAt) {
  const WEEK = 7 * 86400;
  const remain = toSec(resetsAt) - Date.now() / 1000;
  const elapsed = WEEK - remain;
  if (!resetsAt || remain <= 0 || elapsed < 3600 || used <= 0) return '';
  const rate = used / elapsed;
  const projected = used + rate * remain;
  if (projected < 100) return ` ${c.dim}→${c.reset}${color(projected)}${Math.round(projected)}%${c.reset}`;
  const runOut = (100 - used) / rate;
  return ` ${c.red}⚠ ${dur(runOut)}後用完${c.reset}`;
}

function render(input) {
  let d = {};
  try { d = JSON.parse(input); } catch {}
  const parts = [];

  if (d.model?.display_name) parts.push(`${c.cyan}${d.model.display_name}${c.reset}`);

  const cwd = d.workspace?.current_dir || d.cwd;
  if (cwd) {
    const branch = gitBranch(cwd);
    parts.push(`${c.blue}${path.basename(cwd) || cwd}${c.reset}` + (branch ? ` ${c.magenta}⎇ ${branch}${c.reset}` : ''));
  }

  const cw = d.context_window;
  if (cw?.used_percentage != null) {
    const size = cw.context_window_size ? `${c.dim}/${Math.round(cw.context_window_size / 1000)}k${c.reset}` : '';
    parts.push(`ctx ${bar(cw.used_percentage)} ${pct(cw.used_percentage)}${size}`);
  }

  const reset = (ts) => {
    const left = ts ? toSec(ts) - Date.now() / 1000 : 0;
    return left > 0 ? ` ${c.dim}(${dur(left)})${c.reset}` : '';
  };
  const rl = d.rate_limits || {};
  const h5 = rl.five_hour, wk = rl.seven_day;
  if (h5?.used_percentage != null)
    parts.push(`5h ${bar(h5.used_percentage)} ${pct(h5.used_percentage)}${reset(h5.resets_at)}`);
  if (wk?.used_percentage != null)
    parts.push(`week ${bar(wk.used_percentage)} ${pct(wk.used_percentage)}${reset(wk.resets_at)}${weeklyPace(wk.used_percentage, wk.resets_at)}`);

  return parts.join(`${c.dim} │ ${c.reset}`);
}
