# Plan: Cross-Harness Repo Restructure

## Metadata

- **Number:** 001
- **Status:** completed
- **Created:** 2026-07-08
- **Last refreshed:** 2026-07-08
- **Refinement count:** 0
- **Plan type:** migration/infra/refactor
- **Verification Policy:** Adaptive (default)
- **Related PRD:** `_claude/prd/cross-harness-repo-architecture.md` (v1.1)

## Executive Summary

Restructure `dionridley/ai-tools` from a Claude-only plugin marketplace into a dual-harness repo serving Claude Code and Pi from the same bundles. The three plugin folders move under `bundles/` via `git mv` (`project-mgmt-plugin/` → `bundles/project-management/`, `engineering-tools/` and `experimental/` keep their names under `bundles/`), with plugin **names** and the marketplace name `dion-tools` frozen so existing enablement keys never change. Two root catalogs anchor the repo: the updated `.claude-plugin/marketplace.json` (sources re-pointed, placeholder owner fixed) and a new root `package.json` — the single manifest Pi reads on a whole-repo git install — globbing `bundles/*/skills/*`. Each bundle also gets an inert-until-needed `package.json` (`@dionridley/<bundle>`, version locked to the bundle's semver) so dormant npm publishing (Option B) stays a publish step, not a restructure.

The change is purely structural — zero skill-content edits (those are portability Phases 1–8, which run **after** this ships, inside the new layout). It lands as one PR with a minor version bump per bundle, README install/selection recipes for both harnesses, and the Phase 0 capability matrix + sequencing note appended to `.research/skill-portability-plan.md` as part of the same change. Risk is inherently low: Pi consumers don't exist yet, and every real Claude install points at the untouched `claude-plugins` predecessor repo — the standing rollback net until Stage 4 re-pointing (out of scope here).

## Current State

- Three plugin folders at repo root, each with `.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`, and `skills/`:
  - `project-mgmt-plugin/` — plugin name `project-management` v2.3.0; skills `dr-init`, `dr-research`, `dr-prd`, `dr-plan`, `dr-ship`; `agents/plan-verifier.md` registered in plugin.json.
  - `engineering-tools/` — v0.3.1; skills `frontend-design`, `react-19`.
  - `experimental/` — v0.6.0; skill `mvp`.
  - 8 `SKILL.md` files total (Glob-confirmed 2026-07-08).
- `.claude-plugin/marketplace.json` — name `dion-tools`, **placeholder owner** (`Dev Team` / `dev@example.com`), sources `./project-mgmt-plugin`, `./engineering-tools`, `./experimental`.
- **No Pi manifest anywhere** — no root `package.json`; `pi install git:` has no install path today.
- Root `README.md` — titled "Claude Code Plugin Marketplace"; all install commands and plugin-table links reference `dionridley/claude-plugins` and the old folder paths.
- Root `CLAUDE.md` — Repository Structure tree and prose describe the old layout.
- ~~`.claude/skills/skill-creator/` — repo-level dev skill; **does not move**.~~ *(Correction 2026-07-08, from the Phase 1 verifier: this path was never tracked in ai-tools — it exists only in the legacy repo. CLAUDE.md's structure map is stale on this line; fix during the Phase 3 CLAUDE.md rewrite.)*
- `.gitignore` — has one uncommitted modification (adds `_claude/`); rides this PR deliberately.
- `_claude/` and `.research/` are gitignored (local outputs); `_claude/plans/` did not exist before this plan.
- The dr-* tooling executing this plan runs from the **old repo's installed plugin** (`claude-plugins` path), so restructuring this working tree cannot break the tooling mid-flight.

## Assumptions

- [x] Pi reads the `pi` manifest from the installed package **root only**; subfolder `package.json` files are inert in a whole-repo install — source-verified in `package-manager.ts` (deep-dive findings, 2026-07-06).
- [x] Claude Code requires each plugin's manifest at `.claude-plugin/plugin.json` relative to the plugin root; the path moves with the folder (current layout + Claude docs).
- [x] Current versions and placeholder owner confirmed by reading `marketplace.json` on 2026-07-08: 2.3.0 / 0.3.1 / 0.6.0, `Dev Team`/`dev@example.com`.
- [x] All three bundles have `README.md` and `CHANGELOG.md` to receive updates (Glob-confirmed 2026-07-08).
- [x] Plugin names (and the marketplace name `dion-tools`) are the enablement keys; folder paths are internal. Renaming folders while freezing names preserves existing enablements (Pi research + PRD FR1/FR3; marketplace name kept by PRD's zero-behavioral-change target — it makes Stage 4 re-pointing seamless).
- [x] No automated test/lint/typecheck exists in this repo (CLAUDE.md: manual validation, no test suite) — the Definition of Done substitutes manifest-parse and structure-integrity checks; the typecheck line is struck.
- [x] Exact current Claude CLI syntax for marketplace operations — resolved in Phase 3 via `claude plugin --help`: `claude plugin marketplace add <source>` (URL/path/GitHub), `claude plugin install <plugin>@<marketplace>`, `claude plugin validate <path>`, `claude plugin tag`. The old `claude plugins add` form is gone from the README.
- [x] Root README can absorb the cross-harness install sections without a ground-up rewrite — it got a clean full rewrite in Phase 3 (simpler than incremental edits; all four recipes present).
- [x] No load-bearing references to old folder paths exist outside `CLAUDE.md` and the READMEs — Phase 3 `git grep` sweep confirmed: zero `project-mgmt-plugin` hits; only exempt `claude-plugins` hits (README supersedes-note, `claude-plugins-official`).

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

### Blocking

Must resolve before implementation starts.

- None — all design decisions are locked in PRD v1.1 (layout, names, manifests, versioning, npm scope, sequencing).

### Non-Blocking

Can resolve during implementation.

- [x] ~~[OPEN] Tag the release commit with a repo-level git tag as a courtesy pinning point for future Pi consumers?~~ **Resolved 2026-07-08 at ship time: no tag.** Zero Pi consumers exist and tags are retrofittable via `claude plugin tag` (per-plugin `{name}--v{version}` tags — dissolves the repo-level-version awkwardness). Revisit triggers + mechanism documented in `.research/pi-releases.md`.

**Decided (recorded for the record, not open):** version bumps are **minor** per bundle (PRD Release Strategy — the added `package.json` is a new consumer-visible surface); the PRD permits flipping to patch at release time if that feels inflated, but the default stands unless Dion objects at review. The `pi/` and `claude/` escape-hatch folders start **absent** (PRD FR5) — do not create empty directories.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [x] All three bundles live under `bundles/` (`project-management`, `engineering-tools`, `experimental`) with plugin names, descriptions, and the marketplace name unchanged; owner block is real (`Dion Ridley` / `aitools@dionridley.com`). *(Final verifier: byte diff `ed6a67f..HEAD` confirms descriptions untouched — an earlier console DIFF on experimental's description was an em-dash encoding artifact, disproven at byte level.)*
- [x] Root `package.json` exists: `"private": true`, `"keywords": ["pi-package"]`, `pi.skills = ["bundles/*/skills/*"]` — and that glob matches exactly the 8 skill directories, nothing else. *(EXACT MATCH (8 dirs); carries the Phase-4-documented `"version": "0.0.0"` addition.)*
- [x] Each bundle has a `package.json` named `@dionridley/<bundle>` whose version equals its `plugin.json` and its marketplace entry at the release commit. *(Triple-equality OK ×3.)*
- [x] Versions bumped minor with CHANGELOG entries dated 2026-07-08: project-management **2.4.0**, engineering-tools **0.4.0**, experimental **0.7.0**.
- [x] `git log --follow` returns pre-move history for a sampled `SKILL.md` in each bundle. *(dr-research → `e359b1e`, frontend-design → `d403b86`, mvp → `94fd9e7`.)*
- [x] Root README documents all four recipes: Claude install (re-pointed to `dionridley/ai-tools`), Pi whole-repo install, Pi per-bundle opt-out filter, Pi local-path dev install; `CLAUDE.md` structure map matches the new layout.
- [x] `.research/skill-portability-plan.md` carries the Phase 0 capability matrix and the restructure-first sequencing note.
- [x] Smoke test passes: a fresh-profile Claude install from this repo lists all 3 plugins at the bumped versions, all 8 skills load and route from `bundles/` paths, and `project-management:plan-verifier` resolves as an agent — with zero mutation to the developer profile or the old repo. *(All clauses met, agent clause by Dion's direct in-session confirmation; dev profile and legacy repo verified untouched by the final verifier.)*
- [x] **Deferred by design (not gating this plan):** the two Pi-side PRD acceptance criteria (`pi install git:…` succeeds; filter snippet excludes `experimental`) execute in portability Phase 8 when Pi access exists. They remain PRD-level criteria; this plan records them as deferred, not failed. *(Recorded in both this plan and the portability plan's appendix.)*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- All tracked JSON manifests parse:
  ```powershell
  git ls-files "*.json" | ForEach-Object { try { Get-Content $_ -Raw | ConvertFrom-Json | Out-Null; "OK   $_" } catch { "FAIL $_" } }
  ```
  Expected: every line `OK`, no `FAIL`. (New `package.json` files must be `git add`-ed when created so this check sees them.)
- Marketplace structure integrity — every `source` resolves to a directory containing `.claude-plugin/plugin.json`:
  ```powershell
  (Get-Content .claude-plugin/marketplace.json -Raw | ConvertFrom-Json).plugins | ForEach-Object { $p = Join-Path $_.source ".claude-plugin/plugin.json"; if (Test-Path $p) { "OK   $($_.name)" } else { "FAIL $($_.name) -> $p" } }
  ```
  Expected: 3 `OK` lines.
- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — struck: the repo is markdown + JSON only with no test suite (see Assumptions); the two checks above are the closest equivalents.

## Rollback Plan

What it takes to undo this restructure at each phase boundary. The overriding safety property: **every real Claude install points at the untouched `claude-plugins` predecessor repo**, and Pi consumers don't exist yet — so even a bad merge to `ai-tools` main affects zero consumers. Stage 4 (re-pointing installs) is explicitly out of scope.

### Rollback by phase

- **Phase 1 (moves + catalog):** revert the move commit (`git revert` or reset the feature branch). `git mv` is content-preserving; no data restore concept applies.
- **Phase 2 (Pi manifests):** revert the commit — purely additive files delete cleanly.
- **Phase 3 (docs):** revert the commit. The `.research/skill-portability-plan.md` append is a local gitignored file — undo by deleting the appended section (it is clearly delimited).
- **Phase 4 (bumps + changelogs):** revert the commit; versions return to 2.3.0 / 0.3.1 / 0.6.0.
- **Phase 5 (smoke test):** makes no repo changes — rollback = remove the test profile / test marketplace registration.

### Rollback validation

- [x] No rollback scripts exist to rehearse — every rollback is a plain `git revert` of a phase commit. Validation: confirm the working tree is fully committed at each phase boundary so revert boundaries stay clean (enforced by each phase's final "commit" task). *(Tree was clean at every phase boundary; 4 clean commits.)*
- [x] Old-repo isolation holds: `claude-plugins` receives zero writes from this plan (verified implicitly — no task touches that path; Phase 5 teardown re-checks the developer profile still lists the old install). *(Dev profile post-teardown identical to baseline; old repo untouched.)*

### Point of no return

**None inside this plan.** Merging the PR is still reversible (revert the merge; no consumer re-points until Stage 4). The first genuinely irreversible step in the broader transition is Stage 4's install re-pointing, which this plan does not perform.

## Implementation Plan

### Phase 1: Move Bundles and Re-Point the Claude Catalog

#### Entry Preconditions

- [x] On a feature branch created from `main` — branch `001-cross-harness-repo-restructure`, cut by Dion from main's tip (`ed6a67f`).
- [x] Working tree contains only the intended pre-existing change: modified `.gitignore` (adds `_claude/`), which rides this PR deliberately. `git status` shows nothing else.

#### Tasks

- [x] Create `bundles/` and move the three folders with history preserved:
  ```powershell
  New-Item -ItemType Directory bundles | Out-Null
  git mv project-mgmt-plugin bundles/project-management
  git mv engineering-tools bundles/engineering-tools
  git mv experimental bundles/experimental
  ```
  *(Execution note: a transient Windows file lock forced moving `project-mgmt-plugin`'s children piecewise; verifier confirmed the RESULT is identical — one commit, 78 `R100` renames, 1:1 with HEAD~1's tracked files, nothing dropped. The old folder also contained `commands/.gitkeep`, `.gitignore`, `CONTRIBUTING.md`, `LICENSE` — all moved.)*
- [x] Edit `.claude-plugin/marketplace.json`: the three `source` values become `./bundles/project-management`, `./bundles/engineering-tools`, `./bundles/experimental`; owner becomes `{"name": "Dion Ridley", "email": "aitools@dionridley.com"}`. Plugin names, descriptions, versions, and the marketplace name `dion-tools` are untouched.
- [x] Confirm `.claude/skills/skill-creator/`, root `README.md`, `CLAUDE.md`, and `.claude-plugin/` did **not** move. *(Verifier note: skill-creator was never tracked in this repo — nothing to move; see Current State correction.)*
- [x] Commit the phase as a single commit (moves + catalog edit together, so the marketplace never points at missing folders in history). Keep content edits out of this commit to preserve clean rename detection. *(Commit `942ac87`.)*

#### Verification

- [x] Run `git show --name-status -M HEAD` — expected: the moved files appear as `R100` renames (not delete + add pairs); `marketplace.json` appears as `M`. *(78 R100 + 1 M, zero D/A pairs.)*
- [x] Glob `bundles/*/.claude-plugin/plugin.json` — expected: exactly 3 matches.
- [x] Glob `bundles/*/skills/*/SKILL.md` — expected: exactly 8 matches.
- [x] Confirm `project-mgmt-plugin/`, and root-level `engineering-tools/` / `experimental/` no longer exist.
- [x] Run `git log --follow --oneline -- bundles/project-management/skills/dr-plan/SKILL.md` — expected: pre-move commits appear (spot check; the per-bundle sweep is Phase 4). *(Pre-move commits `b5f533b`, `0f448da` visible.)*
- [x] Run Definition of Done commands — both pass. *(8 tracked JSON all OK; 3 structure OK.)*

#### Acceptance Criteria

- Marketplace parses, every `source` resolves to a plugin manifest, and plugin names/versions/descriptions are byte-identical to before the phase. ✅ verifier PASS
- Owner block contains the real name and email; no `example.com` remains anywhere in `marketplace.json`. ✅ verifier PASS
- History follows through the move for the sampled file. ✅ verifier PASS

#### Phase Exit Gate

<!-- verifier-recommendation: yes — load-bearing structural phase with the highest blast radius; every downstream phase builds on these paths, and a fresh-context check that all manifest-referenced paths resolve is cheap relative to the cost of a subtle path error propagating. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *(Ran 2026-07-08: every item PASS, zero FAIL/UNVERIFIED.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Carried forward: fix the stale skill-creator line in CLAUDE.md during Phase 3.)*

### Phase 2: Add the Pi Catalogs (Root + Per-Bundle Manifests)

#### Entry Preconditions

- [x] Phase 1 Exit Gate passed; `bundles/` layout committed.

#### Tasks

- [x] Write root `package.json` exactly per the PRD's "Manifest contents" block:
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
  No `workspaces` field — deferred until the first TypeScript extension lands (research recommendation).
- [x] Write `bundles/project-management/package.json`: name `@dionridley/project-management`, version `2.3.0` (bumps happen in Phase 4), description mirrored from its `plugin.json` (fall back to the marketplace entry text if plugin.json lacks one), `"license": "MIT"`, `"keywords": ["pi-package"]`, `"pi": { "skills": ["skills/*"] }`.
- [x] Same shape for `bundles/engineering-tools/package.json` (version `0.3.1`) and `bundles/experimental/package.json` (version `0.6.0`), descriptions mirrored the same way.
- [x] Add a `node_modules/` line to `.gitignore` — a root `package.json` invites accidental `npm install`; keep the tree clean.
- [x] Do **not** create `pi/` or `claude/` escape-hatch folders (start absent per PRD FR5; the root manifest gains `extensions`/`prompts` globs only when content exists).
- [x] `git add` the four new `package.json` files (brings them under the DoD parse check) and commit. *(Commit `4c289d9`; the `.gitignore` edit rode along, closing out the pending `_claude/` ignore line.)*

#### Verification

- [x] Run Definition of Done commands — the parse check now covers all 8 manifests (marketplace + 3 plugin.json + root package.json + 3 bundle package.json). *(12 tracked JSON files all OK.)*
- [x] Glob-coverage check — the Pi glob matches exactly the skill directories: *(EXACT MATCH, 8 dirs.)*
  ```powershell
  $globDirs = (Get-ChildItem bundles/*/skills/* -Directory).FullName | Sort-Object
  $skillDirs = (Get-ChildItem bundles/*/skills/*/SKILL.md).Directory.FullName | Sort-Object
  if (Compare-Object $globDirs $skillDirs) { "MISMATCH" } else { "EXACT MATCH ($($skillDirs.Count) dirs)" }
  ```
  Expected: `EXACT MATCH (8 dirs)`.
- [x] Read root `package.json` — expected: `private` is `true` (boolean), `pi.skills` is exactly `["bundles/*/skills/*"]`.
- [x] Read the three bundle manifests — expected: versions 2.3.0 / 0.3.1 / 0.6.0 equal their `plugin.json` counterparts; names carry the `@dionridley/` scope.

#### Acceptance Criteria

- Root manifest matches the PRD block verbatim (modulo whitespace); the repo root cannot be published (`private` flag present). *(Annotation from Phase 4: `"version": "0.0.0"` was later added so npm tooling can parse the manifest — a documented deviation from the PRD's literal block; all PRD-required fields remain exactly as specified.)*
- Per-bundle names are `@dionridley/<bundle>`; each version equals the bundle's current `plugin.json` version.
- `bundles/*/skills/*` resolves to exactly the 8 `SKILL.md` directories.

#### Phase Exit Gate

<!-- verifier-recommendation: no — four small JSON files whose exact content is spelled out in the PRD; the scripted parse and glob-coverage checks cover the entire surface, leaving nothing requiring semantic judgment. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All 6 tasks and 4 verification items green; no skips.)*

### Phase 3: Update Docs and Internal References

#### Entry Preconditions

- [x] Phases 1–2 committed (docs must describe the final layout, not a transitional one). *(Commits `942ac87`, `4c289d9`.)*
- [x] Source files exist: `_claude/research/pi-dev-capability-audit-2026-07-06/capability-matrix.md` and `.research/skill-portability-plan.md`. *(Both read in full.)*

#### Tasks

- [x] Verify the current Claude CLI marketplace syntax with `claude plugin --help` (and subcommand help) — resolves the `[?]` assumption. Use the verified syntax in all README command examples below; do not copy the old README's `claude plugins add` form unverified. *(Verified: `claude plugin marketplace add <source>` accepts URL/path/GitHub repo; `claude plugin install <plugin>@<marketplace>`; `claude plugin validate <path>` EXISTS for Phase 4; bonus find — `claude plugin tag` creates `{name}--v{version}` release tags, relevant to the [OPEN] tag question at ship time.)*
- [x] Rewrite root `README.md`: reframe the title/intro as a cross-harness repo (Claude Code marketplace + Pi package); fix the plugin table links to `./bundles/<name>/README.md`; re-point every `dionridley/claude-plugins` install reference to `dionridley/ai-tools`; add the Pi sections — whole-repo install (`pi install git:github.com/dionridley/ai-tools`), per-bundle opt-out via the settings `packages` object-form filter, and local-path install for development (live reference, no copy). Copy the Pi snippets from the verified research — do **not** freelance the syntax. Source: `_claude/research/pi-dev-capability-audit-2026-07-06/deep-dives/one-repo-many-bundles-2026-07-06/findings.md` (settings-filter and install-anatomy sections).
- [x] Update `CLAUDE.md`: Repository Structure tree → `bundles/` layout (note `pi/` and `claude/` escape hatches as start-absent); update prose that names old folder paths; add a line that the root `package.json` is the Pi catalog and that per-bundle `package.json` files mirror `plugin.json`. Also remove the stale `.claude/skills/skill-creator/` structure line (verifier: never tracked in this repo).
- [x] Fix any old-path self-references inside the three bundle READMEs (grep-driven; content edits beyond paths are out of scope). *(Verified no-op: `git grep` found zero old-path or old-repo references in any bundle README.)*
- [x] Repo-wide reference sweep: grep tracked files for `project-mgmt-plugin` and `claude-plugins`; fix live references. Exemptions: CHANGELOG.md historical entries (history is not rewritten), `.research/` and `_claude/` (untracked), and a deliberate predecessor-repo mention in the README if one is kept.
- [x] Append to `.research/skill-portability-plan.md` under a clearly delimited heading: (a) the Phase 0 capability matrix (copied/adapted from the research report), (b) a sequencing note — restructure-first decided 2026-07-08; Phases 1–8 run inside the `bundles/` layout; re-measure the path-variable inventory (66 occurrences / 19 files was counted in the old layout) before Phase 1 starts. (Local gitignored file — rides along, not part of the PR diff.)
- [x] Commit. *(Commit `5162deb`; the portability-plan edit is gitignored and rides locally, as designed. Bonus fixes in the same commit: Phase 0 checklist in the portability plan answered inline; status line updated.)*

#### Verification

- [x] Grep `project-mgmt-plugin` across tracked files — expected: hits only in CHANGELOG history entries, or zero. *(Zero hits.)*
- [x] Grep `claude-plugins` across tracked files — expected: no install commands point there; only a deliberate predecessor mention remains, if any. *(Two hits, both exempt: the README's deliberate supersedes-note and `.claude/settings.json`'s `claude-plugins-official` — Anthropic's own marketplace id, unrelated to the old repo.)*
- [x] Read root `README.md` — expected: all four recipes present (Claude UI + CLI, Pi full install, Pi filter opt-out, Pi local dev).
- [x] Read the appended section of `.research/skill-portability-plan.md` — expected: capability matrix table + sequencing note present. *(22-row matrix + sequencing section appended; Phase 8 also absorbs the two deferred Pi-side ACs.)*
- [x] Run Definition of Done commands — both pass. *(12 JSON OK; 3 structure OK; working tree clean.)*

#### Acceptance Criteria

- Docs describe only the new layout; no live reference to old folder paths or the old repo's install coordinates survives outside changelog history.
- Pi snippets in the README match the research-verified syntax (cited source, not improvised).
- The portability plan file carries the matrix and the sequencing note.

#### Phase Exit Gate

<!-- verifier-recommendation: no — documentation edits; the grep sweeps plus self-review against the cited research snippets cover the surface, and no code paths can break. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All 7 tasks green — one a verified no-op; Pi snippets in the README trace to findings.md ledger claims #1, #2, #5, #6 and the docs-verbatim filter example.)*

### Phase 4: Release Prep — Version Bumps, Changelogs, Manifest Consistency

#### Entry Preconditions

- [x] Phases 1–3 committed; versions still read 2.3.0 / 0.3.1 / 0.6.0 (bumps happen only here, once, at the end). *(Verifier: all nine fields at `e9695d6~1` confirmed pre-bump.)*

#### Tasks

- [x] Bump `project-management` → **2.4.0** in all three places: `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, and its `marketplace.json` entry.
- [x] Bump `engineering-tools` → **0.4.0** (same three places).
- [x] Bump `experimental` → **0.7.0** (same three places).
- [x] Add a CHANGELOG entry per bundle (`## [X.Y.Z] - 2026-07-08`, Keep-a-Changelog categories): **Changed** — folder moved to `bundles/<name>/` (plugin name and behavior unchanged); **Added** — Pi package manifest (`package.json`), making the bundle consumable via Pi as part of the ai-tools repo package.
- [x] Run the `plugin-dev:plugin-validator` agent against the repo (or `claude plugin validate` if the installed CLI has it) — fix anything it flags before proceeding. *(`claude plugin validate` exists and was used on root + all 3 bundles. Flagged and fixed: missing marketplace `metadata.description`; YAML-invalid unquoted `argument-hint` in dr-plan/dr-prd/dr-ship + embedded colon in dr-plan's `description` — quoted, byte-identical content (verifier diff-confirmed), a deliberate behavior-preserving exception to "zero skill-content edits", logged under Fixed in the pm CHANGELOG. All four targets now pass.)*
- [x] If `npm` is available: run `npm publish --dry-run` at the repo root — expected: refusal due to `"private": true` (PRD failure-mode criterion). If npm is unavailable, verify the `private` field by reading the file and note the substitution. *(Deviation, verifier-accepted: dry-run refused with exit 1 but via registry tag validation — an unrelated `ai-tools@1.0.1` exists on npm — because npm's dry-run does not evaluate `private`. The AC's by-read branch holds: `"private": true` committed at package.json:4, the field EPRIVATE enforces on real publish. `"version": "0.0.0"` was added so npm parses the manifest at all.)*
- [x] Commit. *(Commit `e9695d6`, 14 files, verifier-confirmed all within phase scope; tree clean after.)*

#### Verification

- [x] Triple-equality check — for each bundle, plugin.json == package.json == marketplace entry:
  ```powershell
  $mp = Get-Content .claude-plugin/marketplace.json -Raw | ConvertFrom-Json
  foreach ($p in $mp.plugins) {
    $dir = $p.source -replace '^\./',''
    $pj = (Get-Content "$dir/.claude-plugin/plugin.json" -Raw | ConvertFrom-Json).version
    $pk = (Get-Content "$dir/package.json" -Raw | ConvertFrom-Json).version
    if (($pj -eq $pk) -and ($pk -eq $p.version)) { "OK   $($p.name) $pj" } else { "FAIL $($p.name): plugin.json=$pj package.json=$pk marketplace=$($p.version)" }
  }
  ```
  Expected: three `OK` lines showing 2.4.0, 0.4.0, 0.7.0.
- [x] Run `git log --follow --oneline` on one `SKILL.md` per bundle (e.g., `dr-research`, `frontend-design`, `mvp`) — expected: pre-move history for all three. *(Verifier: dr-research back to `e359b1e`, frontend-design to `d403b86`, mvp to `94fd9e7` — all through the move.)*
- [x] Read each CHANGELOG.md — expected: top entry is the new version dated 2026-07-08.
- [x] Run Definition of Done commands — both pass. *(12 JSON OK; 3 structure OK.)*

#### Acceptance Criteria

- All nine version fields agree per bundle at 2.4.0 / 0.4.0 / 0.7.0; changelogs updated per repo convention.
- Root `npm publish` is impossible (private flag verified, by dry-run or by read).
- History preserved through the move for all three sampled files.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the release gate: cross-file version consistency across nine fields plus the PRD acceptance sweep is exactly the class of error a fresh-context verifier catches, and it is the last automated check before the human smoke test. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *(Ran 2026-07-08: every item PASS — npm AC via its by-read branch; frontmatter diff confirmed quotes-only.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Carried to Retro: npm dry-run does not evaluate `private:true` — never rely on it for that failure mode; Phase 2's "verbatim" AC annotated for the version-field addition.)*

### Phase 5: Verify in Production — Claude Marketplace Smoke Test

*(Adapted verify-in-prod: "production" here is a fresh Claude Code profile installing from this repo's working tree. This runs pre-merge by design — the local marketplace add reads the branch state. The marketplace name `dion-tools` collides with the live install of the old repo on the developer profile, so the test uses an isolated profile and never touches the developer profile.)*

#### Entry Preconditions

- [x] Phases 1–4 committed on the feature branch. *(`942ac87`, `4c289d9`, `5162deb`, `e9695d6`.)*
- [x] Claude Code CLI available; Dion present for the interactive invocation pass (skills cannot be invoked non-interactively). *(Interactive pass performed by Dion 2026-07-08.)*
- [x] Marketplace CLI syntax confirmed in Phase 3 (`[?]` assumption resolved).
- [x] A throwaway test project directory exists **outside this repo** for invocations — never invoke `dr-init` inside ai-tools (it would append consumer sections to the dev CLAUDE.md). *(Created under the session scratchpad: `phase5-smoke-project`.)*

#### Tasks

- [x] Create an isolated profile (e.g., set `CLAUDE_CONFIG_DIR` to a scratch directory) and add this repo as a marketplace from its **local path**. *(Done: `CLAUDE_CONFIG_DIR` → scratchpad `phase5-profile`; `claude plugin marketplace add S:/dev/repos/dionridley/ai-tools` succeeded; no name collision because the profile is isolated. Developer-profile baseline captured first: `dion-tools` there sources `S:\dev\repos\dionridley\claude-plugins` with pm 2.2.0 / et 0.3.1 / exp 0.6.0.)* If profile isolation proves finicky, fall back to side-by-side add on the developer profile only if the `dion-tools` name does not collide — and in that case remove it again at teardown. Never remove or modify the existing old-repo marketplace registration (the running dr-* tooling depends on it until Stage 4).
- [x] Enable all three plugins in the test profile; confirm the plugin list shows `project-management` 2.4.0, `engineering-tools` 0.4.0, `experimental` 0.7.0 sourced from `./bundles/*`. *(`claude plugin install <name>@dion-tools` ×3 — all installed, enabled, and listing exactly 2.4.0 / 0.4.0 / 0.7.0.)*
- [x] Invocation pass in the throwaway project — **load-only**: confirm each of the 8 skills loads its SKILL.md and routes/reaches its first interactive step, then abort. Do not execute any skill end-to-end. Specific cautions: `dr-init` — abort at its first prompt; `dr-ship` — it commits/pushes/publishes, so invoke only in the throwaway project (no remote) and abort at its first gate; `mvp` — abort before scaffolding. *(User-executed 2026-07-08; Dion's report: "everything seemed to work", no load failures observed.)*
- [x] Reference-file spot check: in the test session, have one deep skill (`dr-plan` or `dr-research`) actually load one of its `references/*.md` files — proves reference resolution from the new `bundles/` paths, not just SKILL.md discovery. *(Dion observed `templates/plan-base.md` loading from `bundles/project-management/...` and the CREATE-mode routing signal — which requires `references/create-mode.md` to have resolved first, since that file issues the plan-base load. Skill-dir file resolution from the new path confirmed.)*
- [x] Confirm `project-management:plan-verifier` appears as an available agent type in the test session. *(DIRECTLY CONFIRMED by Dion in the test session, reported 2026-07-08 after the Phase 5 verifier ran: the session listed `project-management:plan-verifier` with its full description and tools (Read, Grep, Glob, Bash) among available agent types. This supersedes the earlier equivalence-only evidence the verifier had held at UNVERIFIED. Supporting equivalence data retained: `plugin details` reports `Agents (0)` on both old- and new-layout installs — a display quirk that counts only auto-discovered agents, not manifest-registered ones.)*
- [x] Tear down: remove the test profile / test marketplace registration; confirm the developer profile still lists the old-repo install unchanged. *(Test profile fully deleted — including the user-authorized `.credentials.json` copy — after PowerShell long-path failures were finished off with bash `rm -rf`. Developer profile verified identical to the pre-test baseline: same marketplaces (`dion-tools` → `S:\dev\repos\dionridley\claude-plugins`), same plugins/versions/enablement. Leftover: the empty smoke-project folder is held open by Dion's still-running test session — one placeholder README in the auto-cleaned scratchpad; delete after closing that terminal or ignore.)*
- [x] Record the two Pi-side PRD criteria as **deferred to portability Phase 8** (do not flip them; they gate the PRD, not this plan). *(Recorded in this plan's Success Criteria and in `.research/skill-portability-plan.md`'s appendix — Phase 8 explicitly absorbs both.)*

#### Verification

- [x] Test-profile plugin list output — expected: 3 plugins at 2.4.0 / 0.4.0 / 0.7.0. *(Confirmed, all enabled.)*
- [x] Session evidence (transcript/screenshots) — expected: all 8 skills loaded from `bundles/` paths; one reference file read from a new path; agent resolved. *(User report (all skills loaded, no failures; by construction only new-layout paths existed in the test profile) + observed `plan-base.md` load from `bundles/` path + direct in-session agent-type confirmation — see task notes.)*
- [x] Developer-profile plugin list after teardown — expected: identical to before the phase. *(Marketplace list + plugin list both byte-identical to the captured baseline.)*

#### Acceptance Criteria

- Fresh-profile install from this repo meets the PRD "Claude parity" metric: every skill invokes and loads from the new paths with zero old-path reads.
- No mutation to the developer profile, the old `claude-plugins` repo, or this repo's working tree from the test itself.
- Deferred Pi criteria are explicitly recorded as deferred in this plan.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the final safety net before ship; the verifier independently re-checks all repo-side artifacts and acceptance criteria. The interactive invocation results are user-executed evidence: the verifier marks them from recorded evidence or leaves them UNVERIFIED rather than guessing. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(12 JSON OK; 3 structure OK; tree clean at `e9695d6`.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. *(Ran 2026-07-08: every item PASS except the agent-resolution task, held UNVERIFIED on equivalence-only evidence — subsequently closed by Dion's direct in-session confirmation, which the verifier's own report anticipated as the acceptable closure path.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(Applied; the one UNVERIFIED item flipped only after direct user evidence arrived.)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(No open items remain. Verifier observation carried to Retro: blanket user reports beat no evidence, but a per-skill checklist would make future smoke-test records stronger.)*

## Refinement History

- **2026-07-08:** Initial plan creation.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_claude/plans/in_progress/` to `_claude/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

### What worked

- Restructure-first sequencing: zero content edits in flight meant the move commit was 78 clean `R100` renames — history preservation was provable, not hoped-for.
- The verified research paid off directly: every Pi-mechanics assumption (root-only manifest, inert per-bundle manifests, filter syntax) went into manifests and README recipes without a single surprise.
- Isolated `CLAUDE_CONFIG_DIR` profile for the smoke test: real fresh-install semantics, zero collision with the same-named `dion-tools` marketplace on the dev profile, and the dev profile came through byte-identical.
- `claude plugin validate` earned a permanent spot in the release ritual: it caught a real pre-existing bug (YAML-invalid unquoted `argument-hint` values + an embedded colon in dr-plan's description) that a strict parser would have used to silently drop dr-ship's `disable-model-invocation: true`.
- Fresh-context verifier gates caught what self-review wouldn't: the stale `.claude/skills/skill-creator` doc line (never tracked in this repo) and honest framing of the npm deviation.

### What didn't

- PowerShell 5.1 encoding round-trip: `Get-Content -Raw` on a UTF-8-no-BOM file read as Windows-1252 and mangled every non-ASCII character during the plan-file move — required a full rewrite via the file tools. Never round-trip file content through PS 5.1 string cmdlets.
- Windows file locks twice: a transient handle inside `skills/dr-prd` forced a piecewise `git mv` (identical result, verifier-confirmed), and `Remove-Item -Recurse` hit long-path failures in the test profile's plugin cache (bash `rm -rf` finished the job).
- `npm publish --dry-run` does NOT evaluate `"private": true` — the refusal came from registry state instead (an unrelated `ai-tools@1.0.1` is squatted on npm). The AC closed via its verify-by-read branch.
- Smoke-test record-keeping: the invocation pass came back as a blanket "everything seemed to work" plus two specific observations; the agent-resolution result surfaced only after the final verifier had already held it UNVERIFIED. A printed per-skill checklist for the user would have made the evidence airtight the first time.

### Learnings

- `claude plugin details` counts only auto-discovered agents — `Agents (0)` on a manifest-registered agent is normal. Never use it as agent-registration evidence; ask in-session.
- `claude plugin tag` exists (`{name}--v{version}`, validates plugin.json ↔ marketplace agreement) — directly answers this plan's [OPEN] git-tag question; consider it at ship time and for the release ritual.
- The npm package name `ai-tools` is taken (1.0.1) — root stays `private` forever; any future Option B publishing goes through `@dionridley/<bundle>`, which is conflict-free.
- Freezing the marketplace name (`dion-tools`) keeps enablement keys stable but means side-by-side testing always needs an isolated profile — that's the standing pattern for pre-merge smoke tests in this repo.
- Dev-profile plugin versions can lag the repo (pm was at 2.2.0 installed vs 2.3.0 in the old repo's catalog) — check `claude plugin list` vs catalog before debugging "missing" behavior.
