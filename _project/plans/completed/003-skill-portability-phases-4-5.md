# Plan: Skill Portability Phases 4+5 — `_project/` Rename + AGENTS.md-Canonical dr-init

## Metadata

- **Number:** 003
- **Status:** completed
- **Created:** 2026-07-10
- **Last refreshed:** 2026-07-10
- **Refinement count:** 1
- **Plan type:** migration/infra/refactor
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A (workstream spec: `.research/skill-portability-plan.md`, decisions F + H)

## Executive Summary

This plan executes workstream Phases 4 and 5 of the skill-portability effort as **one breaking release: project-management 3.0.0**. Two coupled changes ship together because both rewrite dr-init's template machinery, and sequencing them in one pass means the template is structurally rewritten only once.

**Workstream Phase 4 (plan phases 1–2):** rename the output-directory convention `_claude/` → `_project/` (`_project/plans/`, `_project/prd/`, `_project/research/`, plus `docs/` and `resources/`). Measured 2026-07-10: **193 occurrences / 23 files, all inside `bundles/project-management/`** — 10 of them in CHANGELOG.md history that stays untouched, leaving **183 occurrences / 22 files** to rename. mvp uses `.mvp/` and engineering-tools is grep-clean, so no other bundle changes. Consumer skills get one-line old-path tolerance; this repo's own gitignored dogfood `_claude/` directory is renamed so dr-plan/dr-ship keep working here.

**Workstream Phase 5 (plan phase 3):** dr-init becomes AGENTS.md-canonical per decision F. AGENTS.md is the generated, section-versioned artifact (`CLAUDE-template.md` → `AGENTS-template.md`); CLAUDE.md becomes a thin generated pointer to it. The three state flows and section-versioning machinery are reworked: State B additionally detects legacy projects (plugin marker in CLAUDE.md, old `_claude/` dirs) and offers conversion. Pi reads AGENTS.md natively (Phase 0 confirmed); Claude Code reaches the content through the CLAUDE.md pointer — smoke-validated in the final phase.

Then the release ritual (plan phase 4: 2.5.0 → 3.0.0 in three version locations + CHANGELOG with migration note) and a user-run smoke pass (plan phase 5, the migration overlay's Verify-in-Prod adapted to this repo's live-serve install).

## Current State

- Baseline: main `9a989dc` (PR #2) — pm 2.5.0 / et 0.4.0 / exp 0.8.0. All skills use spec-relative paths and capability-conditional prose (workstream Phases 1–3 complete).
- All dr-* skills read/write `_claude/docs|plans|prd|resources|research`. dr-init generates a full CLAUDE.md from `templates/CLAUDE-template.md` with three versioned sections (actual current versions: plan-management-workflow **v3**, available-commands **v3**, task-completion-protocol **v1**).
- Known pre-existing staleness (fix in passing, plan phase 3): `section-versioning.md`'s "Current Version" table says v2/v1/v1 (template says v3/v3/v1); the generated plugin marker hardcodes `Plugin: project-management v1.0.0`.
- This repo dogfoods the convention: plans live in gitignored `_claude/plans/` (`.gitignore` line 2).
- The user's installed plugin still serves from the old `claude-plugins` repo (dev-install cutover ON HOLD) — the *installed* dr-ship globs `_claude/plans/in_progress/` and won't see `_project/`; its `@plan-file` argument overrides auto-discovery, so plan 003 ships via explicit path.

### Measured rename inventory (2026-07-10, `_claude/` occurrences to change)

| File | Count |
|---|---|
| README.md (bundle) | 43 |
| skills/dr-init/references/state-c-uninitialized.md | 24 |
| skills/dr-init/references/state-a-fresh.md | 15 |
| skills/dr-plan/references/refine-mode.md | 14 |
| skills/dr-prd/references/refine-mode.md | 13 |
| skills/dr-plan/references/create-mode.md | 10 |
| skills/dr-init/references/state-b-update.md | 10 |
| skills/dr-init/templates/CLAUDE-template.md | 9 |
| skills/dr-init/SKILL.md | 7 |
| skills/dr-research/SKILL.md | 7 |
| skills/dr-prd/references/create-mode.md | 7 |
| skills/dr-plan/references/questions-mode.md | 5 |
| skills/dr-ship/references/ship.md | 4 |
| skills/dr-plan/SKILL.md | 3 |
| skills/dr-ship/SKILL.md | 2 |
| skills/dr-ship/references/preflight.md | 2 |
| skills/dr-prd/templates/prd-base.md | 2 |
| skills/dr-prd/SKILL.md | 2 |
| skills/dr-plan/templates/plan-base.md | 1 |
| skills/dr-plan/references/template-variants.md | 1 |
| skills/dr-research/references/research-methodology.md | 1 |
| skills/dr-research/references/output-formats.md | 1 |
| **Total** | **183** |

Excluded: CHANGELOG.md (10 occurrences — historical record, never rewritten). Also touched outside the bundle: `.gitignore` (1) and the repo's own `_claude/` directory (filesystem rename; gitignored so no git surface).

### Phase 5 prose surface (CLAUDE.md / CLAUDE-template mentions, measured 2026-07-10)

98 occurrences / 11 files in the bundle; CHANGELOG.md (20) stays historical. Load-bearing files: dr-init's five files + template (structural rework), bundle README (14), and three consumer mentions in dr-plan/dr-prd that list CLAUDE.md as a DoD/config source (keep both files listed; flip precedence to AGENTS.md-first). Root repo CLAUDE.md's "Template Section Versioning" section names `CLAUDE-template.md` and needs the rename.

## Assumptions

- [x] Only the project-management bundle references `_claude/` — grep 2026-07-10: 193/23 all in `bundles/project-management/`; mvp keeps state in `.mvp/`; engineering-tools clean.
- [x] Local-path marketplace installs serve the repo working tree live (smoke-proven in plan 002) — the smoke phase sees branch edits without reinstall.
- [x] `claude plugin validate` is available and passes on this repo (ran ×4 in plan 002's release phase).
- [x] Pi loads AGENTS.md natively (global + parents + cwd) — Phase 0 capability matrix, Confirmed 2026-07-06.
- [x] Claude Code applies AGENTS.md's content in a project generated by dr-init 3.0.0 — validated in plan phase 5 Smoke B (2026-07-11): a fresh session quoted the draft-folder execution rule verbatim and named AGENTS.md + section as its source. (Evidence proves the outcome; it doesn't isolate whether the CLAUDE.md pointer or native AGENTS.md reading delivered it — the design is satisfied by either, and the pointer remains the guaranteed floor.)
- [x] The installed (old-repo) dr-ship can ship this plan via explicit `@plan-file` reference (its auto-discovery globs `_claude/` only) **and** its Phase 2 move step — which hardcodes `_claude/plans/completed/` as the target — is neutralized by shipping the plan from `_project/plans/completed/` (the Completion flow moves it there first, so dr-ship sees "already in completed/" and skips the move). *(Verified at ship time 2026-07-11: Ship Report showed no move / nothing to commit; ship proceeded push+PR-only exactly as designed. Refined 2026-07-10 during question resolution.)*
- [x] State B's legacy detection anchor keeps old files detectable after dropping the ` vX.Y.Z` suffix from newly generated markers. *(Validated with a correction 2026-07-10: the anchor as originally written (`<!-- Plugin: project-management` on one line) never existed — the comment opener sits on its own line in every template generation. Corrected anchor: the line `Plugin: project-management`, verifier-confirmed to literally match new templates, the appended-marker blocks, and pre-3.0.0 generated files.)*

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only.

### Blocking

Must resolve before implementation starts.

- (none)

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-10] Exact CLAUDE.md pointer wording — keep ≤ ~10 lines; must instruct Claude Code to read and follow AGENTS.md, carry a plugin marker for State B detection, and invite Claude-specific additions below the managed block.
  > **Decision:** Minimal pointer — one instruction, zero duplicated content.
  > **Rationale:** Nothing to drift when AGENTS.md's versioned sections update; command hints would shadow the canonical available-commands section. Locked wording for `templates/CLAUDE-pointer.md`:
  >
  > ```markdown
  > <!--
  >   Plugin: project-management
  >   Generated by /dr-init. This file is a pointer — AGENTS.md is
  >   the canonical agent guidance for this project.
  > -->
  >
  > # CLAUDE.md
  >
  > Read AGENTS.md and follow all of its guidance. It is the
  > canonical instruction file for every coding agent working
  > in this repository, including Claude Code.
  >
  > <!-- End of plugin-managed section -->
  > <!-- Claude-specific additions go below this line. -->
  > ```
- [x] [DECIDED: 2026-07-10] Whether the plugin.json / package.json / marketplace.json `description` strings mention CLAUDE.md or `_claude/` and need rewording.
  > **Decision:** No rewording needed — confirm-only during phase 3.
  > **Rationale:** Grep 2026-07-10: all three descriptions are generic ("Structured project management with research, PRDs, and implementation plans"); zero CLAUDE.md/`_claude/` mentions. (dr-init's SKILL.md *frontmatter* description does mention them — that is already a phase 3 task, distinct from the manifests.)

## Design Decisions (locked for execution)

Resolved during planning so execution is deterministic; recorded here rather than as open questions.

1. **Artifact model:** AGENTS.md = generated canonical file (header marker comment + intro "guidance to coding agents" + Project Structure (`_project/` tree) + the three versioned sections + end-of-managed-section markers). CLAUDE.md = thin generated pointer from a new `templates/CLAUDE-pointer.md` (single source — three flows reference it; avoids drift).
2. **New state matrix (dr-init Phase 1):** evidence = Read AGENTS.md, Read CLAUDE.md, Glob `_project/**`, Glob `_claude/**` (legacy), marker check in both files.
   - **A — Fresh:** no AGENTS.md AND no CLAUDE.md (or both empty) → create AGENTS.md + CLAUDE.md pointer + 7 `_project/` gitkeeps (9 parallel writes).
   - **B — Initialized:** marker in AGENTS.md → section verify/update against AGENTS-template (today's flow, retargeted). **Legacy variant:** marker in CLAUDE.md and no AGENTS.md → offer conversion: extract the plugin-managed block from CLAUDE.md → write AGENTS.md from it (re-anchored on the current template), replace the block in CLAUDE.md with the pointer, preserve all user content.
   - **C — Uninitialized:** file(s) with content but no marker anywhere → user has own AGENTS.md: append plugin sections to it (today's State C append logic, retargeted); user has only CLAUDE.md: create AGENTS.md with plugin sections + append a short pointer note to their CLAUDE.md (git-safety prompt as today).
   - **Any state:** if `_claude/` exists and `_project/` doesn't → offer the rename (`git mv _claude _project`; plain `mv` fallback when untracked/ignored) before directory backfill.
3. **Marker compatibility:** generated markers keep the exact substring `<!-- Plugin: project-management` (detection anchor) but drop the hardcoded version suffix — versions live in manifests, not generated artifacts.
4. **DoD-source precedence in dr-plan:** AGENTS.md listed before CLAUDE.md in create-mode.md step 5 / refine-mode.md — generated projects now put build/test docs in AGENTS.md.
5. **CHANGELOG history is immutable** — `_claude/` and CLAUDE.md mentions in past entries stay.
6. **This repo's root CLAUDE.md stays a real file** (hand-written, not dr-init-generated; /dr-init never runs in ai-tools). Only its `CLAUDE-template.md` references change.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [x] Zero `_claude/` occurrences in `bundles/` outside CHANGELOG history and the deliberate old-path detection/migration mentions (4 consumer tolerance lines + dr-init's legacy offers), each of which names `_claude/` solely to detect or migrate pre-3.0.0 projects (grep-verified). *(Phase 5 verifier enumerated every hit into an allowed category — no strays.)*
- [x] Zero `CLAUDE-template` references in the repo outside CHANGELOG history (grep-verified; root CLAUDE.md updated). *(One deliberate "formerly CLAUDE-template.md" historical note in root CLAUDE.md — verifier-accepted.)*
- [x] dr-plan, dr-prd, dr-ship, dr-research each carry exactly one old-path tolerance line ("if `_claude/` exists and `_project/` doesn't, suggest the rename"). *(Exactly 4 sites, uniform marker phrase; verifier-confirmed with line numbers.)*
- [x] `templates/AGENTS-template.md` exists (git-mv'd from CLAUDE-template.md), reworded "guidance to coding agents", `_project/` tree, versioned sections intact at v3/v3/v1; `templates/CLAUDE-pointer.md` exists. *(Committed `497bcd8`; smoke A generated from them cleanly.)*
- [x] dr-init's three state flows + SKILL.md implement the new state matrix incl. legacy conversion and the `_claude/`→`_project/` rename offer; `section-versioning.md` retargeted to AGENTS.md with the version table corrected to v3/v3/v1. *(Phase 3 verifier PASS after one fix round; smoke D exercised the conversion + rename end-to-end on a real fixture.)*
- [x] Smoke evidence: fresh /dr-init in a scratch project produces AGENTS.md + CLAUDE.md pointer + `_project/` tree; a legacy fixture gets the conversion + rename offers; a follow-on /dr-plan create lands in `_project/plans/draft/`; the session quotes a plugin-managed rule, proving the pointer path loads on Claude Code. *(Smokes A–D all PASS 2026-07-11 with disk-derived + quoted evidence; see phase 5 annotations.)*
- [x] project-management at 3.0.0 in plugin.json, package.json, and the marketplace.json entry; CHANGELOG has a `## [3.0.0] - 2026-07-10` entry with a breaking-change migration note; other bundles' versions untouched. *(Commit `de4f58c`; et 0.4.0 / exp 0.8.0 unchanged.)*
- [x] `claude plugin validate` passes on the marketplace and all three bundles. *(Run ×4 at every phase gate; final pass 2026-07-11.)*
- [x] This repo's dogfood dir is `_project/` (with `.gitignore` updated) and this plan file lives under it at completion. *(Renamed in phase 2 — copy+delete fallback after a rename lock; this plan is at `_project/plans/in_progress/`, moving to `completed/` at close-out.)*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- Manifests validate: `claude plugin validate .claude-plugin/marketplace.json` plus `claude plugin validate bundles/<name>` for all three bundles — all pass.
- Rename gate: `grep -r '_claude/' bundles/` returns hits only in `bundles/project-management/CHANGELOG.md` after phase 1. From phase 2 onward the deliberate old-path mentions added by design are also allowed: the 4 consumer tolerance lines (phase 2), dr-init's legacy conversion/rename offers (phase 3), and the 3.0.0 CHANGELOG entry (phase 4). No other occurrences. *(Wording corrected in-flight 2026-07-10 — the original "only CHANGELOG from phase 1 onward" contradicted phases 2–3, whose tolerance/migration lines must name the old path to detect it.)*
- Reference integrity: every relative path mentioned in changed skill files resolves to an existing file.

(Tests / lint / typecheck struck: markdown-only repo with no test suite, linter, or type system — validation is the manifest validator + grep gates above, consistent with plans 001/002.)

## Rollback Plan

What it takes to undo this migration at each phase boundary.

### Rollback by phase

- **Phases 1–4 (pre-merge):** all changes are commits on branch `003-skill-portability-phases-4-5` — `git revert` the commit(s) or abandon the branch. The dogfood dir rename (phase 2) is gitignored filesystem state: `mv _project _claude` restores it (revert the `.gitignore` edit alongside).
- **Phase 5 (smoke):** read-only against scratch projects; nothing to roll back in this repo. Scratch fixtures are deleted at teardown.
- **Post-merge:** revert the squash commit on main and release 3.0.1 restoring 2.5.0 content (version numbers must move forward). Installed-user impact is self-limiting: dr-init changes user projects only behind explicit diff-previewed approval.

### Rollback validation

- [x] Branch-only strategy confirmed: no step before the PR merge mutates anything outside this repo's working tree and gitignored dirs. *(Held true through execution — smoke fixtures lived in the session scratchpad; the smoke profile is user-managed.)*
- [x] Dogfood-dir restore (`mv _project _claude` + `.gitignore` revert) rehearsed mentally against phase 2's exact steps — no data loss possible (pure rename). *(Phase 2's actual fallback was copy+delete due to a rename lock; restore remains a pure rename either way.)*
- [x] Runbook note: not applicable (no on-call; solo maintainer). *(Struck as N/A.)*

### Point of no return

Squash-merging the PR to main. After that, users can install 3.0.0 and run conversions on their own projects (each conversion is individually user-approved with a diff preview, so even post-merge exposure is gated). The executing agent pauses for the user's /dr-ship gate before any push — that gate is the confirmation.

## Implementation Plan

Mapping to the workstream: plan phases 1–2 = workstream Phase 4; plan phase 3 = workstream Phase 5; plan phases 4–5 = release + verification.

### Phase 1: Content rename `_claude/` → `_project/` (183 occurrences / 22 files)

#### Entry Preconditions

- [x] On branch `003-skill-portability-phases-4-5` cut from main at `9a989dc` (or later); `git status` clean. *(Verified 2026-07-10: HEAD = 9a989dc, porcelain empty; verifier confirmed.)*
- [x] Rename inventory re-confirmed: `grep -rc '_claude/' bundles/` matches the table above (±0; investigate any drift before editing). *(2026-07-10: exact match, 193 lines / 23 files incl. CHANGELOG. Note: Grep counts are per-line; CHANGELOG is 10 lines / 11 occurrences — one line carries two. Verifier confirmed conservation: 204 content occurrences renamed, CHANGELOG byte-identical to baseline.)*

#### Tasks

- [x] Replace every `_claude/` path occurrence with `_project/` in the 22 inventoried files (all of `bundles/project-management/` except CHANGELOG.md): skill SKILL.mds, references, templates (incl. CLAUDE-template.md — file is renamed later, in phase 3), and the bundle README. Pure mechanical substitution; directory leaf names (`docs`, `plans/draft|in_progress|completed`, `prd`, `resources`, `research`) are unchanged. *(Verifier PASS 2026-07-10: normalized diff byte-identical to pure substitution across all 183 changed lines; zero misses, zero over-renames.)*
- [x] While editing, verify no occurrence is a historical citation that should stay (expected: none outside CHANGELOG.md; annotate here if found). *(Verifier PASS: no history-flavored language among changed lines; none found — as expected.)*

#### Verification

- [x] Run `grep -rn '_claude/' bundles/` — expected: hits only in `bundles/project-management/CHANGELOG.md` (10). *(PASS 2026-07-10: 10 lines / 11 occurrences, CHANGELOG only; verifier independently confirmed.)*
- [x] Run `grep -rc '_project/' bundles/project-management/` — expected: per-file counts match the inventory table (183 total across the 22 files). *(PASS: all 22 per-file counts exact; sum 183; verifier independently confirmed.)*
- [x] Read 3 spot-check files (bundle README structure tree, dr-plan create-mode.md phase 3/10, dr-ship SKILL.md Phase 0) — expected: paths read naturally, no `_claude`/`_project` hybrids like `_project/plans` under a `_claude/` tree diagram. *(PASS: spot-reads clean; verifier's hybrid greps — slash-less remnants, `_projects` typos — returned nothing.)*

#### Acceptance Criteria

- Zero `_claude/` in bundle skill/doc content outside CHANGELOG history.
- No leaf-directory names changed; only the root segment renamed.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — 183-site mechanical rename with a deliberate exclusion (CHANGELOG); high blast radius, and misses/over-renames are exactly what a fresh-context grep pass catches. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(2026-07-10: `claude plugin validate` ×4 all passed; rename gate green; reference integrity PASS by construction — pure substring substitution.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Spawned 2026-07-10; report: all items PASS, zero FAIL/UNVERIFIED.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(All PASS → all flipped; nothing kept open.)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Done; verifier's line-vs-occurrence nuance annotated on the inventory precondition; its commit-before-phase-2 recommendation adopted.)*

### Phase 2: Old-path tolerance + repo dogfood migration

#### Entry Preconditions

- [x] Phase 1 fully verified (rename complete; grep gate green). *(Verifier PASS 2026-07-10; committed as `94ac1dd`.)*

#### Tasks

- [x] Add one old-path tolerance line to each consumer skill, at its directory-touching entry point (wording per skill, one sentence each): dr-plan (create-mode.md Phase 3 numbering glob + Phase 10 write), dr-prd (create-mode.md output step), dr-ship (SKILL.md Phase 0 locate), dr-research (SKILL.md output-dir step). Shape: "If `_claude/` exists and `_project/` does not, this project predates the 3.0.0 rename — mention it and suggest running /dr-init (or `git mv _claude _project`), then proceed against the old path for this run." *(Done 2026-07-10; uniform marker phrase "predates the 3.0.0 directory rename" at all 4 sites for grep-ability.)*
- [x] Rename this repo's dogfood dir: `mv _claude _project` (Bash; dir is gitignored → filesystem-only, no git surface). This plan file moves with it — its path becomes `_project/plans/in_progress/003-skill-portability-phases-4-5.md` (in_progress/, not draft/ — corrected in-flight; the plan moved folders at execution start). *(Done 2026-07-10, with a wrinkle: `mv` and `Rename-Item` both hit Permission denied — an external process held a handle blocking rename. Fallback: `cp -r` to `_project/` then `rm -rf _claude` — the delete succeeded even though rename didn't. End state verified identical to a rename.)*
- [x] Edit `.gitignore`: `_claude/` → `_project/`. *(Done; a temporary `_claude/` line added during the locked-dir window was removed once the old dir deleted.)*
- [x] Annotate here for ship time: invoke /dr-ship with the explicit plan path (`@_project/plans/in_progress/003-...`) because the installed old-repo dr-ship auto-discovers only `_claude/`. *(Annotated here and in the Completion section, which also requires the Ship Report to show no move.)*

#### Verification

- [x] Run `grep -rn 'if .?_claude' bundles/project-management/` (or equivalent) — expected: exactly 4 tolerance sites (dr-plan, dr-prd, dr-ship, dr-research); dr-init's offer lands in phase 3, not here. *(PASS: grep for the marker phrase returns exactly those 4 files.)*
- [x] Run `ls _project/plans/in_progress/` — expected: this plan file present; `_claude/` no longer exists. *(PASS: plan present; `_claude/` deleted, confirmed via -d test.)*
- [x] Read `.gitignore` — expected: `_project/` listed, `_claude/` absent; `git status --porcelain` shows no newly-untracked `_project/` noise. *(PASS: `.research` / `_project/` / `node_modules/`; porcelain shows exactly .gitignore + the 4 tolerance files.)*

#### Acceptance Criteria

- Each of the four consumer skills degrades gracefully against a pre-rename project with exactly one added sentence.
- Repo dogfood state consistent: plans resolvable under `_project/`, gitignore intact.

#### Phase Exit Gate

<!-- verifier-recommendation: no — four one-line prose additions plus a local rename, fully covered by the Verification greps/ls above. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(2026-07-10: validate ×4 pass; rename gate green under the corrected wording — `_claude/` hits = CHANGELOG + the 4 deliberate tolerance lines only.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(Done — all 4 tasks verified; the locked-dir fallback honestly recorded on the rename task.)*

### Phase 3: dr-init AGENTS.md-canonical rework

#### Entry Preconditions

- [x] Phases 1–2 verified: all dr-init files already speak `_project/`, so this phase's rewrite is structural only (no path churn mixed in). *(Commits `94ac1dd`, `a3b7fda`.)*

#### Tasks

- [x] `git mv bundles/project-management/skills/dr-init/templates/CLAUDE-template.md bundles/project-management/skills/dr-init/templates/AGENTS-template.md`, then rework: title `# AGENTS.md`; intro "guidance to coding agents working with code in this repository" (absorbs the 2 branded-prose hits deferred from workstream Phase 2); header marker keeps substring `<!-- Plugin: project-management` but drops ` v1.0.0` (design decision 3); versioned sections carried over intact at v3/v3/v1 (content unchanged in this plan → no version bumps); Project Structure tree already `_project/` from phase 1. *(Verifier PASS; staged as R. Correction: the one-line marker substring never existed — `<!--` sits on its own line in every template, old and new. Detection anchor corrected everywhere to the line `Plugin: project-management`; templates untouched.)*
- [x] Create `templates/CLAUDE-pointer.md` with the exact wording locked in Open Questions & Decisions (DECIDED 2026-07-10: minimal pointer, no command hints). *(Verifier PASS: byte-matches the locked wording.)*
- [x] Rework `SKILL.md`: description field (now: AGENTS.md canonical, CLAUDE.md pointer, `_project/` dirs); Phase 1 evidence list + state table per design decision 2 (AGENTS.md/CLAUDE.md/marker/`_project/`/legacy-`_claude/` columns); route unchanged. *(Verifier PASS. The legacy `_claude/`→`_project/` rename offer was hoisted here — SKILL.md Phase 1, all states, before backfill — rather than duplicated per state file; `allowed-tools` gains `Bash(git mv:*)`.)*
- [x] Rework `references/state-a-fresh.md`: 9 parallel writes (7 `_project/` gitkeeps + AGENTS.md from template + CLAUDE.md from pointer template); success message updated. *(Verifier PASS.)*
- [x] Rework `references/state-b-update.md`: retarget section machinery to AGENTS.md/AGENTS-template.md; add legacy-conversion sub-flow (marker in CLAUDE.md, no AGENTS.md → diff-previewed offer: plugin block → AGENTS.md, block replaced by pointer in CLAUDE.md, user content preserved); add legacy-dir offer (`git mv _claude _project`, plain-mv fallback when untracked) ahead of directory backfill; git-safety check now covers both files it may write. *(Verifier PASS after one fix round: initial version overwrote a user's marker-less AGENTS.md during conversion — now branches to State-C-style append; pointer-vs-legacy tiebreak added to Step 0. Dir-rename offer lives in SKILL.md, cross-referenced here.)*
- [x] Rework `references/state-c-uninitialized.md`: no-marker matrix per design decision 2 (own-AGENTS.md append path; CLAUDE.md-only path creates AGENTS.md + appends pointer note); previews and success messages updated. *(Verifier PASS.)*
- [x] Rework `references/section-versioning.md`: all references CLAUDE.md → AGENTS.md / CLAUDE-template → AGENTS-template; **fix stale version table to v3/v3/v1**; maintainer notes updated (marker without version suffix). *(Verifier PASS: table matches the template's actual markers.)*
- [x] dr-plan `references/create-mode.md` step 5 + `references/refine-mode.md` DoD line: list AGENTS.md before CLAUDE.md (design decision 4); check dr-prd create-mode.md's single CLAUDE.md mention for the same treatment. *(Verifier PASS; README's DoD-source line also flipped for consistency.)*
- [x] Root repo `CLAUDE.md`: "Template Section Versioning" section and any other `CLAUDE-template.md` mentions → `AGENTS-template.md`; adjust the repo-structure/dr-init descriptions to the new artifact model. *(Verifier PASS; one deliberate "formerly CLAUDE-template.md" historical note remains.)*
- [x] Bundle `README.md`: dr-init section rewritten (AGENTS.md canonical + CLAUDE.md pointer + conversion story); check remaining CLAUDE.md mentions file-wide (14 measured) — update the generated-artifact ones, keep any that genuinely mean Claude Code's config file. *(Verifier PASS: all remaining mentions audited into allowed categories.)*
- [x] Confirm the three manifest `description` strings remain clean (resolved 2026-07-10: grep shows all three are generic — confirm-only, no edits expected). *(Verifier PASS: zero CLAUDE.md/`_claude/` mentions.)*

#### Verification

- [x] Run `grep -rn 'CLAUDE-template' .` (repo root) — expected: hits only in `bundles/project-management/CHANGELOG.md` and this plan file. *(PASS with annotation: root CLAUDE.md's deliberate "formerly CLAUDE-template.md" note also remains — intentional historical context, verifier-accepted.)*
- [x] Glob `bundles/project-management/skills/dr-init/templates/*` — expected: exactly `AGENTS-template.md` and `CLAUDE-pointer.md`. *(PASS.)*
- [x] Read the reworked SKILL.md state table + each state file — expected: mutually consistent matrix (every AGENTS.md/CLAUDE.md/marker combination routes to exactly one state; legacy variants covered in B; `_claude/`-dir offer present once). *(PASS on verifier re-check, after fixing its two flagged defects: the conversion overwrite-vs-append branch and the multi-line marker anchor. `git mv _claude _project` appears exactly once inside dr-init.)*
- [x] Run `grep -n 'v[0-9]' bundles/project-management/skills/dr-init/references/section-versioning.md` — expected: table shows v3/v3/v1 matching AGENTS-template.md's markers. *(PASS: lines 31–33 ↔ template lines 62/109/126.)*
- [x] Run `grep -rn 'CLAUDE\.md' bundles/project-management/ --include='*.md'` (excl. CHANGELOG) — expected: every remaining mention is either the pointer artifact, the legacy-conversion story, or a genuine Claude Code config reference; none describe CLAUDE.md as the canonical generated file. *(PASS: verifier audited all 60 hits into allowed categories.)*

#### Acceptance Criteria

- A fresh-project walkthrough of state-a-fresh.md on paper yields: AGENTS.md (marker, v3/v3/v1 sections, `_project/` tree) + pointer CLAUDE.md + 7 gitkeeps.
- A legacy-project walkthrough of state-b-update.md yields both offers (artifact conversion, dir rename), each diff-previewed and individually declinable.
- No file anywhere still instructs generating a full CLAUDE.md.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase produces the plan's user-visible contract (templates + state machine); cross-file consistency of the state matrix is semantic and won't be caught by greps alone. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(2026-07-10: validate ×4 pass; rename gate green per corrected wording; reference integrity PASS.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Spawned 2026-07-10. First report: 10/11 tasks PASS, consistency item FAIL with two specified defects. Fixed both + two hardening observations; verifier re-check on the same context: PASS. Gate cleared on attempt 2 of the allowed 3.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(Applied: all items flipped only after the re-check turned the FAIL into PASS; annotations carried onto the relevant tasks.)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Done. Verifier's residual cosmetic nit — conversion success message saying "created" unconditionally — fixed opportunistically ("created / appended to"). Retro note queued: the one-line marker-substring assumption was wrong in the plan itself; smoke D should exercise detection against a real legacy file.)*

### Phase 4: Release 3.0.0

#### Entry Preconditions

- [x] Phases 1–3 verified; working tree contains the complete content change set. *(Commits `94ac1dd`, `a3b7fda`, `497bcd8`.)*

#### Tasks

- [x] Bump `bundles/project-management/.claude-plugin/plugin.json` version 2.5.0 → 3.0.0.
- [x] Bump `bundles/project-management/package.json` version 2.5.0 → 3.0.0.
- [x] Bump the project-management entry in `.claude-plugin/marketplace.json` to 3.0.0.
- [x] Add `## [3.0.0] - 2026-07-10` to `bundles/project-management/CHANGELOG.md`: **Changed** (BREAKING: output dirs `_claude/` → `_project/`; BREAKING: dr-init generates AGENTS.md-canonical + CLAUDE.md pointer), **Added** (old-path tolerance in dr-plan/dr-prd/dr-ship/dr-research; legacy conversion + dir-rename offers in dr-init; CLAUDE-pointer template), **Fixed** (section-versioning version table; stale hardcoded marker version). Include a one-line migration note: "Existing projects: run /dr-init — it offers `git mv _claude _project` and the CLAUDE.md → AGENTS.md conversion." *(Entry written with all four sections + the migration line.)*
- [x] Confirm engineering-tools (0.4.0) and experimental (0.8.0) versions untouched anywhere. *(Grep: marketplace shows 0.4.0/0.8.0; no other version fields changed.)*

#### Verification

- [x] Run `grep -n '"version"' bundles/project-management/.claude-plugin/plugin.json bundles/project-management/package.json` and `grep -n '3.0.0' .claude-plugin/marketplace.json` — expected: 3.0.0 in all three; no other bundle entries changed. *(PASS 2026-07-10.)*
- [x] Read CHANGELOG.md top entry — expected: 3.0.0 dated 2026-07-10 with the migration note. *(PASS.)*
- [x] Run `claude plugin validate` ×4 (marketplace + three bundles) — expected: all pass. *(PASS ×4.)*

#### Acceptance Criteria

- Version agreement across all three declarations + CHANGELOG per the root CLAUDE.md release ritual.

#### Phase Exit Gate

<!-- verifier-recommendation: no — mechanical version edits fully covered by the greps and the validator. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(2026-07-10: validate ×4 pass; rename gate unchanged from phase 3; reference integrity unaffected.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(Done — all five tasks evidence-backed by the verification greps.)*

### Phase 5: Smoke verification (Verify-in-Prod, adapted)

Adapted from the migration overlay: no production system exists; "prod" is a live-served install of the working tree exercised in scratch projects, with the user driving the interactive legs (dr-init is gated on AskUserQuestion approvals by design). **Never run /dr-init inside ai-tools itself.**

#### Entry Preconditions

- [x] Phases 1–4 verified; branch contains the full change set (live-serve means the smoke session sees it without reinstall). *(Commits `94ac1dd`…`de4f58c`.)*
- [x] User available for the interactive pass (same pattern as plan 002); scratch area under the session scratchpad (`smoke-003/`), plus a legacy fixture: a scratch project pre-seeded with a 2.x-style CLAUDE.md (with plugin marker) and a `_claude/` tree. *(Fixtures built 2026-07-10: `fresh/` empty; `legacy/` = committed git repo with old-template CLAUDE.md (v1.0.0 marker, `_claude/` paths, user section) + `_claude/` tree + demo plan.)*
- [x] Smoke profile with the ai-tools marketplace installed available to the user (recreate per plan 002's recipe if needed — the 002 profile was deleted at teardown). *(User recreated `C:\Users\dridl\.claude-smoke` 2026-07-11.)*

#### Tasks

- [x] **Smoke A (fresh init):** user runs /dr-init in an empty scratch project → expects AGENTS.md (marker, sections v3/v3/v1, `_project/` tree) + pointer CLAUDE.md + 7 gitkeep dirs. *(PASS 2026-07-11: user's `tree /f` shows exactly the 9 artifacts + no `_claude/`; I read the generated files off disk — CLAUDE.md byte-identical to the locked pointer template; AGENTS.md marker without version suffix, date substituted 2026-07-11, `_project/` tree, sections at v3/v3/v1 (lines 62/109/126).)*
- [x] **Smoke B (pointer efficacy on Claude Code):** in the smoke-A project, a fresh session is asked to state the plan-folder execution rule (or another plugin-managed rule) — expects the session to quote/paraphrase AGENTS.md content, and to confirm the announced source, proving the pointer path loads (validates the `[?]` assumption). *(PASS 2026-07-11: fresh session quoted the "NEVER execute or implement tasks from plans in the draft/ folder" rule verbatim and attributed it to "AGENTS.md (under the Plan Management Workflow → IMPORTANT: Plan Execution Rules section)". Nuance: evidence proves AGENTS.md content loads and is applied on Claude Code; it does not isolate pointer-following vs native AGENTS.md reading — either mechanism satisfies the design.)*
- [x] **Smoke C (plan into new tree):** user runs /dr-plan with a toy feature in the smoke project — expects the plan file under `_project/plans/draft/`. *(PASS 2026-07-11: `001-browser-todo-app.md` confirmed on disk at `_project/plans/draft/`; completion summary referenced `_project/` paths throughout. Bonus Smoke-B corroboration: the session refused to implement from draft/, citing the project rules.)*
- [x] **Smoke D (legacy conversion):** user runs /dr-init in the legacy fixture — expects State B legacy detection with both offers (CLAUDE.md → AGENTS.md conversion with diff preview; `_claude/` → `_project/` rename), and correct results after approval. *(PASS 2026-07-11: user confirmed via structured question that /dr-init asked and waited before writing. Disk audit of the fixture: `_claude/` gone; `_project/` complete with the demo plan intact; git shows 7 staged R renames (git mv path exercised, history preserved) + M CLAUDE.md + untracked AGENTS.md; new AGENTS.md is current-template (unversioned marker, v3/v3 sections, `_project/` paths); converted CLAUDE.md = pointer + user's "My Project Notes" section byte-identical.)*
- [x] Record each smoke's evidence (quoted session output) as annotations on these checkboxes; fix-and-rerun on failures (edits are live-served). *(Done — A/B/C/D annotated above with quoted output + disk-audit evidence; zero failures, zero reruns needed.)*
- [x] Teardown: delete scratch projects; if a temporary profile was created with copied credentials, delete the copy (user-run, per 002's security protocol). *(Done 2026-07-11: user deleted the profile — verified gone by `-d` test, credentials copy destroyed. Fixture contents deleted; two empty dir husks (`fresh/`, `legacy/`) remain locked by the user's open smoke terminals — credential-free temp space, same as 002's teardown, self-resolving.)*

#### Verification

- [x] Read the user's pasted smoke transcripts — expected: A/B/C/D each show the expected artifacts/behavior, quoted verbatim. *(PASS: A = tree paste, B = verbatim rule quote + source attribution, C = completion summary with `_project/` paths, D = user-confirmed gating; all supplemented by direct disk audits since the fixtures are locally readable.)*
- [x] For Smoke A: user pastes `ls -R` (or tree) of the scratch project — expected: exactly the 9 generated artifacts, no `_claude/`, no full CLAUDE.md. *(PASS: `tree /f` showed exactly the 9 + harness's own `.claude/settings.local.json`; CLAUDE.md read from disk is the pointer, byte-identical to the locked template.)*

#### Acceptance Criteria

- All four smokes PASS with direct quoted evidence (002's lesson: ask the session to quote its loaded instructions — cheap, high-signal).
- The pointer-following assumption in Assumptions flips to `[x]` with the Smoke B citation.
- No regression on Claude Code: the smoke session behaves first-class (structured questions, verifier spawns) throughout.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — final safety net before a breaking release; semantic judgment over transcript evidence, same as plan 002's phase 5. -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(2026-07-11: verifier-confirmed — validate ×4 pass; rename gate green with every `_claude/` hit enumerated into an allowed category; reference integrity pass incl. the deliberate dr-ship→dr-plan cross-skill path.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Spawned 2026-07-11; report: all tasks/criteria PASS — Smokes A/C/D independently re-derived from fixture disk state (byte-identical template/pointer/user-content checks against git history), Smoke B PASS as recorded evidence with verbatim-quote corroboration.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(Applied — all smoke flips stand; Teardown kept `[ ]` per verifier (pending user action, not a failure).)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Done. Outstanding: Teardown flips when the user confirms profile deletion — must be `[x]` or waived before /dr-ship. Retro notes queued: conversion inserts one blank join line (identical-modulo-newline, not pure concatenation); verifier-spawn-inside-smoke-profile never exercised (capability shown on same harness in dev repo); fixture deletion destroys smoke artifacts — the verifier report is the durable evidence.)*

## Refinement History

- **2026-07-10:** Initial plan creation.
- **2026-07-10:** Resolved 2 non-blocking questions (CLAUDE.md pointer locked to minimal wording; manifest descriptions confirmed clean by grep), refined 1 uncertain assumption (ship-path: old dr-ship's hardcoded `_claude/plans/completed/` move target neutralized by shipping from `_project/plans/completed/`), left 1 assumption [?] for smoke validation, kept Verification Policy Adaptive.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/` (the dogfood dir is renamed in phase 2 — use the new paths).
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan — **with the explicit plan path** `@_project/plans/completed/003-skill-portability-phases-4-5.md` (step 2 must have already moved it there: the installed dr-ship auto-discovers only `_claude/` and its move step hardcodes `_claude/plans/completed/`, so it must find the plan already in a `completed/` folder and skip its own move). At the ship gate, confirm the Ship Report's R line shows **no move** before approving.

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- Verifier gates earned their cost again: the phase 3 verifier caught a real design bug (legacy conversion would overwrite a user's own marker-less AGENTS.md instead of appending) and a false detection anchor (the one-line `<!-- Plugin: …` substring never existed — multi-line comment) before anything shipped. Re-checking via a follow-up message to the *same* verifier agent was cheap and kept independence.
- Measured inventories held exactly: 183 occurrences / 22 files matched the plan table ±0 at execution; the phase 1 verifier proved diff purity (normalized diff byte-identical to the substitution).
- Per-file `Edit replace_all` for the mechanical rename; grep gates + validator ×4 at every phase boundary.
- Smoke evidence quality: fixtures in the local scratchpad + live-served installs meant the smoke artifacts were directly readable — disk audits (byte-compares against templates and `git show HEAD:`) beat pasted transcripts. The phase 5 verifier independently re-derived 3 of 4 smokes from disk.
- A structured gating question resolved the ambiguous smoke-D report ("it moved everything") into a clean approval-gate verdict instead of an assumed PASS.

### What didn't

- The dogfood `_claude/` dir rename hit a Windows rename lock (`mv` and `Rename-Item` both denied by an external handle) — fallback was `cp -r` + `rm -rf`, and notably the *delete* succeeded where the rename didn't.
- The plan shipped with an internal contradiction: the DoD rename gate said "only CHANGELOG from phase 1 onward" while phases 2–3 deliberately add `_claude/`-naming tolerance lines. Corrected in-flight, honestly annotated.
- Two stale `draft/` path references were written into phase 2 before the plan moved folders at execution start; plus the marker-substring assumption was wrong as written.
- Compaction reset Edit read-tracking mid-rename — two files read before the boundary needed re-reads.

### Learnings

- Give deliberate old-path mentions a uniform marker phrase ("predates the 3.0.0 directory rename") so allowed exceptions are grep-enumerable.
- Verify detection anchors against actual file bytes, never against an assumed one-line shape — HTML comment markers split across lines.
- Shipping from `completed/` neutralizes the installed old dr-ship's hardcoded `_claude/plans/completed/` move target; the Ship Report must show no move (checked at the gate).
- The legacy conversion joins pointer + user content with one inserted blank line — identical-modulo-newline, not pure concatenation.
- Verifier-spawn-inside-a-smoke-profile was never exercised (no smoke executed a plan); capability demonstrated on the same harness in the dev repo only.
