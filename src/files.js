const path = require('node:path');
const { createIgnoreMatcher } = require('./exclusions');

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
function compareNames(a, b) {
  return collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

// Compare path segments so directory subtrees precede sibling files, as in the tree.
function comparePaths(a, b) {
  const left = a.split('/');
  const right = b.split('/');
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] === right[i]) continue;
    const leftDirectory = i < left.length - 1;
    const rightDirectory = i < right.length - 1;
    return Number(rightDirectory) - Number(leftDirectory) || compareNames(left[i], right[i]);
  }
  return left.length - right.length;
}

function checkCancellation(token) {
  if (token?.isCancellationRequested) {
    const error = new Error('Selection cancelled');
    error.name = 'CancellationError';
    throw error;
  }
}

function isBinary(bytes) {
  return bytes.includes(0);
}

// One traversal and one disk read per unique file. Keep providers' URIs intact.
async function collectFiles(api, uris, config, token, report = () => {}) {
  const visited = new Set();
  const explicit = new Set(uris.map(uri => uri.toString()));
  const policies = new Map();
  const ignoreContents = new Map();
  const files = [];
  let skipped = 0;
  const documents = new Map(config.readFromEditor
    ? api.workspace.textDocuments.map(document => [document.uri.toString(), document]) : []);

  async function visit(uri, knownType, policy) {
    checkCancellation(token);
    const key = uri.toString();
    if (visited.has(key)) return;
    const type = knownType ?? (await api.workspace.fs.stat(uri)).type;
    // Do not follow links: a selected folder must not escape its tree or loop.
    if (type & api.FileType.SymbolicLink) { skipped++; return; }
    if (type & api.FileType.Directory) {
      const root = api.workspace.getWorkspaceFolder(uri)?.uri ?? policy?.root ?? uri;
      if (!policies.has(root.toString())) {
        const matcher = await createIgnoreMatcher(api, root, config, async ignoreUri => {
          const bytes = await api.workspace.fs.readFile(ignoreUri);
          ignoreContents.set(ignoreUri.toString(), bytes);
          return bytes;
        });
        policies.set(root.toString(), { root, matcher });
      }
      policy = policies.get(root.toString());
    }
    // An explicitly selected file wins even if a parent traversal excluded it.
    const directFile = Boolean(type & api.FileType.File) && explicit.has(key);
    const relative = policy && relativePath(policy.root, uri);
    if (!directFile && relative && policy.matcher.ignores(relative + (type & api.FileType.Directory ? '/' : ''))) {
      skipped++;
      return;
    }
    visited.add(key);
    if (type & api.FileType.Directory) {
      const entries = await api.workspace.fs.readDirectory(uri);
      entries.sort(([a, at], [b, bt]) => Number(Boolean(bt & api.FileType.Directory)) - Number(Boolean(at & api.FileType.Directory)) || compareNames(a, b));
      for (const [name, childType] of entries) await visit(api.Uri.joinPath(uri, name), childType, policy);
    } else if (type & api.FileType.File) {
      const document = documents.get(key);
      const bytes = document ? Buffer.from(document.getText(), 'utf8')
        : ignoreContents.get(key) ?? await api.workspace.fs.readFile(uri);
      checkCancellation(token);
      if (isBinary(bytes)) { skipped++; return; }
      files.push({ uri, content: Buffer.from(bytes).toString('utf8') });
      if (files.length % 50 === 0) report({ message: `Read ${files.length} files` });
    } else { skipped++; }
  }
  for (const uri of uris) await visit(uri);
  if (config.orderFilesBy === 'treeOrder') files.sort((a, b) => comparePaths(a.uri.path, b.uri.path));
  return { files, skipped };
}

function relativePath(root, uri) {
  if (root.scheme !== uri.scheme || root.authority !== uri.authority) return null;
  // VS Code can return a lowercase drive letter for an editor document and an
  // uppercase one for its workspace. URI paths still use forward slashes.
  const windows = root.scheme === 'file' && (process.platform === 'win32' || /^\/[a-z]:\//i.test(root.path));
  const relative = windows
    ? path.win32.relative(root.path, uri.path).replaceAll('\\', '/')
    : path.posix.relative(root.path, uri.path);
  return relative === '..' || relative.startsWith('../') || path.posix.isAbsolute(relative) ||
    (windows && path.win32.isAbsolute(relative)) ? null : relative;
}

function groupFiles(api, files) {
  const groups = new Map();
  for (const file of files) {
    const workspace = api.workspace.getWorkspaceFolder(file.uri);
    const root = workspace?.uri ?? api.Uri.joinPath(file.uri, '..');
    const key = root.toString();
    if (!groups.has(key)) groups.set(key, { root, name: workspace?.name ?? path.posix.basename(root.path), files: [] });
    groups.get(key).files.push(file);
  }
  return [...groups.values()];
}

module.exports = { collectFiles, checkCancellation, isBinary, compareNames, comparePaths, relativePath, groupFiles };
