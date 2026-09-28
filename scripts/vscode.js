const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { runCode } = require('./code-cli');
const root = path.resolve(__dirname, '..');
const code = process.env.VSCODE_CLI || (process.platform === 'win32' ? 'code.cmd' : 'code');
const mode = process.argv[2];
const args = ['--user-data-dir', path.join(root, '.dev', 'user-data'), '--extensions-dir', path.join(root, '.dev', 'extensions')];
const fixture = path.join(root, 'test', 'fixtures', 'project');
function run(command, commandArgs) {
  const result = (command === code ? runCode : spawnSync)(command, commandArgs, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!['dev', 'test', 'install'].includes(mode)) throw new Error('Expected dev, test, or install');
if (mode !== 'install') {
  const settingsDir = path.join(root, '.dev', 'user-data', 'User');
  fs.mkdirSync(settingsDir, { recursive: true });
  const settingsPath = path.join(settingsDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({ 'workbench.startupEditor': 'none', 'telemetry.telemetryLevel': 'off', 'extensions.autoUpdate': false, 'update.mode': 'none' }, null, 2));
}
if (mode === 'dev') {
  run(code, [...args, '--new-window', '--extensionDevelopmentPath=' + root, fixture]);
} else {
  run(process.execPath, [path.join(__dirname, 'package.js')]);
  const vsix = path.join(root, 'builds', `commander-v-${require('../package.json').version}.vsix`);
  run(code, [...(mode === 'test' ? args : []), '--install-extension', vsix, '--force']);
  if (mode === 'test') run(code, [...args, '--new-window', fixture]);
}
