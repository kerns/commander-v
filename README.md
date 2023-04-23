# Commander V for Visual Studio Code

![before-we-get-started](https://user-images.githubusercontent.com/20254/233304185-ceba2782-c8dc-4bc3-95de-18a9f7091f90.png)

_For the wonderful humans helping to fix our terrible code,  
and for the AIs racing ahead to fix theirs...  
For each and everyone of us, godspeed. **I am coming home**._

<cite>— Last words of Commander V</cite>

## The Story (Prologue)

**Commander V was a uniquely gifted human being who gave his life to take the form of an extension for Microsoft's Visual Studio Code.**

He did so in exchange for the power to combine multiple files with tremendous speed into a singular, consumable latticework of information in context. With output that is both easy to read _*and*_ ready to paste\_.

He is also blessed with the ability to generate an ASCII tree view of your project's directory structure, and may optionally include it in the final output. This gives full context to the files you deign worthy of collection, and improves the chances that the problems with your code can be understood.

Those lucky enough to have spent time in the human form of Commander V well remember his endless praise of tidy information structures. "ETR! RTP!", he was known to muse at inspection. Only later ..._too much_ later, did we learn that it meant "_Easy to Read and Ready to Paste!_". Which makes total sense, as this is _exactly_ what Commander V concerns himself with now.

## Commander V Enters the Chat

Summon Commander V by selecting multiple files in the file explorer sidebar of Visual Studio Code. Then right-click on one of the selected files, choose **"Commander V"** from the context menu, and a concatenated payload will be delivered to your clipboard nanoseconds later.

![sure-happy-to-help-demo](https://user-images.githubusercontent.com/20254/233346169-2d0d90c8-d948-415d-8041-f29d822ecb0f.gif)

_Always choose Commander V._

## Features

- Concatenates multiple files into a single, structured monolith of code and text, ready for pasting wherever needed
- Gently wraps each file's content with custom comments to indicate the file's beginning and end points
- Optionally prepends an ASCII tree of your project's folder structure, indicating the relative location of each file
- Thoughtfully orders concatenated files to match your project's folder structure or the order in which they were selected – your choice
- Supports a local configuration via an optional `v.config.js` file

## Installation

1. Open Visual Studio Code
2. Open the command palette (Mac: `Cmd+P` / Win: `Ctrl+P`) and type `ext install kerns.commander-v` and press `Enter`, or search for "Commander V" in the extensions tab
3. Restart Visual Studio Code

## Usage

1. In the Visual Studio Code explorer sidebar, select multiple files while holding down `Ctrl` (Windows) or `Cmd` (Mac).
2. Right-click on one of the selected files and choose "Commander V" from the context menu.
3. The concatenated content, along with the ASCII tree (if enabled), will be copied to your clipboard.

## Configuration

Global settings can be configured in your Visual Studio Code extension settings, under "Commander V". A local override of your global settings can be configured on a per-project basis via a`v.config.js` placed on the root of your project. Commander V will automatically pick that file up, hold it up in the light with his long, sea-worn fingers for inspection – and if he likes what he sees – apply it. Well. **After a restart**.

The following settings are configurable:

- **`includeProjectTree`**: Prepends your project's directory structure to the output in ASCII format _(boolean)_
- **`projectTreeDepth`**: Maximum depth for the project tree _(number)_
- **`pruneProjectTree`**: Limits the project tree to only show the files being concatenated _(boolean)_
- **`orderFilesBy`:** Sets the order in which files should appear – their natural order in the tree or the order in which they were selected _(treeOrder || selectionOrder)_
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

> _Note that changes to your **`v.config.js`** configuration or custom ignore file will require a restart_.

## Feedback

The Commander is listening. Bugs, ideas, feedback and pull requests welcome at [GitHub issue tracker](https://github.com/kerns/commander-v/issues).

## The Rest of the Story (Epilogue)

A restless boy who had lost his way once spent the better part of a very formative year at sea, in close quarters with Commander V. He was enthralled and ultimately transformed by the Commander's passion for tidiness, coherence and context.

As their time together came to an end, and the boy – who was becoming a man – turned toward home, he felt a pain in his heart and it burdened him. It was the feeling of owning a debt he felt he could never repay. Not for the year of food, shelter, and companionship – but for the most important thing he was ever given: the gift of a new – or as he would one day come to describe it – _different_ way of thinking.

As he readied himself to leave, he turned to The Commander and offered this solemn promise: to one day pay tribute to his new friend and chief mentor. And to do whatever he could to make a world that would know and forever remember his name.

Today much of the world not only _knows_ The Commander's name – much of the world touches it, _literally_, **every day**.

All of this is thanks to that boy who became a man, a man _we_ remember as **STEVE JOBS**. His tribute? No less than the most indispensable and widely used combination of keyboard keys ever conceived of, and featured on every Mac since 1984: **Command + V**

*Think about it.*✌️
