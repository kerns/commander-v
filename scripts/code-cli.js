const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

function windowsCliEntry(app, launcher) {
  // Recent Windows builds put resources inside a versioned subdirectory. Use
  // the official launcher's path without sending user arguments through cmd.exe.
  const entry = launcher.match(/"%~dp0([^"\r\n]*\\resources\\app\\out\\cli\.js)"/i)?.[1];
  if (!entry) throw new Error('Cannot locate the VS Code CLI entry point in its Windows launcher');
  return path.win32.resolve(app, 'bin', entry);
}

// Run Windows' CLI through Electron-as-Node so paths never pass through cmd.exe.
function runCode(cli, args, options = {}) {
  if (process.platform === 'win32' && cli.toLowerCase().endsWith('.cmd')) {
    const located = path.isAbsolute(cli) ? cli : execFileSync('where.exe', [cli], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    const app = path.dirname(path.dirname(located));
    const name = path.basename(located).toLowerCase().includes('insiders') ? 'Code - Insiders.exe' : 'Code.exe';
    const executable = path.join(app, name);
    if (!fs.existsSync(executable)) throw new Error(`VS Code executable not found at ${executable}`);
    return spawnSync(executable, [windowsCliEntry(app, fs.readFileSync(located, 'utf8')), ...args], {
      ...options, env: { ...process.env, ...options.env, ELECTRON_RUN_AS_NODE: '1' },
    });
  }
  return spawnSync(cli, args, options);
}
module.exports = { runCode, windowsCliEntry };
