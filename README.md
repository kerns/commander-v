# Commander V for Visual Studio Code

> _For the wonderful humans helping to fix our terrible code, and for the AIs racing ahead to fix theirs...\_godspeed to us all_. **I am coming home.**
>
> _— <cite>Commander V, Last words</cite>_

## The Story (Prologue)

**Commander V was a discreetly gifted human being who gave his life to take the form of an extension for Microsoft's Visual Studio Code.**

He did so in exchange for the power to combine multiple files with tremendous speed into a single, beautiful, symphony of code and text – output that is both *easy to read **and** easy to paste*.

He is also blessed with the ability to generate an ASCII tree view of your project, and may optionally include it in the final output. This gives additional context to the files you've collected, and improves the chances that the problems with your code can be understood.

Those lucky enough to have spent time with Commander V well remember his endless praise of tidy file structures everywhere. "ETR! RTP!", he was known to muse at inspection. Later ...much, _too much_ later – we learned it meant "_Easy-to-Read and Ready-to-Paste!_". Which makes total sense, as this is _exactly_ what Commander V offers now.

## Calling Commander V

Call on Commander V by selecting multiple files in the file explorer sidebar of Visual Studio Code. Then right-click on one of the selected files, choose **"Commander V"** from the context menu, and a concatenated payload will be delivered to your clipboard nanoseconds later.

_Always choose Commander V._

## Features

- Concatenates multiple files into a single, structured monolith of code and text, ready for pasting wherever needed
- Gently wraps each file's content with custom comments to indicate the file's beginning and end points
- Optionally prepends an ASCII tree of your project's folder structure, indicating the relative location of each file
- Thoughtfully orders concatenated files to match your project's folder structure
- Supports a local configuration via an optional `.com-v.config.js` file

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`, or search for "Commander V" in the extensions tab
3. Restart Visual Studio Code

## Usage

1. In the Visual Studio Code explorer sidebar, select multiple files while holding down `Ctrl` (Windows) or `Cmd` (Mac).
2. Right-click on one of the selected files and choose "Commander V" from the context menu.
3. The concatenated content, along with the ASCII tree (if enabled), will be copied to your clipboard.

## Configuration

Global settings can be configured in Visual Studio Code settings, under the "Commander V" portion of the mess that is "Settings" in VSC. Should you need them, local overrides of global settings can be configured on a per-project basis by way of a `.com-v.config.js`. Create it and place at the root of your project if you need it. Commander V will automatically pick it up, turn it over in his strong, sea-worn hands, and give it a good shake.

The following settings can be configured:

- `asciiTreePrepend`: Whether to prepend an ASCII tree of the project's folder structure
- `asciiTreeMaxDepth`: Maximum depth for the ASCII tree
- `asciiTreePrune`: Limit tree to the files being concatenated
- `ignoreFile`: File to use for ignoring folders in the ASCII tree (defaults to `.gitignore`)
- `prependComment`: Comment to prepend before each file's content
- `appendComment`: Comment to append after each file's content

A sample `.com-v.config.js` file might look as follows:

```javascript
module.exports = {
  asciiTreePrepend: true,
  asciiTreeMaxDepth: 3,
  asciiTreePrune: true,
  ignoreFile: ".com-v.ignore", // call this anything you want
  prependComment: "/* Begin custom $path */",
  appendComment: "/* End custom $path */",
};
```

By default, Commander V looks for a .gitignore file in the project root, and will use that file if it exists to exclude files or directories from the project tree. If you wish to use a different ignore file, you can specify it in the settings or in your local config file.

In this sample `.com-v.ignore` file, we allow our node_modules folder to be included in the tree, while ignoring the contents of the node_modules folder itself:

```text
node_modules/*
```

> _Note that changes to your `.com-v.config.js` configuration file and local ignore files require a restart_.

## Feedback

The Commander is listening. Bugs, ideas, feedback and pull requests welcome at [GitHub issue tracker](https://github.com/kerns/commander-v/issues).

## The Rest of the Story (Epilogue)

As the story goes, a restless young boy from America once spent the better part of a year at sea in close quarters with Commander V. He was enthralled and ultimately transformed by the Commander's passion for tidiness, coherence and context.

As their time together came to an end, and the boy – who was becoming a man – turned toward home, he felt the pain of unpayable debt to the Commander. Not for the year of food, shelter, and companionship – but for the most important thing he was ever given: the gift of a new, you could say, _different_ way of thinking.

As he readied himself to leave, he turned to The Commander and offered this solemn promise: to one day pay tribute to his new friend and mentor of mentors. And to do whatever he could to make a world that would know and remember his name.

Today much of the world not only _knows_ The Commander's name – much of the world touches it, _literally_, **every day**. All of this is thanks to that man.

That man's name? **STEVE JOBS**. His tribute? No less than the most indispensable and widely used combination of keyboard keys ever conceived of, and featured on every Mac since 1984: **Command + V**

_Think about it._
