# Plan: Claude Hook Spike

## Metadata

- **Number:** 009
- **Status:** draft
- **Created:** 2026-07-16
- **Last refreshed:** 2026-07-16
- **Refinement count:** 0
- **Plan type:** spike
- **Verification Policy:** Adaptive (default)
- **Related PRD:** _project/prd/stage-3-harness-artifacts-install-story.md
- **Time-box:** Two working sessions (PRD decision 2026-07-16). If there is no load-and-fire signal by the end of session 2, exit via the blocked path and write up. Check the time-box at each Phase Exit Gate; escalate if running significantly over.

## Executive Summary

Second spike under the Stage 3 PRD: prove the Claude Code hook mechanism end to end — the Claude-side mirror of plan 008. Build a minimal, **inert/read-only** hook served from this repo, wire it into a plugin manifest, and watch it load and fire in a live Claude Code session. The live channel already exists: Claude Code on this machine installs these plugins from the local `ai-tools` directory marketplace, so the working tree serves live with no publish step. The spike has a binary exit — *mechanism proven* (demo fires; pattern written down) or *mechanism blocked* (findings and blockers written to `.research/`, revisit decision recorded — including whether to try the PRD's fallback candidates, statusline or output style). Either exit is a full success for the plan.

Deliverables that land regardless of outcome: a Claude-side pattern doc in `_project/docs/`, findings and evidence under `.research/claude-hook-spike/`, the AGENTS.md escape-hatch paragraph amended with the Claude-side outcome (parallel to the Pi sentence plan 008 added), and the demo disposed per the decided convention (removed with `claude/` keeping its `.gitkeep`, unless genuinely useful).

The install & discovery pass (FR5) is deliberately out of scope — it becomes the final Stage 3 plan.

## Current State

- **Shared** artifacts are proven (Stage 2: skills live on both harnesses) and the **Pi-exclusive** mechanism is proven (plan 008, PR #10): `pi.extensions` manifest, recipe in `_project/docs/pi-extension-pattern.md`.
- On the Claude side, bundles carry only skills and agents — both passive markdown (the `plan-verifier` agent loads and spawns fine, so passive Claude-side artifacts already work). No **executable** Claude-exclusive artifact (a hook runs shell commands) has ever been served from this repo. That executable wiring is the untested mechanism and this spike's reason to exist.
- The live test channel: Claude Code was cut over to the local `ai-tools` directory marketplace on 2026-07-13 — the plugins running today's sessions are served directly from this working tree. Consequence for safety: anything wired into a bundle manifest goes live in Dion's real sessions on next load, so the demo must be inert from its first commit to the working tree.
- The `claude/` escape hatch exists as a `.gitkeep` placeholder (amended convention, plan 008). Whether a cross-cutting hook can actually live there — or whether plugin-channel hooks are necessarily bundle-owned — is one of this spike's questions.
- PRD decisions already made (2026-07-16): the artifact is a **hook** (statusline/output style are fallbacks only if hooks prove unworkable); the demo stays inert/read-only and is reviewed before enabling; time-box is two working sessions; disposition convention is `.gitkeep` + pattern doc when no production use case emerges.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- [x] Claude Code serves these plugins live from this working tree via the directory marketplace — cut over 2026-07-13; the dr-* skills running this session are served from it.
- [x] This repo has no automated test/lint/typecheck suite (validation is manual, per AGENTS.md) — the spike's relaxed DoD relies on live verification and evidence capture instead.
- [x] `pi/` and `claude/` exist as `.gitkeep` placeholders and the AGENTS.md escape-hatch convention reflects that — plan 008 (PR #10), verified in the merged tree.
- [ ] [?] Hooks ride the plugin channel per-bundle (wired in a plugin's own manifest), meaning a cross-cutting hook at root `claude/` may not be loadable via the marketplace at all — Phase 1 verifies, and the pattern doc records the real Claude-side ownership rule either way.
- [ ] [?] Hook configuration is captured at session start, so a live-fire test needs a fresh session (or a headless `claude -p` run) rather than firing mid-session — the exact reload story is a Phase 1 question.
- [ ] If the demo hook is removed before merge, bundle manifests end net-unchanged and no version ritual applies (the plan 008 precedent); if the demo stays, the touched bundle's ritual (3 manifests + CHANGELOG) applies before shipping.

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

- None. The PRD decisions (hook as candidate, inert/read-only constraint, time-box, disposition convention) are made; the mechanism unknowns are the spike's Questions to Answer, not blockers.

### Non-Blocking

Can resolve during implementation.

- [ ] [OPEN] Which bundle hosts the demo hook wiring during the spike?
  - Leading candidate: `experimental` — its charter is experimental capabilities, and a throwaway demo fits there better than in `project-management`.
  - Phase 1 picks from evidence about where hooks may actually live (and the root-`claude/` question may reshape this).
- [ ] [OPEN] What is the demo hook's observable behavior?
  - Smallest observable thing, per the plan 008 precedent — a log line, injected context, or debug-visible execution.
  - Phase 1 picks the concrete form from whatever hook surface the docs actually expose (events, matchers, output handling).

## Questions to Answer

- [ ] How does a plugin from this repo wire a hook — which manifest field(s) or files, what config shape (event, matcher, command), and what path variables resolve for hook commands?
- [ ] Does the hook load and fire in a live Claude Code session served from the directory-marketplace install, and what is the reload story (fresh session required? plugin refresh? immediate)?
- [ ] What executes hook commands on Windows (which shell), and does an inert/read-only demo run cleanly in this environment?
- [ ] Does the escape-hatch ownership rule hold on the Claude side — can a cross-cutting hook live at root `claude/`, or are plugin-channel hooks necessarily bundle-owned? *(The answer may amend the rule's Claude-side wording — evidence-based, like plan 008's root-manifest nuance on the Pi side.)*
- [ ] Is there a production-worthy first hook use case, or is the demo removed per the disposition convention (`.gitkeep` + pattern doc remain)?

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

### Phase 1: Research the Hook Mechanism

Target: first half of working session 1.

#### Tasks

- [ ] Locate the hook documentation: the plugin-dev toolkit installed in this environment (its plugin directory carries the plugin-spec docs) and the official Claude Code docs via WebFetch as needed. Identify: (a) the manifest wiring — how a plugin declares hooks (plugin.json field and/or a hooks config file), (b) the hook config shape — events, matchers, command, timeout, and any structured output (e.g., context injection), (c) which events are innocuous and observable enough for an inert demo (session start, prompt submit, notification, …), (d) the Windows execution story — which shell runs hook commands and what portability constraints follow, (e) the reload story for the directory-marketplace live channel, and whether a headless `claude -p` run from Bash can serve as an agent-drivable test channel (the analog of plan 008's `pi -e` + registerTool proof).
- [ ] Cross-check against the local environment for real-world examples of hook wiring: installed plugins that carry hooks (the plugin-dev plugin itself is a candidate), and this repo's `.claude-plugin/marketplace.json`. Read-only inspection; no settings changes.
- [ ] Answer the root-`claude/` question from evidence: can the marketplace/plugin channel load an artifact from outside a bundle at all, or is the Claude-side ownership rule "plugin-channel artifacts are necessarily bundle-owned"? Record the answer with citations — it shapes both placement and the pattern doc.
- [ ] Design the minimal inert demo hook per the decided constraints (inert/read-only; smallest observable thing): concrete event, exact command, file placement + manifest wiring, and the exact test recipe — including whether Dion must start a fresh session and what the agent can drive itself. Record the design in the findings file.
- [ ] Safety review of the design: the command is read-only/log-only, touches nothing outside `.research/` or the session temp directory, embeds no secrets, and is safe to sit live in Dion's real sessions (the marketplace serves this working tree — wiring it IS enabling it on next load).
- [ ] Write findings to `.research/claude-hook-spike/findings.md` with source citations (doc paths or URLs) for every claim, recorded at the moment of observation (plan 008 learning — the verifier caught an observation that skipped the findings file).

#### Verification

- [ ] Read `.research/claude-hook-spike/findings.md` — each of (a)–(e) has an evidence-backed answer with citations, or an explicit unknown with the blocker described.
- [ ] The Phase 2 recipe (demo design, placement, wiring, test steps including the reload story) is recorded in the findings file and follows from the cited evidence.

#### Acceptance Criteria

- The manifest wiring, hook config shape, Windows execution story, and test/reload story are documented with citations — no guesses recorded as facts.
- A concrete Phase 2 build/wire/fire recipe exists, or the blocked path is already triggered with the blocker described.

#### Phase Exit Gate

<!-- verifier-recommendation: no — research-only phase producing findings notes; its real test is Phase 2's empirical load-and-fire, and no repo code changes yet -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: Build, Wire, and Fire the Demo

Target: end of session 1 through session 2. This phase carries the time-box: no load-and-fire signal by the end of session 2 → take the blocked path and move to Phase 3.

#### Tasks

- [ ] Create the demo hook artifact(s) per the Phase 1 design (expected: inside the chosen bundle; adjust to what the evidence actually requires).
- [ ] Wire the manifest per the Phase 1 findings. The bundle's existing skills/agents wiring must remain untouched.
- [ ] **Pre-enable safety review:** re-read the final command as wired — inert/read-only, no secrets, no writes outside the agreed log target. This is the PRD's mitigation for "demo hook does something unsafe," and it happens before any session loads the hook.
- [ ] Fire the hook and capture evidence to `.research/claude-hook-spike/evidence.md`: agent-driven where possible (e.g., a headless `claude -p` smoke run from Bash with hook execution observable), plus Dion's interactive confirmation per the reload story (fresh session via a separate terminal or the `!` prefix). Evidence lines are written only **after** the event they describe (plan 008 learning).
- [ ] Edge case: confirm the touched bundle's existing surface still works with the hook present — skills still listed and invocable, no manifest load errors. Record the result in the evidence file.
- [ ] **Blocked path (only if triggered):** if there is no load-and-fire signal by the end of session 2, stop building — write blockers and partial findings to `.research/claude-hook-spike/findings.md`, record a revisit decision that explicitly weighs the PRD's fallback candidates (statusline / output style), and proceed to Phase 3 in blocked mode. Never silently dropped.

#### Verification

- [ ] Read `.research/claude-hook-spike/evidence.md` — it shows the hook demonstrably loading and firing in a live Claude Code session served from this working tree (or the blocked path fully recorded: blockers, partial findings, revisit decision).
- [ ] The bundle-surface edge case is recorded with its outcome: skills unaffected with the hook present.

#### Acceptance Criteria

- A Claude Code-exclusive artifact from this repo loads and fires in a live session served from this working tree, with evidence under `.research/` — OR the blocked exit is recorded with findings and a revisit decision (fallbacks weighed).
- The touched bundle's existing plugin surface (skills, agents) is unaffected with the hook present.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the proof is empirical (a live Claude Code session the user witnesses); a fresh-context subagent cannot re-run the live channel, and the evidence file is the auditable artifact -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 3: Pattern Doc, Disposition, and Close-Out

Target: session 2.

#### Tasks

- [ ] Write `_project/docs/claude-hook-pattern.md` covering: where a hook lives (the ownership rule as actually proven — including whether root `claude/` is viable for plugin-channel artifacts or bundle-owned is the rule), the manifest wiring, the hook config shape, Windows execution notes, the reload/test story, and the install path (directory marketplace here; what a normal marketplace install would do). Every claim grounded in what the spike actually did — in blocked mode, document what was learned, the blocker, and the fallback status (statusline / output style candidates).
- [ ] Disposition: keep the demo only if it is genuinely useful; otherwise remove it **and its manifest wiring** together, leaving `claude/` with its `.gitkeep`. **Before removing anything the pattern doc quotes, archive it into `.research/claude-hook-spike/`** (plan 008 learning). If removed: touched bundle manifests must end net-unchanged in git status — no version ritual. If kept: run the bundle version ritual (plugin.json + package.json + marketplace.json + CHANGELOG) before shipping.
- [ ] Amend AGENTS.md: add the Claude-side outcome sentence to the escape-hatch paragraph, parallel to the Pi sentence plan 008 added (pointing at `_project/docs/claude-hook-pattern.md`), and adjust the ownership-rule wording only if the spike's evidence requires it.
- [ ] Confirm nothing added by this plan references `dionridley/claude-plugins`.
- [ ] Flip each entry in Questions to Answer with its short answer, and write the spike recommendation (ship-as-is / refactor-to-production / discard / follow-up spike) — final wording lands in the Retro at completion.

#### Verification

- [ ] Read `_project/docs/claude-hook-pattern.md` against `.research/claude-hook-spike/` — every claim matches the recorded evidence; nothing rests on pre-spike assumptions.
- [ ] Read the AGENTS.md escape-hatch paragraph — it now covers both harness pattern docs and contradicts nothing in the amended convention.
- [ ] Glob `claude/**` and check `git status` on touched manifests — the disposition is consistent: `.gitkeep` + net-unchanged manifests, or a kept demo with the version ritual completed.
- [ ] Grep this plan's added/changed files for `claude-plugins` — no new references.

#### Acceptance Criteria

- The pattern doc is accurate against what the spike actually did — location, manifest wiring, config shape, reload story, install path.
- AGENTS.md reflects the Claude-side outcome; the escape-hatch convention stays coherent across both harnesses.
- The disposition left no dangling wiring (or a fully versioned kept artifact).
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
