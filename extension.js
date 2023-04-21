// COMMANDER V
// Description: Main extension file
// Author: David Kerns
// Date: 2023-04-18
// License: MIT

// Package imports
const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});

// Local imports
const { generateProjectTree } = require('./src/projectTree');

/**
 * Read the contents of the selected files.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {Promise<string[]>} - An array of file contents as strings.
 */
async function readFileContents(filePaths) {
  const fileContents = [];

  for (const filePath of filePaths) {
    const fileUri = vscode.Uri.file(filePath);
    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    fileContents.push(fileContent.toString());
  }

  return fileContents;
}

/**
 * Wrap file contents with comments including the file path.
 * @param {string[]} files - An array of file paths.
 * @param {string[]} contents - An array of file contents as strings.
 * @param {string} commentAtFileBegin - The comment template to be placed at the beginning of each file.
 * @param {string} commentAtFileEnd - The comment template to be placed at the end of each file.
 * @returns {string[]} - An array of wrapped file contents.
 */
function wrapFileContents(files, contents, commentAtFileBegin, commentAtFileEnd) {
  return contents.map((content, index) => {
    const filePath = files[index].replace(vscode.workspace.workspaceFolders[0].uri.fsPath, '');
    return `${commentAtFileBegin.replace('$path', filePath)}\n\n${content}\n${commentAtFileEnd.replace('$path', filePath)}\n`;
  });
}

/**
 * Sort the files by their paths.
 * @param {vscode.Uri[]} files - An array of file URIs.
 * @returns {vscode.Uri[]} - An array of sorted file URIs.
 */

// Sorts the files by their paths
function orderFilesByPath(filePaths) {
  return filePaths.sort((a, b) => {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Register the 'extension.commanderV' command
  let disposable = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
    if (!uri || !allUris) {
      vscode.window.showInformationMessage('This command is designed to work with multiple file selections in the explorer sidebar.');
      return;
    }

    // Read the global configuration
    const globalConfig = vscode.workspace.getConfiguration('commanderV');

    // Check if local configuration file exists
    const localConfigPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'v.config.js');
    const localConfigUri = vscode.Uri.file(localConfigPath);
    let localConfigExists = false;
    let localConfig = {};

    try {
      await vscode.workspace.fs.stat(localConfigUri);
      localConfigExists = true;
      localConfig = require(localConfigPath);
    } catch (err) {
      // Local configuration not found, using global configuration
    }

    // Merge global and local configurations
    const finalConfig = { ...globalConfig, ...localConfig };

    // Get configurations for project tree and comments
    const includeProjectTree = finalConfig.includeProjectTree;
    const projectTreeDepth = finalConfig.projectTreeDepth;
    const pruneProjectTree = finalConfig.pruneProjectTree;
    const orderFilesBy = finalConfig.orderFilesBy;
    const ignoreFile = finalConfig.ignoreFile;
    const commentAtFileBegin = finalConfig.commentAtFileBegin || '/* --- Begin $path --- */';
    const commentAtFileEnd = finalConfig.commentAtFileEnd || '/* --- End $path --- */';


    // Get the file paths of the selected files
    let files = allUris.map(fileUri => fileUri.fsPath);
    // Sort the files based on the chosen order (treeOrder or selectionOrder)
    files = orderFilesBy === 'treeOrder' ? orderFilesByPath(files) : files;

    let projectTree = '';

    if (includeProjectTree) {
      // Generate project tree if enabled
      projectTree = await generateProjectTree(vscode.workspace.workspaceFolders[0].uri.fsPath, projectTreeDepth, ignoreFile, files, pruneProjectTree);
    }

    // Read the contents of the selected files
    const fileContents = await readFileContents(files);

    // Wrap file contents with comments
    const wrappedFileContents = wrapFileContents(files, fileContents, commentAtFileBegin, commentAtFileEnd);

    // Concatenate the project tree (if enabled) and wrap file contents with comments
    const result = (projectTree ? `${projectTree}\n\n` : '') + wrappedFileContents.join('\n\n');

    // Copy the result to the clipboard
    vscode.env.clipboard.writeText(result);

    // Calculate the number of files and total characters
    const numberOfFiles = files.length;
    const totalChars = result.length;

    // Play a sound and show information message
    const playSoundOnComplete = finalConfig.playSoundOnComplete;
    if (playSoundOnComplete) {
      player.play(path.join(__dirname, 'src', 'success.wav'), (err) => {
        if (err) {
          // Error playing sound
        }
      });
    }

    // Success message
    const manageExtensionLink = new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`);
    vscode.window.showInformationMessage(`✌️ Commander copied ${numberOfFiles} files (${totalChars} chars) to your clipboard`, manageExtensionLink);

  });

  context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};
