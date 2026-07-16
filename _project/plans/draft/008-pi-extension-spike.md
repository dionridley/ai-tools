# Plan: Pi Extension Spike

## Metadata

- **Number:** 008
- **Status:** draft
- **Created:** 2026-07-16
- **Last refreshed:** 2026-07-16
- **Refinement count:** 0
- **Plan type:** spike
- **Verification Policy:** Adaptive (default)
- **Related PRD:** _project/prd/stage-3-harness-artifacts-install-story.md
- **Time-box:** Two working sessions (PRD decision 2026-07-16). If there is no install-and-execute signal by the end of session 2, exit via the blocked path and write up. Check the time-box at each Phase Exit Gate; escalate if running significantly over.

## Executive Summary

First plan under the Stage 3 PRD: prove the Pi extension mechanism end to end. Build a minimal TypeScript extension in this repo, wire it into a Pi manifest, install it into Pi through an existing channel, and watch it execute in a live session. The spike has a binary exit — *mechanism proven* (demo runs; pattern written down) or *mechanism blocked* (findings and blockers written to `.research/`, revisit decision recorded). Either exit is a full success for the plan.

Deliverables that land regardless of outcome: a Pi-side pattern doc in `_project/docs/`, findings and evidence under `.research/pi-extension-spike/`, the `pi/` and `claude/` folders per the decided disposition (`.gitkeep` placeholders or real content), the amended AGENTS.md escape-hatch rule text, and the PRD's one remaining open question (manifest mechanism + build step) answered from evidence.

The Claude artifact spike (FR2) and the install & discovery pass (FR5) are deliberately out of scope — they become later plans.

## Current State

- The cross-harness layout is proven for **shared** artifacts: bundles under `bundles/`, dual manifests, skills validated live on both harnesses (Stage 2, PRs #2–#6).
- The root `package.json` is the Pi catalog; its `pi.skills` glob (`bundles/*/skills/*`) is how Pi discovers skills on a whole-repo `pi install git:…`. Pi on this machine tracks merged main via a git package.
- No harness-exclusive artifact exists anywhere in the repo. The root `pi/` and `claude/` escape hatches are absent by rule ("create them only with their first content") — the rule is untested.
- Pi extensions are TypeScript files, a distinct artifact type from skills (capability audit, `_project/research/pi-dev-capability-audit-2026-07-06/`). How a package manifest references them, and whether a build step is required, is unknown — that unknown is this spike's reason to exist.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- [x] Pi is installed and working on this machine — validated live during Stage 2 skill testing.
- [x] The root `package.json` is the only manifest Pi reads on a whole-repo install; `pi.skills` must keep covering exactly the skill directories — AGENTS.md Cross-Harness Packaging section, confirmed live in Stage 2.
- [x] This repo has no automated test/lint/typecheck suite (validation is manual, per AGENTS.md) — the spike's relaxed DoD relies on live verification and evidence capture instead.
- [ ] [?] Pi supports extensions as package-distributed artifacts (not only user-level config) — verified in Phase 1 against the pi-mono source.
- [ ] [?] A pre-merge live-test channel exists (local-path install, or git install of a branch) so the spike can test before merging to main — verified in Phase 1.
- [ ] No bundle's contents change in this plan, so no bundle version ritual applies — root artifacts sit outside bundle versioning (PRD Conventions to Preserve).

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost. Use for high-stakes work or when self-verification has been unreliable.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

### Blocking

Must resolve before implementation starts.

- None. The PRD decisions (time-box, disposition, scope) are made; the mechanism unknowns are the spike's Questions to Answer, not blockers.

### Non-Blocking

Can resolve during implementation.

- [ ] [OPEN] Which channel serves the live test — local-path install or a git install of the spike branch? Decided in Phase 1 once pi-mono confirms what Pi supports.
- [ ] [OPEN] What should the demo extension observably do? Smallest observable behavior wins (e.g., a log line or trivial command). Decided in Phase 1's design task.

## Questions to Answer

- [ ] How do Pi package manifests reference extensions (the `pi.skills` analog)? *(This is the Stage 3 PRD's one remaining open question — answering it here closes it.)*
- [ ] Does Pi load TypeScript extensions directly, or is a build/transpile step required?
- [ ] Do extensions ride the existing install channels (git package / local path), the same way skills do?
- [ ] Does the escape-hatch placement rule hold in practice — does a cross-cutting extension at root `pi/extensions/` install and run from there, with the whole-repo install's skill discovery unaffected?
- [ ] Is there a production-worthy first extension use case, or is the demo removed per the disposition decision (`.gitkeep` + pattern doc)?

Each question should be answerable with evidence, not opinion. By the end of the spike, each `[ ]` flips to `[x]` with a short answer recorded in the Retro section.

## Definition of Done

Spike code is **throwaway by default.** Strict DoD (tests / lint / typecheck) is relaxed — this repo has no automated suite anyway (see Assumptions).

**At every Phase Exit Gate:**

- The phase's Verification commands produce the expected output (or explicit `UNVERIFIED` with reasoning).
- The phase's Acceptance Criteria are met or explicitly deferred with a note.

**At the final Phase Exit Gate, additionally:**

- Every question in "Questions to Answer" is flipped `[x]` with an evidence-grounded answer, OR explicitly marked unanswered with reasoning.
- A clear recommendation is written: ship-as-is / refactor-to-production / discard / do a follow-up spike.

If the spike outcome is "keep some of this code in production," a follow-up plan must bring that code to the full DoD standard — this plan does not.

## Implementation Plan

### Phase 1: Research the Extension Mechanism

Target: first half of working session 1.

#### Tasks

- [ ] Locate the extension API in the pi-mono source (github.com/badlogic/pi-mono) via WebFetch/WebSearch/`gh`, or a clone in the session scratchpad. Identify: (a) the manifest field that references extensions (the `pi.skills` analog), (b) the shape of an extension file (entry point, exports, runtime API), (c) whether Pi loads TypeScript directly or requires a build/transpile step, (d) which install channels deliver extensions.
- [ ] Cross-check against the local Pi installation (installed packages, config) for real-world examples of extension wiring. **Never read `~/.pi/agent/auth.json`** — it holds credentials.
- [ ] Choose the Phase 2 live-test channel (local-path install vs git install of the branch) based on what Pi actually supports; record the choice and flip the corresponding [OPEN] question.
- [ ] Design the minimal demo: smallest observable behavior, file location under `pi/extensions/`, and exact manifest wiring; record the design and flip the corresponding [OPEN] question.
- [ ] Write findings to `.research/pi-extension-spike/findings.md` with source citations (pi-mono file paths or URLs) for every claim.

#### Verification

- [ ] Read `.research/pi-extension-spike/findings.md` — each of (a)–(d) has an evidence-backed answer with citations, or an explicit unknown with the blocker described.
- [ ] The Phase 2 recipe (demo behavior, location, manifest wiring, install channel, test steps) is recorded in the findings file and follows from the cited evidence.

#### Acceptance Criteria

- The manifest mechanism, TS loading story, and install-channel support are documented with citations — no guesses recorded as facts.
- A concrete Phase 2 build/install/test recipe exists, or the blocked path is already triggered with the blocker described.

#### Phase Exit Gate

<!-- verifier-recommendation: no — research-only phase producing findings notes; its real test is Phase 2's empirical install-and-execute, and no repo code changes yet -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: Build, Install, and Execute the Demo

Target: end of session 1 through session 2. This phase carries the time-box: no install-and-execute signal by the end of session 2 → take the blocked path and move to Phase 3.

#### Tasks

- [ ] Create the demo TypeScript extension under `pi/extensions/` per the Phase 1 design.
- [ ] Wire the manifest reference per the Phase 1 findings (expected: root `package.json`; adjust to what pi-mono actually requires). The `pi.skills` glob must remain untouched.
- [ ] Install into Pi via the channel chosen in Phase 1.
- [ ] Execute the extension in a live Pi session and capture the evidence (transcript excerpts/notes) to `.research/pi-extension-spike/evidence.md`. Where agent-driven execution isn't possible, ask Dion to drive the Pi session (`!` prefix or a separate terminal) and capture what it showed.
- [ ] Edge case: run a whole-repo install with the extension artifacts present and confirm skill discovery still works (skills list unchanged, no manifest conflict). Record the result in the evidence file.
- [ ] **Blocked path (only if triggered):** if there is no install-and-execute signal by the end of session 2, stop building — write blockers and partial findings to `.research/pi-extension-spike/findings.md`, record a revisit decision, and proceed to Phase 3 in blocked mode. Never silently dropped.

#### Verification

- [ ] Read `.research/pi-extension-spike/evidence.md` — it shows the extension demonstrably executing in a live Pi session (or the blocked path fully recorded: blockers, partial findings, revisit decision).
- [ ] The whole-repo install check is recorded with its outcome: skills still discovered with extension artifacts present.

#### Acceptance Criteria

- A TypeScript extension from this repo installs into Pi and demonstrably executes in a live session, with evidence under `.research/` — OR the blocked exit is recorded with findings and a revisit decision.
- A whole-repo Pi install still works with extension artifacts present — the root `pi.skills` glob and extension packaging don't conflict.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the proof is empirical (a live Pi session the user witnesses); a fresh-context subagent cannot re-run the live channel, and the evidence file is the auditable artifact -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 3: Pattern Doc, Disposition, and Close-Out

Target: session 2.

#### Tasks

- [ ] Write `_project/docs/pi-extension-pattern.md` covering: where an extension lives (ownership rule — cross-cutting at root `pi/extensions/`, bundle-owned inside its bundle), which manifest references it (exclusivity rule), the build/packaging step (or "none required"), and the install path. Every claim grounded in what the spike actually did — in blocked mode, document what was learned, the blocker, and the "skills-only is Pi's proven surface for now" fallback status.
- [ ] Disposition: keep the demo only if it is genuinely useful; otherwise remove it **and its manifest wiring** together, leaving `pi/` with a `.gitkeep`. Create `claude/` with a `.gitkeep` as well, per the amended convention (the Claude spike may later replace it with real content).
- [ ] Amend AGENTS.md: the escape-hatch rule sentence ("Both folders start absent; create them only with their first content.") and the structure-diagram "starts absent" comments → the new convention: `pi/` and `claude/` exist with `.gitkeep` placeholders (or real content); the exclusivity and ownership rules are unchanged.
- [ ] Update `_project/prd/stage-3-harness-artifacts-install-story.md`: flip the remaining open question to `[x]` with the spike's evidence-based answer (manifest mechanism + build step), dated.
- [ ] Confirm nothing added by this plan references `dionridley/claude-plugins`.
- [ ] Flip each entry in Questions to Answer with its short answer, and write the spike recommendation (ship-as-is / refactor-to-production / discard / follow-up spike) — final wording lands in the Retro at completion.

#### Verification

- [ ] Read `_project/docs/pi-extension-pattern.md` against `.research/pi-extension-spike/` — every claim matches the recorded evidence; nothing rests on pre-spike assumptions.
- [ ] Grep AGENTS.md for `start absent` / `starts absent` — no stale convention text remains.
- [ ] Glob `pi/**` and `claude/**` — both folders exist with `.gitkeep` or real content, and if the demo was removed, no dangling manifest wiring remains in the root `package.json`.
- [ ] Grep this plan's added/changed files for `claude-plugins` — no matches.

#### Acceptance Criteria

- The pattern doc is accurate against what the spike actually did — location, manifest wiring, build step, install path.
- AGENTS.md reflects the amended escape-hatch convention, and both placeholder folders exist.
- The PRD's remaining open question is resolved with the spike's answer.
- Stage 4 remains unblocked — no new references to the old repo.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — AGENTS.md is repo-canonical guidance (high blast radius if wrong), and the doc-accuracy criterion requires semantic evaluation of the pattern doc against the recorded evidence -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

## Refinement History

- **2026-07-16:** Initial plan creation.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form. For this spike, the Retro is where the actual findings live — include the answer to every Questions to Answer entry and the final recommendation.
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
