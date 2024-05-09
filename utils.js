// utils.js
// Description: Utility functions for managing configurations, file selections, and content processing.
// Author: David Kerns
// License: MIT

const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});

/**
 * Display a message about unsupported binary files.
 */
function showBinaryFileError() {
  vscode.window.showInformationMessage('👨🏾‍✈️ Commander V does not join binary files');
}

/**
 * Display a success message and play a sound if sound is enabled.
 * @param {number} numberOfFiles - Number of files that were concatenated.
 * @param {number} totalChars - Total number of characters in the result.
 * @param {string} manageExtensionLink - Markdown string for managing the extension.
 * @param {boolean} playSound - Whether to play a success sound.
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
  const binaryFiles = [];

  for (const fileUri of allUris) {
    const filePath = fileUri.fsPath;
    const stat = await vscode.workspace.fs.stat(fileUri);

    if (stat.type === vscode.FileType.File) {
      const fileBytes = await vscode.workspace.fs.readFile(fileUri);
      if (!isBinaryFile(fileBytes)) {
        selectedItems.push({ type: 'file', path: filePath });
      } else {
        binaryFiles.push(filePath);
      }
    } else if (stat.type === vscode.FileType.Directory) {
      const nonBinaryFiles = await getNonBinaryFilesInFolder(filePath);

      if (nonBinaryFiles.length > 0) {
        selectedItems.push({ type: 'directory', path: filePath });
      } else {
        binaryFiles.push(filePath); // Entire directory is binary
      }
    }
  }

  // If all selected items are binary files, show an error message and exit
  if (binaryFiles.length > 0 && selectedItems.length == 0) {
    showBinaryFileError();
    return [];
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
  const selectedFilePaths = new Set();

  // Collect file paths from selected items (files and directories)
  for (const item of selectedItems) {
    if (item.type === 'file') {
      selectedFilePaths.add(item.path);
    } else if (item.type === 'directory') {
      const folderFiles = await getNonBinaryFilesInFolder(item.path);
      folderFiles.forEach(filePath => selectedFilePaths.add(filePath));
    }
  }

  // Convert the set to an array and order file paths based on the specified order (tree order or selection order)
  let orderedFilePaths = Array.from(selectedFilePaths);
  if (orderBy === 'treeOrder') {
    orderedFilePaths = orderFilesByPath(orderedFilePaths);
  }

  return orderedFilePaths;
}


/**
 * Read the contents of the selected files, either from the editor or from the file system.
 * @param {vscode.Uri[]} fileUris - An array of file URIs.
 * @param {boolean} readFromEditor - Whether to read file contents from the editor if the file is open.
 * @returns {Promise<string[]>} - An array of file contents as strings.
 */
async function readFileContents(fileUris, readFromEditor) {
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
  return filePaths.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Get relative file paths from the provided file paths and workspace root path.
 * @param {string[]} filePaths - An array of file paths.
 * @param {string} workspaceRootPath - The root path of the workspace.
 * @returns {string[]} - An array of relative file paths.
 */
function getRelativeFilePaths(filePaths, workspaceRootPath) {
  return filePaths.map(filePath => path.relative(workspaceRootPath, filePath));
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
    return `${commentAtContentBegin.replace('$file', label)}\n${content}\n${commentAtContentEnd.replace('$file', label)}`;
  });
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

module.exports = {
  mergeConfigurations,
  getSelectedItems,
  getSelectedFilePaths,
  readFileContents,
  isBinaryFile,
  orderFilesByPath,
  getRelativeFilePaths,
  wrapWithComments,
  getNonBinaryFilesInFolder,
  showBinaryFileError,
  showSuccessMessage,
};