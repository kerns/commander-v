# Change Log - Commander V

Notable changes to the extension will be documented in this file. Reverse chron. order.

## 3.0.1 – September 28, 2026

- Removed the historical AI conversation illustration from the README while keeping the animated demo. No extension behavior changes.

## 3.0.0 – Fall 2026

- Quick copies show only their completion notification and optional sound. Cancellable progress appears only for copies still running after one second, and closes before the completion message is requested.
- Added shared built-in exclusions for folder contents and project trees, covering modern web dependencies/build output and Python environments/caches. Project ignore rules extend the defaults; explicitly selected files remain copyable. Added **Use Default Ignores** to opt out.
- Kept source, lockfiles, project configuration, and common environment templates eligible. Excluded directories are skipped before traversal, and ignore-file contents are reused when included in a copy.
- Added **Commander V: Copy Project Tree** to the command palette and Explorer folder context menu. Shortcut: `Cmd+K`, then `Cmd+Shift+T` on Mac; `Ctrl+K`, then `Ctrl+Shift+T` on Windows/Linux.
- Tree-only copies use depth and ignore settings, include binary filenames and empty folders, and leave the previous file selection unchanged. Listed file contents are not read.
- Trees now use conventional four-column branches and unlabeled Markdown code blocks by default for clearer pastes into chat apps. Added Unicode/ASCII branch styles and a raw-text option.
- File-only copying remains available through **Include Project Tree**. Whole-payload code-block wrapping avoids nested tree fences.
- Modern development tooling, reproducible npm lockfile, automated regression tests, CI, and local VSIX installation commands. Requires VS Code 1.105+.
- One traversal and one read per unique selected file; pruned trees are built from selected paths without scanning the workspace. Full trees use asynchronous filesystem access and real ignore patterns.
- Correct UTF-8 decoding, unsaved background editor content, directory-first file ordering, and multi-root/loose-file handling.
- Cancellable progress, complete command error handling, clipboard preservation on empty/failed operations, and previous-selection updates only after successful copies.
- Validated settings and explicit Workspace Trust handling for executable configuration. Local configuration reloads on each command.
- Removed the legacy tree and sound packages. Completion sound uses an optional system player, with the corrected bundled asset path.
- Safer Markdown fences and literal filename substitution. Symlinks are skipped to avoid recursive loops and traversal outside the selection.
- Linux completion audio now uses `paplay`; remote-host audio is disabled.

## 2.4.x – May 2024

Support for reading unsaved directly from the editor. Also a new "Rerun Commander V on Previous" feature. Refactored codebase.

## 2.3.x – May 2024

Recursive folder support, bug fixes, and design + performance improvements.

## 2.0.0 – 2.0.5 - April 29, 2024

Major release. Many updates and point releases fixing bloated bundle.

## 1.0.3 - April 23, 2023

- ADDED keyboard bindings for The Commander (Mac: `Cmd+Shift+V` / Win: `Ctrl+Shift+V`)

## 1.0.2

- CHANGED $path variable to use $file, which is more accurate
- IMPROVED with updates to README.md

## 1.0.0 - April 21, 2023 🍾

- ADDED sorting of files to match the project tree
- IMPROVED behavior of the project tree to override maxdepth if the selected file is deeper in the tree
- IMPROVED performance of the project tree
- REVISED function names and settings

## 0.5.4 - April 19, 2023

- IMPROVED with comments and cleanup
- IMPROVED with updates to README.md
- ADDED Commander backstory

## 0.5.3 - April 18, 2023

- IMPROVED pruning of the ASCII tree (asciiTreePrune) as a setting in the config file. If true, the tree will be limited to the files being concatenated. If false, the tree will be the full project tree. Defaults to true.
- ADDED ability to map hidden files that are otherwise in your **ignore** file when in prune mode.
- IMPROVED the README and other files you probably don't need to read.

Enjoy.

## 0.5.2

- ADDED pruning of the ASCII tree.

## 0.5.1 - April 17, 2023

- Bugfixes and improvements to the ASCII tree generation
- Better READMEs and added a CHANGELOG

## 0.5.0

- Initial release. I built this the shoulders of my previous effort, PastePilot X, which was quite far along. So we're sailing from here with Commander V. I hope you enjoy it.
