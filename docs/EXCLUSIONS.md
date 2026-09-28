# Copy exclusions

Reviewed 28 September 2026. The baseline is shipped as [`src/default.ignore`](../src/default.ignore), using gitignore syntax. It is a set of defaults, not a mandatory denylist.

## Policy

1. Apply built-in rules when `commanderV.useDefaultIgnores` is enabled (the default).
2. Append the configured `commanderV.ignoreFile`, defaulting to the workspace root's `.gitignore`. A custom file replaces this project layer, not the built-in layer. An empty setting disables the project layer.
3. Apply the resulting matcher before descending into excluded directories or reading excluded file bodies. Folder content collection, full trees, and tree-only copies share the matcher implementation.
4. Explicitly selected individual files bypass these exclusions. This includes active-editor copies, files selected alongside a parent folder, and reuse of an explicitly copied file. Binary and symlink handling still applies.
5. Pruned trees describe the files actually copied and need no filesystem reads. Full trees continue to apply their own depth and exclusion rules, so an explicitly copied excluded file need not appear in a full tree.

Gitignore `!` negation can override a built-in rule. An excluded parent must be reopened before descendants can be included. For example, to copy only one file from `dist` during folder traversal:

```gitignore
!dist/
dist/*
!dist/keep.js
```

To disable filtering completely, set `useDefaultIgnores` to `false` and `ignoreFile` to `""`. Turning off just the defaults retains the project file's rules.

## Scope and tradeoffs

- Defaults cover common web dependency installations, framework build output, test reports, and caches. They include package-local paths inside monorepos. pnpm's store usually lives outside the project; `.pnpm-store/` is excluded wherever it appears inside a copied tree.
- Python defaults cover `.venv`, `venv`, bytecode, package metadata, and common test, lint, type-checking, environment, and notebook caches. Custom environment/cache paths require project rules. Generic `env/`, `lib/`, `data/`, and `public/` directories are deliberately retained because they frequently contain source or project assets.
- Generic `build/`, `dist/`, and `out/` directories are presumed generated. Projects using those names for source can add `!` rules or disable the defaults. No framework is detected and no build configuration is executed to guess custom output paths.
- Lockfiles, manifests, source, tests and snapshots, migrations, notebooks, `.github`, and editor settings remain eligible. Yarn cache/unplugged files are excluded without dropping its patches, plugins, releases, versions, or configuration. Nx cache directories are excluded without dropping `.nx/workflows`.
- `.env` and `.env.*` are excluded, except common `.env.example`, `.env.sample`, and `.env.template` files. The later project layer can override those exceptions. These are path conventions, not content inspection or comprehensive secret detection.
- Only the configured root ignore file is read. Nested `.gitignore`, global Git excludes, `.git/info/exclude`, and VS Code `files.exclude` are not consulted. Rules apply by path even to Git-tracked files.
- Outside a workspace, the selected folder is the ignore root. A subtree inside a workspace uses workspace-relative patterns. Each workspace supplies its own ignore file, while the command's configuration values still come from the first selection.
- A selected ignored directory inside a workspace is not traversed. A tree-only copy can show its root label without descendants. The workspace/copy root itself is retained.
- Missing ignore files are normal. Other read failures abort the copy and preserve the clipboard. The rules are reloaded for each operation; no cross-command cache can retain stale project rules.

## Verification

Unit tests assert exclusion before directory/file reads, nested packages, retained source/configuration, negation, explicit file overrides, opt-out, custom files, anchored subtree rules, multiple workspaces, remote URI adapters, missing files, and errors. Real VS Code integration tests exercise both content and tree commands from an installed VSIX and check that the default rule file ships with it.

## Research references

The defaults are tailored to clipboard context rather than copied wholesale from Git templates:

- [Next.js starter ignore rules](https://github.com/vercel/next.js/blob/canary/packages/create-next-app/templates/app/ts/gitignore) identify framework output, Yarn artifacts, and local generated files.
- [Vite React starter rules](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react/_gitignore) identify dependency and distribution output.
- [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure#Other-files-.svelte-kit) describes its regenerable `.svelte-kit` directory.
- [pnpm store configuration](https://pnpm.io/settings/store#storedir) describes standard store locations and `.pnpm-store` fallbacks.
- [Yarn file guidance](https://yarnpkg.com/getting-started/qa#which-files-should-be-gitignored) distinguishes cache/install artifacts from patches, configuration, and lockfiles.
- [uv project layout](https://docs.astral.sh/uv/concepts/projects/layout/) distinguishes the `.venv` environment from project metadata and `uv.lock`.
- [Ruff defaults](https://docs.astral.sh/ruff/configuration/) document common Python tool/environment exclusions.
- [Playwright configuration](https://playwright.dev/docs/test-configuration) documents test artifact output.

Revisit defaults when upstream conventions change. A project-specific override should remain possible without editing the installed extension.
