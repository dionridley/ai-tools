# Deep Dive: One Repo, Many Bundles — Pi Packaging Options

**Date:** 2026-07-06
**Parent Research:** [Pi.dev Agent Harness Capability Audit](../../index.md) (2026-07-06)
**Research Question:** With separate repos ruled out, how does Pi package a repo containing multiple plugin-like bundles (skills/agents/extensions), and which mechanisms let a user take some bundles but not others — the way Claude Code's marketplace lets users pick plugins?

> **Answer: One repo works — layer three mechanisms: a root `package.json` `pi` manifest for the single-command whole-repo git install, settings-level filters for per-user/per-project plugin selection, and per-plugin `package.json` files that stay inert until installed by local path (dev) or published to npm (true selective install, deferrable).** Confidence: High.
> **Exceptions:** git installs can never fetch a subdirectory — selective *install* (as opposed to selective *use*) requires either npm publishing per plugin or a local clone; and the fresh-install default is everything-on (opt-out filtering), not opt-in.
> **Verification (Deep path):** rests on claims 1–6, all Confirmed, most at source-code level — see the [Claim Ledger](./findings.md#claim-ledger).

## Why this deep dive

The parent audit confirmed the `pi` manifest concept but left packaging granularity at doc-level: no git-subdir syntax, per-resource `pi config` — one source each, options unmapped. This dive verifies the mechanics in `package-manager.ts`, surfaces the settings object-form filters (the piece that makes plugin-level selection real), finds the officially documented workspaces monorepo pattern, and confirms a production example ([gotgenes/pi-packages](https://github.com/gotgenes/pi-packages)) running the exact dual model this repo needs.

## How this differs from the parent

The parent answered "can Pi consume our skills and manifest at all?" This answers "how does one repo serve *selectable* bundles?" — install anatomy, filter syntax, update/pinning, dependency resolution, and five composition options scored against the one-repo constraint. Nothing in the parent is overturned; the parent's packaging findings are extended, not superseded.

## Key Takeaways

1. **Selective *use* is first-class; selective *install* costs a publish step** — settings filters give per-plugin selection from one git install today, therefore npm publishing (Option B) can stay dormant until someone actually wants a standalone plugin.
2. **Subfolder `package.json` files are inert in a whole-repo install** (root-only manifest reading, source-verified) — therefore per-plugin manifests, the root manifest, `marketplace.json`, and `plugin.json` all coexist in one repo with zero interference.
3. **Local installs are live references, not copies** — therefore the Phase 8 dev loop is `pi install <repo-path>` once, then edit-and-test against the working tree.
4. **Pi auto-runs `npm install` on installed packages** — therefore future TypeScript extensions with dependencies ship from this repo with no extra install instructions.
5. **Plugin boundaries must stay directory boundaries** in the Stage 3 taxonomy — filters, manifests, and future publishing all key off folder paths.

## Research Files

- **[Findings](./findings.md)** — claim ledger, install mechanics, the five options (git+filters, workspaces+npm, local paths, raw paths, meta-packages) with scored comparison and current-repo mapping
- **[Recommendations](./recommendations.md)** — the layered A+C-now/B-later architecture, Stage 3 PRD inputs, risk gates
- **[Resources](./resources.md)** — sources for this deep dive

## Related Documents

- [← Parent Research: Pi.dev Agent Harness Capability Audit](../../index.md)
