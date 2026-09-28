const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Uri, makeApi } = require('./helpers');
const { collectFiles, relativePath } = require('../../src/files');
const { collectProjectTrees } = require('../../src/treeOnly');
const { createIgnoreMatcher } = require('../../src/exclusions');
const { validateConfiguration } = require('../../src/configuration');
const defaults = validateConfiguration({});

async function fixture(t, names) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'commander-v-exclusions-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const name of names) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), `CONTENT ${name}`);
  }
  const api = makeApi(root);
  return { root, uri: Uri.file(root), api };
}

const excludedDirectories = [
  'node_modules', '.pnpm-store', '.npm', '.yarn/cache', '.yarn/unplugged',
  '.next', '.svelte-kit', '.nuxt', '.output', '.astro', '.vercel', '.netlify',
  '.vite', '.vite-temp', '.parcel-cache', '.turbo', '.nx/cache', '.nx/workspace-data', '.angular/cache',
  '.cache', 'dist', 'dist-ssr', 'build', 'out', 'storybook-static',
  'coverage', '.nyc_output', 'playwright-report', 'blob-report', 'test-results', 'htmlcov',
  '.venv', 'venv', '__pycache__', '__pypackages__', '.eggs', 'sample.egg-info',
  '.pdm-build', '.uv-cache', '.direnv', '.tox', '.nox', '.pytest_cache', '.mypy_cache',
  '.ruff_cache', '.pytype', '.pyre', '.hypothesis', '.ipynb_checkpoints', '.git', '.hg', '.svn',
];

test('modern web/Python artifacts are omitted before reading their directories or contents', async t => {
  const paths = excludedDirectories.map(directory => `${directory}/should-not-read.txt`);
  const { api, uri } = await fixture(t, [...paths, 'src/app.tsx']);
  const readDirectory = api.workspace.fs.readDirectory;
  const readFile = api.workspace.fs.readFile;
  api.workspace.fs.readDirectory = input => {
    assert.ok(!excludedDirectories.includes(relativePath(uri, input)), `must not enter ${input.path}`);
    return readDirectory(input);
  };
  api.workspace.fs.readFile = input => {
    assert.ok(!input.path.endsWith('should-not-read.txt'));
    return readFile(input);
  };
  const files = (await collectFiles(api, [uri], defaults)).files;
  assert.deepEqual(files.map(file => relativePath(uri, file.uri)), ['src/app.tsx']);
  const tree = (await collectProjectTrees(api, [uri], defaults))[0];
  assert.match(tree, /app\.tsx/);
  assert.doesNotMatch(tree, /should-not-read|node_modules|\.venv|\.pnpm-store|\.svelte-kit|coverage/);
});

test('defaults also filter generated filenames and keep environment templates', async t => {
  const excluded = ['module.pyc', 'module.pyo', 'tsconfig.tsbuildinfo', '.eslintcache', '.stylelintcache',
    '.pnp.cjs', '.pnp.loader.mjs', '.yarn/install-state.gz', '.yarn/build-state.yml', '.coverage',
    '.coverage.machine.1', '.DS_Store', 'Thumbs.db', 'npm-debug.log', 'yarn-error.log', 'pnpm-debug.log',
    '.pnpm-debug.log', '.env', '.env.local', '.env.production', '.git'];
  const kept = ['.env.example', '.env.sample', '.env.template', 'src/env.ts'];
  const { api, uri } = await fixture(t, [...excluded, ...kept]);
  assert.deepEqual((await collectFiles(api, [uri], defaults)).files.map(file => relativePath(uri, file.uri)).sort(), kept.sort());
});

test('source, tests, migrations, lockfiles, notebooks, editor settings, and Yarn/Nx configuration remain', async t => {
  const kept = ['src/app.tsx', 'src/lib/index.ts', 'src/routes/+page.svelte', 'app/page.tsx',
    'lib/client.py', 'public/robots.txt', 'static/site.css', 'migrations/001.py', 'tests/unit.py',
    'tests/__snapshots__/page.snap', 'notebooks/explore.ipynb', 'env/schema.py',
    'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package-lock.json', 'yarn.lock', 'bun.lock',
    'pyproject.toml', 'uv.lock', 'poetry.lock', 'Pipfile.lock', 'requirements.txt', '.python-version',
    '.github/workflows/ci.yml', '.vscode/settings.json', '.yarnrc.yml', '.yarn/patches/fix.patch',
    '.yarn/plugins/plugin.cjs', '.yarn/releases/yarn.cjs', '.yarn/versions/release.yml', '.nx/workflows/ci.yaml',
    'next.config.ts', 'svelte.config.js', 'vite.config.ts'];
  const { api, uri } = await fixture(t, kept);
  const actual = (await collectFiles(api, [uri], defaults)).files.map(file => relativePath(uri, file.uri));
  assert.deepEqual(actual.sort(), kept.sort());
});

test('built-in names work in nested monorepo packages as well as the workspace root', async t => {
  const { api, uri } = await fixture(t, ['apps/web/.next/cache.txt', 'apps/web/node_modules/lib/index.js',
    'apps/web/.yarn/cache/archive.txt', 'apps/web/.nx/cache/result.txt', 'apps/web/src/page.tsx',
    'packages/api/.venv/lib/code.py', 'packages/api/.ruff_cache/result', 'packages/api/src/main.py']);
  const files = (await collectFiles(api, [uri], defaults)).files;
  assert.deepEqual(files.map(file => relativePath(uri, file.uri)), ['apps/web/src/page.tsx', 'packages/api/src/main.py']);
  const tree = (await collectProjectTrees(api, [uri], { ...defaults, projectTreeDepth: 10 }))[0];
  assert.doesNotMatch(tree, /\.next|node_modules|\.venv|\.ruff_cache|cache\//);
  assert.match(tree, /main\.py/);
});

test('project rules extend defaults and can reinclude directories with gitignore negation', async t => {
  const { root, api, uri } = await fixture(t, ['dist/kept.js', '.next/generated.js', 'private/data.txt', 'src/main.js']);
  await fs.writeFile(path.join(root, '.gitignore'), '!dist/\nprivate/\n');
  const files = (await collectFiles(api, [uri], defaults)).files;
  const names = files.map(file => relativePath(uri, file.uri));
  assert.ok(names.includes('dist/kept.js'));
  assert.ok(names.includes('src/main.js'));
  assert.ok(!names.includes('private/data.txt'));
  assert.ok(!names.includes('.next/generated.js'));
  const tree = (await collectProjectTrees(api, [uri], defaults))[0];
  assert.match(tree, /kept\.js/);
  assert.doesNotMatch(tree, /private|\.next/);
});

test('ignored parents must be reincluded before individual descendants, as with gitignore', async t => {
  const { root, api, uri } = await fixture(t, ['dist/keep.js', 'dist/omit.js']);
  await fs.writeFile(path.join(root, '.gitignore'), '!dist/keep.js\n');
  assert.equal((await collectFiles(api, [uri], defaults)).files.some(file => file.uri.path.endsWith('keep.js')), false);
  await fs.writeFile(path.join(root, '.gitignore'), '!dist/\ndist/*\n!dist/keep.js\n');
  const names = (await collectFiles(api, [uri], defaults)).files.map(file => relativePath(uri, file.uri));
  assert.ok(names.includes('dist/keep.js'));
  assert.ok(!names.includes('dist/omit.js'));
});

test('explicit files override exclusions in either selection order without duplicates', async t => {
  const { api, uri } = await fixture(t, ['node_modules/lib.js', 'src/main.js', '.env']);
  const chosen = Uri.joinPath(uri, 'node_modules', 'lib.js');
  for (const selection of [[uri, chosen, chosen], [chosen, uri]]) {
    const files = (await collectFiles(api, selection, defaults)).files;
    assert.equal(files.filter(file => file.uri.toString() === chosen.toString()).length, 1);
    assert.equal(files.length, 2);
  }
  assert.equal((await collectFiles(api, [Uri.joinPath(uri, '.env')], defaults)).files.length, 1);
});

test('selecting an excluded folder cannot accidentally read its contents', async t => {
  const { api, uri } = await fixture(t, ['.venv/lib/module.py']);
  const selected = Uri.joinPath(uri, '.venv');
  assert.equal((await collectFiles(api, [selected], defaults)).files.length, 0);
  assert.equal((await collectProjectTrees(api, [selected], defaults))[0], '.venv/\n');
  assert.equal(api.counts.directories, 0);
});

test('default opt-out preserves project rules; disabling both restores unfiltered traversal', async t => {
  const { root, api, uri } = await fixture(t, ['node_modules/lib.js', 'custom/file.txt']);
  await fs.writeFile(path.join(root, '.gitignore'), 'custom/\n');
  const names = (await collectFiles(api, [uri], { ...defaults, useDefaultIgnores: false })).files.map(file => relativePath(uri, file.uri));
  assert.ok(names.includes('node_modules/lib.js'));
  assert.ok(!names.includes('custom/file.txt'));
  const all = (await collectFiles(api, [uri], { ...defaults, useDefaultIgnores: false, ignoreFile: '' })).files;
  assert.equal(all.length, 3);
});

test('custom ignore files replace the project layer but keep built-in exclusions', async t => {
  const { root, api, uri } = await fixture(t, ['private/data.txt', 'docs/keep.md', '.pnpm-store/cache.txt']);
  await fs.writeFile(path.join(root, '.gitignore'), 'docs/\n');
  await fs.writeFile(path.join(root, '.commander-v.ignore'), 'private/\n');
  const names = (await collectFiles(api, [uri], { ...defaults, ignoreFile: '.commander-v.ignore' })).files.map(file => relativePath(uri, file.uri));
  assert.ok(names.includes('docs/keep.md'));
  assert.ok(!names.includes('private/data.txt'));
  assert.ok(!names.includes('.pnpm-store/cache.txt'));
});

test('a selected subtree still uses anchored workspace ignore rules', async t => {
  const { root, api, uri } = await fixture(t, ['src/private/data.txt', 'src/public/main.js']);
  await fs.writeFile(path.join(root, '.gitignore'), '/src/private/\n');
  const names = (await collectFiles(api, [Uri.joinPath(uri, 'src')], defaults)).files.map(file => relativePath(uri, file.uri));
  assert.deepEqual(names, ['src/public/main.js']);
});

test('ignore files are loaded once per workspace per collection and independently across roots', async t => {
  const a = await fixture(t, ['src/a.js', 'tests/a.js']);
  const b = await fixture(t, ['src/b.js', 'tests/b.js']);
  await fs.writeFile(path.join(a.root, '.gitignore'), 'tests/\n');
  await fs.writeFile(path.join(b.root, '.gitignore'), 'src/\n');
  a.api.workspace.getWorkspaceFolder = input => relativePath(a.uri, input) !== null ? { uri: a.uri } : { uri: b.uri };
  const readFile = a.api.workspace.fs.readFile;
  const loaded = [];
  a.api.workspace.fs.readFile = input => {
    if (input.path.endsWith('/.gitignore')) loaded.push(input.toString());
    return readFile(input);
  };
  const result = await collectFiles(a.api, [a.uri, b.uri], defaults);
  assert.equal(result.files.length, 4); // One source plus the ignore file in each root.
  assert.deepEqual(loaded, [Uri.joinPath(a.uri, '.gitignore').toString(), Uri.joinPath(b.uri, '.gitignore').toString()]);
});

test('outside-workspace folders use their own configured ignore file', async t => {
  const { root, api, uri } = await fixture(t, ['src/keep.py', 'private/data.txt']);
  api.workspace.getWorkspaceFolder = () => undefined;
  await fs.writeFile(path.join(root, '.gitignore'), 'private/\n');
  const names = (await collectFiles(api, [uri], defaults)).files.map(file => relativePath(uri, file.uri));
  assert.deepEqual(names.sort(), ['.gitignore', 'src/keep.py']);
});

test('remote providers use the same exclusions without local filesystem access', async () => {
  const api = makeApi();
  const root = Uri.parse('vscode-remote://ssh-remote+test/repo');
  api.workspace.getWorkspaceFolder = () => ({ uri: root, name: 'repo' });
  api.workspace.fs.stat = async () => ({ type: 2 });
  api.workspace.fs.readDirectory = async input => {
    assert.equal(input.toString(), root.toString(), 'must not enter excluded folders');
    return [['.venv', 2], ['.pnpm-store', 2], ['main.py', 1]];
  };
  api.workspace.fs.readFile = async input => {
    assert.equal(input.authority, root.authority);
    if (input.path.endsWith('.gitignore')) throw Object.assign(new Error('missing'), { code: 'FileNotFound' });
    assert.equal(input.path, '/repo/main.py');
    return Buffer.from('print("hello")');
  };
  assert.equal((await collectFiles(api, [root], defaults)).files.length, 1);
  assert.equal((await collectProjectTrees(api, [root], defaults))[0], 'repo/\n└── main.py\n');
});

test('ignore-file read failures propagate; missing files and empty paths retain defaults', async () => {
  const api = makeApi();
  const root = Uri.file('/project');
  api.workspace.fs.readFile = async () => { throw Object.assign(new Error('denied'), { code: 'NoPermissions' }); };
  await assert.rejects(createIgnoreMatcher(api, root, defaults), /denied/);
  assert.ok((await createIgnoreMatcher(api, root, { ...defaults, ignoreFile: '' })).ignores('node_modules/'));
  api.workspace.fs.readFile = async () => { throw Object.assign(new Error('missing'), { code: 'FileNotFound' }); };
  assert.ok((await createIgnoreMatcher(api, root, defaults)).ignores('.venv/'));
  assert.throws(() => validateConfiguration({ useDefaultIgnores: 'false' }), /useDefaultIgnores/);
});
