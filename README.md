# Commander V for VSC ✌️

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/kerns.commander-v?label=Visual%20Studio%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/kerns.commander-v?label=Installs)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/kerns.commander-v?label=Rating)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

![commander_v_notification](https://github.com/kerns/commander-v/assets/20254/930f0c95-ba3f-4e7d-9c3d-e9afecb0a92f)

## Overview

### For a Better AI Pair Programming Experience on the Open Seas of AI

**Better because you can instantly convert selected folders and files into a single, shareable, blueprint of your codebase.** This plaintext blueprint takes the form of an ASCII tree of your project's directory structure, joined with the full contents of the selected files. Comments are added between files to explain what and where everything is. (e.g. `/* --- Begin /path/to/file.js --- */`)

## 🛳️🐬💦 Spring 2024 – Version 2 Sets Sail

### New Features

- **Mix and match a selection of files and folders**. It works recursively. _All will be joined_.
- **Ability to read open, unsaved files** directly from the editor
- **Improved KB Support** allows `Cmd + Shift + V` to capture the active tab and `Cmd + Shift + R` to rerun Commander V on the previous selection
- **Improved ASCII tree formatting**, **custom file separators**, and **more**

## Details

**Commander V was a gifted and beloved Ship Captain who gave his life to take the form of an extension for Microsoft's Visual Studio Code** <sup>[1](#donotaskwhy)</sup>. He did this in exchange for the power of combining multiple files, together with an ASCII tree view of your project's directory structure, to your clipboard – giving greater context to the files and folders you share.

Sharing the updated state of your code in this way improves productivity when pair programming with an AI.

Because regularly reorienting your partner AI is more likely to solve problems in a way that makes sense for the system as a whole – not just for a single function or system in isolation.

It can also help overcome limits on memory, and can reduce the drift toward hallucination that smaller, self-hosted AI models are known to experience when pushed hard.

Watch...👇👀🍿

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

_<figcaption>A demonstration of Commander V in use, this clip loops every 30 seconds, and makes more sense on subsequent views.</figcaption>_

## Installation

1. Open Visual Studio Code
2. Search for "Commander V" in the extensions tab. **Or** open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`
3. Enjoy Commander V

## Usage

### Commander V Enters the Chat...

1. Summon Commander V by selecting one or more items (files and/or folders) from the file explorer sidebar in Visual Studio Code

2. Right-click on the items, and choose **"Commander V"** from the context menu

3. A blueprint of your project files is pushed to your clipboard

![my_project_demo](https://github.com/kerns/commander-v/assets/20254/3b6b84d4-4a7c-49d3-aca0-4e8dd1e1a947)

_<figcaption>This moves quickly but loops every 15 seconds. Watch it a few times to grasp the full banality of what you're seeing.</figcaption>_

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
  font-size: 2em;
  font-weight: bold;
  color: hsl(200 100% 50%);
  margin-bottom: 1em;
}

/* --- End /style/global.css --- */


```

## Optional Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override can be configured on a per-project basis via a `v.config.js` placed on the root of your project. May require a restart of VSC.

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
- **`playSoundOnComplete`**: Play a sound when operations are successful and output is delivered to your clipboard _(boolean)_
- **`readFromEditor`**: Read unsaved file contents directly from the editor if the file is open, otherwise read from the last saved file _(boolean)_

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

During this time, the boy was captivated and ultimately transformed by the Commander's unwavering passion for tidiness, coherence, and context in all aspects of his care for the ship that had become their home. Everything about life at sea with Commander V was a lesson in the importance of structure and order.

As their time together drew to a close, the boy felt heavy with the burden of a debt he knew he could never repay. Not for the years of food, shelter, and companionship – but for the gift of a new, or as he would one day come to describe it... a _different_ way of thinking.

In the years that followed he lost the burden of that debt. But never missed an opportunity to signal a public tribute to Commander V. Why, it's the reason every Apple Computer since 1983 has used "Command V" for paste <sup>[2](#justajoke)</sup>. Because of a boy who grew into a man. A man we knew as **_STEVE JOBS_**.

![steve_peace](https://github.com/kerns/commander-v/assets/20254/e86b32bd-1825-4949-8495-3ef7b7d24296)

## Feedback

The Commander is listening. Bugs, ideas, feedback and pull requests can go to [GitHub issue tracker](https://github.com/kerns/commander-v/issues). If you're using and enjoying Commander V, please consider leaving a review on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v). This motivates The Commander to stay sailin'.

## Footnotes

[<a name="donotaskwhy">1</a>] Unclear why or how

[<a name="justajoke">2</a>]</a> And/or Larry Tesler, Tim Mott, Xerox PARC
