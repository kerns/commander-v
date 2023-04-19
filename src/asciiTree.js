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
    ignoredPaths.push(...lines);
  } catch (err) {
    console.error('Error reading ignore file:', err);
  }

  return ignoredPaths;
}

// Check if the given path should be ignored based on the ignoredPaths list
function shouldBeIgnored(path, ignoredPaths) {
  return ignoredPaths.some(ignoredPath => {
    if (ignoredPath.startsWith('#') || ignoredPath === '') {
      return false;
    }

    // Convert the ignored path to a regex and test against the given path
    const regex = new RegExp(ignoredPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    return regex.test(path);
  });
}

// Check if the given path is included in the selected files list
function isPathInSelectedFiles(path, files) {
  return files.some(file => file.includes(path));
}

// Recursively generate a filtered tree based on ignored paths and the selected files list
function generateFilteredTree(treeObject, ignoredPaths, files, asciiTreePrune, ignoreFile) {
  const pathShouldBeIgnored = asciiTreePrune ? false : shouldBeIgnored(treeObject.path, ignoredPaths);

  // If the path should be ignored, return null
  if (pathShouldBeIgnored) {
    return null;
  }

  // If pruning the tree and the path is not in the selected files, return null
  if (asciiTreePrune && !isPathInSelectedFiles(treeObject.path, files)) {
    return null;
  }

  // Create a new node with the object's name as the label
  const node = { label: treeObject.name };

  // If the object has children, recursively generate nodes for each child
  if (treeObject.children && treeObject.children.length > 0) {
    node.nodes = treeObject.children
      .map(child => generateFilteredTree(child, ignoredPaths, files, asciiTreePrune, ignoreFile))
      .filter(child => child !== null);
  }

  return node;
}

// Generate an ASCII tree for the directory structure based on provided parameters
async function generateAsciiTree(rootPath, maxDepth, ignoreFile = '.gitignore', files = [], asciiTreePrune = false) {
  const ignoreFilePath = path.join(rootPath, ignoreFile);
  const ignoredPaths = await getIgnoredPaths(ignoreFilePath);

  // Set the directory tree options
  const options = {
    depth: maxDepth,
  };

  // Generate the directory tree and filter it based on ignored paths and selected files
  const treeObject = dirTree(rootPath, options);
  const filteredTree = generateFilteredTree(treeObject, ignoredPaths, files, asciiTreePrune, ignoreFile);
  const tree = archy(filteredTree);

  console.log('generateAsciiTree parameters:', { rootPath, maxDepth, ignoreFile });

  return tree;
}

// Export the generateAsciiTree function for use in other modules
module.exports = {
  generateAsciiTree,
};