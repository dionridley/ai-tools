# Deep Dive Resources: One Repo, Many Bundles

**Date:** 2026-07-06

[← Back to Pi.dev Capability Audit](../../index.md) · [Deep Dive Index](./index.md)

## Documentation (primary sources)

- [Pi packages docs (rendered)](https://badlogic-pi-mono.mintlify.app/coding-agent/pi-packages) — verbatim source for: the workspaces monorepo example, settings object-form filters and pattern syntax, `bundledDependencies` meta-package pattern, "Not copied - added as reference" local installs, npm-vs-git publishing routes
- [docs/packages.md (repo)](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) — settings file locations (`~/.pi/agent/settings.json`, `.pi/settings.json`), git URL forms, `pi update --extensions/--all`, auto-discovery conventions, automatic `npm install` of dependencies
- [docs/skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) — `--skill <path>` and settings-level skill paths (Option D)

## Source Code (verification)

- [package-manager.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/package-manager.ts) — `GitSource` type (no subdir field), whole-repo `git clone`, root-only `readPiManifest()`, automatic dependency install (`runNpmCommand(this.getGitDependencyInstallArgs(), { cwd: targetDir })`), update/pinning logic (`git reset --hard <ref>`), local-path handling, `applyPatterns()` filtering, `autoload` delta handling

## Real-World Examples

- [gotgenes/pi-packages](https://github.com/gotgenes/pi-packages) — production dual-model monorepo: pnpm workspaces, 8 packages under `packages/*` each with its own `package.json`, published individually as `@gotgenes/*` on npm AND installable whole via `pi install git:github.com/gotgenes/pi-packages`
- [xynogen/pix-mono](https://github.com/xynogen/pix-mono), [jvm/pi-mono](https://github.com/jvm/pi-mono) — further Pi-ecosystem monorepos surfaced in search (not examined in depth)

## Related Documents

- [← Parent Research: Pi.dev Agent Harness Capability Audit](../../index.md)
- [Index](./index.md) — this deep dive's overview
- [Findings](./findings.md) — claim ledger and options analysis
