# Commander V for VS Code ✌️

[![VS Code Marketplace](https://img.shields.io/badge/VS_Code_Marketplace-Commander_V-007ACC)](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

## Overview

### The Context Bundler Loved by Humans and Agents Alike

**Commander V is a context bundler for VS Code. It gathers selected file contents and a map of their folder structure into one clipboard snapshot, ready to paste.**

Select the files and folders you want to share. Commander V combines their text with a project tree and labels each file with its path, so the contents keep their context. Copy the files and tree together, just the files, or just the tree.

Use it for code reviews, issue reports, documentation, handoffs, or a conversation with an AI coding assistant. One selection, one copy, wherever you need the context.

## 🍂🎃🛳️ Fall 2026 – Commander V 3.0, Smoother Sailing

The Commander is back from a little time in dry dock. This fall's tune-up is all about faster copies, smoother handling, and keeping your code-sharing routine shipshape.

### Fresh on Deck

- **Better trees. 🌳** Cleaner formatting and a new tree-only command, available by shortcut or folder menu.
- **Faster copies.** Folder copies use two-thirds fewer file reads. Pruned trees no longer scan the workspace.
- **Captures unsaved edits** in background tabs.
- **Less noise.** Quick copies skip the progress popup. Longer copies still offer Cancel.
- **Reduced cargo.** Updated defaults skip common web and Python dependencies, build output, and caches.
- **Freshly provisioned.** Updated dependencies, general security maintenance, cleaner code, and more tests.

Same familiar workflow: select your files and folders, summon the Commander, and paste. 🍁

## Details

**Commander V was a gifted and beloved Ship Captain who gave his life to take the form of an extension for Microsoft's Visual Studio Code** <sup>[1](#donotaskwhy)</sup>. He did this in exchange for the power of combining multiple files, together with a plain-text tree view of your project's directory structure, to your clipboard – giving greater context to the files and folders you share.

Watch...👇👀🍿

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

_<figcaption>A demonstration of Commander V in use. This clip loops every 30 seconds and makes more sense on subsequent views.</figcaption>_

## Installation

Requires **VS Code 1.105 or newer**.

1. Open Visual Studio Code
2. Search for "Commander V" in the extensions tab. **Or** open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`
3. Enjoy Commander V

## Usage

### Summon the Commander

1. Select one or more items (files and/or folders) from the file explorer sidebar in Visual Studio Code

2. Right-click on the items, and choose **"Commander V"** from the context menu

3. Your selected file contents and project tree are copied together, ready to paste where you need them

![Commander V's completion notification](https://github.com/kerns/commander-v/assets/20254/930f0c95-ba3f-4e7d-9c3d-e9afecb0a92f)

| Action | Mac | Windows / Linux |
| --- | --- | --- |
| Copy active file, with tree | `Cmd + Shift + V` | `Ctrl + Shift + V` |
| Copy project tree only | `Cmd + K`, then `Cmd + Shift + T` | `Ctrl + K`, then `Ctrl + Shift + T` |
| Reuse last file selection | `Cmd + Shift + R` | `Ctrl + Shift + R` |

For **file contents only**, turn off **Commander V: Include Project Tree** and use the regular Commander V command.

![my_project_demo](https://github.com/kerns/commander-v/assets/20254/3b6b84d4-4a7c-49d3-aca0-4e8dd1e1a947)

_<figcaption>This moves quickly but loops every 15 seconds. Watch it a few times to grasp the full banality of what you're seeing.</figcaption>_

### Project tree 🌳

Run **Commander V: Copy Project Tree** from the command palette or use its shortcut to copy the active file's workspace tree. Right-click a folder in the Explorer to copy that folder's tree instead. You can select several folders; overlapping subfolders appear only once.

The command uses **Project Tree Depth** and **Ignore File**, includes names of binary files and empty folders, and copies no file contents. It works independently of **Include Project Tree** and **Prune Project Tree**, and leaves your last file selection ready to reuse. With no active editor, a single workspace folder is used automatically; multiple workspace folders offer a picker. A standalone file uses its parent folder.

### Readable trees

Tree branches use Unicode box-drawing characters by default. A proportional font or collapsed spaces can make them look misaligned, even when the copied text is intact. Commander V wraps trees in a Markdown code block without a language label, so compatible chats, issue trackers, and documentation tools preserve the spacing when they render it. Some apps may still display the backticks or show proportional text in their input box before you send or preview it.

Set **Commander V: Tree Format** to **ascii** for simple `|--` branches, or turn off **Wrap Tree In Code Block** if you want raw text. Both tree styles look best in a monospace font. If **Wrap In Code Block** is already enabled for the whole payload, Commander V uses one outer block.

### Sample output

The default combined copy includes the tree's code-block markers:

````
```
My Project/
├── components/
│   └── logo.tsx
├── style/
│   └── global.css
└── index.tsx
```

/* --- Begin components/logo.tsx --- */
import React from "react";

const Logo = ({ logoUrl }) => <img src={logoUrl} alt="" />;

export default Logo;

/* --- End components/logo.tsx --- */

/* --- Begin style/global.css --- */
h1 {
  font-size: 2em;
  font-weight: bold;
  color: hsl(200 100% 50%);
  margin-bottom: 1em;
}

/* --- End style/global.css --- */

/* --- Begin index.tsx --- */
import React from "react";

const HelloWorld = () => {
  return <h1>Hello World</h1>;
};

export default HelloWorld;

/* --- End index.tsx --- */
````

## Configuration

Settings can be configured in Visual Studio Code under "Commander V", globally or per workspace folder. A local override can be configured via a `v.config.js` in the workspace folder. This executable file is loaded only in trusted local filesystem workspaces, and is reloaded each time you run the command. In Restricted Mode, copying works using VS Code settings without executing `v.config.js`. For selections spanning several workspace folders, formatting settings come from the first selected item and file labels include the folder name.

### Leaving things ashore

Built-in exclusions apply to **file contents collected from folders and project trees**, even if your project has no `.gitignore`. They skip common generated files and directories before their contents are read:

| Workflow | Examples excluded by default |
| --- | --- |
| JavaScript package managers | `node_modules/`, `.pnpm-store/`, `.npm/`, Yarn cache and unplugged directories |
| Next.js, React/Vite, SvelteKit, and other web tools | `.next/`, `.svelte-kit/`, `.vite/`, `.nuxt/`, `.output/`, `.astro/`, `dist/`, `build/`, `out/` |
| Build and test tools | `.turbo/`, Nx caches, coverage output, Playwright reports, Storybook output |
| Python | `.venv/`, `venv/`, `__pycache__/`, Ruff/mypy/pytest caches, tox/nox environments, package metadata, notebook checkpoints |
| Local generated files | Repository internals, OS metadata, package-manager debug logs, TypeScript build info |

Lockfiles (`pnpm-lock.yaml`, `uv.lock`, and others), manifests, source, tests, migrations, notebooks, and editor configuration remain eligible. Yarn patches and configuration are kept; its cache is excluded. Local `.env` files are excluded, with exceptions for `.env.example`, `.env.sample`, and `.env.template`. See the [complete built-in rules](src/default.ignore).

The configured **Ignore File** defaults to the workspace folder's `.gitignore`. Its rules are applied after the built-in defaults, using gitignore-style patterns and `!` exceptions. These are path rules, not a Git tracked-file check. Only that configured file is loaded; nested `.gitignore` files and global Git ignores are not read. Outside a workspace, the copied folder supplies the ignore file.

**Selecting an individual file explicitly overrides exclusions.** This also applies to an active-file copy and reusing that selection. Folder selection still filters its contents. A pruned tree reflects the files actually copied; a full or tree-only tree follows the exclusion rules. Directly requesting an excluded folder's tree shows only its root.

For custom rules without changing Git behavior, set **Ignore File** to a file such as `.commander-v.ignore`. This replaces the `.gitignore` layer while keeping the built-in defaults. For example, to include a source directory named `build` and omit a local data directory:

```gitignore
!build/
local-data/
```

To include a file inside an excluded directory, first re-include its parent directory; `!dist/keep.js` alone cannot reopen an excluded `dist/`. Turn off **Use Default Ignores** to disable the built-in rules. Set **Ignore File** to an empty string as well to disable all exclusion rules. Custom cache locations and differently named virtual environments can be added to your ignore file.

Binary file contents and symbolic links are skipped when copying files. Trees list non-excluded binary filenames and links without following links. Content is decoded as UTF-8; UTF-16 files are not supported. Selections with no eligible text files leave the clipboard unchanged. Copies start immediately; cancellable progress appears after one second only if still needed. Completion audio is best effort (macOS `afplay`, Windows PowerShell, Linux `paplay`) and is disabled on remote hosts.

### Configurable settings (Optional):

- **`includeProjectTree`**: Includes a project tree with the copied files; turn off for files only _(boolean)_
- **`projectTreeDepth`**: Maximum depth for tree-only copies and unpruned combined trees _(integer)_
- **`treeFormat`**: Branch style: `unicode` (default) or `ascii` _(string)_
- **`wrapTreeInCodeBlock`**: Wraps the tree in a Markdown code block without a language label; enabled by default _(boolean)_
- **`pruneProjectTree`**: Limits the project tree to only show the files being concatenated _(boolean)_
- **`orderFilesBy`:** Sets the order in which files should appear – their order in the tree or the order in which they were selected _('treeOrder' or 'selectionOrder')_
- **`ignoreFile`**: Project rules for excluding folder contents and tree entries (defaults to `.gitignore`) _(string)_
- **`useDefaultIgnores`**: Apply the built-in web, Python, and general exclusion rules; enabled by default _(boolean)_
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

## Development and local test builds

Working on the ship? See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, testing, local builds, and installation. Development requires Node.js 22.13+ (Node.js 24 LTS recommended) and the `code` CLI on your PATH.

```sh
npm ci
npm run check          # lint and regression tests
npm run dev            # isolated VS Code window running this source checkout
npm run test:manual    # build and install a VSIX into an isolated test window
npm run install:local  # build and install in your normal VS Code profile
```

`npm run package` creates a local VSIX in `builds/`. After installing a new build, use **Developer: Reload Window** in VS Code to pick it up.

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
