# Plan: Install & Discovery Docs Pass

## Metadata

- **Number:** 010
- **Status:** draft
- **Created:** 2026-07-21
- **Last refreshed:** 2026-07-21
- **Refinement count:** 1
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** _project/prd/stage-3-harness-artifacts-install-story.md (FR5)

## Executive Summary

This plan delivers FR5 of the Stage 3 PRD — the install & discovery pass — the last remaining Stage 3 slice. The goal: a newcomer (or the maintainer on a fresh machine) can install this repo's tooling on either harness following **only** the repo docs, and the marketplace metadata reads correctly on discovery. Existing channels only — Claude Code marketplace add and Pi git install; npm publishing is explicitly out of scope and the per-bundle `package.json` manifests stay dormant.

The work is an **audit-and-verify pass, not greenfield writing**: the root README already carries per-harness install sections (Claude Code UI + CLI paths, Pi full install, settings filters, local dev install, capability notes). What has never happened is (a) a systematic claims-vs-reality audit of those docs — at least one claim is already known stale (the repo-layout line says `pi/ · claude/` are "absent until needed", falsified by the Stage 3 disposition: they exist as `.gitkeep` placeholders, and Claude plugin hooks are bundle-owned) — and (b) the PRD's acceptance criterion: a from-scratch dry-run on each harness following only the docs, with evidence noted.

Two phases: **(1)** audit every install/discovery claim in the root README, bundle READMEs, and catalog manifests against live reality, recording verdicts evidence-first in `.research/`, then fix what's stale; **(2)** perform isolated from-scratch dry-runs on both harnesses following only the updated docs, capturing evidence, fixing and re-running on any stumble. Once this merges, Stage 3 closes and Stage 4 (deprecation README → GitHub Archive of `claude-plugins`) becomes eligible.

## Current State

- **Root `README.md`** — already substantive: bundle table, Claude Code install (UI + CLI: `claude plugin marketplace add dionridley/ai-tools`, per-plugin installs, update/remove, verify), Pi install (`pi install git:github.com/dionridley/ai-tools`, settings filters, local dev installs, capability notes), repository layout, supersession note pointing at `claude-plugins` (intentional, predates Stage 3). Known stale spot: the layout diagram's `pi/ · claude/ # … (absent until needed)` line — the amended convention (Stage 3 disposition, plans 008/009) is `.gitkeep` placeholders present, with plugin-channel Claude hooks necessarily bundle-owned.
- **Bundle READMEs** — `bundles/{project-management,engineering-tools,experimental}/README.md` exist; install/discovery accuracy unaudited since the Skills 2.0 / portability changes.
- **Catalog manifests** — `.claude-plugin/marketplace.json` (owner `aitools@dionridley.com`, three plugins at 3.1.2 / 0.4.1 / 0.10.1) and root `package.json` (private Pi catalog, `pi.skills` glob). Versions match the memory baseline; consistency against the six per-bundle manifests is re-verified in Phase 1.
- **Live installs on this machine (must remain untouched):** Claude Code serves the plugins from this working tree via the `ai-tools` **directory** marketplace registered in user settings; Pi tracks merged main via the git package. A naive from-scratch dry-run (e.g., adding the GitHub-form marketplace, which shares the name `ai-tools`) would collide with or disturb these — the dry-runs must run isolated.
- **Proven mechanisms feeding the docs:** Pi extension pattern (`_project/docs/pi-extension-pattern.md`, plan 008) and Claude hook pattern (`_project/docs/claude-hook-pattern.md`, plan 009) — the README need not teach these, but must not contradict them.
- **Evidence convention:** scratch/evidence files go in gitignored `.research/` (this plan uses `.research/install-discovery/`), never the session scratchpad.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- [x] The root README already contains per-harness install sections — read 2026-07-21; this pass audits and verifies rather than authors from scratch.
- [x] Marketplace versions (pm 3.1.2 / et 0.4.1 / exp 0.10.1) match the current release baseline — per `.claude-plugin/marketplace.json` read 2026-07-21 and the recent-releases baseline (main `eb86039`); full cross-manifest consistency is re-checked in Phase 1.
- [ ] The GitHub-form install commands documented in the README (`claude plugin marketplace add dionridley/ai-tools`, `pi install git:github.com/dionridley/ai-tools`) resolve against **merged main**, so Phase 1 doc edits are not visible to the dry-run's fetched copy until this PR merges. The dry-run therefore validates the *commands and mechanics* as documented; if Phase 1 changes any install command itself (not expected), record the discrepancy and note a post-merge re-verify.
- [ ] [?] Claude Code's from-scratch dry-run can be isolated from the live config (candidate: `CLAUDE_CONFIG_DIR` pointing at a scratch directory, giving a clean-slate config so the GitHub-form `ai-tools` marketplace never touches the live directory-marketplace registration) — mechanism confirmed empirically at Phase 2 start before any state-changing command.
- [ ] [?] Pi's from-scratch dry-run can be isolated from the live global install (candidate: project-scope install in a scratch project directory, or a temporary config home) — mechanism confirmed empirically at Phase 2 start before any state-changing command.
- No automated test suite exists in this repo (AGENTS.md: validation is manual) — the Definition of Done substitutes manifest JSON validity and the dry-runs themselves for test/lint/typecheck commands.

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

*(none)*

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-21] Exact isolation mechanism per harness for the from-scratch dry-runs. **Hard rule regardless of mechanism: the live configs are never modified.**
  > **Decision:** Named candidates — Claude Code: scratch config dir via `CLAUDE_CONFIG_DIR`; Pi: scratch project-scope install.
  > **Rationale:** Test-only scaffolding, deleted after the dry-run — nothing lasting, nothing in the shipped docs. Phase 2 still verifies isolation empirically with read-only probes before any state-changing command, and escalates rather than touching the live installs if a candidate fails to isolate.
- [x] [DECIDED: 2026-07-21] How far the bundle README audit goes.
  > **Decision:** Full content audit — every claim in all three bundle READMEs, not just install/discovery.
  > **Rationale:** The bundle READMEs haven't been audited since the Skills 2.0 / portability changes; a full claims-vs-reality pass belongs in this docs slice.
- [x] [DECIDED: 2026-07-21] Whether to flip the now-met acceptance-criteria checkboxes in the Stage 3 PRD (it lives in-repo) as part of this PR's close-out.
  > **Decision:** Yes — flip the met criteria at close-out.
  > **Rationale:** This plan completes the PRD's scope; the PRD should read as delivered when Stage 3 closes.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] Every install/discovery claim in the root README is verified accurate or fixed — including the stale `pi/ · claude/` layout line — with per-claim verdicts recorded in `.research/install-discovery/findings.md`.
- [ ] Marketplace metadata reads correctly: names, descriptions, versions, and owner email are consistent across `marketplace.json`, the three `plugin.json` files, and the four `package.json` manifests; only the public address (`aitools@dionridley.com`) appears in public artifacts.
- [ ] A from-scratch dry-run on each harness succeeds following **only** the repo docs, performed in isolation, with evidence captured in `.research/install-discovery/evidence.md` at the moment of observation.
- [ ] The live installs on this machine are demonstrably untouched after the dry-runs (read-only inspection of live config recorded in evidence).
- [ ] Nothing added by this plan references `dionridley/claude-plugins` (the pre-existing supersession note is intentional and stays); npm publishing remains out of scope with per-bundle manifests dormant.
- [ ] Stage 3 PRD FR5 delivered — Stage 3 scope complete; Stage 4 becomes eligible.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — no automated test suite (AGENTS.md: validation is manual). Closest equivalent: both catalogs parse as valid JSON (`.claude-plugin/marketplace.json`, root `package.json`) and the Phase 2 dry-runs pass.
- ~~Lint clean~~ — no linter configured; this plan's surface is markdown and JSON only.
- ~~Typecheck clean~~ — no type system in this plan's surface.

## Implementation Plan

### Phase 1: Audit & Update Install/Discovery Docs

#### Tasks

- [ ] Create `.research/install-discovery/findings.md` and inventory **every install/discovery claim** in the root README (Claude Code section, Pi section, verify steps, capability notes, repository layout) — one line per claim, each tagged `verified` / `stale` / `deferred-to-dry-run`, with the evidence source cited at the moment of observation (008/009 discipline: every doc fact goes through findings.md first).
- [ ] Verify marketplace metadata consistency: `.claude-plugin/marketplace.json` (marketplace name, owner name/email, per-plugin name + description + version) against each bundle's `.claude-plugin/plugin.json` and `package.json`, and the root `package.json` catalog (`pi.skills` glob covers exactly the skill directories). Record deltas in findings.md; fix any drift.
- [ ] Audit the three bundle READMEs **in full** — every claim (skill lists, invocation forms, feature descriptions, capability notes), not just install/discovery (decided 2026-07-21) — against current bundle contents and live behavior. Record verdicts in findings.md; fix what's wrong.
- [ ] Fix the known-stale root README layout line: `pi/ · claude/` are `.gitkeep` placeholders per the Stage 3 disposition (root `claude/` = settings-wired artifacts only; plugin hooks bundle-owned) — wording consistent with AGENTS.md and the two pattern docs.
- [ ] Sweep all public docs touched or audited for the personal email — only `aitools@dionridley.com` may appear.

#### Verification

- [ ] Read the updated root README — layout line matches the amended AGENTS.md escape-hatch convention; no claim tagged `stale` in findings.md remains unfixed.
- [ ] Parse `.claude-plugin/marketplace.json` and root `package.json` as JSON — both valid; versions read pm 3.1.2 / et 0.4.1 / exp 0.10.1 everywhere (or the intentional post-fix values, noted).
- [ ] Read `findings.md` — every inventoried claim has a verdict; `deferred-to-dry-run` items enumerate exactly what Phase 2 must exercise.

#### Acceptance Criteria

- Every install/discovery claim in the root README, and every claim in the three bundle READMEs, has a recorded verdict with evidence.
- All `stale` verdicts are fixed in the same phase; metadata is consistent across all seven manifests.
- No personal email in any public artifact.

#### Phase Exit Gate

<!-- verifier-recommendation: no — docs edits whose real test is Phase 2's empirical dry-run; the findings.md evidence discipline plus self-review covers this phase, and the plan-verifier runs at Phase 2 where the claims get exercised -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: From-Scratch Dry-Runs Following Only the Docs

#### Tasks

- [ ] **Confirm isolation before any state change.** Decided mechanisms (2026-07-21): Claude Code — scratch config dir via `CLAUDE_CONFIG_DIR`; Pi — scratch project-scope install. Verify empirically (read-only probes first) that each gives a clean-slate config and that no dry-run command can write to the live config. Record the mechanism and its confirmation in `evidence.md`. If a mechanism fails to isolate, stop and escalate — never touch the live installs.
- [ ] **Claude Code dry-run:** in the isolated environment, follow the root README's Claude Code section *only* — add the marketplace (GitHub form), install the plugins, run the documented verify step. Record every command, its output, and a verdict in `.research/install-discovery/evidence.md` at the moment of observation. Note that the fetched copy is merged main (Phase 1 doc edits ride this PR; install commands themselves are unchanged unless Phase 1 says otherwise).
- [ ] **Pi dry-run:** in the isolated environment, follow the root README's Pi section *only* — `pi install git:github.com/dionridley/ai-tools`, then the documented discovery/verify expectations (skills list; explicit-only skills hidden from auto-discovery by design). This also re-confirms the PRD edge case: a whole-repo Pi install works with the Stage 3 artifacts present. Record evidence identically.
- [ ] **On any stumble:** fix the doc so the documented path works, note the fix in findings.md, and re-run the failing step from the docs as amended. A dry-run that only passes with off-doc knowledge is a FAIL.
- [ ] **Tear down and prove no side effects:** remove the isolated environments; then read-only inspect the live configs (Claude Code user settings / marketplace registration; Pi settings) and record in evidence.md that they are byte-unchanged from before the dry-runs (capture the before-state read-only at phase start).
- [ ] Close out the PRD (decided 2026-07-21): flip the now-met acceptance-criteria checkboxes in `_project/prd/stage-3-harness-artifacts-install-story.md` — including those satisfied by plans 008/009 — and note Stage 3 scope complete.

#### Verification

- [ ] Read `evidence.md` — both dry-runs show install + discovery succeeding from docs alone, with isolation confirmation, per-command transcripts, and the live-config before/after comparison.
- [ ] In a normal (non-isolated) session context, confirm the live channels still work: the working-tree marketplace still serves the plugins and Pi still lists the git package — recorded read-only.
- [ ] Read `findings.md` — every `deferred-to-dry-run` claim now has a final verdict; any doc fixed during Phase 2 has its fix noted.

#### Acceptance Criteria

- From-scratch install succeeds on each harness following only repo docs (PRD acceptance criterion), evidence captured.
- Live installs untouched — before/after comparison recorded.
- No remaining unverified install/discovery claim in findings.md.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — final phase carrying the plan's user-visible contract (the install docs) and evidence-based claims ("following only the docs", "live config untouched") that need fresh-context semantic evaluation; 008/009 precedent: the verifier caught real claims-vs-evidence gaps -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in the Retro.

## Refinement History

- **2026-07-21:** Initial plan creation.
- **2026-07-21:** Resolved 0 blocking + 3 non-blocking questions (isolation mechanism → named candidates; bundle README audit → full content; PRD checkboxes → flip at close-out); 2 uncertain assumptions deliberately left [?] for empirical Phase 2 confirmation; Verification Policy unchanged (Adaptive).

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

<!-- populated at completion — do not hand-edit before execution finishes -->

### What worked

- [Populated at completion]

### What didn't

- [Populated at completion]

### Learnings

- [Populated at completion — things a future plan would do differently]
