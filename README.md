# Commander V Lives and Works Inside Visual Studio Code. But also your Heart.

For the brave humans trying to fix your terrible code, and the increasingly powerful AIs racing (ahead) to fix theirs. Commander V is a powerful but discreet extension for Visual Studio Code, able to combine multiple files into a single, easy-to-read and _ready-to-paste_ blob of text with tremendous speed. Commander V also offers to generate an ASCII tree view of your project, which can be included in the final output.

Call on Commander V by selecting multiple files in the file explorer sidebar of Visual Studio Code. Then right-click on one of the selected files, choose **"Commander V"** from the context menu, and a concatenated payload will be delivered to your clipboard.

**Always choose Commander V.**

## Features

- Concatenates multiple selected files into a single, structured blob of text
- Optionally prepends an ASCII tree of your project's folder structure
- Gently wraps each file's content with custom comments indicating the beginning and end of each file
- Supports local configuration via an optional `.com.v.config.js` file

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`, or search for "Commander V" in the extensions tab
3. Restart Visual Studio Code

## Usage

1. In the Visual Studio Code explorer sidebar, select multiple files while holding down `Ctrl` (Windows) or `Cmd` (Mac).
2. Right-click on one of the selected files and choose "Commander V" from the context menu.
3. The concatenated content, along with the ASCII tree (if enabled), will be copied to your clipboard.

## Configuration

Global settings can be configured in Visual Studio Code's settings, under the "Commander V" portion of the horrible mess that is the settings UI of VSC. Should you need them, local settings can be configured to override global ones on a per-project basis by way of a `.com.v.config.js` you can create and place at the root of your project.

The following settings can be configured:

- `asciiTreePrepend`: Whether to prepend an ASCII tree of the project's folder structure
- `asciiTreeMaxDepth`: Maximum depth for the ASCII tree
- `ignoreFile`: File to use for ignoring folders in the ASCII tree (defaults to `.gitignore`)
- `prependComment`: Comment to prepend before each file's content
- `appendComment`: Comment to append after each file's content

A sample `.com.v.config.js` file might look as follows:

```javascript
module.exports = {
  asciiTreePrepend: true,
  asciiTreeMaxDepth: 3,
  ignoreFile: ".some-custom-ignore-file",
  prependComment: "/* Begin custom $path */",
  appendComment: "/* End custom $path */",
};
```

Changes to your `.com.v.config.js` configuration file require a restart.

## Feedback

The Commander is listening. Bugs, ideas, feedback and pull requests welcome at [GitHub issue tracker](https://github.com/kerns/commander-v/issues).
