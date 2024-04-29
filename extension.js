// COMMANDER V
// Description: Main extension file
// Author: David Kerns
// Date: 2023-04-18
// Last updated: 2024-04-29
// License: MIT

// Package imports
const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});

// Local imports
const { generateProjectTree } = require('./src/projectTree');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
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

    if (!Array.isArray(allUris)) {
      allUris = [uri];
    }

    const globalConfig = vscode.workspace.getConfiguration('commanderV');
    const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const localConfigPath = path.join(workspaceRootPath, 'v.config.js');
    const localConfigUri = vscode.Uri.file(localConfigPath);
    let localConfig = {};

    try {
      await vscode.workspace.fs.stat(localConfigUri);
      localConfig = require(localConfigPath);
    } catch (err) {
      // Local configuration not found, using global configuration
    }

    const finalConfig = mergeConfigurations(globalConfig, localConfig);

    const selectedItems = await getSelectedItems(allUris);
    const selectedFilePaths = await getSelectedFilePaths(selectedItems, finalConfig.orderFilesBy);

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

    const fileContents = await readFileContents(selectedFilePaths);
    const relativeFilePaths = getRelativeFilePaths(selectedFilePaths, workspaceRootPath);
    const formattedFileContents = wrapWithComments(
      relativeFilePaths,
      fileContents,
      finalConfig.commentAtFileBegin,
      finalConfig.commentAtFileEnd
    );

    const result = formatResult(
      projectTree,
      formattedFileContents,
      finalConfig.includeSeparator,
      finalConfig.separatorCharacter,
      finalConfig.separatorLength,
      finalConfig.wrapInCodeBlock
    );

    await vscode.env.clipboard.writeText(result);

    const numberOfFiles = selectedFilePaths.length;
    const totalChars = result.length;

    if (finalConfig.playSoundOnComplete) {
      player.play(path.join(__dirname, 'src', 'success.wav'), (err) => {
        if (err) {
          console.error('Error playing sound:', err);
        }
      });
    }

    const manageExtensionLink = new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`);
    vscode.window.showInformationMessage(`✌️ Commander copied ${numberOfFiles} files (${totalChars} chars) to your clipboard`, manageExtensionLink);
  });

  context.subscriptions.push(disposable);
}

/**
 * Merge global and local configurations.
 * @param {object} globalConfig - The global configuration object.
 * @param {object} localConfig - The local configuration object.
 * @returns {object} - The merged configuration object.
 */
function mergeConfigurations(globalConfig, localConfig) {
  return { ...globalConfig, ...localConfig };
}

/**
 * Get selected items (files and folders) from the provided URIs.
 * @param {vscode.Uri[]} allUris - An array of URIs representing selected files and folders.
 * @returns {Promise<{ type: string, path: string }[]>} - An array of selected items with their type and path.
 */
async function getSelectedItems(allUris) {
  const selectedItems = [];

  for (const fileUri of allUris) {
    const filePath = fileUri.fsPath;
    const stat = await vscode.workspace.fs.stat(fileUri);

    if (stat.type === vscode.FileType.File) {
      const fileBytes = await vscode.workspace.fs.readFile(fileUri);
      if (!isBinaryFile(fileBytes)) {
        selectedItems.push({ type: 'file', path: filePath });
      } else if (allUris.length === 1) {
        vscode.window.showInformationMessage('👨🏾‍✈️ Commander V does not support binary files.');
        return []; // Exit early if a single binary file is selected
      }
    } else if (stat.type === vscode.FileType.Directory) {
      selectedItems.push({ type: 'directory', path: filePath });
    }
  }

  return selectedItems;
}


/**
 * Get selected file paths based on the provided selected items and order.
 * @param {{ type: string, path: string }[]} selectedItems - An array of selected items with their type and path.
 * @param {string} orderBy - The order in which to arrange the selected file paths ('treeOrder' or 'selectionOrder').
 * @returns {Promise<string[]>} - An array of selected file paths.
 */
async function getSelectedFilePaths(selectedItems, orderBy) {
  let selectedFilePaths = [];

  for (const item of selectedItems) {
    if (item.type === 'file') {
      selectedFilePaths.push(item.path);
    } else if (item.type === 'directory') {
      const folderFiles = await getNonBinaryFilesInFolder(item.path);
      selectedFilePaths.push(...folderFiles);
    }
  }

  if (orderBy === 'treeOrder') {
    selectedFilePaths = orderFilesByPath(selectedFilePaths);
  }

  return selectedFilePaths;
}

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
 * Get relative file paths from the provided file paths and workspace root path.
 * @param {string[]} filePaths - An array of file paths.
 * @param {string} workspaceRootPath - The root path of the workspace.
 * @returns {string[]} - An array of relative file paths.
 */
function getRelativeFilePaths(filePaths, workspaceRootPath) {
  return filePaths.map(filePath => filePath.replace(workspaceRootPath, ''));
}

/**
 * Wrap content with comments including the given label.
 * @param {string[]} labels - An array of labels to be used in comments.
 * @param {string[]} contents - An array of content as strings.
 * @param {string} commentAtContentBegin - The comment template to be placed at the beginning of each content.
 * @param {string} commentAtContentEnd - The comment template to be placed at the end of each content.
 * @returns {string[]} - An array of wrapped content.
 */
function wrapWithComments(labels, contents, commentAtContentBegin, commentAtContentEnd) {
  return contents.map((content, index) => {
    const label = labels[index];
    return `${commentAtContentBegin.replace('$file', label)}\n${content}\n${commentAtContentEnd.replace('$file', label)}\n`;
  });
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

  if (wrapInCodeBlock) {
    result += '```\n';
  }

  result += projectTree ? `${projectTree}\n\n` : '';

  if (includeSeparator) {
    const separator = '\n' + separatorCharacter.repeat(separatorLength) + '\n\n';
    result += formattedFileContents.join(separator);
  } else {
    result += formattedFileContents.join('\n\n');
  }

  if (wrapInCodeBlock) {
    result += '\n```';
  }

  return result;
}

/**
 * Get non-binary files in a folder recursively.
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<string[]>} - An array of non-binary file paths.
 */
async function getNonBinaryFilesInFolder(folderPath) {
  const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));
  const nonBinaryFiles = [];

  for (const [name, type] of files) {
    if (type === vscode.FileType.File) {
      const filePath = path.join(folderPath, name);
      const fileUri = vscode.Uri.file(filePath);
      const fileBytes = await vscode.workspace.fs.readFile(fileUri);

      if (!isBinaryFile(fileBytes)) {
        nonBinaryFiles.push(filePath);
      }
    } else if (type === vscode.FileType.Directory) {
      const subfolderPath = path.join(folderPath, name);
      const subfolderFiles = await getNonBinaryFilesInFolder(subfolderPath);
      nonBinaryFiles.push(...subfolderFiles);
    }
  }

  return nonBinaryFiles;
}

/**
 * Check if the file is binary based on its content.
 * @param {Uint8Array} fileBytes - The file content as a byte array.
 * @returns {boolean} - True if the file is considered binary, false otherwise.
 */
function isBinaryFile(fileBytes) {
  return fileBytes.some(byte => byte === 0);
}

/**
 * Sort the files by their paths.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {string[]} - An array of sorted file paths.
 */
function orderFilesByPath(filePaths) {
  return filePaths.sort((a, b) => {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};