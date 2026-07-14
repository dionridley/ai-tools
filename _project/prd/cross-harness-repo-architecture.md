# PRD: Cross-Harness Repo Architecture (Claude Code + Pi from One Repo)

**Status:** Draft
**Version:** 1.1
**Created:** 2026-07-08
**Author:** Claude Code (with Dion Ridley)
**Last Updated:** 2026-07-08
**Feature Type:** infra

## Problem Statement

This repo (`dionridley/ai-tools`, successor to `claude-plugins`) currently serves exactly one harness. Every structural convention is Claude Code's: plugins discovered via `.claude-plugin/marketplace.json`, per-plugin `plugin.json` manifests, folder names like `project-mgmt-plugin`. A Pi user has **no install path at all today** — there is no Pi manifest, so `pi install git:github.com/dionridley/ai-tools` would fall back to directory conventions that don't match this layout and find nothing.

The maintainer (Dion) is building toward cross-harness AI tooling: skills usable from any Agent Skills-spec harness, Pi TypeScript extensions as a new artifact type, and per-harness manifests over shared artifacts (vision recorded in `.research/repo-transition-handoff.md`). The current layout blocks that: there is no home for harness-exclusive artifacts, no Pi entry point, and the "plugin" grouping — which *should* be the unit of selection on both harnesses — exists only in Claude's manifest format.

The mechanics to fix this are verified, not speculative: the Pi capability audit (2026-07-06) and its packaging deep dive confirmed at source-code level how Pi discovers, installs, filters, and updates packages — including a production example ([gotgenes/pi-packages](https://github.com/gotgenes/pi-packages)) running the exact one-repo/many-bundles model this PRD adopts.

## Hypothesis

**We believe** restructuring into harness-neutral bundles (`bundles/<name>/`) with two root-anchored catalog manifests (Claude `marketplace.json`, Pi `package.json` with `pi` globs) **will produce** one repo installable and selectable from both harnesses with zero forked or duplicated skill content **because** both manifest systems are mutually inert — Pi reads only the root `package.json` and ignores unknown files; Claude reads only its own manifests — and both can resolve paths downward into the same bundle directories.

Testable signal: after the restructure, (a) a fresh Claude Code install from the re-pointed marketplace behaves identically to today, and (b) `pi install git:…/ai-tools` yields invocable skills — with **no skill file existing twice**. If either harness ends up needing its own copy of any skill, the hypothesis is falsified.

## Success Metrics

- **Pi installability** — Current: no install path (0 manifests). Target: one `pi install git:` command loads all bundle skills, invocable as `/skill:dr-*`. Measured via: hands-on smoke test (this is also portability-plan Phase 8's install target).
- **Claude parity** — Current: 3 plugins working (project-management 2.3.0 baseline). Target: zero behavioral regressions post-move — every skill invokes and loads its references from the new paths. Measured via: manual invocation pass on all skills after migration.
- **Maintenance overhead** — Target: a bundle release stays a ≤4-file ritual (plugin.json, package.json, marketplace.json entry, CHANGELOG) with no sync tooling. Measured via: performing the first post-restructure release.
- **Selection works on both sides** — Target: README recipes let a Claude user enable a subset of plugins (existing behavior) and a Pi user exclude a bundle with a single settings paste. Measured via: following the README verbatim on each harness.

> The ≤4-file bound is a starting-point default chosen to keep the don't-over-invest principle honest — confirm it survives the first real release before treating it as the standard (see Open Questions).

## User Stories

*(Operator framing — the "users" of repo architecture are its maintainer and installers.)*

- As the **maintainer**, I want plugin boundaries to be directory boundaries, so that selection, versioning, and future publishing all key off paths with no extra tooling.
- As a **Claude Code user**, I want the marketplace and its plugins to work exactly as today after the restructure, so that nothing about my workflow changes.
- As a **Pi user**, I want one `pi install git:` command that brings in all skills with per-bundle opt-out via settings filters, so that I can consume these tools with no registry or per-skill wiring.
- As a **Pi user on a delegation-capable setup**, I want agent definitions usable as subagent instructions (file-as-prompt), so that plan verification can run in a fresh context without any package coupling.
- As the **maintainer**, I want designated homes for harness-exclusive artifacts (Pi TS extensions, Claude hooks), so that cross-harness growth doesn't leak harness-specific code into shared bundles.
- As a **future consumer of a single bundle**, I want per-bundle manifests already in place, so that standalone npm install (dormant Option B) is a publish step, not a restructure.

## Functional Requirements

### Core

1. **Bundle-first layout.** Each plugin becomes `bundles/<name>/` containing its `skills/`, optional `agents/`, its Claude manifest at `.claude-plugin/plugin.json` (Claude requires this path relative to plugin root), and a new Pi manifest at `package.json`. Bundle folders are renamed to match their existing plugin names — `project-mgmt-plugin/` → `bundles/project-management/`, `engineering-tools/` → `bundles/engineering-tools/`, `experimental/` → `bundles/experimental/` — keeping marketplace plugin **names** unchanged so existing enablements don't break. Moves use `git mv` to preserve history.
2. **Root Pi catalog.** A root `package.json` with `"private": true` (the root itself never publishes), `"keywords": ["pi-package"]`, and a `pi` key globbing `bundles/*/skills/*`. This is the single manifest Pi reads on a whole-repo git install (verified: root-only).
3. **Root Claude catalog.** `marketplace.json` updated: `source` paths → `./bundles/<name>`, placeholder owner replaced with real values (Dion Ridley / aitools@dionridley.com).
4. **Per-bundle Pi manifest.** Each bundle's `package.json` mirrors its `plugin.json`: same name (npm-scoped form), same version as the bundle's semver, `pi` key globbing that bundle's own `skills/`. Inert during whole-repo installs (root-only reading, verified); activates for local-path installs today and npm publishing later.
5. **Escape hatches.** Root `pi/` (for cross-cutting TypeScript extensions, prompt templates) and `claude/` (for cross-cutting hooks etc.) folders. Rule: **exclusivity determines which manifest references an artifact; ownership determines where it lives** — bundle-owned harness-specific artifacts stay inside their bundle, referenced only by that harness's bundle manifest. Both folders may start empty or absent; the root `pi` manifest adds `extensions`/`prompts` globs only when content exists.
6. **Agents as harness-neutral instruction documents.** `bundles/<name>/agents/*.md` stay registered in `plugin.json` for Claude. No Pi-side registration, no subagent-package coupling: skills consume the same file via three tiers (Claude named agent → generic delegation feeding the file as instructions → inline checklist fallback). The prose enabling tiers 2–3 lands in portability Phase 2, not this restructure.
7. **Install & selection recipes.** Root README documents: Claude (add marketplace, enable plugins — unchanged), Pi full install (`pi install git:…`), Pi per-bundle opt-out (settings `packages` object-form filter snippet, copy-pasteable), Pi local-path install for development (live reference, no copy).
8. **Internal reference updates.** Repo-level CLAUDE.md structure map, per-bundle READMEs, and any doc referencing old folder paths updated in the same change.

### Enhancements (if scope permits)

1. **Pi prompt-template shims.** Thin `pi/prompts/dr-*.md` templates so Pi users get `/dr-plan`-style invocation (templates support `$ARGUMENTS`) mapping onto the skills — restoring Claude-like UX without touching skill content.

## Acceptance Criteria

- [ ] Fresh Claude Code install from the updated marketplace lists all three plugins; every skill in each bundle invokes successfully and loads its reference files from the new paths.
- [ ] `plan-verifier` still resolves as a Claude agent (`project-management:plan-verifier`) after the move.
- [ ] Root `package.json` parses, is `"private": true`, and its `pi.skills` globs match every `SKILL.md` directory under `bundles/` (and nothing else).
- [ ] Each bundle's three version declarations agree at the release commit: `plugin.json` == bundle `package.json` == its `marketplace.json` entry.
- [ ] `git log --follow` returns pre-move history for a sampled `SKILL.md` in each bundle (history preserved through `git mv`).
- [ ] On a machine with Pi: `pi install git:github.com/dionridley/ai-tools` succeeds; `/skill:dr-plan` is invocable; `disable-model-invocation: true` skills (dr-init, dr-research, dr-ship) are absent from auto-discovery but invocable explicitly. *(Gated on Pi access — may execute as part of portability Phase 8; the criterion still belongs to this PRD.)*
- [ ] On Pi: applying the README's filter snippet excludes the `experimental` bundle and its skills stop loading. *(Same gate.)*
- [ ] Failure mode: `npm publish` from the repo root refuses (private flag) — accidental root publishing is impossible.
- [ ] Rollout signal: the old `claude-plugins` repo remains untouched and existing installs pointing at it keep working (Stage 4 EOL sequencing unaffected).

## Technical Considerations

### Target layout

```
/
├── .claude-plugin/marketplace.json      # Claude catalog (root-forced); sources → ./bundles/*
├── package.json                         # Pi catalog (root-forced, private): pi.skills → bundles/*/skills/*
├── bundles/
│   ├── project-management/
│   │   ├── .claude-plugin/plugin.json   # Claude bundle manifest (path required by Claude)
│   │   ├── package.json                 # Pi bundle manifest (inert in whole-repo installs)
│   │   ├── README.md · CHANGELOG.md
│   │   ├── skills/{dr-research,dr-init,dr-prd,dr-plan,dr-ship}/
│   │   └── agents/plan-verifier.md
│   ├── engineering-tools/               # same shape: skills/{frontend-design,react-19}
│   └── experimental/                    # same shape: skills/{mvp}
├── pi/                                  # cross-cutting Pi-only (extensions/, prompts/) — may start absent
├── claude/                              # cross-cutting Claude-only (hooks/ …) — may start absent
├── CLAUDE.md · README.md
└── _claude/                             # local outputs (research/prd/plans); _project/ rename pending (portability Phase 4)
```

### Manifest contents

Root `package.json` (the Pi entry point — the only `package.json` Pi reads on `pi install git:`):

```json
{
  "name": "ai-tools",
  "private": true,
  "keywords": ["pi-package"],
  "pi": {
    "skills": ["bundles/*/skills/*"]
  }
}
```

Per-bundle `package.json` (Pi twin of `plugin.json`; version always equals the bundle's semver):

```json
{
  "name": "@dionridley/project-management",
  "version": "2.3.0",
  "description": "Structured project management with research, PRDs, and implementation plans",
  "license": "MIT",
  "keywords": ["pi-package"],
  "pi": { "skills": ["skills/*"] }
}
```

`marketplace.json` changes only `source` paths and the owner block; plugin names and versions are untouched by the move itself.

### Verified constraints this design obeys (from the research reports)

- **Both catalogs are root-forced.** Pi reads the `pi` manifest from the installed package root only — subfolder `package.json` files are inert in a whole-repo install (source-verified in `package-manager.ts`). Claude discovers `marketplace.json` at the repo root. Everything else is free to move; the two catalogs are not.
- **Mutual tolerance.** Pi silently ignores unknown frontmatter and unknown files; Claude ignores `package.json`. Dual manifests coexist without interference.
- **Selection mechanics.** Pi settings `packages` object form filters per resource type with glob/`!`/`+`/`-`/`[]` syntax layered over the manifest; `pi config` edits interactively. Bundle-as-directory makes filters read like plugin names.
- **Delivery model.** Pi git installs track main (unversioned) or pin to a ref; `pi update` reconciles. Pi runs `npm install` on installed packages automatically — future extensions may declare real dependencies.
- **Skill compatibility.** Pi implements the Agent Skills spec leniently and natively honors `disable-model-invocation`; `allowed-tools` is parsed but unenforced (safety-in-prose is the portability plan's Phase 2 concern, unchanged by this PRD).

### Versioning model (decided 2026-07-08)

Per-bundle semver is the **only** version concept, written in three places per bundle at release time. Pi whole-repo delivery is deliberately unversioned (track main; pinning available); repo git tags are an optional courtesy for pinners, not a managed axis. Per-bundle npm publishing (Option B) stays dormant — each bundle's `package.json` version is already the npm version whenever it activates. Consequence: **main is a live release channel for Pi consumers** — mostly harmless while content is markdown skills; once `pi/extensions/` gains code, PRs touching it need a loads-cleanly check (CI note, future gate).

### What this PRD deliberately does not change

- **Skill content.** All Claude-ism rewording (path variables, conditional prose, model neutrality, AGENTS.md) belongs to `.research/skill-portability-plan.md` Phases 1–8, which now run **after** this restructure inside the new layout.
- **Output directory convention.** `_claude/` → `_project/` remains portability Phase 4 unless explicitly batched into this release (Open Question).
- **The old repo.** `claude-plugins` EOL sequencing (Stage 4) is untouched.

## Dependencies

- [x] Pi capability audit + one-repo-many-bundles deep dive (completed 2026-07-06 — see References).
- [ ] Access to a Pi installation for the two Pi-side acceptance criteria (may ride portability Phase 8's testing setup).
- [x] Resolution of the `_project/` batching question — resolved 2026-07-08: rename stays in portability Phase 4 (see Open Questions).

## Release Strategy

**Restructure-first (decided 2026-07-08, supersedes the portability plan's original ordering):** this restructure lands as one PR to main *before* portability Phases 1–8, while zero content edits are in flight — READMEs, CHANGELOGs, and paths get touched once. Each bundle takes a **minor** version bump (structure + new manifest, no behavior change) with a CHANGELOG entry. `.research/skill-portability-plan.md` gets a sequencing note updated as part of the same change. Pi consumers don't exist yet; Claude consumers see a routine marketplace update.

> Minor (not patch) is a judgment call — the added `package.json` is a new consumer-visible surface. Flip to patch if that feels inflated at release time.

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude Code marketplace update mishandles moved plugin sources (cached paths, stale enablement) | M | L | Plugin names/versions kept stable; test with Dion's own install against this repo before any old-repo re-pointing (Stage 4 gate unchanged) |
| Pi packaging behavior drifts before hands-on validation (1–3-day release cadence) | M | M | Pi-side ACs re-verify the load-bearing claims (root-only manifest, filter syntax) at execution time; findings are date-stamped 2026-07-06 |
| Restructure invalidates the portability plan's measured inventory (66 path-variable occurrences / 19 files, counted in old layout) | L | H | The plan already mandates re-measuring before Phase 1; re-run the grep in the new layout |
| Dual-manifest version drift (3 files disagree) | L | M | Equality is an acceptance criterion at each release; add a tiny sync script only if a real release actually fumbles it |
| History loss from folder moves | L | L | `git mv` only; `git log --follow` spot-check is an acceptance criterion |

## Open Questions

- [x] ~~Batch the `_claude/` → `_project/` output-dir rename into this restructure release?~~ **Resolved 2026-07-08: keep in portability Phase 4.** The restructure PR stays purely structural (zero skill-content edits); the rename ships with the breaking 3.0.0 portability release.
- [x] ~~Are `_claude/` (future `_project/`) PRDs and plans committed or kept local?~~ **Resolved 2026-07-08: everything stays local (gitignored) through the migration.** Once the migration is complete and verified, the new `_project/` folder becomes the committed home for tracking changes going forward.
- [x] ~~npm scope for per-bundle package names?~~ **Resolved 2026-07-08: `@dionridley/<bundle>`.** Personal npm scope — conflict-free, zero registration needed until Option B ever activates.
- [ ] ≤4-file release ritual: acceptable after the first real release, or does it justify the 20-line sync script? — owner: Dion, needs by: first post-restructure release.
- [ ] When the first Pi extension lands: what's the minimum loads-cleanly CI check, given main is a live Pi release channel? — owner: Dion, needs by: first extension PR.

## References

- `@_claude/research/pi-dev-capability-audit-2026-07-06/index.md` — Pi capability audit (Deep path; 6 claims Confirmed): skills support, tools, frontmatter, AGENTS.md, packaging.
- `@_claude/research/pi-dev-capability-audit-2026-07-06/deep-dives/one-repo-many-bundles-2026-07-06/index.md` — packaging deep dive (6 claims Confirmed, source-level): install anatomy, settings filters, workspaces pattern, the five composition options.
- `.research/skill-portability-plan.md` — Stage 2 content-portability plan (Phases 0–8); sequencing updated by this PRD's Release Strategy.
- `.research/repo-transition-handoff.md` — the cross-harness vision and five-stage transition context.
- [Pi packages documentation](https://badlogic-pi-mono.mintlify.app/coding-agent/pi-packages) · [Agent Skills specification](https://agentskills.io/specification) · [gotgenes/pi-packages](https://github.com/gotgenes/pi-packages) (production dual-model example).

---

## Refinement History

**Version 1.1** — 2026-07-08
- Resolved 3 of 5 open questions: `_project/` rename stays in portability Phase 4 (restructure PR remains purely structural); all `_claude/` outputs stay gitignored until post-migration, then `_project/` becomes the committed tracking home; npm scope locked to `@dionridley/<bundle>`.
- Remaining open questions (release-ritual script, extension CI check) are deliberately gated on future events.

**Version 1.0** — 2026-07-08
- Initial PRD creation
