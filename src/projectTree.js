// COMMANDER V
// Description: Creates a tree in ASCII format
// Author: David Kerns
// Date: 2023-04-18
// License: MIT

const archy = require('archy');
const dirTree = require('directory-tree');
const fs = require('fs');
const path = require('path');

/**
 * Get a list of ignored paths from the specified ignore file (e.g., .gitignore).
 * @param {string} ignoreFilePath - The path to the ignore file.
 * @returns {Promise<RegExp[]>} - An array of regular expressions representing ignored paths.
 */
async function getIgnoredPaths(ignoreFilePath) {
  const ignoredPaths = [];

  try {
    const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
    const lines = content.split('\n').map(line => line.trim());

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

/**
 * Check if the given path should be ignored based on the ignoredPaths list.
 * @param {string} path - The path to check.
 * @param {RegExp[]} ignoredPaths - An array of regular expressions representing ignored paths.
 * @returns {boolean} - True if the path should be ignored, false otherwise.
 */
function shouldBeIgnored(path, ignoredPaths) {
  return ignoredPaths.some(ignoredPathRegex => ignoredPathRegex.test(path));
}

/**
 * Check if the given path is included in the selected files list.
 * @param {string} path - The path to check.
 * @param {string[]} files - An array of selected file paths.
 * @returns {boolean} - True if the path is included in the selected files list, false otherwise.
 */
function isPathInSelectedFiles(path, files) {
  return files.some(file => file.includes(path));
}

/**
 * Check if the given path should be pruned based on pruneProjectTree and the selected files list.
 * @param {string} path - The path to check.
 * @param {boolean} pruneProjectTree - Whether to prune the project tree.
 * @param {string[]} files - An array of selected file paths.
 * @returns {boolean} - True if the path should be pruned, false otherwise.
 */
function shouldBePruned(path, pruneProjectTree, files) {
  return pruneProjectTree && !isPathInSelectedFiles(path, files);
}

/**
 * Recursively generate a filtered tree based on ignored paths and the selected files list.
 * @param {object} treeObject - The tree object to filter.
 * @param {RegExp[]} ignoredPaths - An array of regular expressions representing ignored paths.
 * @param {string[]} files - An array of selected file paths.
 * @param {boolean} pruneProjectTree - Whether to prune the project tree.
 * @param {string} ignoreFile - The path to the ignore file.
 * @returns {object|null} - The filtered tree object or null if the path should be ignored or pruned.
 */
function generateFilteredTree(treeObject, ignoredPaths, files, pruneProjectTree, ignoreFile) {
  const pathShouldBeIgnored = pruneProjectTree ? false : shouldBeIgnored(treeObject.path, ignoredPaths);
  const pathShouldBePruned = shouldBePruned(treeObject.path, pruneProjectTree, files);

  if (pathShouldBeIgnored || pathShouldBePruned) {
    return null;
  }

  const node = { label: treeObject.name };

  if (treeObject.children && treeObject.children.length > 0) {
    node.nodes = treeObject.children
      .map(child => generateFilteredTree(child, ignoredPaths, files, pruneProjectTree, ignoreFile))
      .filter(child => child !== null);
    // Append '/' to directory names
    node.label += '/';
  }

  return node;
}

/**
 * Calculate the maximum depth of the selected files relative to the root path.
 * @param {string} rootPath - The root path of the workspace.
 * @param {string[]} files - An array of selected file paths.
 * @returns {number} - The maximum depth of the selected files.
 */

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

/**
 * Determine the appropriate directory tree depth based on the provided parameters.
 * @param {boolean} pruneProjectTree - Whether to prune the project tree.
 * @param {number} projectTreeDepth - The maximum depth of the project tree.
 * @param {string} workspaceRootPath - The root path of the workspace.
 * @param {string[]} files - An array of selected file paths.
 * @returns {number} - The appropriate directory tree depth.
 */
function getDirectoryTreeDepth(pruneProjectTree, projectTreeDepth, workspaceRootPath, files) {
  return pruneProjectTree ? getMaxDepthOfSelectedFiles(workspaceRootPath, files) : projectTreeDepth;
}

/**
 * Generate an ASCII tree for the directory structure based on provided parameters.
 * @param {string} workspaceRootPath - The root path of the workspace.
 * @param {number} projectTreeDepth - The maximum depth of the project tree.
 * @param {string} [ignoreFilePath='.gitignore'] - The path to the ignore file.
 * @param {string[]} [files=[]] - An array of selected file paths.
 * @param {boolean} [pruneProjectTree=false] - Whether to prune the project tree.
 * @returns {Promise<string>} - The generated ASCII tree.
 */
async function generateProjectTree(workspaceRootPath, projectTreeDepth, ignoreFilePath = '.gitignore', files = [], pruneProjectTree = false) {
  const ignoredPaths = await getIgnoredPaths(path.join(workspaceRootPath, ignoreFilePath));
  const directoryTreeDepth = getDirectoryTreeDepth(pruneProjectTree, projectTreeDepth, workspaceRootPath, files);

  const options = {
    depth: directoryTreeDepth,
  };

  const treeObject = dirTree(workspaceRootPath, options);
  const filteredTree = generateFilteredTree(treeObject, ignoredPaths, files, pruneProjectTree, ignoreFilePath);
  const tree = archy(filteredTree);

  return tree;
}

module.exports = {
  generateProjectTree,
};