const vscode = require('vscode');
const { collectFiles, groupFiles, checkCancellation } = require('./src/files');
const { fetchConfiguration } = require('./src/configuration');
const { generateProjectTree } = require('./src/projectTree');
const { formatOutput, formatTreeOutput } = require('./src/format');
const { resolveTreeRoots, collectProjectTrees } = require('./src/treeOnly');
const { showSuccess, showTreeSuccess } = require('./src/notifications');
const { withDelayedProgress } = require('./src/progress');

function activate(context) {
  let previous = [];
  let busy = false;

  async function execute(uri, allUris, reuse = false, treeOnly = false) {
    if (busy) {
      void vscode.window.showInformationMessage('Commander V is already processing a selection.');
      return;
    }
    busy = true;
    try {
      if (treeOnly) {
        const roots = await resolveTreeRoots(vscode, uri, allUris);
        if (roots === null) return;
        if (!roots.length) {
          void vscode.window.showInformationMessage('Open a workspace or select a folder to copy its project tree.');
          return;
        }
        const config = await fetchConfiguration(vscode, roots[0]);
        const copied = await withDelayedProgress(vscode, 'Commander V: Copy Project Tree', async (progress, token) => {
          const trees = await collectProjectTrees(vscode, roots, config, token, update => progress.report(update));
          checkCancellation(token);
          const result = formatTreeOutput(trees, config);
          checkCancellation(token);
          await vscode.env.clipboard.writeText(result);
          return { count: trees.length, chars: result.length };
        });
        showTreeSuccess(vscode, copied.count, copied.chars, config.playSoundOnComplete);
        return;
      }
      let uris;
      if (reuse) {
        uris = [];
        for (const saved of previous) {
          try { await vscode.workspace.fs.stat(saved); uris.push(saved); } catch (error) {
            if (error.code !== 'FileNotFound' && error.code !== 'ENOENT') throw error;
          }
        }
      } else {
        uris = Array.isArray(allUris) && allUris.length ? allUris : [uri ?? vscode.window.activeTextEditor?.document.uri].filter(Boolean);
      }
      if (!uris.length) {
        void vscode.window.showInformationMessage(reuse ? 'No previously selected files are available.' : 'No file or folder selected.');
        return;
      }
      if (uris.some(item => item.scheme !== 'file' && item.scheme !== 'vscode-remote')) {
        void vscode.window.showInformationMessage('Commander V requires saved files in a local or remote filesystem workspace.');
        return;
      }
      const config = await fetchConfiguration(vscode, uris[0]);
      const copied = await withDelayedProgress(vscode, 'Commander V', async (progress, token) => {
        const { files, skipped } = await collectFiles(vscode, uris, config, token, update => progress.report(update));
        if (!files.length) {
          return;
        }
        const groups = groupFiles(vscode, files);
        const trees = [];
        if (config.includeProjectTree) {
          for (const group of groups) trees.push(await generateProjectTree(vscode, group, config, token));
        }
        checkCancellation(token);
        const result = formatOutput(groups, files, trees, config);
        checkCancellation(token);
        await vscode.env.clipboard.writeText(result);
        previous = files.map(file => file.uri);
        await vscode.commands.executeCommand('setContext', 'commanderV.hasPreviousSelection', true);
        return { count: files.length, chars: result.length, skipped };
      });
      if (copied) showSuccess(vscode, copied.count, copied.chars, copied.skipped, config.playSoundOnComplete);
      else void vscode.window.showInformationMessage('No text files found after exclusions. The clipboard was left unchanged.');
    } catch (error) {
      if (error.name !== 'CancellationError') void vscode.window.showErrorMessage(`Commander V: ${error.message}`);
    } finally {
      busy = false;
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.commanderV', (uri, allUris) => execute(uri, allUris)),
    vscode.commands.registerCommand('extension.commanderVCopyProjectTree', (uri, allUris) => execute(uri, allUris, false, true)),
    vscode.commands.registerCommand('extension.commanderVReusePreviousSelection', () => execute(undefined, undefined, true))
  );
}

module.exports = { activate };
