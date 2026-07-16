# PRD: Stage 3 — Harness-Exclusive Artifacts & Install Story

**Status:** Draft
**Version:** 1.1
**Created:** 2026-07-16
**Author:** Claude Code
**Last Updated:** 2026-07-16
**Feature Type:** infra (with embedded spikes)

## Problem Statement

The cross-harness architecture (PR #1: `bundles/` layout, dual Claude + Pi manifests) proved that **shared** artifacts work: the same skills serve Claude Code and Pi, validated live in Stage 2. But the transition vision (`.research/repo-transition-handoff.md`, 2026-07-06) includes artifact types that exist on **only one** harness — Pi extensions (TypeScript, no Claude Code equivalent) and Claude Code-exclusive artifacts (hooks and similar) — and neither mechanism has ever been exercised here. The `pi/` and `claude/` escape hatches exist only as a rule in AGENTS.md ("exclusivity determines the manifest; ownership determines the location"); no bundle or root folder carries a harness-exclusive artifact, so the rule is untested and the next harness-exclusive idea starts with archaeology instead of a documented pattern.

Separately, install and discovery are folk knowledge: the working installs (Claude Code directory marketplace pointed at this working tree; Pi git package tracking main) live in the maintainer's config and memory, not in repo docs a newcomer — or the maintainer on a fresh machine — could follow.

Both gaps sit on the critical path to Stage 4: the old `claude-plugins` repo should not be archived until this repo is provably self-sufficient.

## Hypothesis

**We believe** spiking both harness-exclusive artifact mechanisms end to end (a TypeScript extension installed into and running in Pi; a non-skill Claude Code artifact loaded and firing) and documenting the resulting patterns **will produce** a structurally final repo where every future artifact type has a known-working, documented home **because** these two mechanisms are the only untested parts of the cross-harness architecture — everything else (shared skills, dual manifests, install channels) is already proven in live use.

Testable signal: each spike produces a demo artifact that installs and executes on its harness within the time-box → supported. Either mechanism cannot be made to work within its time-box → falsified, and the architecture (or the harness's supported surface) needs a documented rethink.

## Success Metrics

- **Pi extension mechanism proven** — Current: never exercised. Target: a TypeScript extension from this repo installs into Pi and demonstrably runs. Measured via: live Pi session (same test-in-Pi channel Stage 2 used).
- **Claude-exclusive mechanism proven** — Current: never exercised (bundles carry only skills and agents). Target: one non-skill artifact (candidate: a hook) served from this repo loads and fires in Claude Code. Measured via: live session against the directory-marketplace install.
- **Patterns documented** — Current: one-line escape-hatch rule in AGENTS.md. Target: a how-to per side covering location, manifest wiring, build step (Pi), and install path, accurate against what the spikes actually did. Measured via: docs review after the spikes land.
- **Newcomer install story** — Current: unaudited folk knowledge. Target: install-from-scratch instructions for both harnesses in repo docs. Measured via: a dry-run following only the docs.

## User Stories

- As the repo maintainer, I want each harness-exclusive artifact mechanism proven end to end, so that future tooling ideas land in a known-working home instead of an untested convention.
- As the repo maintainer, I want the add-an-extension and add-a-Claude-artifact patterns documented, so that the next artifact is mechanical to add, not archaeology.
- As a newcomer (or the maintainer on a fresh machine), I want per-harness install instructions in the repo, so that setup requires no folk knowledge.
- As the repo maintainer, I want Stage 3 to leave the repo structurally final, so that Stage 4 (deprecation README + GitHub Archive of `claude-plugins`) can proceed with nothing left depending on the old repo.

## Functional Requirements

### Core

1. **Pi extension spike** — build a minimal TypeScript extension in this repo, install it into Pi through an existing channel (git package or local path), and verify it executes. Time-boxed; exit criteria in Technical Considerations.
2. **Claude artifact spike** — build a minimal Claude Code-exclusive **hook** (decided 2026-07-16; statusline/output style remain fallbacks only if hooks prove unworkable) served from this repo, and verify it loads and fires. Time-boxed.
3. **Pattern documentation** — for each side, document: where the artifact lives (ownership rule), which manifest references it (exclusivity rule), the build/packaging step (Pi TypeScript), and the install path. The docs land **regardless of spike outcome** — a "mechanism works, no production use case yet" writeup is a full success.
4. **Post-spike disposition** — a genuinely useful artifact stays; otherwise the demo is removed and only the documented pattern remains, with `pi/` and `claude/` kept as `.gitkeep` placeholder folders (decided 2026-07-16). This amends the AGENTS.md escape-hatch rule ("folders start absent") — updating that rule text is part of this requirement.
5. **Install & discovery pass, existing channels only** — audit and update repo README(s) with per-harness install instructions (Claude Code: marketplace add; Pi: git install), and verify marketplace metadata reads correctly. npm publishing is explicitly **out of scope**; per-bundle `package.json` manifests stay dormant.

### Enhancements (if scope permits)

1. A real (non-demo) first Pi extension, if the spike surfaces a use case worth keeping.

## Acceptance Criteria

Testable bullets — `/dr-plan` consumes these as test-first tasks:

- [ ] A TypeScript extension from this repo installs into Pi and demonstrably executes in a live session, with the evidence (transcript/notes) captured under `.research/`.
- [ ] A Claude Code-exclusive artifact from this repo loads and fires in a live Claude Code session served from this working tree.
- [ ] Each pattern doc is accurate against what its spike actually did — location, manifest wiring, build step, install path — not against pre-spike assumptions.
- [ ] A from-scratch install on each harness succeeds following only repo docs (dry-run performed and noted).
- [ ] Edge case: a whole-repo Pi install (`pi install git:…`) still works with extension artifacts present — the root `pi.skills` glob and extension packaging don't conflict.
- [ ] Failure mode: a spike that can't prove its mechanism within the time-box exits with findings written to `.research/` and a revisit decision recorded — never silently dropped.
- [ ] `pi/` and `claude/` exist with `.gitkeep` placeholders (or real content) after the spikes, and the AGENTS.md escape-hatch rule text reflects the amended convention.
- [ ] Nothing added in Stage 3 references `dionridley/claude-plugins` — Stage 4 remains unblocked.

## Technical Considerations

**Spike framing (both sides).** Each spike is one time-boxed exploration with a binary exit: *mechanism proven* (demo installs and executes; pattern written down) or *mechanism blocked* (findings + blockers written to `.research/`, revisit decision recorded). Time-box: **two working sessions each** (decided 2026-07-16); if no install-and-execute signal by the end of the second session, exit and write up.

**Pi side.**
- Known facts (capability audit + Stage 2 live validation): Pi reads AGENTS.md, installs packages via `pi install git:…`/`npm:…`/local path, discovers skills through the root catalog's `pi.skills` glob; extensions are TypeScript files — a distinct artifact type from skills.
- The spike must answer: how Pi manifests reference extensions (the `pi.skills` analog), what build/transpile step (if any) Pi expects for TS, and whether extensions ride the same git-package install as skills. These are recorded as Open Questions, not guessed.
- Placement per the escape-hatch rule: a cross-cutting demo belongs in root `pi/extensions/`; a bundle-owned extension would live inside its bundle. The spike validates the rule holds for real extension loading.

**Claude side.**
- Candidate artifact: a hook (plugin.json `hooks` wiring) — the plugin-dev toolkit in this environment documents the shape. Statusline or output style are fallback candidates if hooks prove awkward.
- Live-serving advantage: Claude Code serves these plugins directly from this working tree (directory marketplace), so a spike artifact is testable in-session with no publish step.
- Safety: hooks execute shell commands. The demo hook stays inert/read-only (e.g., log-only on an innocuous event), and is reviewed before enabling.

**Conventions to preserve.**
- The bundle version ritual (3 manifests + CHANGELOG) applies only when a bundle's contents change. Spike artifacts at the root escape hatches sit outside bundle versioning; they need no version story of their own (lean — revisit only if root artifacts accumulate).
- Taxonomy is settled: `bundles/` by plugin is the end state. This PRD adds no layout changes beyond first content (or placeholders) in `pi/` / `claude/`.

## Dependencies

- [ ] Pi installed and working on this machine (validated during Stage 2) — the live test channel for the extension spike.
- [ ] Pi extension API source/docs accessible (the `badlogic/pi-mono` repo) — input to the Pi spike.
- [ ] Claude Code plugin hook support as documented by the plugin-dev toolkit — input to the Claude spike.

## Release Strategy

Ships as ordinary PRs to main; a bundle version bump only occurs if a bundle's own contents change — root-level spike artifacts and docs ride without a version event.

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Pi extension API is undocumented/unstable | M | M | Time-boxed spike; findings to `.research/`; fallback: document "skills-only" as Pi's supported surface and revisit |
| No useful production artifact emerges from either spike | L | H | Explicitly a success path: mechanism proven, pattern documented, demo removed, folders per disposition decision |
| Scope creep into npm publishing or taxonomy rework | M | M | Both pinned out of scope here; revisit after Stage 4 |
| Demo hook does something unsafe | H | L | Hook kept inert/read-only; reviewed before enabling |

## Open Questions

- [x] Folder disposition when a spike yields no production artifact — **DECIDED 2026-07-16:** `.gitkeep` placeholders + pattern docs; amend the AGENTS.md escape-hatch rule accordingly.
- [x] How do Pi manifests reference extensions (the `pi.skills` analog), and is a build/transpile step required? — **ANSWERED 2026-07-16 (Pi spike, plan 008):** a `pi.extensions` array in the root `pi` manifest (paths/globs relative to the package root; must be explicit since the repo has a `pi` manifest — convention-dir auto-discovery doesn't apply); **no build step** — Pi loads TypeScript at runtime via jiti. Proven live: install → load → execute, with skills coexisting. Recipe: `_project/docs/pi-extension-pattern.md`.
- [x] Which Claude artifact type is the spike candidate — **DECIDED 2026-07-16:** hook (inert/read-only for the spike); statusline/output style are fallbacks only if hooks prove unworkable.
- [x] Time-box length per spike — **DECIDED 2026-07-16:** two working sessions each, chosen over the one-session default to give the Pi extension API room.

## References

- `@_project/research/pi-dev-capability-audit-2026-07-06/index.md` — Pi capability audit (Stage 2 Phase 0), incl. the `deep-dives/one-repo-many-bundles-2026-07-06/` packaging deep-dive
- `@_project/prd/cross-harness-repo-architecture.md` — the prior Stage 3 slice already delivered (bundles layout, dual manifests, escape-hatch rule)
- `.research/repo-transition-handoff.md` — the transition-stage source document (gitignored; local working copy only)

---

## Refinement History

**Version 1.1** — 2026-07-16
- Resolved 3 of 4 open questions with Dion: folder disposition (`.gitkeep` + docs, amending the AGENTS.md start-absent rule), Claude spike artifact (hook), spike time-box (two working sessions each). The Pi manifest/build-step question stays open by design — it's the Pi spike's exit deliverable.

**Version 1.0** — 2026-07-16
- Initial PRD creation
