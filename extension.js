// extension.js
// Description: Main extension file for Commander V, handling commands and their execution
// Author: David Kerns
// Date: 2023-04-18
// Last updated: May 2024
// License: MIT

// Module imports
const vscode = require('vscode');
const path = require('path');

// Import our helper functions from local modules
const { generateProjectTree } = require('./src/projectTree');
const {
  mergeConfigurations, getSelectedItems, getSelectedFilePaths, readFileContents,
  getRelativeFilePaths, wrapWithComments, showSuccessMessage
} = require('./utils');

// Stores the file paths selected in previous executions for reuse
let previouslySelectedFilePaths = [];

/**
 * Extension activation function, initializes the context and registers commands.
 * @param {vscode.ExtensionContext} context - Provides subscriptions to register commands.
 */
function activate(context) {
  // Register the primary command for new selections
  let disposableNewSelection = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
    await handleNewSelection(uri, allUris);
  });

  // Register the command for reusing previous selections
  let disposableReuseSelection = vscode.commands.registerCommand('extension.commanderVReusePreviousSelection', async () => {
    await handleReuseSelection();
  });

  // Add to context subscriptions for cleanup
  context.subscriptions.push(disposableNewSelection, disposableReuseSelection);
}

async function handleNewSelection(uri, allUris) {
  if (!uri) {
    uri = getActiveEditorUri();
    if (!uri) {
      vscode.window.showInformationMessage('No file or folder selected.');
      return;
    }
    allUris = [uri];
  } else {
    allUris = ensureArray(allUris, uri);
  }

  const config = await fetchConfiguration();
  const selectedItems = await getSelectedItems(allUris);
  const selectedFilePaths = await getSelectedFilePaths(selectedItems, config.orderFilesBy);

  // Update global state with current selection
  previouslySelectedFilePaths = selectedFilePaths;
  vscode.commands.executeCommand('setContext', 'commanderV.hasPreviousSelection', selectedFilePaths.length > 0);

  // Process selection
  const selectedFileUris = selectedFilePaths.map(filePath => vscode.Uri.file(filePath));
  await processSelection(selectedFileUris, config);
}

async function handleReuseSelection() {
  if (previouslySelectedFilePaths.length === 0) {
    vscode.window.showInformationMessage('No previously selected files found.');
    return;
  }

  const existingFileUris = await filterExistingFilePaths(previouslySelectedFilePaths);
  if (existingFileUris.length === 0) {
    vscode.window.showInformationMessage('All previously selected files have been deleted or moved.');
    return;
  }

  const config = await fetchConfiguration();
  await processSelection(existingFileUris, config);
}

/**
 * Fetches global and optional local configurations, merging them.
 * @returns {Promise<Object>} The merged configuration object.
 */
async function fetchConfiguration() {
  const globalConfig = vscode.workspace.getConfiguration('commanderV');
  const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const localConfigPath = path.join(workspaceRootPath, 'v.config.js');

  let localConfig = {};
  try {
    localConfig = require(localConfigPath);
  } catch (err) {
    // Handle error if local configuration is not found
  }

  return mergeConfigurations(globalConfig, localConfig);
}

/**
 * Processes file selections and generates the project output.
 * This function orchestrates reading file contents, generating project trees,
 * formatting the output, and handling the clipboard operations.
 * 
 * @param {vscode.Uri[]} fileUris - URIs of files to process.
 * @param {Object} config - Configuration settings.
 * @returns {Promise<void>} - A promise that resolves when the process is complete.
 */
async function processSelection(fileUris, config) {
  try {
    const filePaths = fileUris.map(uri => uri.fsPath);
    const projectTree = config.includeProjectTree ? await generateProjectTreeFromConfig(filePaths, config) : '';
    const fileContents = await readFileContents(fileUris, config.readFromEditor);
    const relativeFilePaths = getRelativeFilePaths(filePaths, vscode.workspace.workspaceFolders[0].uri.fsPath);
    const formattedContents = wrapWithComments(relativeFilePaths, fileContents, config.commentAtFileBegin, config.commentAtFileEnd);
    const result = formatResult(projectTree, formattedContents, config);

    await vscode.env.clipboard.writeText(result);
    showSuccessMessage(filePaths.length, result.length, new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`), config.playSoundOnComplete);
  } catch (error) {
    vscode.window.showErrorMessage(`Error processing selection: ${error.message}`);
  }
}

function getActiveEditorUri() {
  const activeEditor = vscode.window.activeTextEditor;
  return activeEditor && activeEditor.document.uri.scheme === 'file' ? activeEditor.document.uri : null;
}

function ensureArray(allUris, uri) {
  return Array.isArray(allUris) ? allUris : [uri];
}

async function filterExistingFilePaths(filePaths) {
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

async function generateProjectTreeFromConfig(filePaths, config) {
  return generateProjectTree(
    vscode.workspace.workspaceFolders[0].uri.fsPath,
    config.projectTreeDepth,
    config.ignoreFile,
    filePaths,
    config.pruneProjectTree
  );
}

function formatResult(projectTree, formattedFileContents, config) {
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