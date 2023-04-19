// COMMANDER V
// Description: Main extension file
// Author: David Kerns
// Date: 2023-04-18
// License: MIT

const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});
const { generateAsciiTree } = require('./src/asciiTree');

// Read the contents of the selected files
async function readFileContents(filePaths) {
  const fileContents = [];

  for (const filePath of filePaths) {
    const fileUri = vscode.Uri.file(filePath);
    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    fileContents.push(fileContent.toString());
  }

  return fileContents;
}

// Wrap file contents with comments including the file path
function wrapFileContents(files, contents, prependComment, appendComment) {
  return contents.map((content, index) => {
    const filePath = files[index].replace(vscode.workspace.workspaceFolders[0].uri.fsPath, '');
    return `${prependComment.replace('$path', filePath)}\n\n${content}\n${appendComment.replace('$path', filePath)}\n`;
  });
}

// Sort the files by their paths
function sortFilesByPath(files) {
  return files.sort((a, b) => {
    const pathA = a.fsPath;
    const pathB = b.fsPath;
    if (pathA < pathB) return -1;
    if (pathA > pathB) return 1;
    return 0;
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Activating Commander V...');

  let disposable = vscode.commands.registerCommand('extension.commanderV', async (uri, allUris) => {
    if (!uri || !allUris) {
      vscode.window.showInformationMessage('This command is designed to work with multiple file selections in the explorer sidebar.');
      return;
    }

    // Get the file paths of the selected files
    let files = allUris.map(fileUri => fileUri.fsPath);
    console.log('Selected files:', files);

    // Sort the files by path and reassign to the 'files' variable
    files = sortFilesByPath(files);
    console.log('Sorted files:', files);

    // Read the global configuration
    const globalConfig = vscode.workspace.getConfiguration('commanderV');

    // Check if local configuration file exists
    const localConfigPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.com-v.config.js');
    const localConfigUri = vscode.Uri.file(localConfigPath);
    let localConfigExists = false;
    let localConfig = {};

    try {
      await vscode.workspace.fs.stat(localConfigUri);
      localConfigExists = true;
      localConfig = require(localConfigPath);
    } catch (err) {
      console.log('Local configuration not found, using global configuration');
    }

    console.log('Global configuration:', globalConfig);
    console.log('Local configuration:', localConfig);

    // Merge global and local configurations
    const finalConfig = { ...globalConfig, ...localConfig };
    console.log('Final configuration:', finalConfig);

    // Get configurations for ASCII tree and comments
    const asciiTreePrepend = finalConfig.asciiTreePrepend;
    const asciiTreeMaxDepth = finalConfig.asciiTreeMaxDepth;
    const asciiTreePrune = finalConfig.asciiTreePrune;
    const ignoreFile = finalConfig.ignoreFile;
    const prependComment = finalConfig.prependComment || '/* --- Begin $path --- */';
    const appendComment = finalConfig.appendComment || '/* --- End $path --- */';

    let asciiTree = '';

    if (asciiTreePrepend) {
      // Generate ASCII tree if enabled
      asciiTree = await generateAsciiTree(vscode.workspace.workspaceFolders[0].uri.fsPath, asciiTreeMaxDepth, ignoreFile, files, asciiTreePrune);
      console.log('Generated ASCII tree:\n', asciiTree);
    }

    // Read the contents of the selected files
    const fileContents = await readFileContents(files);
    console.log('File contents:', fileContents);

    // Wrap file contents with comments
    const wrappedFileContents = wrapFileContents(files, fileContents, prependComment, appendComment);

    // Concatenate the ASCII tree (if enabled) and wrapped file contents
    const result = (asciiTree ? `${asciiTree}\n\n` : '') + wrappedFileContents.join('\n\n');

    // Copy the result to the clipboard
    vscode.env.clipboard.writeText(result);

    // Calculate the number of files and total characters
    const numberOfFiles = files.length;
    const totalChars = result.length;

    // Play a sound and show information message
    const playDoneSound = finalConfig.playDoneSound;
    if (playDoneSound) {
      player.play(path.join(__dirname, 'src', 'success.wav'), (err) => {
        if (err) {
          console.error('Error playing sound:', err);
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