// utils.js
// Description: Utility functions for file handling, configuration management, and user interaction in Commander V extension.
// Author: David Kerns
// License: MIT

const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});

/**
 * Displays an error message for unsupported binary files.
 */
function displayBinaryFileError() {
  vscode.window.showInformationMessage('🤚 Commander V does not join binary files');
}

/**
 * Displays a success message and optionally plays a sound.
 * @param {number} numberOfFiles - Number of files that were concatenated.
 * @param {number} totalChars - Total number of characters in the result.
 * @param {string} manageExtensionLink - Markdown string for managing the extension.
 * @param {boolean} playSound - Indicates whether a success sound should be played.
 */
function showSuccessMessage(numberOfFiles, totalChars, manageExtensionLink, playSound) {
  const fileOrFiles = numberOfFiles === 1 ? 'file' : 'files';
  vscode.window.showInformationMessage(`✌️ Commander copied ${numberOfFiles} ${fileOrFiles} (${totalChars} chars) to your clipboard`, manageExtensionLink);

  if (playSound) {
    player.play(path.join(__dirname, '..', 'src', 'success.wav'), (err) => {
      if (err) {
        console.error('Error playing sound:', err);
      }
    });
  }
}

/**
 * Combines global and local configuration settings into a single object.
 * @param {object} globalConfig - The global configuration object.
 * @param {object} localConfig - The local configuration object.
 * @returns {object} - The combined configuration object.
 */
function combineConfigurations(globalConfig, localConfig) {
  return { ...globalConfig, ...localConfig };
}

/**
 * Identifies and categorizes selected files and folders from provided URIs.
 * @param {vscode.Uri[]} allUris - An array of URIs representing selected files and folders.
 * @returns {Promise<{ type: string, path: string }[]>} - An array of selected items with their type and path.
 */
async function identifySelectedFilesAndFolders(allUris) {
  const selectedItems = [];
  const binaryFiles = [];

  for (const fileUri of allUris) {
    const filePath = fileUri.fsPath;
    const stat = await vscode.workspace.fs.stat(fileUri);

    if (stat.type === vscode.FileType.File) {
      const fileBytes = await vscode.workspace.fs.readFile(fileUri);
      if (!checkIfFileIsBinary(fileBytes)) {
        selectedItems.push({ type: 'file', path: filePath });
      } else {
        binaryFiles.push(filePath);
      }
    } else if (stat.type === vscode.FileType.Directory) {
      const nonBinaryFiles = await filterNonBinaryFilesInFolder(filePath);

      if (nonBinaryFiles.length > 0) {
        selectedItems.push({ type: 'directory', path: filePath });
      } else {
        binaryFiles.push(filePath); // Entire directory is binary
      }
    }
  }

  if (binaryFiles.length > 0 && selectedItems.length === 0) {
    displayBinaryFileError();
    return [];
  }

  return selectedItems;
}

/**
 * Determines the order of file paths based on configuration settings.
 * @param {{ type: string, path: string }[]} selectedItems - An array of selected items with their type and path.
 * @param {string} orderBy - The ordering criterion ('treeOrder' or 'selectionOrder').
 * @returns {Promise<string[]>} - An array of file paths in the specified order.
 */
async function determineFilePathsOrder(selectedItems, orderBy) {
  const selectedFilePaths = new Set();

  for (const item of selectedItems) {
    if (item.type === 'file') {
      selectedFilePaths.add(item.path);
    } else if (item.type === 'directory') {
      const folderFiles = await filterNonBinaryFilesInFolder(item.path);
      folderFiles.forEach(filePath => selectedFilePaths.add(filePath));
    }
  }

  let orderedFilePaths = Array.from(selectedFilePaths);
  if (orderBy === 'treeOrder') {
    orderedFilePaths = sortFilePathsAlphabetically(orderedFilePaths);
  }

  return orderedFilePaths;
}

/**
 * Fetches the contents of files, optionally from the editor if open.
 * @param {vscode.Uri[]} fileUris - An array of file URIs.
 * @param {boolean} readFromEditor - Indicates whether to read contents from the editor.
 * @returns {Promise<string[]>} - An array of file contents.
 */
async function fetchFileContents(fileUris, readFromEditor) {
  const fileContents = [];

  for (const fileUri of fileUris) {
    const filePath = fileUri.fsPath;

    if (readFromEditor) {
      const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === fileUri.toString());

      if (editor) {
        fileContents.push(editor.document.getText());
        continue;
      }
    }

    const fileBytes = await vscode.workspace.fs.readFile(fileUri);
    fileContents.push(fileBytes.toString());
  }

  return fileContents;
}

/**
 * Checks if a file is considered binary by examining its byte content.
 * @param {Uint8Array} fileBytes - The file content as a byte array.
 * @returns {boolean} - True if the file is considered binary, otherwise false.
 */
function checkIfFileIsBinary(fileBytes) {
  return fileBytes.some(byte => byte === 0);
}

/**
 * Sorts file paths alphabetically.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {string[]} - A sorted array of file paths.
 */
function sortFilePathsAlphabetically(filePaths) {
  return filePaths.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Calculates relative paths for files based on the workspace root.
 * @param {string[]} filePaths - An array of file paths.
 * @param {string} workspaceRootPath - The root path of the workspace.
 * @returns {string[]} - An array of relative file paths.
 */
function calculateRelativeFilePaths(filePaths, workspaceRootPath) {
  return filePaths.map(filePath => path.relative(workspaceRootPath, filePath));
}

/**
 * Encapsulates content within comments, using provided labels and templates.
 * @param {string[]} labels - An array of labels for each content block.
 * @param {string[]} contents - An array of content blocks.
 * @param {string} commentAtContentBegin - The comment template for the beginning of each content block.
 * @param {string} commentAtContentEnd - The comment template for the end of each content block.
 * @returns {string[]} - An array of content blocks wrapped with comments.
 */
function encapsulateContentWithComments(labels, contents, commentAtContentBegin, commentAtContentEnd) {
  return contents.map((content, index) => {
    const label = labels[index];
    return `${commentAtContentBegin.replace('$file', label)}\n${content}\n${commentAtContentEnd.replace('$file', label)}`;
  });
}

/**
 * Filters non-binary files from a folder, including its subdirectories.
 * @param {string} folderPath - The path to the folder.
 * @returns {Promise<string[]>} - An array of non-binary file paths.
 */
async function filterNonBinaryFilesInFolder(folderPath) {
  const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));
  const nonBinaryFiles = [];

  for (const [name, type] of files) {
    if (type === vscode.FileType.File) {
      const filePath = path.join(folderPath, name);
      const fileUri = vscode.Uri.file(filePath);
      const fileBytes = await vscode.workspace.fs.readFile(fileUri);

      if (!checkIfFileIsBinary(fileBytes)) {
        nonBinaryFiles.push(filePath);
      }
    } else if (type === vscode.FileType.Directory) {
      const subfolderPath = path.join(folderPath, name);
      const subfolderFiles = await filterNonBinaryFilesInFolder(subfolderPath);
      nonBinaryFiles.push(...subfolderFiles);
    }
  }

  return nonBinaryFiles;
}

module.exports = {
  combineConfigurations,
  identifySelectedFilesAndFolders,
  determineFilePathsOrder,
  fetchFileContents,
  checkIfFileIsBinary,
  sortFilePathsAlphabetically,
  calculateRelativeFilePaths,
  encapsulateContentWithComments,
  filterNonBinaryFilesInFolder,
  displayBinaryFileError,
  showSuccessMessage,
};
