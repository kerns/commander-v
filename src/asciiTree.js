// This file serves as a wrapper around the directory-tree and archy packages.
// It generates an ASCII tree of the directory structure of the given rootPath.
// It also filters out any paths that are listed in the ignore file path (i.e .gitignore).

const archy = require('archy');
const dirTree = require('directory-tree');
const fs = require('fs');
const path = require('path');

async function getIgnoredPaths(ignoreFilePath) {
  const ignoredPaths = [];

  try {
    const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
    const lines = content.split('\n').map(line => line.trim());
    ignoredPaths.push(...lines);
  } catch (err) {
    console.error('Error reading ignore file:', err);
  }

  return ignoredPaths;
}

function shouldBeIgnored(path, ignoredPaths) {
  return ignoredPaths.some(ignoredPath => {
    if (ignoredPath.startsWith('#') || ignoredPath === '') {
      return false;
    }

    const regex = new RegExp(ignoredPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    return regex.test(path);
  });
}

function isPathInSelectedFiles(path, files) {
  return files.some(file => file.includes(path));
}

function generateFilteredTree(treeObject, ignoredPaths, files, asciiTreePrune, ignoreFile) {
  const pathShouldBeIgnored = asciiTreePrune ? false : shouldBeIgnored(treeObject.path, ignoredPaths);

  if (pathShouldBeIgnored) {
    return null;
  }

  if (asciiTreePrune && !isPathInSelectedFiles(treeObject.path, files)) {
    return null;
  }

  const node = { label: treeObject.name };

  if (treeObject.children && treeObject.children.length > 0) {
    node.nodes = treeObject.children
      .map(child => generateFilteredTree(child, ignoredPaths, files, asciiTreePrune, ignoreFile))
      .filter(child => child !== null);
  }

  return node;
}

async function generateAsciiTree(rootPath, maxDepth, ignoreFile = '.gitignore', files = [], asciiTreePrune = false) {
  const ignoreFilePath = path.join(rootPath, ignoreFile);
  const ignoredPaths = await getIgnoredPaths(ignoreFilePath);

  const options = {
    depth: maxDepth,
  };

  const treeObject = dirTree(rootPath, options);
  const filteredTree = generateFilteredTree(treeObject, ignoredPaths, files, asciiTreePrune, ignoreFile);
  const tree = archy(filteredTree);

  console.log('generateAsciiTree parameters:', { rootPath, maxDepth, ignoreFile });

  return tree;
}


module.exports = {
  generateAsciiTree,
};
