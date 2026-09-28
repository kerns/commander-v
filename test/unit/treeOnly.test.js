const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Uri, makeApi } = require('./helpers');
const { resolveTreeRoots, collectProjectTrees } = require('../../src/treeOnly');
const { renderTree, selectedTree } = require('../../src/projectTree');
const { formatOutput, formatTreeOutput } = require('../../src/format');
const { validateConfiguration } = require('../../src/configuration');
const defaults = validateConfiguration({});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'commander-v-tree-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const api = makeApi(root);
  api.window = {};
  await fs.mkdir(path.join(root, 'components'));
  await fs.mkdir(path.join(root, 'empty'));
  await fs.writeFile(path.join(root, 'components', 'greeting.js'), 'FILE CONTENT MUST NOT BE READ');
  await fs.writeFile(path.join(root, 'binary.dat'), Buffer.from([0, 1, 2]));
  await fs.writeFile(path.join(root, '.gitignore'), '*.secret\ncomponents/ignored/\n');
  await fs.writeFile(path.join(root, 'credentials.secret'), 'NOT COPIED');
  await fs.mkdir(path.join(root, 'components', 'ignored'));
  await fs.writeFile(path.join(root, 'components', 'ignored', 'skip.js'), 'skip');
  return { root, api };
}

test('tree-only includes binary names and empty folders without reading any file bodies', async t => {
  const { root, api } = await fixture(t);
  const readFile = api.workspace.fs.readFile;
  api.workspace.fs.readFile = async uri => {
    assert.equal(uri.fsPath, path.join(root, '.gitignore'), 'only the configured ignore file may be read');
    return readFile(uri);
  };
  const [tree] = await collectProjectTrees(api, [Uri.file(root)], defaults);
  assert.match(tree, /binary\.dat/);
  assert.match(tree, /empty\//);
  assert.match(tree, /greeting\.js/);
  assert.doesNotMatch(tree, /FILE CONTENT|NOT COPIED|credentials|ignored|skip\.js/);
  assert.equal(api.counts.reads, 1);
  assert.equal(api.counts.directories, 3);
});
test('selected subfolders respect ignore patterns rooted at the containing workspace', async t => {
  const { root, api } = await fixture(t);
  const [tree] = await collectProjectTrees(api, [Uri.file(path.join(root, 'components'))], defaults);
  assert.equal(tree, 'components/\n└── greeting.js\n');
});
test('tree-only depth applies independently of pruning and content settings', async t => {
  const { root, api } = await fixture(t);
  const [tree] = await collectProjectTrees(api, [Uri.file(root)], { ...defaults, projectTreeDepth: 1, pruneProjectTree: true, includeProjectTree: false });
  assert.match(tree, /components\//);
  assert.doesNotMatch(tree, /greeting\.js/);
  assert.equal(api.counts.directories, 1);
});
test('tree-only can copy an empty root folder', async t => {
  const { root, api } = await fixture(t);
  const [tree] = await collectProjectTrees(api, [Uri.file(path.join(root, 'empty'))], defaults);
  assert.equal(tree, 'empty/\n');
});
test('tree-only does not follow symlinks and rejects a linked root', async t => {
  const { root, api } = await fixture(t);
  const link = path.join(root, 'components', 'loop');
  await fs.symlink(root, link, 'junction');
  const tree = (await collectProjectTrees(api, [Uri.file(root)], defaults))[0];
  assert.match(tree, /loop/);
  assert.equal(api.counts.directories, 3);
  await assert.rejects(collectProjectTrees(api, [Uri.file(link)], defaults), /symbolic links/);
});
test('tree-only cancellation and filesystem errors propagate before producing output', async t => {
  const { root, api } = await fixture(t);
  await assert.rejects(collectProjectTrees(api, [Uri.file(root)], defaults, { isCancellationRequested: true }), { name: 'CancellationError' });
  assert.equal(api.counts.reads, 0);
  api.workspace.fs.readDirectory = async () => { throw new Error('permission denied'); };
  await assert.rejects(collectProjectTrees(api, [Uri.file(root)], defaults), /permission denied/);
});
test('shortcut resolves the active workspace while context selections override it', async t => {
  const { root, api } = await fixture(t);
  api.window.activeTextEditor = { document: { uri: Uri.file(path.join(root, 'components', 'greeting.js')) } };
  assert.equal((await resolveTreeRoots(api))[0].fsPath, root);
  const selected = Uri.file(path.join(root, 'empty'));
  assert.deepEqual(await resolveTreeRoots(api, selected), [selected]);
});
test('overlapping and duplicate folder selections produce only one root', async t => {
  const { root, api } = await fixture(t);
  const parent = Uri.file(root);
  const child = Uri.file(path.join(root, 'components'));
  const result = await resolveTreeRoots(api, child, [child, parent, parent, Uri.parse(parent.toString() + '/')]);
  assert.deepEqual(result.map(uri => uri.fsPath), [parent.fsPath]);
});
test('shortcut supports one workspace with no editor, a folder picker, and picker cancellation', async () => {
  const api = makeApi();
  api.window = {};
  const first = { uri: Uri.file('/alpha'), name: 'alpha' };
  const second = { uri: Uri.file('/beta'), name: 'beta' };
  api.workspace.workspaceFolders = [first];
  assert.deepEqual(await resolveTreeRoots(api), [first.uri]);
  api.workspace.workspaceFolders = [first, second];
  api.window.showWorkspaceFolderPick = async () => second;
  assert.deepEqual(await resolveTreeRoots(api), [second.uri]);
  api.window.showWorkspaceFolderPick = async () => undefined;
  assert.equal(await resolveTreeRoots(api), null);
});
test('shortcut supports standalone files and handles no folder or unsupported URIs', async () => {
  const api = makeApi();
  api.window = { activeTextEditor: { document: { uri: Uri.file('/tmp/loose.js') } } };
  assert.equal((await resolveTreeRoots(api))[0].fsPath, path.resolve('/tmp'));
  api.window.activeTextEditor = undefined;
  assert.deepEqual(await resolveTreeRoots(api), []);
  await assert.rejects(resolveTreeRoots(api, Uri.parse('https://example.com/project')), /filesystem folders/);
});
test('remote tree roots retain their scheme and authority', async () => {
  const api = makeApi();
  const uri = Uri.parse('vscode-remote://ssh-remote+test/project');
  api.workspace.fs.stat = async () => ({ type: 2 });
  api.workspace.fs.readDirectory = async input => {
    assert.equal(input.toString(), uri.toString());
    return [['hello.js', 1]];
  };
  api.workspace.fs.readFile = async () => { throw new Error('must not read file bodies'); };
  assert.equal((await collectProjectTrees(api, [uri], { ...defaults, ignoreFile: '' }))[0], 'project/\n└── hello.js\n');
});

const sample = { root: Uri.file('/project'), name: 'project', files: [
  { uri: Uri.file('/project/components/greeting.js'), content: 'const greeting = "hello";' },
  { uri: Uri.file('/project/hello.js'), content: 'hello' },
  { uri: Uri.file('/project/README.md'), content: 'readme' },
] };
test('Unicode and ASCII trees use consistent four-column indentation', () => {
  assert.equal(renderTree(selectedTree(sample)), 'project/\n├── components/\n│   └── greeting.js\n├── hello.js\n└── README.md\n');
  const ascii = renderTree(selectedTree(sample), 'ascii');
  assert.equal(ascii, 'project/\n|-- components/\n|   `-- greeting.js\n|-- hello.js\n`-- README.md\n');
  assert.ok([...ascii].every(character => character.charCodeAt(0) < 128));
});
test('default tree-only output has unlabeled code fences, with raw text opt-out', () => {
  const tree = renderTree(selectedTree(sample));
  assert.equal(formatTreeOutput([tree], defaults), '```\n' + tree + '```');
  assert.equal(formatTreeOutput([tree], { ...defaults, wrapTreeInCodeBlock: false }), tree.slice(0, -1));
});
test('combined output fences just the tree and leaves file contents outside it', () => {
  const tree = renderTree(selectedTree(sample));
  const output = formatOutput([sample], sample.files, [tree], defaults);
  assert.ok(output.startsWith('```\nproject/'));
  assert.ok(output.includes('└── README.md\n```\n\n/* --- Begin components/greeting.js --- */'));
});
test('whole-payload wrapping does not introduce nested tree fences', () => {
  const tree = renderTree(selectedTree(sample));
  const output = formatOutput([sample], sample.files, [tree], { ...defaults, wrapInCodeBlock: true });
  assert.ok(output.startsWith('```\nproject/'));
  assert.equal((output.match(/```/g) ?? []).length, 2);
  assert.doesNotMatch(output, /```text/);
});
test('tree fences cannot be closed by backticks in file names', () => {
  const output = formatTreeOutput(['project/\n└── ```file.js\n'], defaults);
  assert.equal(output, '````\nproject/\n└── ```file.js\n````');
});
test('files-only output stays free of trees and fences', () => {
  assert.equal(formatOutput([sample], [sample.files[0]], [], defaults), '/* --- Begin components/greeting.js --- */\nconst greeting = "hello";\n/* --- End components/greeting.js --- */');
});
test('invalid tree display settings are rejected', () => {
  assert.throws(() => validateConfiguration({ treeFormat: 'html' }), /treeFormat/);
  assert.throws(() => validateConfiguration({ wrapTreeInCodeBlock: 'true' }), /wrapTreeInCodeBlock/);
});
