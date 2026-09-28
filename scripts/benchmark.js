// Reproducible I/O comparison with the original 2.4.7 implementation.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { collectFiles } = require('../src/files');
const { generateProjectTree } = require('../src/projectTree');
const { validateConfiguration } = require('../src/configuration');
const { Uri, makeApi } = require('../test/unit/helpers');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'commander-v-benchmark-'));
  try {
    const count = 1000;
    for (let i = 0; i < count; i++) await fs.writeFile(path.join(root, `file-${i}.js`), 'const sample = "Hello";\n'.repeat(50));
    const api = makeApi(root);
    const readFile = api.workspace.fs.readFile;
    api.workspace.fs.readFile = async uri => Buffer.from(await readFile(uri));
    api.window = { visibleTextEditors: [] };
    const baselineSource = execFileSync('git', ['show', '1782f87:utils.js'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    const baseline = { exports: {} };
    vm.runInNewContext(baselineSource, { module: baseline, console, __dirname, require: name => {
      if (name === 'vscode') return api;
      if (name === 'path') return path;
      if (name === 'play-sound') return () => ({});
      throw new Error(`Unexpected baseline import: ${name}`);
    } });
    const uri = Uri.file(root);
    // Isolate file-content I/O; this fixture has no project ignore file.
    const config = validateConfiguration({ ignoreFile: '' });
    async function measure(label, callback) {
      api.counts.reads = 0;
      api.counts.directories = 0;
      const start = performance.now();
      await callback();
      console.log(JSON.stringify({ label, files: count, milliseconds: Math.round(performance.now() - start), ...api.counts }));
    }
    await measure('2.4.7 selection pipeline', async () => {
      const items = await baseline.exports.identifySelectedFilesAndFolders([uri]);
      const ordered = await baseline.exports.determineFilePathsOrder(items, 'treeOrder');
      await baseline.exports.fetchFileContents(ordered.map(Uri.file), false);
    });
    await measure('current selection pipeline', () => collectFiles(api, [uri], config));
    const group = { root: uri, name: 'benchmark', files: Array.from({ length: count }, (_, i) => ({ uri: Uri.joinPath(uri, `file-${i}.js`) })) };
    await measure('current pruned tree', () => generateProjectTree(api, group, config));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
