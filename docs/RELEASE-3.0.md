# Commander V 3.0 release readiness

Prepared 28 September 2026. **Publication is on hold until the user gives the release command.** No Marketplace publish, GitHub release, remote push, or release tag has been performed as part of this preparation.

## Release artifact

- Extension identity: `kerns.commander-v` (unchanged).
- Release name: **Commander V 3.0**; package version: **3.0.0**.
- Requires VS Code **1.105.0 or newer**.
- Local artifact: `builds/commander-v-3.0.0.vsix`, 24 files, approximately 2.16 MB compressed.
- SHA-256: `29ac58b7eb037fc56a04ee5e3aa110572703d251f87fc80bb045d64b272dee87`.
- Prepared source branch: `codex/commander-v-3.0`, based on `1782f87`. The remote baseline was checked and matched before committing.

The final artifact is installed in the normal local VS Code profile. Its code, manifest, README, and default ignore rules were checked against the packaged files. Only `ignore` ships as a runtime dependency. Developer tools, tests, reports, scratch files, and test profiles are excluded from the VSIX.

## Acceptance results

| Check | Result |
| --- | --- |
| Lint and unit regressions | 59 tests passed |
| Packaged integration tests, VS Code 1.105.0 / Node 22.19.0 | 32 checks passed |
| Packaged integration tests, installed VS Code 1.135.0 / Node 24.18.1 | 32 checks passed |
| Packaged integration tests, VS Code 1.139.1 / Node 24.20.0 | 32 checks passed |
| Dependency audit | Zero known findings; no outdated direct dependencies |
| Package inspection | Correct identity/version; allowlist and README verified |
| README display in VS Code | Context-bundler introduction, working badges, Fall 2026 / 3.0 heading |

All editor runs above were on macOS arm64. The expanded integration suite covers both copy commands, reuse, unsaved background documents, saved-file mode, multi-root and loose files, default/project/custom ignores and opt-outs, custom labels/separators, Markdown fences, ASCII/raw trees, per-folder settings, trusted local config reloads, invalid-config recovery, binary/empty/error clipboard preservation, and native delayed progress.

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

Windows/Linux keyboard shortcuts and audio, real SSH/container workspaces, and remote GitHub Actions have not been exercised here. The CI matrix is configured for all three desktop platforms and minimum/current-stable editors; it will run after a source push. Large copies still retain content in memory, and synchronous formatting or a single provider read cannot be interrupted mid-operation. See the [assessment](REVIEW-2026-09-28.md) for follow-up work.

GitHub authentication is available. `vsce ls-publishers` returned no stored publisher, and `VSCE_PAT` was not present in this shell. A valid publisher authentication path must therefore be established when publication is authorized; credentials must not be committed or added to this document.

## On the user's release command

1. Confirm that the prepared commit is still the desired release and that the remote baseline has not changed. Integrate the release branch into `main` and push the source through the repository's normal workflow. Wait for the configured cross-platform CI and address any failures before publishing. The VSIX's relative README links point at GitHub's default branch, so the source must be available there.
2. Check the artifact against the SHA-256 above with `shasum -a 256 builds/commander-v-3.0.0.vsix`. If the artifact or source changes, rebuild and rerun the affected validation; update this record with the newly tested checksum.
3. Authenticate the existing `kerns` publisher securely if needed, using the official `vsce` login or supported environment authentication. Do not create a different extension identity.
4. Publish the tested artifact, without rebuilding it during publication:

   ```sh
   npx --no-install vsce publish --packagePath builds/commander-v-3.0.0.vsix
   ```

5. Verify Marketplace version 3.0.0, the listing/README, minimum VS Code requirement, and an install/update from the Marketplace. Then create the `v3.0.0` tag and GitHub release from the published source commit as part of the authorized release workflow.

Until that command is given, retain the local commit and tested artifact without publishing or pushing release state.
