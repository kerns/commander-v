// extension.js
// Description: Main extension file
// Author: David Kerns
// Date: 2023-04-18
// Last updated: 2024-04-29
// License: MIT

// Package imports
const vscode = require('vscode');
const path = require('path');

// Local imports
const { generateProjectTree } = require('./src/projectTree');
const { mergeConfigurations, getSelectedItems, getSelectedFilePaths, readFileContents, getRelativeFilePaths, wrapWithComments, showSuccessMessage } = require('./utils');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
    // Check if no file or folder is selected
    if (!uri) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        uri = activeEditor.document.uri;
        allUris = [uri];
      } else {
        vscode.window.showInformationMessage('No file or folder selected.');
        return;
      }
    }

    // Ensure allUris is an array
    if (!Array.isArray(allUris)) {
      allUris = [uri];
    }

    // Get global and local configurations
    const globalConfig = vscode.workspace.getConfiguration('commanderV');
    const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const localConfigPath = path.join(workspaceRootPath, 'v.config.js');
    const localConfigUri = vscode.Uri.file(localConfigPath);
    let localConfig = {};

    // Check for local configuration file
    try {
      await vscode.workspace.fs.stat(localConfigUri);
      localConfig = require(localConfigPath);
    } catch (err) {
      // Local configuration not found, using global configuration
    }

    // Merge global and local configurations
    const finalConfig = mergeConfigurations(globalConfig, localConfig);

    // Get selected items and file paths
    const selectedItems = await getSelectedItems(allUris);
    const selectedFilePaths = await getSelectedFilePaths(selectedItems, finalConfig.orderFilesBy);

    // Generate project tree if enabled
    let projectTree = '';
    if (finalConfig.includeProjectTree) {
      projectTree = await generateProjectTree(
        workspaceRootPath,
        finalConfig.projectTreeDepth,
        finalConfig.ignoreFile,
        selectedFilePaths,
        finalConfig.pruneProjectTree
      );
    }

    // Read file contents and wrap with comments
    const fileContents = await readFileContents(selectedFilePaths);
    const relativeFilePaths = getRelativeFilePaths(selectedFilePaths, workspaceRootPath);
    const formattedFileContents = wrapWithComments(
      relativeFilePaths,
      fileContents,
      finalConfig.commentAtFileBegin,
      finalConfig.commentAtFileEnd
    );

    // Format the final result string
    const result = formatResult(
      projectTree,
      formattedFileContents,
      finalConfig.includeSeparator,
      finalConfig.separatorCharacter,
      finalConfig.separatorLength,
      finalConfig.wrapInCodeBlock
    );

    // Write the result to the clipboard
    await vscode.env.clipboard.writeText(result);

    // Get the number of files and total characters in the result
    const numberOfFiles = selectedFilePaths.length;
    const totalChars = result.length;

    // Create a link to manage the extension
    const manageExtensionLink = new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`);

    // Display success message and play sound if specified
    showSuccessMessage(numberOfFiles, totalChars, manageExtensionLink, finalConfig.playSoundOnComplete);
  });

  context.subscriptions.push(disposable);
}

/**
 * Format the result string based on the provided parameters.
 * @param {string} projectTree - The project tree string.
 * @param {string[]} formattedFileContents - An array of formatted file contents.
 * @param {boolean} includeSeparator - Whether to include a separator between file contents.
 * @param {string} separatorCharacter - The character to use for the separator.
 * @param {number} separatorLength - The length of the separator.
 * @param {boolean} wrapInCodeBlock - Whether to wrap the result in a code block.
 * @returns {string} - The formatted result string.
 */
function formatResult(projectTree, formattedFileContents, includeSeparator, separatorCharacter, separatorLength, wrapInCodeBlock) {
  let result = '';

  // Wrap the result in a code block if specified
  if (wrapInCodeBlock) {
    result += '```\n';
  }

  // Add the project tree to the result if it exists
  result += projectTree ? `${projectTree}\n\n` : '';

  // Join the formatted file contents with a separator if specified
  if (includeSeparator) {
    const separator = '\n' + separatorCharacter.repeat(separatorLength) + '\n\n';
    result += formattedFileContents.join(separator);
  } else {
    result += formattedFileContents.join('\n\n');
  }

  // Close the code block if it was opened
  if (wrapInCodeBlock) {
    result += '\n```';
  }

  return result;
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};