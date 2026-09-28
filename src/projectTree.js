const { compareNames, relativePath, checkCancellation } = require('./files');
const { createIgnoreMatcher } = require('./exclusions');

function node(name, directory = true) {
  return { name, directory, children: new Map() };
}

function selectedTree(group) {
  const root = node(group.name);
  for (const file of group.files) {
    const relative = relativePath(group.root, file.uri);
    if (!relative) continue;
    const segments = relative.split('/');
    let parent = root;
    segments.forEach((segment, index) => {
      if (!parent.children.has(segment)) parent.children.set(segment, node(segment, index < segments.length - 1));
      parent = parent.children.get(segment);
    });
  }
  return root;
}

function renderTree(root, format = 'unicode') {
  const glyphs = format === 'ascii'
    ? { branch: '|-- ', last: '`-- ', continuation: '|   ' }
    : { branch: '├── ', last: '└── ', continuation: '│   ' };
  const lines = [`${root.name}/`];
  function render(parent, prefix) {
    const children = [...parent.children.values()].sort((a, b) => Number(b.directory) - Number(a.directory) || compareNames(a.name, b.name));
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? glyphs.last : glyphs.branch}${child.name}${child.directory ? '/' : ''}`);
      render(child, `${prefix}${last ? '    ' : glyphs.continuation}`);
    });
  }
  render(root, '');
  return lines.join('\n') + '\n';
}

async function generateProjectTree(api, group, config, token) {
  // The default path performs no filesystem I/O, regardless of workspace size.
  if (config.pruneProjectTree) return renderTree(selectedTree(group), config.treeFormat);
  const ignoreRoot = group.ignoreRoot ?? group.root;
  const matcher = await createIgnoreMatcher(api, ignoreRoot, config);
  async function walk(uri, current, depth) {
    checkCancellation(token);
    if (depth >= config.projectTreeDepth) return;
    for (const [name, type] of await api.workspace.fs.readDirectory(uri)) {
      checkCancellation(token);
      const childUri = api.Uri.joinPath(uri, name);
      const directory = Boolean(type & api.FileType.Directory);
      const relative = relativePath(ignoreRoot, childUri);
      if (!relative || matcher.ignores(relative + (directory ? '/' : ''))) continue;
      const child = node(name, directory);
      current.children.set(name, child);
      if (directory && !(type & api.FileType.SymbolicLink)) await walk(childUri, child, depth + 1);
    }
  }
  const root = node(group.name);
  const relative = relativePath(ignoreRoot, group.root);
  // A directly requested ignored subtree still shows its root, but no contents.
  if (!relative || !matcher.ignores(relative + '/')) await walk(group.root, root, 0);
  return renderTree(root, config.treeFormat);
}

module.exports = { generateProjectTree, renderTree, selectedTree };
