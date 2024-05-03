# Commander V for Visual Studio Code

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

_To the wonderful humans helping to fix our terrible code,  
and for the AIs racing ahead to fix theirs...  
To each and every one of us, godspeed. **I am coming home**._

<cite>— Final words of Commander V</cite>

## 🐬💦 SPRING UPDATE: Version 2.0 of Commander V Sets Sail

New features include:

- **Folder Support** – You can now select a folder and Commander V will concatenate all non-binary files within that folder. Even select multiple folders, or mix and match selection of files and folders ..._all will be joined_
- **Improved KB Support** – Trigger Commander V on the active / focused tab with `Shift + Cmd + V`
- **Better Formatting** – Option to wrap output in a code block for better formatting in some chat interfaces
- Improved ASCII tree formatting, custom file separators, and more

## Prologue

**Commander V was a gifted man who gave his life to take the form of an extension for Microsoft's Visual Studio Code.** He did so in return for the power to combine the contents of multiple files to your clipboard, together with an optional ASCII tree view of your project's directory structure. This gives needed context to the files you gather, and improves the chances that the problems with your code can be better understood by both machines and humans alike.

## Commander V Enters the Chat

Summon Commander V by selecting one or more items (files or folders!) from the file explorer sidebar in Visual Studio Code. Then right-click on the items, choose **"Commander V"** (or Shift + Cmd + V) to have them added to your clipboard as a single blob, formatted according to your settings or our sensible defaults.

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

_Always choose Commander V._

## Features

- Concatenates multiple files into a single, structured monolith and pushes it to your clipboard
- Wraps each file in a comment to clearly demark beginning and end
- Optionally adds an ASCII tree of your project's structure, showing the relative location of files
- Orders concatenated files to match your project's folder structure or the order in which they were selected
- Supports local configuration via optional `v.config.js` file
- Includes configurable separator character and length between file contents
- Allows wrapping the output in a code block for better formatting in chat interfaces
- Provides customizable file comment structure to suit different preferences

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`, or search for "Commander V" in the extensions tab
3. Restart Visual Studio Code

## Usage

1. In the VSC explorer sidebar, hold down `Ctrl` (Windows) or `Cmd` (Mac) and select multiple files
2. Right-click on one of the selected files and choose `Commander V` from the context menu – or use the keyboard shortcut `Shift + Cmd + V` to trigger Commander V on the active tab
3. The content of the selected files with an ASCII tree view of your project is merged and added to your clipboard

## Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override of your global settings can be configured on a per-project basis via a `v.config.js` placed on the root of your project. Changes require a restart of VS Code.

Configurable settings:

- **`includeProjectTree`**: Prepends your project's directory structure to the output in ASCII format _(boolean)_
- **`projectTreeDepth`**: Maximum depth for the project tree _(number)_
- **`pruneProjectTree`**: Limits the project tree to only show the files being concatenated _(boolean)_
- **`orderFilesBy`:** Sets the order in which files should appear – their order in the tree or the order in which they were selected _('treeOrder' or 'selectionOrder')_
- **`ignoreFile`**: File to use for ignoring files or folders from the project tree (defaults to `.gitignore`) _(string)_
- **`commentAtFileBegin`**: Comment to prepend before each file's content _(string)_
- **`commentAtFileEnd`**: Comment to append after each file's content _(string)_
- **`includeSeparator`**: Includes a separator between file contents when concatenating _(boolean)_
- **`separatorCharacter`**: The character to use for the separator between file contents _(string)_
- **`separatorLength`**: The length of the separator between file contents _(number)_
- **`wrapInCodeBlock`**: Wraps the concatenated file contents in a code block (```) _(boolean)_

A sample `v.config.js` could look as follows:

```javascript
module.exports = {
  pruneProjectTree: true,
  ignoreFile: ".some-custom-ignore-file",
  orderFilesBy: "selectionOrder",
  includeSeparator: false,
  separatorCharacter: "*",
  separatorLength: 80,
  wrapInCodeBlock: false,
};
```

> _Changes to your **`v.config.js`** configuration or custom ignore file will require a restart of VS Code_.

## Feedback

Bugs, ideas, feedback and pull requests can go to [GitHub issue tracker](https://github.com/kerns/commander-v/issues). The Commander is listening.

## The _Rest_ of the Story (Epilogue)

A restless boy bent on seeing the world lost his way home after spending the better part of a year at sea, in close quarters with Commander V. He was enthralled and ultimately transformed by the Commander's inexorable passion for tidiness, coherence and context.

As their time together came to an end, and as the boy was becoming a man, he turned toward home with the pain of owing a debt he could never repay. Not for the year of food, shelter, and companionship – but for the gift of a new, or as he would one day come to describe it, _different_ way of thinking.

On the day he said goodbye to The Commander he gave him a solemn promise: to do what he could to build a world that would know and remember his name.

Today the world not only _knows_ The Commander's name, much of the world touches it, _literally_, **every day**. Thanks to that boy. Who became a man. A man we called **STEVE JOBS**. His tribute? No less than the most indispensable and widely used combination of keyboard keys ever conceived by human brain cells, and featured on every Mac desktop and laptop since 1984: **Command + V**

_Think about it_. ✌️
