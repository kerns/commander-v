const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Uri, makeApi } = require('./helpers');
const { collectFiles, groupFiles, comparePaths, relativePath } = require('../../src/files');
const { generateProjectTree, selectedTree, renderTree } = require('../../src/projectTree');
const { validateConfiguration, loadLocalConfiguration } = require('../../src/configuration');
const { formatOutput } = require('../../src/format');
const { soundCommand } = require('../../src/notifications');
const defaults = validateConfiguration({});
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'commander-v-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'src'));
  await fs.writeFile(path.join(root, 'src', 'é.js'), 'const greeting = "你好 👋";');
  await fs.writeFile(path.join(root, 'a.js'), 'alpha');
  await fs.writeFile(path.join(root, 'image.bin'), Buffer.from([0, 1, 2]));
  return { root, api: makeApi(root) };
}

test('folder + overlapping selections read each file exactly once and decode Uint8Array as UTF-8', async t => {
  const { root, api } = await fixture(t);
  const { files, skipped } = await collectFiles(api, [Uri.file(root), Uri.file(path.join(root, 'a.js')), Uri.file(root)], defaults);
  assert.equal(files.length, 2);
  assert.equal(skipped, 1);
  assert.equal(api.counts.reads, 4); // Three selected files plus one ignore-file lookup.
  assert.equal(api.counts.directories, 2);
  assert.equal(files[0].content, 'const greeting = "你好 👋";');
});
test('unsaved background documents override disk without reading it', async t => {
  const { root, api } = await fixture(t);
  const uri = Uri.file(path.join(root, 'a.js'));
  api.workspace.textDocuments.push({ uri, getText: () => 'unsaved background tab' });
  const result = await collectFiles(api, [uri], { ...defaults, readFromEditor: true });
  assert.equal(result.files[0].content, 'unsaved background tab');
  assert.equal(api.counts.reads, 0);
});
test('saved-file mode ignores editor content', async t => {
  const { root, api } = await fixture(t);
  const uri = Uri.file(path.join(root, 'a.js'));
  api.workspace.textDocuments.push({ uri, getText: () => 'dirty' });
  assert.equal((await collectFiles(api, [uri], defaults)).files[0].content, 'alpha');
});
test('selection order is retained and duplicates are removed', async t => {
  const { root, api } = await fixture(t);
  const a = Uri.file(path.join(root, 'a.js'));
  const z = Uri.file(path.join(root, 'src', 'é.js'));
  assert.deepEqual((await collectFiles(api, [a, z, a], { ...defaults, orderFilesBy: 'selectionOrder' })).files.map(f => f.uri.toString()), [a.toString(), z.toString()]);
});
test('directory symlink loops are skipped', async t => {
  const { root, api } = await fixture(t);
  await fs.symlink(root, path.join(root, 'src', 'loop'), 'junction');
  const result = await collectFiles(api, [Uri.file(root)], defaults);
  assert.equal(result.files.length, 2);
  assert.equal(result.skipped, 2);
});
test('cancellation prevents filesystem work', async t => {
  const { root, api } = await fixture(t);
  await assert.rejects(collectFiles(api, [Uri.file(root)], defaults, { isCancellationRequested: true }), { name: 'CancellationError' });
  assert.equal(api.counts.reads, 0);
});
test('pruned trees perform no filesystem reads and include only exact selected paths', async t => {
  const { root, api } = await fixture(t);
  const group = { root: Uri.file(root), name: 'Project', files: [{ uri: Uri.file(path.join(root, 'a.js')) }, { uri: Uri.file(path.join(root, 'src', 'é.js')) }] };
  assert.equal(await generateProjectTree(api, group, defaults), 'Project/\n├── src/\n│   └── é.js\n└── a.js\n');
  assert.deepEqual(api.counts, { reads: 0, directories: 0 });
});
test('full tree respects glob patterns, negation, and skips ignored subtrees before reading', async t => {
  const { root, api } = await fixture(t);
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'node_modules', 'never-read.js'), 'x');
  await fs.writeFile(path.join(root, '.gitignore'), 'node_modules/\n*.bin\n*.js\n!a.js\n');
  const tree = await generateProjectTree(api, { root: Uri.file(root), name: 'Project' }, { ...defaults, pruneProjectTree: false });
  assert.match(tree, /a\.js/);
  assert.doesNotMatch(tree, /node_modules|image\.bin|é\.js/);
  assert.equal(api.counts.directories, 2);
});
test('tree depth zero reads no directories and depth one does not descend', async t => {
  const { root, api } = await fixture(t);
  const group = { root: Uri.file(root), name: 'Project' };
  assert.equal(await generateProjectTree(api, group, { ...defaults, pruneProjectTree: false, ignoreFile: '', projectTreeDepth: 0 }), 'Project/\n');
  assert.equal(api.counts.directories, 0);
  const tree = await generateProjectTree(api, group, { ...defaults, pruneProjectTree: false, ignoreFile: '', projectTreeDepth: 1 });
  assert.match(tree, /src\//);
  assert.doesNotMatch(tree, /é\.js/);
  assert.equal(api.counts.directories, 1);
});
test('tree order follows directory subtrees before files, with deterministic ties', () => {
  assert.deepEqual(['z.js', 'a.js', 'z/a.js', 'b/a.js'].sort(comparePaths), ['b/a.js', 'z/a.js', 'a.js', 'z.js']);
  assert.notEqual(comparePaths('A.js', 'a.js'), 0);
});
test('remote URIs retain authority and use provider reads', async () => {
  const api = makeApi();
  const uri = Uri.parse('vscode-remote://ssh-remote+host/work/a.js');
  api.workspace.fs.stat = async input => { assert.equal(input.scheme, 'vscode-remote'); return { type: 1 }; };
  api.workspace.fs.readFile = async input => { assert.equal(input.authority, 'ssh-remote+host'); return new Uint8Array([65]); };
  assert.equal((await collectFiles(api, [uri], defaults)).files[0].content, 'A');
});
test('path boundaries exclude prefix collisions and other URI authorities', () => {
  const root = Uri.file('/repo');
  assert.equal(relativePath(root, Uri.file('/repo-other/a.js')), null);
  assert.equal(relativePath(root, Uri.file('/repo/a.js')), 'a.js');
  assert.equal(relativePath(Uri.parse('vscode-remote://a/repo'), Uri.parse('vscode-remote://b/repo/a.js')), null);
  assert.equal(renderTree(selectedTree({ root, name: 'repo', files: [{ uri: Uri.file('/repo-other/a.js') }] })), 'repo/\n');
});
test('loose files work without an open workspace', () => {
  const file = { uri: Uri.file('/tmp/loose.js'), content: 'ok' };
  const groups = groupFiles(makeApi(), [file]);
  assert.equal(groups[0].root.fsPath, path.resolve('/tmp'));
  assert.match(formatOutput(groups, [file], [], defaults), /Begin loose\.js/);
});
test('formatting preserves literal dollar filenames and uses safe Markdown fences', () => {
  const file = { uri: Uri.file('/repo/$&.md'), content: '```js\ncode\n```' };
  const group = { root: Uri.file('/repo'), name: 'repo', files: [file] };
  const output = formatOutput([group], [file], [], { ...defaults, wrapInCodeBlock: true, commentAtFileBegin: '$file / $file' });
  assert.ok(output.startsWith('````\n$&.md / $&.md\n'));
  assert.ok(output.endsWith('\n````'));
});
test('multi-root labels are workspace-qualified without changing file order', () => {
  const first = { uri: Uri.file('/alpha/a.js'), content: 'alpha' };
  const second = { uri: Uri.file('/beta/a.js'), content: 'beta' };
  const groups = [{ root: Uri.file('/alpha'), name: 'alpha', files: [first] }, { root: Uri.file('/beta'), name: 'beta', files: [second] }];
  const output = formatOutput(groups, [second, first], [], defaults);
  assert.ok(output.indexOf('beta/a.js') < output.indexOf('alpha/a.js'));
});
test('invalid settings fail before allocation', () => {
  for (const values of [{ separatorLength: -1 }, { separatorLength: 1.5 }, { separatorLength: Infinity }, { projectTreeDepth: 101 }, { orderFilesBy: 'oops' }, { commentAtFileBegin: 3 }, { separatorCharacter: 'long' }]) {
    assert.throws(() => validateConfiguration(values), /Invalid Commander V setting/);
  }
});
test('untrusted JavaScript config is never executed; trusted config reloads', async t => {
  const { root } = await fixture(t);
  const configPath = path.join(root, 'v.config.js');
  await fs.writeFile(configPath, 'throw new Error("must not execute");');
  assert.deepEqual(await loadLocalConfiguration(Uri.file(root), false), {});
  await assert.rejects(loadLocalConfiguration(Uri.file(root), true), /must not execute/);
  await fs.writeFile(configPath, 'module.exports = { separatorLength: 7 };');
  assert.equal((await loadLocalConfiguration(Uri.file(root), true)).separatorLength, 7);
  await fs.writeFile(configPath, 'module.exports = { separatorLength: 9 };');
  assert.equal((await loadLocalConfiguration(Uri.file(root), true)).separatorLength, 9);
});
test('missing config is normal, but broken nested imports are errors', async t => {
  const { root } = await fixture(t);
  assert.deepEqual(await loadLocalConfiguration(Uri.file(root), true), {});
  await fs.writeFile(path.join(root, 'v.config.js'), 'require("./nonexistent.js");');
  await assert.rejects(loadLocalConfiguration(Uri.file(root), true), /nonexistent/);
});
test('sound uses a fixed executable with the bundled asset as a separate argument', () => {
  assert.deepEqual(soundCommand('darwin', '/space dir/success.wav'), ['/usr/bin/afplay', ['/space dir/success.wav']]);
  assert.match(soundCommand('win32', "C:\\it's\\success.wav")[1].at(-1), /it''s/);
});
