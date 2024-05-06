# Commander V, Your AI Captain of Concatenation

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/kerns.commander-v?label=Visual%20Studio%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/kerns.commander-v?label=Installs)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/kerns.commander-v?label=Rating)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

_To the wonderful humans working to fix their terrible code,  
...and to all of the magical AIs racing ahead to help us.  
To each and every one of us, GODSPEED. **I am coming home**!_

<cite>— The last words spoken by Commander V, before he transformed into a VS Code extension</cite>

## 🛳️🐬💦 SPRING 2024: Version 2.1 Hits the High Seas

### New in v.2.1

- **Folder Support** - Commander V now concatenates all non-binary files within any selected folder. Even select multiple folders, or mix and match a selection of files and folders. _All will be joined_.
- **Improved KB Support** – Trigger Commander V on the active tab with `Shift + Cmd + V`
- Improved **ASCII tree formatting**, **custom file separators**, and **more**

## Overview

**Commander V was a gifted and beloved ship captain who gave his life to take the form of an extension for Microsoft's Visual Studio Code** He did this for the power combine multiple files, together with an ASCII tree view of your project's directory structure to your clipboard – giving greater structure and context for the files and folders you share.

Sharing like this makes it easier to pair with an AI for help with your code, and to solve problems in a way that makes sense for the system as a whole – not just that one system or function.

It can also help overcome limits of memory and reduce the drifting toward hallucination that smaller, self-hosted models are known to experience when pressed at length.

Watch...👇👀🍿

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

## Features

- Concatenates files into a single, structured monolith of information and pushes it to your clipboard
- Adds an ASCII tree of your project's structure illustrating the relative location of files
- Sensible comment structure to clearly demark file beginning/end
- Optionally orders files after project's folder structure _or_ the selection order
- Supports local configuration via optional `v.config.js` file
- More. But not a lot more.

## Commander V Enters the Chat

Summon Commander V by selecting one or more items (files _or_ folders) from the file explorer sidebar in Visual Studio Code. Then right-click on the items, and choose **"Commander V"** (Shift + Cmd + V) to have them added to your clipboard as a highly digestible blob.

_Always choose Commander V._

![my_project_demo](https://github.com/kerns/commander-v/assets/20254/3b6b84d4-4a7c-49d3-aca0-4e8dd1e1a947)

### Sample Output

```
My Project/
├─┬ components/
│ └── logo.tsx
├── index.tsx
└─┬ style/
  └── global.css


/* --- Begin /components/logo.tsx --- */
import React from "react";

const Logo = ({ logoUrl }) => <img src={logoUrl} alt="" />;

export default Logo;

/* --- End /components/logo.tsx --- */


/* --- Begin /index.tsx --- */
import React from "react";

const HelloWorld = () => {
  return <h1>Hello World</h1>;
};

export default HelloWorld;

/* --- End /index.tsx --- */


/* --- Begin /style/global.css --- */
h1 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

/* --- End /style/global.css --- */


```

## Installation Steps

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter` – or just search for "Commander V" in the extensions tab
3. Enjoy Commander V

## Usage

1. In the VSC explorer sidebar, hold down `Ctrl` (Windows) or `Cmd` (Mac) and select multiple files
2. Right-click on one of the selected files and choose `Commander V` from the context menu – or use the keyboard shortcut `Shift + Cmd + V` to trigger Commander V on the active tab
3. The content of the selected files with an ASCII tree view of your project is merged and pushed to your clipboard

![commander_v_notification](https://github.com/kerns/commander-v/assets/20254/930f0c95-ba3f-4e7d-9c3d-e9afecb0a92f)

## Optional Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override can be configured on a per-project basis via a `v.config.js` placed on the root of your project. May require a restart of VS Code.

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

A restless boy, determined to see the world, lost his way back home at what he thought was the end of his journey. Fate had him spend a decade more at sea, in close quarters with a man he would come to know as Commander V.

During this time, the boy was captivated and ultimately transformed by the Commander's unwavering passion for tidiness, coherence, and context in all aspects of his care for the ship.

As their time together drew to a close, the boy felt heavy with the burden of a debt he knew he could never repay. Not for the years of food, shelter, and companionship – but for the gift of a new, or as he would one day come to describe it, _different_ way of thinking.

In the years that followed, he lost the burden of that debt. But never an opportunity to signal a public tribute to Commander V. Why else has every Apple since 1983 used "Command V" for paste? [<a name="myfootnote1">1</a>] If not because of a boy, who grew into a man.

A MAN WE KNEW AS **STEVE JOBS**!

## Feedback

The Commander is listening. Bugs, ideas, feedback and pull requests can go to [GitHub issue tracker](https://github.com/kerns/commander-v/issues). If you're using and enjoying Commander V, please consider leaving a review on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v). This motivates Commander to stay sailin'.

## Footnotes

<sup>[1](#myfootnote1)</sup> Besides Larry Tesler, Tim Mott, and Xerox PARC
