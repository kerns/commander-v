const { test } = require('node:test');
const assert = require('node:assert/strict');
const { windowsCliEntry } = require('../../scripts/code-cli');

test('Windows CLI follows the entry point in both official launcher layouts', () => {
  const app = 'C:\\Program Files\\Microsoft VS Code';
  for (const folder of ['', '04c0d99f4f\\']) {
    const launcher = `@echo off\r\n"%~dp0..\\Code.exe" "%~dp0..\\${folder}resources\\app\\out\\cli.js" %*\r\n`;
    assert.equal(windowsCliEntry(app, launcher), `${app}\\${folder}resources\\app\\out\\cli.js`);
  }
});
