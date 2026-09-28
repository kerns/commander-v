const path = require('node:path');
const fs = require('node:fs/promises');
const { runCode } = require('./code-cli');
const { downloadAndUnzipVSCode, runTests, resolveCliArgsFromVSCodeExecutablePath } = require('@vscode/test-electron');
const root = path.resolve(__dirname, '..');

async function main() {
  const executable = process.env.VSCODE_EXECUTABLE_PATH || await downloadAndUnzipVSCode(process.env.VSCODE_VERSION || 'stable');
  const parent = path.join(root, '.vscode-test', 'runs');
  await fs.mkdir(parent, { recursive: true });
  const run = await fs.mkdtemp(path.join(parent, 'integration-'));
  const userData = path.join(run, 'user-data');
  const extensions = path.join(run, 'extensions');
  const first = path.join(run, 'alpha');
  const second = path.join(run, 'beta');
  await fs.mkdir(first);
  await fs.mkdir(second);
  const workspace = path.join(run, 'test.code-workspace');
  await fs.writeFile(workspace, JSON.stringify({ folders: [{ path: first }, { path: second }], settings: { 'commanderV.playSoundOnComplete': false, 'workbench.startupEditor': 'none', 'telemetry.telemetryLevel': 'off' } }));
  await fs.mkdir(path.join(userData, 'User'), { recursive: true });
  await fs.writeFile(path.join(userData, 'User', 'settings.json'), JSON.stringify({ 'update.mode': 'none' }));
  const profileArgs = ['--user-data-dir', userData, '--extensions-dir', extensions];
  const vsix = process.env.COMMANDER_V_VSIX === 'auto'
    ? path.join(root, 'builds', `commander-v-${require('../package.json').version}.vsix`)
    : process.env.COMMANDER_V_VSIX;
  if (vsix) {
    const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(executable, { reuseMachineInstall: true });
    const install = runCode(cli, [...cliArgs, ...profileArgs, '--install-extension', path.resolve(vsix), '--force'], { stdio: 'inherit' });
    if (install.error) throw install.error;
    if (install.status !== 0) throw new Error(`VSIX installation exited ${install.status}`);
  }
  await runTests({
    vscodeExecutablePath: executable,
    extensionDevelopmentPath: vsix ? path.join(root, 'test', 'harness') : root,
    extensionTestsPath: path.join(root, 'test', 'integration', 'index.js'),
    launchArgs: [workspace, ...profileArgs, '--skip-welcome', '--skip-release-notes', '--disable-updates'],
    extensionTestsEnv: {
      COMMANDER_V_TEST_ROOT: run,
      COMMANDER_V_PACKAGED: vsix ? '1' : '',
      COMMANDER_V_EXPECTED_VERSION: /^\d+\.\d+\.\d+$/.test(process.env.VSCODE_VERSION || '') ? process.env.VSCODE_VERSION : '',
    },
  });
}
main().catch(error => { console.error(error); process.exitCode = 1; });
