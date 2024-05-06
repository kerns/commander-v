# Commander V, Your AI Captain of Concatenation

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/kerns.commander-v?label=Visual%20Studio%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/kerns.commander-v?label=Installs)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/kerns.commander-v?label=Rating)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

_To the wonderful humans working to fix their terrible code,  
...to all of the magical AIs racing ahead to help us.  
To each and every one of us, GODSPEED. **I am coming home**!_

<cite>— The last words spoken by Commander V, before he transformed into a VS Code extension</cite>

## 🛳️🐬💦 SPRING 2024: Version 2.1 Hits the High Seas

### New in v.2.1

- **Folder Support** – You can now select a folder and Commander V will concatenate all non-binary files within that folder. Even select multiple folders, or mix and match selection of files and folders ..._all will be joined_
- **Improved KB Support** – Trigger Commander V on the active / focused tab with `Shift + Cmd + V`
- Improved ASCII tree formatting, custom file separators, and more

## Overview

**Commander V was a gifted man who gave his life to take the form of an extension for Microsoft's Visual Studio Code.** Don't ask why or how. He did so in return for the power to make your codebase more easily understood by both machines and humans alike.

He does this by combining multiple files to your clipboard, together with an ASCII tree view of your project's directory structure. This gives context to the files you share, and improves the chances that the problems with your code are solved in a way that makes sense for the system as a whole.

Watch...👇👀🍿

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

## Features

- Concatenates selected files into a single, structured monolith of information, pushed instantly to your clipboard
- Includes an ASCII tree of your project's structure, showing the relative location of files
- Wraps each file in a comment to clearly demark the beginning and end
- Orders concatenated files to match your project's folder structure or the order in which they were selected – your choice
- Supports local configuration via optional `v.config.js` file
- Includes configurable separator character and length between file contents
- Allows wrapping the output in a code block for better formatting in chat interfaces (Claude seems to prefer this)
- Provides customizable file comment structure to suit your preferences

## Commander V Enters the Chat

Summon Commander V by selecting one or more items (files _or_ folders) from the file explorer sidebar in Visual Studio Code. Then right-click on the items, and choose **"Commander V"** (Shift + Cmd + V) to have them added to your clipboard as a single blob, easily digestible blob.

_Always choose Commander V._

### Sample Output

```
My Project/
├── index.ts
└─┬ style/
  └── global.css

/* --- Begin /index.ts --- */

import React from "react";

const HelloWorld = () => {
  return <h1>Hello World</h1>;
};

export default HelloWorld;

/* --- End /index.ts --- */

----------------

/* --- Begin /style/global.css --- */

h1 {
  font-size: 3.145em;
  font-weight: bold;
  color: #333;
  margin-bottom: 1em;
}

/* --- End /style/global.css --- */


```

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter` – or just search for "Commander V" in the extensions tab
3. There is no step 3

## Usage

1. In the VSC explorer sidebar, hold down `Ctrl` (Windows) or `Cmd` (Mac) and select multiple files
2. Right-click on one of the selected files and choose `Commander V` from the context menu – or use the keyboard shortcut `Shift + Cmd + V` to trigger Commander V on the active tab
3. The content of the selected files with an ASCII tree view of your project is merged and pushed to your clipboard

## Optional Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override of your global settings can also be configured on a per-project basis via a `v.config.js` placed on the root of your project. Changes require a restart of VS Code.

### Configurable settings (Optional):

- **`includeProjectTree`**: Prepends directory structure of your project to the output in ASCII format _(boolean)_
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

### Sample `v.config.js` file

```javascript
module.exports = {
  pruneProjectTree: true,
  ignoreFile: ".some-custom-ignore-file",
  orderFilesBy: "selectionOrder",
  includeSeparator: false,
  separatorCharacter: "-",
  separatorLength: 16,
  wrapInCodeBlock: false,
};
```

## The _Rest_ of the Story (Epilogue)

A restless boy, determined to see the world, lost his way back home at what he thought was the end of his journey. It turned out to be the true beginning.

He went on to spend the better part of a decade at sea, in close quarters with Commander V. During this time, he was captivated and ultimately transformed by the Commander's unwavering passion for tidiness, coherence, and context.

As their time together drew to a close, the man who was once a boy turned toward home with the burden of a debt he knew he could never repay. Not for the years of food, shelter, and companionship – but for the gift of a new, or as he would one day come to describe it, different way of thinking.

On the day he bid farewell to The Commander, he made a solemn promise: to do everything in his power to create a world that would know and remember the Commander's name.

"Don't worry, Commander," he said. "I will make sure the world knows who you are."

Commander replied, "I am not worried, my friend. I have always known who I am. Besides. It is not about knowing. It's about _understanding_."

Today, not only does the world know The Commander's name, but much of the world also interacts with it, literally, every day. All thanks to a boy, who grew into a man – a man we remember as **STEVE JOBS**.

And his promised tribute to Commander V? None other than the most indispensable and widely used combination of keyboard keys ever conceived by human brain cells, featured on every Mac desktop and laptop since 1984: Command + V

_Think about it_. ✌️

## Feedback

Bugs, ideas, feedback and pull requests can go to [GitHub issue tracker](https://github.com/kerns/commander-v/issues). The Commander is listening. If you're using and enjoying Commander V, please consider leaving a review on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v). This motivates the Commander to stay sailing!
