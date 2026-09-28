# Developing Commander V

## Prerequisites

Use Node.js 24 LTS (`.nvmrc`), npm, and VS Code 1.105 or newer. Development tools require Node 22.13 or newer; VS Code supplies its own Node runtime for the extension. Install the `code` shell command from VS Code's command palette on macOS. `VSCODE_CLI` can override its path.

```sh
npm ci
npm run check
```

The npm lockfile is version controlled. Do not use a globally installed `vsce`. The project installs the current official packager locally. No Marketplace credentials are needed to build or install a test version.

## Source development and UI control

`npm run dev` opens an Extension Development Host with the fixture project and a separate profile in `.dev/`. Alternatively, open the repository in VS Code and press F5 using **Run Commander V**. After source edits, use **Developer: Reload Window** in the development host. The extension is plain CommonJS JavaScript, so no compile/watch step is needed.

An agent can use the same CLI and control that VS Code window through computer use to select files, invoke commands, inspect notifications, and paste results into an untitled editor. Automated integration tests provide assertions against the real VS Code API and clipboard. This is the repeatable test interface; no extra privileged control extension is installed.

## Build, install, and rollback

```sh
npm run package        # lint + unit tests, then builds/commander-v-<version>.vsix
npm run test:manual    # package + install in .dev/extensions + open fixture
npm run install:local # package + install in the normal VS Code profile
```

After replacing the same version, reload open test windows. Keep the version distinct from the published release when testing changes. **Commander V 3.0** uses package version `3.0.0` and is a local release candidate; nothing in these scripts publishes it publicly.

To roll back the normal installation, install the existing `builds/commander-v-2.4.7.vsix` with `code --install-extension builds/commander-v-2.4.7.vsix --force`, then reload. Alternatively use **Install Another Version** on Commander V's extension page. The repository's historical VSIX files are local artifacts, not tracked source.

## Real VS Code integration tests

```sh
npm run test:integration
VSCODE_VERSION=1.105.0 COMMANDER_V_VSIX=auto npm run test:integration
COMMANDER_V_VSIX=auto npm run test:integration
```

The default downloads current stable VS Code from Microsoft. `COMMANDER_V_VSIX=auto` installs the artifact matching `package.json` into a fresh extensions directory and uses a separate test harness, ensuring the packaged extension—not the source checkout—is exercised. Build the VSIX first. An explicit VSIX path is also accepted.

To use installed VS Code on current macOS:

```sh
VSCODE_EXECUTABLE_PATH='/Applications/Visual Studio Code.app/Contents/MacOS/Code' \
  COMMANDER_V_VSIX=auto npm run test:integration
```

On PowerShell, set environment variables with `$env:VSCODE_VERSION='1.105.0'` before running the npm command. The test runner accepts the native Code executable on Windows/Linux too.

Each run creates disposable files and isolated settings under `.vscode-test/runs/`. Editor updates are disabled, and explicitly requested editor versions are checked at runtime to catch a stale or updated download cache. Tests restore the previous clipboard text on exit; avoid clipboard-dependent work while they run. Microsoft's test runner disables Workspace Trust in the test host, so restricted-mode configuration behavior is separately covered by unit tests. A real SSH/container environment, Windows/Linux audio playback, and the cross-platform CI matrix still need their respective environments to verify them.

CI covers the minimum and current stable VS Code on macOS, Windows, and Linux, tests the installed VSIX, audits dependencies, and uploads the Linux stable build. CI starts when these changes are pushed; creating the workflow does not establish a passing remote CI run.

## Manual checklist

1. In the isolated fixture window, select `hello.js` plus `components`. Right-click → **Commander V**, then paste into a new untitled text editor. Expect a tree and one copy of each file.
2. Run **Reuse last Commander V Selection** after editing a selected file.
3. Enable **Read From Editor**, leave edits unsaved, switch tabs, and repeat. Expect the unsaved content.
4. Toggle **Prune Project Tree**, **Order Files By**, separator settings, and code-block wrapping. Inspect the output.
5. Try a binary-only or empty directory selection. Expect the clipboard to stay unchanged.
6. Quick copies should show only the completion message and optional sound. For an operation lasting over one second, expect cancellable progress to appear. Cancel a large disposable selection and expect the clipboard to remain unchanged. Verify this for both combined and tree-only copies.
7. Use **Manage Extension** on the success notification and test optional audio locally.
8. Run **Commander V: Copy Project Tree** (Mac: `Cmd+K`, then `Cmd+Shift+T`; Windows/Linux: `Ctrl+K`, then `Ctrl+Shift+T`). Expect just the active workspace's tree inside an unlabeled Markdown code block. Right-click `components` and use the same command to copy only that subtree.
9. Change **Tree Format** to **ascii**, toggle **Wrap Tree In Code Block**, and paste into your chat app. Inspect both the input box and the rendered message; the app controls their fonts. Try **Include Project Tree** off to confirm that the regular command still copies only file contents.
10. In a disposable web/Python project, create `.pnpm-store`, `.next`, `.svelte-kit`, `.venv`, and `.ruff_cache` directories with small text files. Copy the project folder and its tree; expect those directories and contents to be omitted, with source and lockfiles retained. Select one excluded file explicitly and confirm it copies. Try **Use Default Ignores** off and project `!` exceptions.

## Maintenance and performance

`npm outdated` checks direct dependency freshness; `npm audit` checks known advisories in both build and runtime dependencies. Neither proves the absence of unknown vulnerabilities. Dependabot is configured for weekly npm and GitHub Actions updates.

`node scripts/benchmark.js` compares file I/O against the original implementation at commit `1782f87`. It creates and removes a temporary 1,000-file fixture and prints elapsed time/read counts. A shallow checkout without that commit cannot run the baseline. Treat elapsed times as illustrative; the stable results are three reads per file reduced to one and zero filesystem reads for a pruned tree.

See [the review](docs/REVIEW-2026-09-28.md) for remaining risks and follow-up work.

The [3.0 release checklist](docs/RELEASE-3.0.md) records the acceptance results and the exact artifact to publish after approval. Building, installing, and committing do not publish the extension.

Built-in exclusions live in `src/default.ignore` and ship inside the VSIX. See [the exclusion policy](docs/EXCLUSIONS.md) for scope, customization, and research sources. Keep the folder-content and tree paths on the same matcher; regression tests assert that excluded directories are never traversed.
