// extension.js
// Description: Main extension file for Commander V, handling file selections and output generation
// Author: David Kerns
// Last updated: May 2024
// License: MIT

// Module imports
const vscode = require('vscode');
const path = require('path');

// Import helper functions from local modules
const { generateProjectTree } = require('./src/projectTree');
const {
  combineConfigurations, identifySelectedFilesAndFolders, determineFilePathsOrder, fetchFileContents,
  calculateRelativeFilePaths, encapsulateContentWithComments, showSuccessMessage
} = require('./utils');

// Stores the file paths selected in previous executions for reuse
let previouslySelectedFilePaths = [];

/**
 * Initializes the extension by registering commands and setting up the context.
 * @param {vscode.ExtensionContext} context - Provides subscriptions to register commands.
 */
function activate(context) {
  const disposableNewSelection = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
    await processNewFileSelection(uri, allUris);
  });

  const disposableReuseSelection = vscode.commands.registerCommand('extension.commanderVReusePreviousSelection', async () => {
    await processPreviousFileSelection();
  });

  context.subscriptions.push(disposableNewSelection, disposableReuseSelection);
}

/**
 * Processes a new selection of files or folders, updating the global state and handling the files.
 * @param {vscode.Uri} uri - The URI of the selected file or folder.
 * @param {vscode.Uri[] | vscode.Uri} allUris - An array of URIs or a single URI representing the selected files and folders.
 */
async function processNewFileSelection(uri, allUris) {
  if (!uri) {
    uri = getUriOfActiveEditor();
    if (!uri) {
      vscode.window.showInformationMessage('🚫 No file or folder selected');
      return;
    }
    allUris = [uri];
  } else {
    allUris = convertToUriArray(allUris, uri);
  }

  const config = await fetchMergedConfiguration();
  const selectedItems = await identifySelectedFilesAndFolders(allUris);
  const selectedFilePaths = await determineFilePathsOrder(selectedItems, config.orderFilesBy);

  previouslySelectedFilePaths = selectedFilePaths;
  vscode.commands.executeCommand('setContext', 'commanderV.hasPreviousSelection', selectedFilePaths.length > 0);

  const selectedFileUris = selectedFilePaths.map(filePath => vscode.Uri.file(filePath));
  await processFilesAndGenerateOutput(selectedFileUris, config);
}

/**
 * Reuses the previously selected files and folders to perform the same operations as on new selection.
 */
async function processPreviousFileSelection() {
  if (previouslySelectedFilePaths.length === 0) {
    vscode.window.showInformationMessage('👀 No previously selected files found');
    return;
  }

  const existingFileUris = await getExistingFileUris(previouslySelectedFilePaths);
  if (existingFileUris.length === 0) {
    vscode.window.showInformationMessage('😕 All previously selected files have been deleted or moved');
    return;
  }

  const config = await fetchMergedConfiguration();
  await processFilesAndGenerateOutput(existingFileUris, config);
}

/**
 * Fetches and merges global and local configurations.
 * @returns {Promise<Object>} The merged configuration object.
 */
async function fetchMergedConfiguration() {
  const globalConfig = vscode.workspace.getConfiguration('commanderV');
  const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const localConfigPath = path.join(workspaceRootPath, 'v.config.js');

  let localConfig = {};
  try {
    localConfig = require(localConfigPath);
  } catch (err) {
    // Log a warning if the local configuration is not found
    console.warn('Local configuration not found:', err);
  }

  return combineConfigurations(globalConfig, localConfig);
}

/**
 * Processes the selection by generating project outputs and handling file contents.
 * @param {vscode.Uri[]} fileUris - URIs of files to process.
 * @param {Object} config - Configuration settings.
 */
async function processFilesAndGenerateOutput(fileUris, config) {
  try {
    const filePaths = fileUris.map(uri => uri.fsPath);
    const projectTree = config.includeProjectTree ? await createProjectTreeFromFilePaths(filePaths, config) : '';
    const fileContents = await fetchFileContents(fileUris, config.readFromEditor);
    const relativeFilePaths = calculateRelativeFilePaths(filePaths, vscode.workspace.workspaceFolders[0].uri.fsPath);
    const formattedContents = encapsulateContentWithComments(relativeFilePaths, fileContents, config.commentAtFileBegin, config.commentAtFileEnd);
    const result = combineProjectAndFileContents(projectTree, formattedContents, config);

    await vscode.env.clipboard.writeText(result);
    showSuccessMessage(filePaths.length, result.length, new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`), config.playSoundOnComplete);
  } catch (error) {
    vscode.window.showErrorMessage(`Error processing selection: ${error.message}`);
  }
}

/**
 * Retrieves the URI of the active text editor if available.
 * @returns {vscode.Uri | null} The URI of the active text editor, or null if none is active or the scheme is not 'file'.
 */
function getUriOfActiveEditor() {
  const activeEditor = vscode.window.activeTextEditor;
  return activeEditor && activeEditor.document.uri.scheme === 'file' ? activeEditor.document.uri : null;
}

/**
 * Ensures the provided parameter is treated as an array of URIs.
 * @param {vscode.Uri[] | vscode.Uri} allUris - An array of URIs or a single URI.
 * @param {vscode.Uri} uri - The single URI to convert to an array if allUris is not an array.
 * @returns {vscode.Uri[]} An array of URIs.
 */
function convertToUriArray(allUris, uri) {
  return Array.isArray(allUris) ? allUris : [uri];
}

/**
 * Filters the provided file paths and returns only those that still exist.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {Promise<vscode.Uri[]>} An array of URIs representing the existing file paths.
 */
async function getExistingFileUris(filePaths) {
  const checks = filePaths.map(async (filePath) => {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return uri;
    } catch (err) {
      return null;
    }
  });
  const results = await Promise.all(checks);
  return results.filter(uri => uri !== null);
}

/**
 * Generates a project tree from file paths based on the provided configuration.
 * @param {string[]} filePaths - An array of file paths.
 * @param {Object} config - Configuration settings.
 * @returns {Promise<string>} The generated project tree.
 */
async function createProjectTreeFromFilePaths(filePaths, config) {
  return generateProjectTree(
    vscode.workspace.workspaceFolders[0].uri.fsPath,
    config.projectTreeDepth,
    config.ignoreFile,
    filePaths,
    config.pruneProjectTree
  );
}

/**
 * Combines the project tree with formatted file contents into a single string.
 * @param {string} projectTree - The generated project tree.
 * @param {string[]} formattedFileContents - An array of formatted file contents.
 * @param {Object} config - Configuration settings.
 * @returns {string} The combined result.
 */
function combineProjectAndFileContents(projectTree, formattedFileContents, config) {
  const separator = config.includeSeparator ? `\n${config.separatorCharacter.repeat(config.separatorLength)}\n\n` : '\n\n';

  let result = [
    projectTree,
    ...formattedFileContents
  ].filter(Boolean).join(separator);

  if (config.wrapInCodeBlock) {
    result = `\`\`\`\n${result}\n\`\`\``;
  }

  return result;
}

function deactivate() { }

module.exports = {
  activate,
  deactivate
};
