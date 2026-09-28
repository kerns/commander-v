const path = require('node:path');
const { relativePath, checkCancellation } = require('./files');
const { generateProjectTree } = require('./projectTree');

function isFilesystemUri(uri) {
  return uri && (uri.scheme === 'file' || uri.scheme === 'vscode-remote');
}

// Context menus supply folders. The shortcut targets the active workspace,
// falling back to a workspace picker or a standalone file's parent directory.
async function resolveTreeRoots(api, uri, allUris) {
  let roots = Array.isArray(allUris) && allUris.length ? allUris : uri ? [uri] : [];
  if (!roots.length) {
    const active = api.window.activeTextEditor?.document.uri;
    const workspace = active && api.workspace.getWorkspaceFolder(active);
    const folders = api.workspace.workspaceFolders ?? [];
    if (workspace) roots = [workspace.uri];
    else if (folders.length === 1) roots = [folders[0].uri];
    else if (folders.length > 1) {
      const chosen = await api.window.showWorkspaceFolderPick({ placeHolder: 'Choose a workspace folder to copy its project tree' });
      // A dismissed picker is cancellation, not an empty-selection warning.
      if (!chosen) return null;
      roots = [chosen.uri];
    } else if (isFilesystemUri(active)) roots = [api.Uri.joinPath(active, '..')];
  }
  if (roots.some(root => !isFilesystemUri(root))) throw new Error('Project trees require local or remote filesystem folders.');
  const unique = [...new Map(roots.map(root => [root.toString(), root])).values()];
  // If both a folder and its child are selected, include the subtree once.
  return unique.filter((root, index) => !unique.some((other, otherIndex) => {
    if (index === otherIndex) return false;
    const relative = relativePath(other, root);
    return relative !== null && (relative !== '' || otherIndex < index);
  }));
}

async function collectProjectTrees(api, roots, config, token, report = () => {}) {
  const trees = [];
  for (const root of roots) {
    checkCancellation(token);
    const { type } = await api.workspace.fs.stat(root);
    if (!(type & api.FileType.Directory) || (type & api.FileType.SymbolicLink)) {
      throw new Error('Copy Project Tree requires folders, not files or symbolic links.');
    }
    const workspace = api.workspace.getWorkspaceFolder(root);
    const group = {
      root,
      name: workspace?.uri.toString() === root.toString() ? workspace.name : path.posix.basename(root.path) || root.path,
      ignoreRoot: workspace?.uri ?? root,
    };
    report({ message: `Reading ${group.name}` });
    // Tree-only is a directory listing, independent of content/pruning settings.
    trees.push(await generateProjectTree(api, group, { ...config, pruneProjectTree: false }, token));
  }
  return trees;
}

module.exports = { resolveTreeRoots, collectProjectTrees };
