// COMMANDER V
// Description: /src/asctiiTree.js creates a tree in ASCII format
// Author: David Kerns
// Date: 2023-04-18
// License: MIT

// Import required packages
const archy = require('archy');
const dirTree = require('directory-tree');
const fs = require('fs');
const path = require('path');

// Get a list of ignored paths from the specified ignore file (e.g., .gitignore)
async function getIgnoredPaths(ignoreFilePath) {
  const ignoredPaths = [];

  try {
    // Read the ignore file and split it into lines
    const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
    const lines = content.split('\n').map(line => line.trim());

    // Precompile the regular expressions for each ignored path
    lines.forEach(line => {
      if (line.startsWith('#') || line === '') {
        return;
      }
      const regex = new RegExp(line.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      ignoredPaths.push(regex);
    });

  } catch (err) {
    console.error('Error reading ignore file:', err);
  }

  return ignoredPaths;
}

// Check if the given path should be ignored based on the ignoredPaths list
function shouldBeIgnored(path, ignoredPaths) {
  return ignoredPaths.some(ignoredPathRegex => ignoredPathRegex.test(path));
}

// Check if the given path is included in the selected files list
function isPathInSelectedFiles(path, files) {
  return files.some(file => file.includes(path));
}

// Check if the given path should be pruned based on pruneProjectTree and the selected files list
function shouldBePruned(path, pruneProjectTree, files) {
  return pruneProjectTree && !isPathInSelectedFiles(path, files);
}

// Recursively generate a filtered tree based on ignored paths and the selected files list
function generateFilteredTree(treeObject, ignoredPaths, files, pruneProjectTree, ignoreFile) {
  // Check if the path should be ignored or pruned
  const pathShouldBeIgnored = pruneProjectTree ? false : shouldBeIgnored(treeObject.path, ignoredPaths);
  const pathShouldBePruned = shouldBePruned(treeObject.path, pruneProjectTree, files);

  // If the path should be ignored or pruned, return null
  if (pathShouldBeIgnored || pathShouldBePruned) {
    return null;
  }

  // Create a new node with the object's name as the label
  const node = { label: treeObject.name };

  // If the object has children, recursively generate nodes for each child
  if (treeObject.children && treeObject.children.length > 0) {
    node.nodes = treeObject.children
      .map(child => generateFilteredTree(child, ignoredPaths, files, pruneProjectTree, ignoreFile))
      .filter(child => child !== null);
  }

  return node;
}

// Calculate the maximum depth of the selected files relative to the root path
function getMaxDepthOfSelectedFiles(rootPath, files) {
  const rootPathDepth = rootPath.split(path.sep).length;
  let maxDepth = 0;

  files.forEach(file => {
    const fileDepth = file.split(path.sep).length;
    const relativeDepth = fileDepth - rootPathDepth;

    if (relativeDepth > maxDepth) {
      maxDepth = relativeDepth;
    }
  });

  return maxDepth;
}

// Determine the appropriate directory tree depth based on the provided parameters
function getDirectoryTreeDepth(pruneProjectTree, projectTreeDepth, rootPath, files) {
  return pruneProjectTree ? getMaxDepthOfSelectedFiles(rootPath, files) : projectTreeDepth;
}

// Generate an ASCII tree for the directory structure based on provided parameters
async function generateProjectTree(rootPath, projectTreeDepth, ignoreFile = '.gitignore', files = [], pruneProjectTree = false) {
  const ignoreFilePath = path.join(rootPath, ignoreFile);
  const ignoredPaths = await getIgnoredPaths(ignoreFilePath);

  // Calculate the appropriate directory tree depth
  const directoryTreeDepth = getDirectoryTreeDepth(pruneProjectTree, projectTreeDepth, rootPath, files);

  // Set the directory tree options
  const options = {
    depth: directoryTreeDepth,
  };

  // Generate the directory tree and filter it based on ignored paths and selected files
  const treeObject = dirTree(rootPath, options);
  const filteredTree = generateFilteredTree(treeObject, ignoredPaths, files, pruneProjectTree, ignoreFile);
  const tree = archy(filteredTree);

  console.log('generateProjectTree parameters:', { rootPath, projectTreeDepth, ignoreFile });

  return tree;
}

// Export the generateProjectTree function for use in other modules
module.exports = {
  generateProjectTree,
};

