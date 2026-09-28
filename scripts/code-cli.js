const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

// Run Windows' CLI through Electron-as-Node so paths never pass through cmd.exe.
function runCode(cli, args, options = {}) {
  if (process.platform === 'win32' && cli.toLowerCase().endsWith('.cmd')) {
    const located = path.isAbsolute(cli) ? cli : execFileSync('where.exe', [cli], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    const app = path.dirname(path.dirname(located));
    const name = path.basename(located).toLowerCase().includes('insiders') ? 'Code - Insiders.exe' : 'Code.exe';
    const executable = path.join(app, name);
    if (!fs.existsSync(executable)) throw new Error(`VS Code executable not found at ${executable}`);
    return spawnSync(executable, [path.join(app, 'resources', 'app', 'out', 'cli.js'), ...args], {
      ...options, env: { ...process.env, ...options.env, ELECTRON_RUN_AS_NODE: '1' },
    });
  }
  return spawnSync(cli, args, options);
}
module.exports = { runCode };
