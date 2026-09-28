# Commander V 3.0 release record

Published 28 September 2026 after the user's release command. **Commander V 3.0.0 is live on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=kerns.commander-v).** The Fall 2026 README, description, version, and existing reviews were verified on the public listing. A fresh installation from the Marketplace matched the tested VSIX, including its runtime files, README, dependencies, and manifest (excluding installation metadata).

## Release artifact

- Extension identity: `kerns.commander-v` (unchanged).
- Release name: **Commander V 3.0**; package version: **3.0.0**.
- Requires VS Code **1.105.0 or newer**.
- Local artifact: `builds/commander-v-3.0.0.vsix`, 24 files, approximately 2.16 MB compressed.
- SHA-256: `fb105bb55dd2b6a935bc8c8570cd6ad702f197464081fdcab5d2597fb9fe8360`.
- Prepared source branch: `codex/commander-v-3.0`, based on `1782f87`. The remote baseline was checked and matched before committing.

The release artifact includes the user's final README edits and a Windows path correction found during release CI. Windows workspace/editor drive-letter casing now preserves file labels and pruned tree entries. The development launcher also follows the official Windows CLI path in both traditional and versioned package layouts. Only `ignore` ships as a runtime dependency. Developer tools, tests, reports, scratch files, and test profiles are excluded from the VSIX.

## Acceptance results

| Check | Result |
| --- | --- |
| Lint and unit regressions | 61 tests passed |
| Packaged integration tests, VS Code 1.105.0 / Node 22.19.0 | 32 checks passed |
| Packaged integration tests, installed VS Code 1.135.0 / Node 24.18.1 | 32 checks passed |
| Packaged integration tests, VS Code 1.139.1 / Node 24.20.0 | 32 checks passed |
| Dependency audit | Zero known findings; no outdated direct dependencies |
| Package inspection | Correct identity/version; allowlist and README verified |
| README display in VS Code | Context-bundler introduction, working badges, Fall 2026 / 3.0 heading |
| Release CI: Windows, macOS, Linux × VS Code 1.105.0 and 1.139.1 | All six jobs passed, with 61 unit tests and 32 installed-VSIX integration checks per job |

The local editor runs were on macOS arm64. The final [cross-platform CI run](https://github.com/kerns/commander-v/actions/runs/36451003312) tested the corrected release source at `5fab268`. The expanded integration suite covers both copy commands, reuse, unsaved background documents, saved-file mode, multi-root and loose files, default/project/custom ignores and opt-outs, custom labels/separators, Markdown fences, ASCII/raw trees, per-folder settings, trusted local config reloads, invalid-config recovery, binary/empty/error clipboard preservation, and native delayed progress.

Hands-on tests used a separate VS Code profile and disposable project under `.dev/acceptance`, without running test copies against a live project:

- `Cmd+Shift+V`, `Cmd+K` then `Cmd+Shift+T`, and `Cmd+Shift+R` all invoked the expected commands.
- Explorer multi-file copying and folder tree-only context actions worked. The subtree action copied only the selected subtree; the shortcut copied the active workspace tree.
- Settings UI changes produced files-only copies and raw ASCII trees. Read From Editor copied an unsaved background buffer without saving it to disk.
- Tree-only copying left the previous file selection intact; reuse picked up subsequent file changes.
- Both native Cancel buttons stopped traversal of a 50,000-file fixture without changing a clipboard marker. A second command was held off during a copy, and reuse recovered afterward.
- A complete large copy contained all 50,000 files exactly once, with a pruned tree: **9,751,928 characters / 10,650,334 UTF-8 bytes**. First and last file markers and total counts were checked.
- Quick copies displayed the completion notification without lingering progress. Manage Extension opened the installed 3.0.0 details page. Optional sound was exercised, but audibility was not independently measured.
- Test windows were closed, the generated stress fixture removed, and the prior clipboard text restored. The user's existing untracked `src/My Project/` sample was left untouched and is not included in the release commit.

The 1,000-file I/O benchmark reported 3,000 reads / 241 ms for the original pipeline and 1,000 reads / 87 ms for the new pipeline; the pruned tree took 6 ms with zero filesystem reads. Timing is illustrative, not a universal speedup claim.

## Remaining validation limits

Windows/Linux keyboard shortcuts and audio and real SSH/container workspaces have not been exercised here. Command-level integration checks pass on all three desktop platforms. Large copies still retain content in memory, and synchronous formatting or a single provider read cannot be interrupted mid-operation. See the [assessment](REVIEW-2026-09-28.md) for follow-up work.

## Publication

- The tested release source was fast-forwarded to `main` before uploading, so the README's GitHub links resolve to the new source. The [main-branch CI run](https://github.com/kerns/commander-v/actions/runs/36451297785) also passed all six jobs.
- The user signed in to the existing `kerns` publisher account. The exact VSIX identified above was uploaded through Microsoft's publisher dashboard and passed Marketplace verification. No publishing token was stored in this repository.
- The public listing retains the same extension identity, install history, and reviews. Its overview now includes the context-bundler introduction, Fall 2026 / Commander V 3.0 update, latest README edits, and performance notes.
- A fresh profile installed `kerns.commander-v@3.0.0` directly from the Marketplace. All 21 packaged non-manifest files matched the VSIX byte for byte; the manifest matched after removing installation metadata. The minimum editor requirement is `^1.105.0`.
- The GitHub repository description was updated to match the extension's context-bundler description. Release notes use general maintenance wording and include the supported editor requirement.

For future releases, repeat the applicable checks, package once, and publish that exact tested artifact through the publisher dashboard or authenticated `vsce publish --packagePath <artifact>`.
