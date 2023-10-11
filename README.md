# Commander V for Visual Studio Code

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

_To the wonderful humans helping to fix our terrible code,  
and for the AIs racing ahead to fix theirs...  
To each and every one of us, godspeed. **I am coming home**._

<cite>— Final words of Commander V</cite>

## Prologue

**Commander V was a gifted man who gave his life to take the form of an extension for Microsoft's Visual Studio Code.** He did so in return for the power to combine multiple files with great speed into a singular, consumable, shareable monolith of information.

Commander V also got power to generate an ASCII tree view of your project's directory structure, and include it at the beginning of the output. This gives needed context to the files you gather, and improves the chances that the problems with your code can be better understood in context – by machines, yes – but also by humans.

## Commander V Enters the Chat

Summon Commander V by selecting one or more files from the file explorer sidebar in Visual Studio Code. Then right-click on the selected file(s), choose **"Commander V"** (or Shift + Cmd + V) to have them added to your clipboard, formatted according to your detailed settings or our sensible defaults.

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

_Always choose Commander V._

## Features

- Concatenates multiple files into a single, structured monolith and pushes it to your clipboard
- Wraps file contents with custom comments to clearly demark beginning and end points of your file(s)
- Optionally prepends an ASCII tree of your project's folder structure, indicating the relative location of each file
- Orders concatenated files to match your project's folder structure or the order in which they were selected
- Supports local configuration via optional `v.config.js` file

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`, or search for "Commander V" in the extensions tab
3. Restart Visual Studio Code

## Usage

1. In the Visual Studio Code explorer sidebar, select multiple files while holding down `Ctrl` (Windows) or `Cmd` (Mac)
2. Right-click on one of the selected files and choose `Commander V` from the context menu
3. The concatenated content, optionally with an ASCII tree view of your project, is pushed to your clipboard

## Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override of your global settings can be configured on a per-project basis via a `v.config.js` placed on the root of your project. Changes require a restart of VS Code.

Configurable settings:

- **`includeProjectTree`**: Prepends your project's directory structure to the output in ASCII format _(boolean)_
- **`projectTreeDepth`**: Maximum depth for the project tree _(number)_
- **`pruneProjectTree`**: Limits the project tree to only show the files being concatenated _(boolean)_
- **`orderFilesBy`:** Sets the order in which files should appear – their order in the tree or the order in which they were selected _('treeOrder' or 'selectionOrder')_
- **`ignoreFile`**: File to use for ignoring files or folders from the project tree (defaults to `.gitignore`) _(string)_
- **`commentAtFileBegin`**: Comment to prepend before each file's content _(string)_
- **`commentAtFileEnd`**: Comment to append after each file's content _(string)_

A sample `v.config.js` might look as follows:

```javascript
module.exports = {
  pruneProjectTree: true,
  ignoreFile: ".vignore",
  orderFilesBy: "selectionOrder",
};
```

> _Changes to your **`v.config.js`** configuration or custom ignore file will require a restart of VS Code_.

## Feedback

Bugs, ideas, feedback and pull requests can go to [GitHub issue tracker](https://github.com/kerns/commander-v/issues). The Commander is listening.

## The _Rest_ of the Story (Epilogue)

A restless boy lost his way home after spending the better part of a year at sea, in close quarters with Commander V. He was enthralled and ultimately transformed by the Commander's passion for tidiness, coherence and context.

As their time together came to an end, and becoming a man, he turned toward home. He did it with the pain of owing a debt he could not repay. For more than, but also for the year of food, shelter, and companionship. But chiefly the gift of a new – or as he would one day come to describe it – _different_ way of thinking.

On the day they said goodbye to The Commander, but not before giving his solemn promise: to one day pay tribute to his mentor, to build a world that would know and remember his name.

Today the world not only _knows_ The Commander's name, the world touches it, _literally_, **every day**. Thanks to that boy. Who became a man. A man we called **STEVE JOBS**. His tribute? No less than the most indispensable and widely used combination of keyboard keys ever conceived by human brain cells. And featured on every Mac desktop and laptop since 1984: **Command + V**

Think about it. ✌️
