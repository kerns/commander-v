const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');

async function run() {
  const root = process.env.COMMANDER_V_TEST_ROOT;
  if (!root) throw new Error('Run integration tests through npm run test:integration');
  const first = path.join(root, 'alpha');
  const second = path.join(root, 'beta');
  const alpha = vscode.Uri.file(path.join(first, 'a.js'));
  const nested = vscode.Uri.file(path.join(first, 'src', 'é.js'));
  const beta = vscode.Uri.file(path.join(second, 'b.js'));
  const binary = vscode.Uri.file(path.join(first, 'binary.dat'));
  await fs.mkdir(path.join(first, 'src'), { recursive: true });
  await fs.writeFile(alpha.fsPath, 'saved alpha');
  await fs.writeFile(nested.fsPath, '你好 👋');
  await fs.writeFile(beta.fsPath, 'beta');
  await fs.writeFile(binary.fsPath, Buffer.from([0, 1, 2]));
  const clipboard = await vscode.env.clipboard.readText();
  const config = vscode.workspace.getConfiguration('commanderV');
  const command = (...uris) => vscode.commands.executeCommand('extension.commanderV', uris[0], uris);
  const treeCommand = (...uris) => vscode.commands.executeCommand('extension.commanderVCopyProjectTree', uris[0], uris.length ? uris : undefined);
  const set = (key, value) => config.update(key, value, vscode.ConfigurationTarget.Workspace);
  let passed = 0;
  async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
  try {
    const extension = vscode.extensions.getExtension('kerns.commander-v');
    assert.ok(extension, 'Commander V is installed');
    await check('extension activates on supported VS Code', async () => {
      await extension.activate();
      assert.ok(extension.isActive);
      assert.equal(extension.packageJSON.version, require('../../package.json').version);
      if (process.env.COMMANDER_V_PACKAGED) assert.ok(extension.extensionPath.includes('extensions'), 'uses installed VSIX');
      console.log(`Testing Commander V ${extension.packageJSON.version} on VS Code ${vscode.version}, Node ${process.versions.node}`);
      console.log(`Extension path: ${extension.extensionPath}`);
      if (process.env.COMMANDER_V_EXPECTED_VERSION) {
        assert.equal(vscode.version, process.env.COMMANDER_V_EXPECTED_VERSION, 'test host must match the requested VS Code version; replace an updated cached download');
      }
    });
    await check('quick copies use a real cancellation token without opening progress', async () => {
      const { withDelayedProgress } = require(path.join(extension.extensionPath, 'src', 'progress.js'));
      let notifications = 0;
      const api = {
        CancellationTokenSource: vscode.CancellationTokenSource,
        ProgressLocation: vscode.ProgressLocation,
        window: { withProgress: (...args) => {
          notifications++;
          return vscode.window.withProgress(...args);
        } },
      };
      assert.equal(await withDelayedProgress(api, 'Quick copy test', async (progress, token) => {
        assert.equal(token.isCancellationRequested, false);
        progress.report({ message: 'Ready' });
        return 'complete';
      }), 'complete');
      assert.equal(notifications, 0);
    });
    await check('slow copies open cancellable native progress and await its cleanup', async () => {
      const { withDelayedProgress } = require(path.join(extension.extensionPath, 'src', 'progress.js'));
      let finishWork;
      const work = new Promise(resolve => { finishWork = resolve; });
      let notifications = 0;
      let closed = false;
      const api = {
        CancellationTokenSource: vscode.CancellationTokenSource,
        ProgressLocation: vscode.ProgressLocation,
        window: { withProgress: async (options, task) => {
          notifications++;
          assert.equal(options.cancellable, true);
          assert.equal(options.location, vscode.ProgressLocation.Notification);
          try {
            return await vscode.window.withProgress(options, async (...args) => {
              const completion = task(...args);
              finishWork('complete');
              return completion;
            });
          } finally { closed = true; }
        } },
      };
      // Release the held task even if a regression prevents progress from appearing.
      const timeout = setTimeout(() => finishWork('timed out'), 10000);
      try {
        const result = await withDelayedProgress(api, 'Commander V: delayed progress test', async progress => {
          progress.report({ message: 'Checking slow-copy progress' });
          return work;
        });
        assert.equal(result, 'complete');
        assert.equal(notifications, 1);
        assert.ok(closed);
      } finally { clearTimeout(timeout); }
    });
    await check('folder selection produces exact tree order, text, and one copy per file', async () => {
      await command(vscode.Uri.file(first), alpha);
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /```\nalpha\/\n├── src\/\n│   └── é\.js\n└── a\.js\n```/);
      assert.match(text, /你好 👋/);
      assert.equal(text.match(/Begin a\.js/g).length, 1);
      assert.doesNotMatch(text, /binary\.dat/);
      assert.ok(text.indexOf('Begin src/é.js') < text.indexOf('Begin a.js'));
    });
    await check('reusing selection reads updated file contents', async () => {
      await fs.writeFile(alpha.fsPath, 'updated alpha');
      await vscode.commands.executeCommand('extension.commanderVReusePreviousSelection');
      assert.match(await vscode.env.clipboard.readText(), /updated alpha/);
    });
    await check('selection order and multi-root paths are preserved', async () => {
      await set('orderFilesBy', 'selectionOrder');
      await command(beta, alpha);
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /Begin beta\/b\.js/);
      assert.match(text, /Begin alpha\/a\.js/);
      assert.ok(text.indexOf('Begin beta/b.js') < text.indexOf('Begin alpha/a.js'));
    });
    await check('unsaved background documents are copied', async () => {
      await set('readFromEditor', true);
      const doc = await vscode.workspace.openTextDocument(alpha);
      await vscode.window.showTextDocument(doc);
      const edit = new vscode.WorkspaceEdit();
      edit.replace(alpha, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), 'UNSAVED BACKGROUND TEXT');
      assert.ok(await vscode.workspace.applyEdit(edit));
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(beta));
      assert.equal(doc.isDirty, true);
      await command(alpha);
      assert.match(await vscode.env.clipboard.readText(), /UNSAVED BACKGROUND TEXT/);
    });
    await check('saved-file setting reads disk even with a dirty background document', async () => {
      await set('readFromEditor', false);
      await command(alpha);
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /updated alpha/);
      assert.doesNotMatch(text, /UNSAVED/);
    });
    await check('command palette invocation uses the active editor', async () => {
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(beta));
      await vscode.commands.executeCommand('extension.commanderV');
      assert.match(await vscode.env.clipboard.readText(), /Begin b\.js/);
    });
    await check('binary-only and empty selections leave clipboard and previous selection intact', async () => {
      await vscode.env.clipboard.writeText('keep me');
      await command(binary);
      assert.equal(await vscode.env.clipboard.readText(), 'keep me');
      const empty = path.join(first, 'empty');
      await fs.mkdir(empty);
      await command(vscode.Uri.file(empty));
      assert.equal(await vscode.env.clipboard.readText(), 'keep me');
      await vscode.commands.executeCommand('extension.commanderVReusePreviousSelection');
      assert.match(await vscode.env.clipboard.readText(), /Begin b\.js/);
    });
    await check('deleted reused files are skipped without losing surviving files', async () => {
      await command(nested, beta);
      await fs.unlink(nested.fsPath);
      await vscode.commands.executeCommand('extension.commanderVReusePreviousSelection');
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /Begin b\.js/);
      assert.doesNotMatch(text, /é\.js/);
    });
    await check('full trees apply real ignore globs', async () => {
      await fs.writeFile(path.join(first, '.gitignore'), '*.dat\nempty/\n');
      await set('pruneProjectTree', false);
      await command(alpha);
      const text = await vscode.env.clipboard.readText();
      assert.doesNotMatch(text, /binary\.dat|empty\//);
      await set('pruneProjectTree', true);
    });
    await check('format options and Markdown containing triple backticks work', async () => {
      await fs.writeFile(beta.fsPath, '```js\nhello\n```');
      await set('wrapInCodeBlock', true);
      await set('includeSeparator', true);
      await set('separatorCharacter', '=');
      await set('separatorLength', 4);
      await command(beta);
      const text = await vscode.env.clipboard.readText();
      assert.ok(text.startsWith('````\n'));
      assert.match(text, /\n====\n/);
      assert.ok(text.endsWith('\n````'));
      await set('wrapInCodeBlock', false);
    });
    await check('loose files outside workspace folders work', async () => {
      const loose = vscode.Uri.file(path.join(root, 'loose.js'));
      await fs.writeFile(loose.fsPath, 'loose content');
      await command(loose);
      assert.match(await vscode.env.clipboard.readText(), /Begin loose\.js/);
    });
    await check('read errors leave the clipboard untouched', async () => {
      await vscode.env.clipboard.writeText('preserve on failure');
      await command(vscode.Uri.file(path.join(first, 'does-not-exist.js')));
      assert.equal(await vscode.env.clipboard.readText(), 'preserve on failure');
    });
    await check('tree-only copies structure including binary names and empty folders, without content', async () => {
      await fs.mkdir(path.join(first, 'assets'));
      await fs.mkdir(path.join(first, 'blank'));
      await fs.writeFile(path.join(first, 'assets', 'badge.png'), Buffer.from([0, 10, 255]));
      await treeCommand(vscode.Uri.file(first));
      const text = await vscode.env.clipboard.readText();
      assert.ok(text.startsWith('```\nalpha/\n'));
      assert.ok(text.endsWith('\n```'));
      assert.match(text, /badge\.png/);
      assert.match(text, /blank\//);
      assert.doesNotMatch(text, /Begin|updated alpha|UNSAVED|binary\.dat/);
    });
    await check('tree-only folder context copies that subtree and observes the depth limit', async () => {
      await treeCommand(vscode.Uri.file(path.join(first, 'assets')));
      assert.equal(await vscode.env.clipboard.readText(), '```\nassets/\n└── badge.png\n```');
      await set('projectTreeDepth', 1);
      await treeCommand(vscode.Uri.file(first));
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /assets\//);
      assert.doesNotMatch(text, /badge\.png/);
      await set('projectTreeDepth', 3);
    });
    await check('tree-only shortcut targets the active workspace and does not replace the last file selection', async () => {
      await command(alpha);
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(beta));
      await treeCommand();
      assert.equal(await vscode.env.clipboard.readText(), '```\nbeta/\n└── b.js\n```');
      await vscode.commands.executeCommand('extension.commanderVReusePreviousSelection');
      assert.match(await vscode.env.clipboard.readText(), /Begin a\.js/);
    });
    await check('tree-only handles multiple roots and overlapping folder selections', async () => {
      await treeCommand(vscode.Uri.file(path.join(first, 'assets')), vscode.Uri.file(first), vscode.Uri.file(second));
      const text = await vscode.env.clipboard.readText();
      assert.equal((text.match(/badge\.png/g) ?? []).length, 1);
      assert.match(text, /alpha\//);
      assert.match(text, /beta\//);
      assert.equal((text.match(/^```$/gm) ?? []).length, 2);
    });
    await check('tree-only handles empty folders and preserves the clipboard on errors', async () => {
      await treeCommand(vscode.Uri.file(path.join(first, 'blank')));
      assert.equal(await vscode.env.clipboard.readText(), '```\nblank/\n```');
      await treeCommand(vscode.Uri.file(path.join(first, 'missing-folder')));
      assert.equal(await vscode.env.clipboard.readText(), '```\nblank/\n```');
    });
    await check('ASCII/raw tree settings work and files-only mode remains independent', async () => {
      await set('treeFormat', 'ascii');
      await set('wrapTreeInCodeBlock', false);
      await set('includeProjectTree', false);
      await treeCommand(vscode.Uri.file(first));
      const text = await vscode.env.clipboard.readText();
      assert.ok(text.startsWith('alpha/\n'));
      assert.match(text, /\|-- assets\/\n\|   `-- badge\.png/);
      assert.doesNotMatch(text, /```|Begin|├|└|│/);
      await command(alpha);
      const filesOnly = await vscode.env.clipboard.readText();
      assert.ok(filesOnly.startsWith('/* --- Begin a.js --- */'));
      assert.doesNotMatch(filesOnly, /```|alpha\/|assets\//);
      await set('treeFormat', 'unicode');
      await set('wrapTreeInCodeBlock', true);
      await set('includeProjectTree', true);
    });
    const modern = path.join(first, 'modern');
    const cached = vscode.Uri.file(path.join(modern, '.pnpm-store', 'cached.js'));
    await check('packaged defaults exclude modern web and Python artifacts from folder copies', async () => {
      await fs.access(path.join(extension.extensionPath, 'src', 'default.ignore'));
      for (const directory of ['.pnpm-store', '.next', '.svelte-kit', '.venv', '__pycache__', '.ruff_cache', 'ignored-by-project']) {
        await fs.mkdir(path.join(modern, directory), { recursive: true });
        await fs.writeFile(path.join(modern, directory, 'cached.js'), `GENERATED BODY ${directory}`);
      }
      await fs.writeFile(path.join(modern, 'main.py'), 'print("MODERN SOURCE")');
      await fs.writeFile(path.join(modern, 'uv.lock'), 'LOCKFILE CONTEXT');
      await fs.writeFile(path.join(modern, 'pnpm-lock.yaml'), 'PACKAGE LOCK CONTEXT');
      await fs.appendFile(path.join(first, '.gitignore'), 'modern/ignored-by-project/\n');
      await command(vscode.Uri.file(modern));
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /MODERN SOURCE/);
      assert.match(text, /LOCKFILE CONTEXT/);
      assert.match(text, /PACKAGE LOCK CONTEXT/);
      assert.doesNotMatch(text, /GENERATED BODY|cached\.js|\.pnpm-store|\.venv/);
    });
    await check('tree-only and unpruned combined trees use the same exclusions', async () => {
      await treeCommand(vscode.Uri.file(modern));
      assert.equal(await vscode.env.clipboard.readText(), '```\nmodern/\n├── main.py\n├── pnpm-lock.yaml\n└── uv.lock\n```');
      await set('pruneProjectTree', false);
      await command(vscode.Uri.file(modern));
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /main\.py/);
      assert.doesNotMatch(text, /\.pnpm-store|\.svelte-kit|\.venv|ignored-by-project|GENERATED BODY/);
      await set('pruneProjectTree', true);
    });
    await check('explicit file selection overrides defaults and can be reused', async () => {
      await command(vscode.Uri.file(modern), cached);
      let text = await vscode.env.clipboard.readText();
      assert.equal((text.match(/GENERATED BODY \.pnpm-store/g) ?? []).length, 1);
      assert.doesNotMatch(text, /GENERATED BODY \.venv/);
      await vscode.commands.executeCommand('extension.commanderVReusePreviousSelection');
      text = await vscode.env.clipboard.readText();
      assert.match(text, /GENERATED BODY \.pnpm-store/);
    });
    await check('default exclusions can be disabled while project ignore rules remain active', async () => {
      await set('useDefaultIgnores', false);
      await command(vscode.Uri.file(modern));
      const text = await vscode.env.clipboard.readText();
      assert.match(text, /GENERATED BODY \.venv/);
      assert.match(text, /GENERATED BODY \.pnpm-store/);
      assert.doesNotMatch(text, /GENERATED BODY ignored-by-project/);
      await treeCommand(vscode.Uri.file(modern));
      assert.match(await vscode.env.clipboard.readText(), /\.venv/);
      assert.doesNotMatch(await vscode.env.clipboard.readText(), /ignored-by-project/);
      await set('useDefaultIgnores', true);
    });
    await check('custom project ignores can reinclude a default exclusion and replace gitignore rules', async () => {
      await fs.writeFile(path.join(first, '.commander-v.ignore'), '!modern/.pnpm-store/\nmodern/main.py\n');
      await set('ignoreFile', '.commander-v.ignore');
      try {
        await command(vscode.Uri.file(modern));
        const text = await vscode.env.clipboard.readText();
        assert.match(text, /GENERATED BODY \.pnpm-store/);
        assert.match(text, /GENERATED BODY ignored-by-project/);
        assert.doesNotMatch(text, /MODERN SOURCE|GENERATED BODY \.venv/);
        await treeCommand(vscode.Uri.file(modern));
        const tree = await vscode.env.clipboard.readText();
        assert.match(tree, /\.pnpm-store\//);
        assert.doesNotMatch(tree, /main\.py|\.venv\//);
      } finally { await set('ignoreFile', '.gitignore'); }
    });
    await check('empty ignore path keeps defaults and disabling both layers includes generated files', async () => {
      await set('ignoreFile', '');
      try {
        await command(vscode.Uri.file(modern));
        let text = await vscode.env.clipboard.readText();
        assert.match(text, /GENERATED BODY ignored-by-project/);
        assert.doesNotMatch(text, /GENERATED BODY \.venv/);
        await set('useDefaultIgnores', false);
        await command(vscode.Uri.file(modern));
        text = await vscode.env.clipboard.readText();
        assert.match(text, /GENERATED BODY \.venv/);
        assert.match(text, /GENERATED BODY ignored-by-project/);
      } finally {
        await set('ignoreFile', '.gitignore');
        await set('useDefaultIgnores', true);
      }
    });
    await check('custom file labels and separators are exact and preserve dollar signs', async () => {
      const literal = vscode.Uri.file(path.join(first, '$&.js'));
      await fs.writeFile(literal.fsPath, 'literal filename');
      await set('includeProjectTree', false);
      await set('commentAtFileBegin', 'START $file $file');
      await set('commentAtFileEnd', 'END $file');
      await set('includeSeparator', true);
      await set('separatorCharacter', '*');
      await set('separatorLength', 5);
      try {
        await command(literal, alpha);
        assert.equal(await vscode.env.clipboard.readText(), 'START $&.js $&.js\nliteral filename\nEND $&.js\n*****\n\nSTART a.js a.js\nupdated alpha\nEND a.js');
      } finally {
        for (const key of ['includeProjectTree', 'commentAtFileBegin', 'commentAtFileEnd', 'includeSeparator', 'separatorCharacter', 'separatorLength']) await set(key, undefined);
      }
    });
    await check('workspace-folder settings follow the first selected folder', async () => {
      const scoped = vscode.workspace.getConfiguration('commanderV', alpha);
      await scoped.update('commentAtFileBegin', 'ALPHA $file', vscode.ConfigurationTarget.WorkspaceFolder);
      try {
        await command(alpha, beta);
        assert.match(await vscode.env.clipboard.readText(), /ALPHA alpha\/a\.js/);
        assert.match(await vscode.env.clipboard.readText(), /ALPHA beta\/b\.js/);
        await command(beta, alpha);
        assert.match(await vscode.env.clipboard.readText(), /Begin beta\/b\.js/);
        assert.doesNotMatch(await vscode.env.clipboard.readText(), /ALPHA/);
      } finally { await scoped.update('commentAtFileBegin', undefined, vscode.ConfigurationTarget.WorkspaceFolder); }
    });
    await check('trusted local configuration reloads and overrides editor settings', async () => {
      assert.ok(vscode.workspace.isTrusted, 'test runner uses a trusted disposable workspace');
      const localConfig = path.join(first, 'v.config.js');
      try {
        await fs.writeFile(localConfig, 'module.exports = { includeProjectTree: false, commentAtFileBegin: "LOCAL_ONE $file" };');
        await command(alpha);
        assert.ok((await vscode.env.clipboard.readText()).startsWith('LOCAL_ONE a.js\n'));
        await fs.writeFile(localConfig, 'module.exports = { includeProjectTree: false, commentAtFileBegin: "LOCAL_TWO $file" };');
        await command(alpha);
        assert.ok((await vscode.env.clipboard.readText()).startsWith('LOCAL_TWO a.js\n'));
      } finally { await fs.rm(localConfig, { force: true }); }
    });
    await check('invalid and broken local configurations preserve the clipboard and recover', async () => {
      const localConfig = path.join(first, 'v.config.js');
      await vscode.env.clipboard.writeText('preserve invalid config');
      try {
        for (const contents of ['module.exports = { separatorLength: 0 };', 'module.exports = {']) {
          await fs.writeFile(localConfig, contents);
          await command(alpha);
          assert.equal(await vscode.env.clipboard.readText(), 'preserve invalid config');
        }
      } finally { await fs.rm(localConfig, { force: true }); }
      await command(alpha);
      assert.match(await vscode.env.clipboard.readText(), /Begin a\.js/);
    });
    await check('Manage Extension opens details through a real supported command', async () => {
      const { showSuccess } = require(path.join(extension.extensionPath, 'src', 'notifications.js'));
      let opened = false;
      await showSuccess({
        window: { showInformationMessage: async () => 'Manage Extension' },
        commands: { executeCommand: async (...args) => {
          await vscode.commands.executeCommand(...args);
          opened = true;
        } },
      }, 1, 1, 0, false);
      assert.ok(opened, 'management command must exist and complete');
    });
    console.log(`${passed} integration checks passed.`);
  } finally {
    await vscode.env.clipboard.writeText(clipboard);
    for (const document of vscode.workspace.textDocuments.filter(item => item.isDirty)) {
      await vscode.window.showTextDocument(document);
      await vscode.commands.executeCommand('workbench.action.files.revert');
    }
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  }
}
module.exports = { run };
