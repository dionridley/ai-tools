# Plan: Skill Portability Phase 6 — mvp Structural Port

## Metadata

- **Number:** 004
- **Status:** completed
- **Created:** 2026-07-12
- **Last refreshed:** 2026-07-12
- **Refinement count:** 1
- **Plan type:** migration/infra/refactor
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A (workstream doc: `.research/skill-portability-plan.md`, Phase 6 section)

## Executive Summary

Port the experimental bundle's `mvp` skill to run on Pi.dev and any Agent Skills spec harness while staying first-class in Claude Code — the final content-porting phase of the skill-portability workstream (Phases 1–5 shipped in pm 2.5.0/3.0.0; mvp's structural concerns were explicitly deferred to this phase).

The work is capability-conditional prose restructuring in two files plus a release. `references/start.md` carries the Claude-Code-specific **two-session restart machinery** (`.claude/settings.local.json` permissions write → restart → `claude --resume`, plus project `.mcp.json` MCP config) — on harnesses that don't enforce settings-file permissions (Pi parses but does not enforce `allowed-tools`; Phase 0 audit, Confirmed) the restart flow collapses into a single continuous session. `references/build.md` carries the **subagent orchestration** (parallel Agent dispatch, `isolation: "worktree"`, quality-review agents, browser-test agents) — on harnesses without subagent dispatch (package-land in Pi core), the skill degrades to a documented **Reduced Sequential Mode**: the main agent executes delegatable tasks inline, sequentially, keeping `state.json`/agent-logs bookkeeping intact. All conditionals follow the Phase 2 idiom: the Claude Code branch keeps the current text (word-identical where feasible), the "otherwise" branch states the degradation plainly. Releases experimental **0.9.0** (minor — additive conditionals, zero behavior change in Claude Code).

Live Pi-side exercise of mvp (start + build on a toy app) is deliberately **not** in this plan — it is Phase 8's job (test-in-Pi), per the workstream doc.

## Current State

- `bundles/experimental/skills/mvp/` — Skill 2.0 directory: `SKILL.md` (router + Shared Conventions), `references/{start,build,status,summary}.md`, `references/conventions/*`, `references/settings/*.json`, `templates/*`.
- Phases 1–2 groundwork (plan 002) already landed in mvp: relative skill-root paths throughout; conditional conventions in SKILL.md for `$ARGUMENTS` (line 23), AskUserQuestion/Structured Questions (line 61), and task tools (line 140, `state.json` canonical); build.md line 300 task-tools call site already conditional.
- `status.md` and `summary.md` are already harness-neutral (file reads + rendering; "agents spawned" appears only as analytics labels).
- **Correction to earlier framing:** the PID/background-process bash in build.md uses only relative project paths and plain POSIX tools (`ps`, `kill`, `lsof`, `$!`) — it does NOT need the `<skill-dir>` resolved-to-absolute idiom. The actual open item is whether Pi supports bash background execution at all → `[?]` assumption, verified in Phase 8.
- Measured inventory (2026-07-12, verbatim greps; re-verify counts at execution start):

| Surface | Behavioral sites | Where |
|---|---|---|
| Claude Code mechanics (`.claude/`, `.mcp.json`, `--resume`, restart prose) | 16 lines *(corrected from 15 by the phase 1 verifier — two `--resume` hits inside the restart boxes, old lines 111/1164, were uncounted)* | `start.md`; SKILL.md ×3 + build.md:300 already conditional |
| Subagent dispatch / orchestration | ~32 | `build.md` (Steps B–D, core/polish/browser-test sections, Phase 6 recovery); template/status/summary hits are labels only |
| `worktree` / `isolation` | 9 | `build.md` only (Phase 1a.5 git check, Step B.5, Step D merge) |
| Task tools (`TaskCreate` etc.) | 8 | SKILL.md frontmatter + convention; build.md call sites lean on the convention |
| PID/background bash | ~41 lines | `build.md` (+10 in start.md) — harness-neutral POSIX; no edits planned, only the `[?]` Pi background-exec assumption |

- Release baseline: experimental **0.8.0** (pm 3.0.0 / et 0.4.0; main at `b479419`).

## Assumptions

- [x] mvp already carries Phase 1 relative paths and Phase 2 conditional conventions — verified 2026-07-12 by direct read (SKILL.md:23,61,140; build.md:14–18,300).
- [x] Pi parses but does NOT enforce `allowed-tools`, ignores unknown frontmatter (`effort`, `argument-hint`), honors `disable-model-invocation` — Phase 0 audit 2026-07-06, all Confirmed. This is why skipping the settings-write/restart on Pi loses nothing.
- [x] Subagents, task tools, and structured questions are package-land in Pi core — Phase 0 audit. Resolves the workstream doc's Phase 6 scope check: mvp-on-Pi = **Reduced Sequential Mode**, documented in the skill, not "requires subagent support".
- [x] Claude Code resolves bare relative skill refs against the announced base directory — smoke-proven in plan 002; mvp's `references/...` reads need no changes.
- [ ] [?] Pi supports bash background execution (`cmd &`, `$!`, `ps`/`kill` sweeps) — written defensively (the PID system is plain POSIX), verified live in Phase 8.
- [ ] [?] Pi has a project-scoped MCP config analog to `.mcp.json` — Phase 5b is phrased conditionally either way; verified live in Phase 8.
- No test/lint/typecheck commands exist: markdown/docs repo — DoD uses structural grep gates + read-through instead (established in plans 002/003).

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`.
  - Option B (Adaptive): Verifier runs only on phases annotated `verifier-recommendation: yes`.
  - Option C (Never): Agent self-review only.

### Blocking

Must resolve before implementation starts.

- (none)

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-12] Live Claude Code routing smoke (invoke `/mvp` no-args + `/mvp status` in an empty scratch dir via the smoke-profile setup from plan 003)?
  > **Decision:** Skip — verifier only.
  > **Rationale:** Lean per investment level; no smoke-profile setup or credentials dance. Conditionals keep the Claude Code branch word-identical, the Phase 4 verifier reads the full diff, and Phase 8 exercises mvp end-to-end in Pi. Reopen only if execution surfaces doubt about the Claude Code path.
- [x] [DECIDED: 2026-07-12] Reduced-mode analytics semantics: `analytics.agentSpawns` counts real dispatches only (stays 0 in reduced mode); per-task reports still go to `.mvp/agent-logs/` regardless of mode.
  > **Decision:** Keep as encoded.
  > **Rationale:** Honest metric — agentSpawns = real dispatches. Consequence adopted into Phase 2 tasks: status/summary ratio computations get a zero-spawn guard (render "N/A" instead of dividing by zero when reduced mode leaves spawns at 0).

### Design Decisions (locked at planning, 2026-07-12)

- **Degradation model:** Reduced Sequential Mode is a documented mode, not a refusal. Main agent = orchestrator + worker; delegatable tasks execute inline sequentially; locks are trivially satisfied (single actor) but lock bookkeeping still written; agent-logs entries written per task as self-reports; `agentSpawns` counts real dispatches only (confirmed 2026-07-12; status/summary get a zero-spawn "N/A" render guard in Phase 2).
- **Conditional idiom:** identical to Phases 2/4–5 — one capability sentence naming the Claude Code branch first, plain "otherwise" degradation second. Claude Code path text stays word-identical wherever the restructure allows; where flow must fork (restart boxes), the Claude Code branch keeps the current box verbatim.
- **Convention placement:** the subagent-orchestration conditional lives once in SKILL.md's Shared Conventions (like Structured Questions / Task Progress Tracking); build.md call sites reference the mode instead of repeating the conditional per site. Worktree and quality-review conditionals live at their build.md sites (they are build-only).
- **`.mcp.json` degradation:** written only when the harness supports project-scoped MCP config; otherwise skipped with a note that Tidewave/Playwright-dependent features degrade — build.md's existing "Playwright MCP not available → HTTP check only" fallback already handles the downstream.
- **Version bump: MINOR (0.8.0 → 0.9.0).** Additive conditionals, no breaking change in Claude Code behavior; nothing here renames user-facing artifacts.
- **PID/background bash: no edits.** It is harness-neutral POSIX; portability risk is Pi's background-exec support, which is an assumption to verify in Phase 8, not prose to change now.

## Success Criteria

- [x] mvp behaves identically in Claude Code: every conditional's Claude Code branch preserves current behavior, with restart boxes and dispatch rules verbatim where promised. *(phase 4 verifier: both restart boxes byte-identical vs b479419 — in no diff hunk; dispatch semantics verbatim; every hunk additive bracket or documented pre-existing-bug fix)*
- [x] Every Claude-Code-only capability in mvp (settings-write/restart flow, `claude --resume`, `.mcp.json`, subagent dispatch, worktree isolation, task tools, Playwright MCP, AskUserQuestion) is either already conditional or made conditional with a coherent degraded path in this plan. *(phase 4 verifier: capability-by-capability evidence, all eight gated with named degradations)*
- [x] Zero unconditioned harness-specific references remain in the mvp skill: every `Claude Code` / `.claude/` / `.mcp.json` / `--resume` / `worktree` / dispatch-instruction site sits inside conditional phrasing (grep-verified). *(phase 4 verifier: 47 suite hits per-hit judged, zero unconditioned; zero path variables)*
- [x] Reduced Sequential Mode is documented once in SKILL.md Shared Conventions and referenced consistently from build.md. *(phase 4 verifier: single definition SKILL.md:63–71; ten build.md sites reference with per-site consequences only)*
- [x] experimental **0.9.0** released consistently (plugin.json + package.json + marketplace.json entry + CHANGELOG); project-management and engineering-tools untouched. *(phase 4 verifier: three locations at 0.9.0; dated CHANGELOG with four claims spot-checked true; pm 3.0.0 / et 0.4.0 unchanged; branch touches nothing outside experimental + one marketplace line)*
- [x] The two `[?]` Pi-side assumptions (background-exec, MCP config) are recorded in `.research/skill-portability-plan.md` as explicit Phase 8 checks. *(phase 4 verifier: workstream doc lines 129–131)*

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- ~~Tests pass~~ — no test suite (docs repo); replaced by each phase's Verification greps.
- Structural gates: the phase's Verification greps return exactly the expected results.
- Claude-Code-path fidelity: `git diff` of the phase shows the Claude Code branches unchanged except where the phase's tasks explicitly say otherwise.
- ~~Migrations registered / feature flags defined~~ — N/A (no schema, no flags; overlay adjustment struck).

## Rollback Plan

What it takes to undo at each phase boundary. All work is prose in git — rollback is always `git revert` (or branch deletion pre-merge); no data, infra, or state migrations.

### Rollback by phase

- **Phase 1 (start.md):** revert the phase commit. No downstream coupling.
- **Phase 2 (build.md + SKILL.md):** revert the phase commit. SKILL.md convention and build.md references land in the same commit, so revert is atomic.
- **Phase 3 (release):** revert the release commit; CHANGELOG entry disappears with it (nothing published to npm; marketplace serves from git).
- **Phase 4 (verify):** read-only — nothing to roll back.

### Rollback validation

- [x] Rollback mechanism exists and is exercised routinely — plain `git revert`/branch deletion; no scripts needed (justification: prose-only change, validated pattern from plans 001–003).
- Rehearsal and on-call runbook: N/A — single-maintainer repo, no runtime system.

### Point of no return

Squash-merge of the PR to main. After merge, rollback = revert the merge commit (cheap; installed users pick up the revert on next marketplace update). There is no boundary inside execution requiring a pause for confirmation.

## Implementation Plan

### Phase 1: start.md — Conditional Session Mechanics

#### Entry Preconditions

- [x] On feature branch `004-skill-portability-phase-6` cut from main at `b479419` or later. *(verifier: merge-base confirmed)*
- [x] Working tree clean (`git status`). *(confirmed at execution start, 2026-07-12)*

#### Tasks

- [x] Re-measure the start.md inventory (grep `Claude Code|\.claude/|\.mcp\.json|--resume`) and annotate this plan if counts moved from the 15-line table above. *(verifier corrected the count: 16 pre-edit lines, not 15 — table fixed; zero coverage consequence, both uncounted hits were inside the boxes and are conditioned)*
  *(2026-07-12 execution note: counts unchanged — 15 lines. Two pre-existing doc bugs found at those sites and fixed in passing: the intro claimed "Phase 4 writes permissions" and Phase 5b claimed "Settings were already written in Phase 4" — both contradicted the file's own Phase 2 Step 1. In-flight scope addition: the read-through surfaced bare-branded prose outside the grep tokens — four `## Instructions for Claude` headings (start/build/status/summary → "## Instructions for the Agent") and "Claude starts/tells you" wording in the Step 5 dev-server question (→ "the agent"); line 121's "Claude will detect…" stays verbatim because it sits inside the Claude-Code-only restart box. Also fixed two dangling restart references the greps could not see: the Phase 4 opener and the Phase 4→5 transition line. Tool note for retro: a `Claude(?! Code)` lookahead grep silently returned zero matches — false negative; simple alternation found the hits.)*
- [x] Intro block (lines ~4–15): make step 4 and the "Two-session flow" note conditional — Claude Code text preserved; add the single-session branch: on harnesses that don't read tool permissions from `.claude/settings.local.json` (e.g. Pi, which does not enforce `allowed-tools`), skip the permissions write and restart; setup runs in one continuous session. *(verifier PASS — Harness Note at line 15)*
- [x] Phase 2 Step 1 (settings write + restart + STOP): fork on the same condition. Claude Code branch: current text verbatim, including the restart box. Degraded branch: still run the harness-neutral parts (`mkdir .mvp/...`, `git init`, minimal `state.json` with `status: "awaiting_brainstorm"` → proceed immediately to Step 2 without stopping). State statuses stay file-based so resume works identically on both branches. *(verifier PASS — box byte-identical; verifier's line-76 polish observation applied post-report)*
- [x] Phase 1 (existing-state handling): confirm the `awaiting_brainstorm`/`awaiting_scaffold` resume paths read correctly under both branches (no restart implied by the message text on the degraded branch); adjust the two "Permissions loaded..." messages to mode-neutral wording or bracket them. *(verifier PASS — "Setup resumed…" wording)*
- [x] Phase 5b (`.mcp.json`): wrap in the MCP-config conditional per the locked decision. Degraded branch: skip the write, state that Tidewave/Playwright MCP features degrade and build.md's fallback covers it. *(verifier PASS)*
- [x] Phase 9 completion summary + restart notice (lines ~1125–1179): fork the notice — Claude Code branch keeps the box verbatim (`claude --resume`, `.mcp.json` lines included); degraded branch replaces it with a short "run `/mvp build` to continue" (no restart-requiring artifacts were written). Bracket the two summary checklist lines (`settings.local.json`, `.mcp.json`) as conditional. *(verifier PASS — box byte-identical, alternate closer at 1190–1200)*
- [x] Step 4 (Playwright question): add one sentence — offer Playwright E2E only when the harness supports MCP servers; otherwise note browser testing is unavailable and default the choice to disabled. *(verifier PASS — line 192)*

#### Verification

- [x] Grep `Claude Code|\.claude/|\.mcp\.json|--resume` in `start.md` — expected: every hit sits inside a conditional sentence or inside the Claude-Code-branch block of a fork. *(verifier: 27 hits, each judged individually, zero unconditioned)*
- [x] `git diff` — expected: inside Claude Code branches, the restart boxes and step text are character-identical to the pre-phase content (moves/indentation aside). *(verifier: both boxes appear in no diff hunk — byte-unchanged)*
- [x] Read the degraded path end-to-end (Phase 1 → 2 → 5b → 9) — expected: a coherent single-session flow with no dangling references to restarts, settings, or resume commands. *(verifier: full-file sweep of restart/resume/settings/permission/session — every hit accounted for as conditioned, in-box, or benign)*

#### Acceptance Criteria

- A Pi-class harness executing start.md never stops for a restart and never writes `.claude/` or `.mcp.json`, yet produces the same `.mvp/` artifacts and state statuses.
- Claude Code execution is unchanged: same two-session flow, same boxes, same messages.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — user-visible contract with a subtle flow restructure; the two-branch fork must not corrupt the Claude Code path, and only a fresh read catches dangling restart references -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(structural greps + diff fidelity — pass, 2026-07-12)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(spawned 2026-07-12; report received — all substantive checks PASS, one annotation-accuracy FAIL fixed in place)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the verifier's reasoning. *(applied: tasks 2–7 flipped on PASS; task 1's count corrected 15→16 then flipped per the verifier's "correct the annotation, then flip"; line-76 polish observation applied)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(entry-precondition "tree clean" was verifier-UNVERIFIED retroactively but confirmed by me at execution start; no open UNVERIFIEDs carry forward)*

### Phase 2: build.md + SKILL.md — Reduced Sequential Mode

#### Entry Preconditions

- [x] Phase 1 Exit Gate passed (verifier PASS or documented waiver). *(6cfb107)*

#### Tasks

- [x] Add a **Subagent Orchestration** convention to SKILL.md Shared Conventions (per the locked placement decision): if the harness provides a subagent dispatch tool (the Agent/Task tool in Claude Code), orchestrate as written in build.md; otherwise run **Reduced Sequential Mode** — main agent executes each delegatable task inline, one at a time, acting as orchestrator and worker; locks are trivially satisfied but still recorded; per-task reports still written to `.mvp/agent-logs/`; `analytics.agentSpawns` counts real dispatches only. *(verifier PASS — SKILL.md:63–71, all five elements present)*
- [x] build.md Step B (dispatch): condition the batch-dispatch instructions on the convention; in reduced mode the "agent instructions" template becomes the inline task brief (same content, executed directly); the "Launch parallel agents in a single message" line gets the conditional. *(verifier PASS — fork at 731; step refs match the renumbered 1–7 list)*
- [x] build.md Step B isolation choice + Phase 1a.5 git/worktree check: condition on worktree support (`isolation: "worktree"` on Claude Code's Agent tool); without it, agents touching >2 files run sequentially (which reduced mode already guarantees); the git-init recovery check stays unconditional (it protects commits generally). *(verifier PASS — 812–815 + 88/95, check kept unconditional)*
- [x] build.md Step D worktree merge: condition on "if the agent ran with worktree isolation" (already nearly true — tighten the framing so no-worktree harnesses skip cleanly). *(verifier PASS — 870)*
- [x] build.md Step D quality review: add the reduced-mode branch — run the same review checklist yourself as a fresh, skeptical pass and record the same JSON verdict (mirror of the dr-* inline-verifier fallback idiom from Phase 2 of the workstream). *(verifier PASS — 878)*
- [x] Browser-test agent sites (core, polish, browser-test sections): condition dispatch on subagent availability — in reduced mode execute the test script inline using Playwright MCP tools if present; the existing "Playwright MCP not available → HTTP check only" fallback remains the final rung. *(verifier PASS — 510/576/588; fallback intact)*
- [x] "Maximum 3 concurrent agents" / batch tables / Phase 6 error-recovery item 1: annotate for reduced mode (concurrency limits are dispatch-only; "agent returns failed" covers inline task failures identically). *(verifier PASS — 480/486/1112)*
- [x] Add a zero-spawn render guard to `status.md`/`summary.md` ratio computations: agent success rate and quality-review pass rate render "N/A" when the denominator is 0 (Reduced Sequential Mode leaves `agentSpawns` at 0 — per the 2026-07-12 analytics decision). *(verifier PASS — status.md:52, summary.md:71)*
- [x] Re-measure: grep `worktree|isolation` (9 expected pre-edit) and dispatch-instruction sites; annotate this plan with the post-edit conditional count. *(verifier PASS — independently re-ran the greps: 11 post-edit, exact match; 9 pre-edit confirmed at HEAD)*
  *(2026-07-12 execution note: post-edit `worktree|isolation` count is 11 lines in build.md — all inside conditional context (git-check rationale ×2 conditioned, Step B fork lead-in, isolation step block ×4 incl. the new no-worktree-but-subagents branch, merge block ×4). In passing, fixed two pre-existing numbering bugs in Step B (duplicate "3." and duplicate "5." items — now 1–7, and the fork lead-in references the corrected numbers). Task-tool call sites (300, 720, 737, 854, 936, 948) unchanged — they lean on SKILL.md's Task Progress Tracking convention, as pre-existing.)*

#### Verification

- [x] Grep `worktree|isolation` in build.md — expected: every hit inside conditional phrasing or the "if the agent ran with worktree isolation" frame. *(verifier: 11 hits, per-hit judged, zero unconditioned)*
- [x] Grep `TaskCreate|TaskUpdate` in build.md — expected: call sites still lean on the SKILL.md convention (no regressions to unconditional imperative). *(verifier: six hits, content identical to HEAD, line shifts only)*
- [x] Read build.md end-to-end wearing the "no subagents, no worktrees, no task tools" hat — expected: an executable sequential flow from Phase 1 through Phase 7 with no orphaned orchestration steps. *(verifier PASS; its one flagged residual — the unconditional agentSpawns increment at Step C item 7 — hardened post-report with a reduced-mode bracket; its two pre-existing-bug observations fixed post-report: "Phase 11"→"Phase 7" at build.md:295, SKILL.md:12 parallel framing softened)*
- [x] `git diff` — expected: dispatch-path text preserved inside its conditional branch. *(verifier: every hunk additive bracket or semantics-neutral; batching/isolation/merge-ordering verbatim)*

#### Acceptance Criteria

- A harness with zero optional capabilities can execute the entire build loop sequentially, producing the same `.mvp/` artifacts, commits, and gates.
- Claude Code orchestration semantics unchanged: same batching, same isolation defaults, same merge-before-review ordering.
- The Reduced Sequential Mode definition exists exactly once (SKILL.md) and is referenced, not restated, in build.md.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — largest file, highest blast radius; orchestration semantics are exactly where a conditional rewrite silently breaks the Claude Code path, and the sequential-coherence check is semantic -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(structural greps + diff fidelity — pass, 2026-07-12)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(spawned 2026-07-12; report: all tasks + criteria PASS, one hardening recommendation, two pre-existing-bug observations)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the verifier's reasoning. *(all 9 tasks + 4 verification items flipped on PASS; hardening bracket + both bug fixes applied before commit)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(no UNVERIFIEDs; Phase 4's grep suite will re-sweep everything post-release)*

### Phase 3: Release experimental 0.9.0

#### Entry Preconditions

- [x] Phases 1–2 Exit Gates passed. *(6cfb107, da76180)*
- [x] Working tree clean except this phase's edits. *(confirmed pre-edit)*

#### Tasks

- [x] Bump `bundles/experimental/.claude-plugin/plugin.json` version → `0.9.0`.
- [x] Bump `bundles/experimental/package.json` version → `0.9.0`.
- [x] Bump the experimental entry in `.claude-plugin/marketplace.json` → `0.9.0`.
- [x] Add `## [0.9.0] - [execution date]` to `bundles/experimental/CHANGELOG.md`: Added (Reduced Sequential Mode convention; conditional single-session setup path; conditional `.mcp.json`/Playwright offers), Changed (start.md restart flow and build.md orchestration now capability-conditional — Claude Code behavior unchanged). *(2026-07-12 entry; also a Fixed section documenting the three pre-existing doc bugs and the branded-prose neutralization under Changed)*
- [x] Confirm project-management (3.0.0) and engineering-tools (0.4.0) manifests untouched (`git diff --stat` scope check). *(marketplace shows 3.0.0/0.4.0 unchanged; diff touches only experimental files + marketplace.json)*

#### Verification

- [x] Grep `"version"` / `0.9.0` across the three locations — expected: all agree at 0.9.0. *(pass — plugin.json:3, package.json:3, marketplace.json:27)*
- [x] Read CHANGELOG top entry — expected: Keep-a-Changelog format, correct date, categories match the shipped work. *(pass — Added/Changed/Fixed, 2026-07-12)*
- [x] `git diff --stat` — expected: only experimental bundle files + marketplace.json in this phase's commit. *(pass — 4 files)*

#### Acceptance Criteria

- All three version declarations agree at 0.9.0; CHANGELOG documents the conditional-port accurately; no other bundle touched.

#### Phase Exit Gate

<!-- verifier-recommendation: no — mechanical version sync across four grep-able locations; Verification commands cover the surface -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(version-consistency greps + scope check — pass, 2026-07-12)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(all 5 tasks verified by command output; nothing skipped)*

### Phase 4: Verify the Port (final safety net)

#### Entry Preconditions

- [x] Phase 3 committed; all planned content edits final. *(0fe29bc)*

#### Tasks

- [x] Run the full grep suite across `bundles/experimental/skills/mvp/`: `Claude Code|\.claude/|\.mcp\.json|--resume|worktree|isolation` — every hit must sit inside conditional phrasing; record final counts in this plan. *(Expanded 2026-07-12: also grep bare `Claude` with simple alternation — NOT lookahead, which false-negatives — expecting hits only in conditional sentences and the Claude-Code-only restart box; the four "Instructions for Claude" headings were renamed in Phase 1.)* *(verifier PASS — independently re-derived: 47 = 5/30/12 exact match, every hit judged, zero unconditioned; bare-Claude 26 is the case-sensitive count, +5 lowercase suite-covered tokens case-insensitively)*
- [x] Grep `CLAUDE_SKILL_DIR|CLAUDE_PLUGIN_ROOT` — expected zero (regression check on Phase 1/plan 002 work). *(verifier PASS — zero)*
  *(2026-07-12 execution note: final counts — mechanics+worktree suite 47 lines across SKILL.md(5)/start.md(30)/build.md(12), every hit previously per-hit judged by the phase 1/2 verifiers as conditioned or box-gated; path variables 0; bare `Claude` 26 lines, all inside "Claude Code" conditionals or the Claude-Code-only restart box; status/summary/templates/conventions have zero hits of any pattern.)*
- [x] Full-diff read-through of the branch against the Success Criteria list; flip plan-level criteria with evidence notes. *(verifier PASS — all six criteria independently re-derived from the raw branch diff, incl. byte-comparison of both restart boxes vs b479419 and four CHANGELOG claims spot-checked against code)*
- [x] Append the two Phase 8 checks (Pi background-exec, Pi MCP-config analog) to `.research/skill-portability-plan.md`'s Phase 8 section so they cannot be lost. *(done 2026-07-12 — two checklist items with either-way consequences spelled out)*
- [x] Rollback validation: confirm the branch reverts cleanly in principle (commits are per-phase and self-contained; no cross-phase file tangles that would make a single-phase revert dirty). *(verifier PASS — per-commit file sets match declared phase scopes; phase 1's heading hunks don't overlap phase 2's hunks)*

#### Verification

- [x] Run each grep above — expected outputs pinned in the task annotations. *(verifier: exact match, re-derived not trusted)*
- [x] Read `.research/skill-portability-plan.md` Phase 8 section — expected: both deferred checks present. *(verifier: lines 129–131)*

#### Acceptance Criteria

- Zero unconditioned harness-specific references in the mvp skill; zero path-variable regressions.
- Success Criteria all flipped with evidence, or the gap is documented and escalated.
- Phase 8 inherits the deferred Pi-side verifications explicitly.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the overlay's final safety net; independent confirmation that the conditional sweep is complete and the Claude Code path survived, before /dr-ship -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(final grep suite + branch-scope check — pass, 2026-07-12)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(spawned 2026-07-12; whole-branch report: every task, criterion, rollback check, and regression check PASS — zero FAILs, zero UNVERIFIEDs)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the verifier's reasoning. *(all remaining tasks, verification items, and the six Success Criteria flipped on PASS; the verifier's one precision observation — 26 is the case-sensitive bare-Claude count — folded into the annotation)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(nothing carries forward except the two [?] assumptions, which are deliberately Phase 8's inheritance)*

## Refinement History

- **2026-07-12:** Initial plan creation.
- **2026-07-12:** Resolved 0 blocking + 2 non-blocking questions (smoke: skip — verifier only; analytics: agentSpawns = real dispatches, zero-spawn guard task added to Phase 2); both `[?]` assumptions deliberately left uncertain for Phase 8 live validation; Verification Policy reviewed and kept Adaptive.

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

*(populated at completion, 2026-07-12 — executed same-day as creation, three commits `6cfb107`/`da76180`/`0fe29bc`, three verifier gates all PASS)*

### What worked

- **Planning-time measured inventory + verifier re-derivation.** Every phase's counts were pinned before editing and independently re-derived after; the phase 1 verifier caught the one counting error (16 pre-edit mechanics lines, not 15 — two `--resume` hits inside boxes).
- **The "read the degraded path end-to-end" verification item** earned its place: it caught what greps structurally cannot — two dangling restart references (Phase 4 opener, Phase 4→5 transition) and bare-"Claude" prose outside every grep token.
- **Box-fidelity discipline** (edit only lead-in lines, never box interiors) made "Claude Code behavior unchanged" cheaply provable — the verifier byte-compared both restart boxes via diff-hunk absence.
- **Convention-once, reference-per-site** (locked at planning) kept build.md's 10 dispatch sites to one-line brackets; the verifier confirmed no restatement.
- **Same-day plan→questions→execute→verify cycle** — smallest end-to-end turnaround of the workstream so far; the plan was right-sized because plan-002 groundwork had already been measured.

### What didn't

- **Grep lookahead false negative:** `Claude(?! Code)` silently returned zero matches instead of erroring — nearly missed the four "Instructions for Claude" headings. Simple alternation found them. (Same tool-quirk class as plan 003's Glob false negative.)
- **The measured inventory undercounted inside display boxes** — box interiors need counting even when they'll never be edited, or the count is wrong by construction.
- **Pre-existing doc bugs clustered exactly where the conditionals went** (permissions-in-"Phase 4" ×2, duplicate step numbers ×2, phantom "Phase 11") — each forced an in-flight scope judgment. Cheap individually, but plan phases touching old prose should budget for archaeology.

### Learnings

- **In this Grep tool, never use lookaheads — use simple alternation and judge hits manually.** A zero-match lookahead result is indistinguishable from a real zero.
- **"Word-identical where feasible" is a verifiable promise** when scoped to named blocks (boxes, templates): declare which blocks are frozen at planning time and the verifier can prove fidelity mechanically.
- **Degradation conventions compose:** Reduced Sequential Mode reused the Phase 2 idiom (capability sentence → plain otherwise-branch) and the dr-* inline-verifier fallback shape for quality review — no new invention needed, which is why the biggest-file phase produced zero verifier FAILs.
- **Analytics honesty needs a render guard:** any "counts real X only" decision implies a divide-by-zero surface somewhere downstream; hunt for the consumers at decision time (status/summary ratio guards came from the questions round, not execution).
