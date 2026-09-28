const fs = require('node:fs/promises');
const path = require('node:path');
const { URL, pathToFileURL, fileURLToPath } = require('node:url');
function uriFromURL(url) {
  return { scheme: url.protocol.slice(0, -1), authority: url.host, path: decodeURIComponent(url.pathname), fsPath: url.protocol === 'file:' ? fileURLToPath(url) : decodeURIComponent(url.pathname), toString: () => url.href };
}
const Uri = {
  file: value => uriFromURL(pathToFileURL(value)),
  parse: value => uriFromURL(new URL(value)),
  joinPath: (base, ...parts) => {
    if (base.scheme === 'file') return Uri.file(path.join(base.fsPath, ...parts));
    const url = new URL(base.toString());
    url.pathname = path.posix.join(base.path, ...parts).split('/').map(encodeURIComponent).join('/');
    return uriFromURL(url);
  },
};
function makeApi(root) {
  const counts = { reads: 0, directories: 0 };
  const api = {
    Uri, FileType: { File: 1, Directory: 2, SymbolicLink: 64 }, counts,
    workspace: { textDocuments: [], getWorkspaceFolder: () => root ? { uri: Uri.file(root), name: path.basename(root) } : undefined, fs: {
      stat: async uri => { const stat = await fs.lstat(uri.fsPath); return { type: stat.isSymbolicLink() ? 64 : stat.isDirectory() ? 2 : 1 }; },
      readFile: async uri => { counts.reads++; return new Uint8Array(await fs.readFile(uri.fsPath)); },
      readDirectory: async uri => { counts.directories++; return (await fs.readdir(uri.fsPath, { withFileTypes: true })).map(entry => [entry.name, entry.isSymbolicLink() ? 64 : entry.isDirectory() ? 2 : 1]); },
    } },
  };
  return api;
}
module.exports = { Uri, makeApi };
