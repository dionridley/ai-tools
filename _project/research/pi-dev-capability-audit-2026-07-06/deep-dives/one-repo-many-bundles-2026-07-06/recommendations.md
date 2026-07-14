# Deep Dive Recommendations: One Repo, Many Bundles

**Date:** 2026-07-06

[← Back to Pi.dev Capability Audit](../../index.md) · [Deep Dive Index](./index.md)

## Recommendation

**Layer Options A + C now, keep B as a dormant capability:** give each plugin folder its own `package.json` with a `pi` key (npm-ready, locally installable, but inert in the whole-repo install), add one root `package.json` whose `pi` key globs across the plugin folders (single-command `pi install git:` full install, filtered per user/project via settings), and use local-path reference installs as the dev loop. Defer actual npm publishing (Option B's cost) until someone demonstrably wants a standalone plugin install. This is one repo serving both harnesses with plugin-level selection on each — the Pi mirror of `marketplace.json` → `plugin.json`.

## Next Steps

### Priority 1: Feed this into the Stage 3 PRD as the packaging section
**Why:** It resolves the "how does Pi consume the repo" design question with verified mechanics, and it constrains the folder taxonomy (plugin boundaries must remain directory boundaries for filters and future publishing to work).
**What:** Carry into the PRD: root manifest with `pi` globs; per-plugin `package.json` files mirroring `plugin.json`; the [official workspaces pattern](https://badlogic-pi-mono.mintlify.app/coding-agent/pi-packages) if/when the folder taxonomy moves to `packages/*`-style; README recipes for the settings filter object (per-plugin selection) and local-path install (dev).

### Priority 2: Use Option C immediately for portability testing
**Why:** Local installs are live references — edit a skill, next Pi session sees it. That's the Phase 8 feedback loop with zero setup.
**What:** When Phase 8 arrives: `pi install <repo-path>/project-mgmt-plugin` (or the repo root) on a machine with Pi, and exercise each skill per the plan's test list.

### Priority 3: Decide git-tag release convention for the Pi side
**Why:** Whole-repo git installs pin to tags (`@v1.0.0`); your current versioning is per-plugin. A repo-level tag scheme is the one new convention Option A needs.
**What:** Flag in the Stage 3 PRD alongside the existing versioning question (the handoff already notes Stage 3 may reshape versioning). Candidates: repo-level semver tags for the Pi package, per-plugin CHANGELOGs unchanged; revisit only if Option B activates.

## What to Avoid

- **Don't publish to npm preemptively.** Option B's per-release publish overhead buys nothing until a real user wants `pi install npm:@dionridley/pm-tools`. The don't-over-invest principle applies squarely.
- **Don't collapse plugin folders into one flat `skills/` directory in Stage 3.** Directory boundaries are what make settings filters, per-plugin manifests, and future publishing all work. Flattening would forfeit plugin-level selection on Pi.
- **Don't put the `pi` manifest only in subfolders.** A whole-repo git install reads the root `package.json` exclusively — without a root manifest you'd be relying on auto-discovery conventions that don't match the current layout.
- **Don't treat settings filters as a security boundary.** They select what loads; they are not sandboxing. (Pi packages run with full system access per its docs.)

## Risks & Decision Gates

| Risk | Impact | Gate / Exit Criterion |
|------|--------|----------------------|
| Settings-filter UX proves too clunky for real plugin selection (opt-out friction) | Med | Phase 8: write the README filter recipe, apply it fresh; if it takes more than a settings paste, activate Option B for the most-wanted plugin |
| Root `workspaces` field interacts badly with the Claude-side repo (npm noise, lockfiles) | Low | Add `workspaces` only when the first TypeScript extension lands; until then the root manifest needs no workspaces |
| Repo-level git tags conflict with per-plugin release cadence | Med | If two plugins need independent Pi release trains before Option B exists, that's the signal to start publishing (B) rather than inventing tag gymnastics |
| Pi's packaging behavior changes under its 1–3-day release cadence | Med | Re-verify ledger claims 1–2 (root-only manifest, filter syntax) at Phase 8 start |

## Open Questions

- Should the eventual root manifest also expose `prompts/` with thin `/dr-plan`-style templates (parent research's UX shim idea) in the same install?
- If a "dr-suite" meta-package (Option E) ever ships to bundle a question-tool/subagent dependency, does it live in this repo or its own? (Leans: this repo, per the one-repo constraint — but that's a Stage 3+ decision.)

## Related Documents

- [← Parent Research: Pi.dev Agent Harness Capability Audit](../../index.md)
- [Index](./index.md) — this deep dive's overview
- [Findings](./findings.md) — the five options and their evidence
- [Resources](./resources.md) — sources
