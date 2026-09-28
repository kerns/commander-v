const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const output = path.join(root, 'builds', `commander-v-${version}.vsix`);
fs.mkdirSync(path.dirname(output), { recursive: true });
execFileSync(process.execPath, [require.resolve('@vscode/vsce/vsce'), 'package', '--out', output], { cwd: root, stdio: 'inherit' });
console.log(`Test build: ${output}`);
