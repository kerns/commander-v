const fs = require('node:fs');
const path = require('node:path');
const ignore = require('ignore');

// Read our small, packaged baseline once, never a user's directory synchronously.
const defaultPatterns = fs.readFileSync(path.join(__dirname, 'default.ignore'), 'utf8');

async function createIgnoreMatcher(api, root, config, readFile = uri => api.workspace.fs.readFile(uri)) {
  const matcher = ignore();
  if (config.useDefaultIgnores !== false) matcher.add(defaultPatterns);
  if (config.ignoreFile) {
    try {
      // Project rules come last, including ! negations to override defaults.
      const bytes = await readFile(api.Uri.joinPath(root, config.ignoreFile));
      matcher.add(Buffer.from(bytes).toString('utf8'));
    } catch (error) {
      if (error.code !== 'FileNotFound' && error.code !== 'ENOENT') throw error;
    }
  }
  return matcher;
}

module.exports = { createIgnoreMatcher };
