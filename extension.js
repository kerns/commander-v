// COMMANDER V
// Description: Main extension file
// Author: David Kerns
// Date: 2023-04-18
// License: MIT

const vscode = require('vscode');
const path = require('path');
const player = require('play-sound')({});
const { generateAsciiTree } = require('./src/asciiTree');

async function readFileContents(filePaths) {
  const fileContents = [];

  for (const filePath of filePaths) {
    const fileUri = vscode.Uri.file(filePath);
    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    fileContents.push(fileContent.toString());
  }

  return fileContents;
}

function wrapFileContents(files, contents, prependComment, appendComment) {
  return contents.map((content, index) => {
    const filePath = files[index].replace(vscode.workspace.workspaceFolders[0].uri.fsPath, '');
    return `${prependComment.replace('$path', filePath)}\n\n${content}\n${appendComment.replace('$path', filePath)}\n`;
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

    const files = allUris.map(fileUri => fileUri.fsPath);
    console.log('Selected files:', files);

    // Read the configuration
    const globalConfig = vscode.workspace.getConfiguration('commanderV');

    // Check if local configuration file exists
    const localConfigPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.com.v.config.js');
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

    const asciiTreePrepend = finalConfig.asciiTreePrepend;
    const asciiTreeMaxDepth = finalConfig.asciiTreeMaxDepth;
    const ignoreFile = finalConfig.ignoreFile;
    const prependComment = finalConfig.prependComment || '/* --- Begin $path --- */';
    const appendComment = finalConfig.appendComment || '/* --- End $path --- */';

    let asciiTree = '';
    if (asciiTreePrepend) {
      //vscode.window.showInformationMessage('Analyzing directory tree...');
      asciiTree = await generateAsciiTree(vscode.workspace.workspaceFolders[0].uri.fsPath, asciiTreeMaxDepth, ignoreFile);
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
      player.play(path.join(__dirname, 'src', 'done.wav'), (err) => {
        if (err) {
          console.error('Error playing sound:', err);
        }
      });
    }

    // Success message
    const manageExtensionLink = new vscode.MarkdownString(`[Manage Extension](command:workbench.extensions.action.showExtension?%22kerns.commander-v%22)`);
    vscode.window.showInformationMessage(`Copied ${numberOfFiles} files with a total of ${totalChars} chars to the clipboard!`, manageExtensionLink);

  });

  context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};
