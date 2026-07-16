# Plan: Pi Extension Spike

## Metadata

- **Number:** 008
- **Status:** completed
- **Created:** 2026-07-16
- **Last refreshed:** 2026-07-16
- **Refinement count:** 1
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
- [x] Pi supports extensions as package-distributed artifacts — confirmed in Phase 1: `pi.extensions` manifest field (pi-mono `loader.ts:548`, `docs/packages.md` "Creating a Pi Package"); real-world example `npm:pi-web-access`.
- [x] A pre-merge live-test channel exists — confirmed in Phase 1: `pi -e <path>` one-run loads and local-path installs serve live without copying (`docs/packages.md`). Git branch refs are not a documented install path, so the git-channel confirm happens post-merge, as the channel decision anticipated.
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

- [x] [DECIDED: 2026-07-16] Which channel serves the live test — local-path install or a git install of the spike branch?
  > **Decision:** Local path first, then git confirm.
  > **Rationale:** Iterate fast with a local-path install (a documented Pi capability); once the extension runs, confirm it also rides the git-package channel — the one production Pi actually uses (pushed spike branch if Pi supports branch refs, otherwise recorded as a post-merge check).
- [x] [DECIDED: 2026-07-16] What should the demo extension observably do?
  > **Decision:** Smallest observable thing — a log line or trivial registered command.
  > **Rationale:** Purely proves load + execute. The concrete form is picked in Phase 1 from whatever API surface pi-mono actually exposes (events, commands, tools).

## Questions to Answer

- [x] How do Pi package manifests reference extensions (the `pi.skills` analog)? *(This is the Stage 3 PRD's one remaining open question — answering it here closes it.)* **A:** a `pi.extensions` array next to `pi.skills` — paths/globs relative to the package root; must be explicit when a `pi` manifest exists (convention-dir auto-discovery only applies without one). PRD question flipped 2026-07-16.
- [x] Does Pi load TypeScript extensions directly, or is a build/transpile step required? **A:** directly, via jiti at runtime — no build step, ship raw `.ts`.
- [x] Do extensions ride the existing install channels (git package / local path), the same way skills do? **A:** yes — npm/git/local path plus `pi -e` one-run loads; git refs are pinned tags/commits, so working-tree testing uses `-e`/local path and the git channel picks changes up post-merge via `pi update --all`.
- [x] Does the escape-hatch placement rule hold in practice — does a cross-cutting extension at root `pi/extensions/` install and run from there, with the whole-repo install's skill discovery unaffected? **A:** yes — proven live (evidence.md Runs 3–4): the model called the extension's tool from a whole-repo package load, and the skill list was intact alongside it.
- [x] Is there a production-worthy first extension use case, or is the demo removed per the disposition decision (`.gitkeep` + pattern doc)? **A:** no production use case yet — demo removed, `.gitkeep` + `_project/docs/pi-extension-pattern.md` remain; recommendation: discard demo, mechanism proven.

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

- [x] Locate the extension API in the pi-mono source (github.com/badlogic/pi-mono) via WebFetch/WebSearch/`gh`, or a clone in the session scratchpad. Identify: (a) the manifest field that references extensions (the `pi.skills` analog), (b) the shape of an extension file (entry point, exports, runtime API), (c) whether Pi loads TypeScript directly or requires a build/transpile step, (d) which install channels deliver extensions. *(Shallow clone @ b8575f6; answers: `pi.extensions`; default-export factory over `ExtensionAPI`; jiti — no build step; npm/git/local + `pi -e`.)*
- [x] Cross-check against the local Pi installation (installed packages, config) for real-world examples of extension wiring. **Never read `~/.pi/agent/auth.json`** — it holds credentials. *(Read settings.json + `npm:pi-web-access` layout; auth.json untouched.)*
- [x] Confirm the decided live-test channel (local path first, git confirm after) against what pi-mono actually supports; note any needed adjustment in the findings file. *(Confirmed; git refs are pinned tags/commits → git confirm is post-merge.)*
- [x] Design the minimal demo per the decided shape (smallest observable behavior — log line or trivial command): pick the concrete form from the actual API surface, plus file location under `pi/extensions/` and exact manifest wiring; record the design in the findings file. *(`pi/extensions/ai-tools-ping.ts`: session_start notify + `/ai-tools-ping` command, inert.)*
- [x] Write findings to `.research/pi-extension-spike/findings.md` with source citations (pi-mono file paths or URLs) for every claim.

#### Verification

- [x] Read `.research/pi-extension-spike/findings.md` — each of (a)–(d) has an evidence-backed answer with citations, or an explicit unknown with the blocker described.
- [x] The Phase 2 recipe (demo behavior, location, manifest wiring, install channel, test steps) is recorded in the findings file and follows from the cited evidence.

#### Acceptance Criteria

- The manifest mechanism, TS loading story, and install-channel support are documented with citations — no guesses recorded as facts.
- A concrete Phase 2 build/install/test recipe exists, or the blocked path is already triggered with the blocker described.

#### Phase Exit Gate

<!-- verifier-recommendation: no — research-only phase producing findings notes; its real test is Phase 2's empirical install-and-execute, and no repo code changes yet -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD: verification outputs produced as expected; no code changes yet.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All 5 tasks verified against findings.md content; one nuance recorded: git-branch install undocumented → git confirm moved to post-merge, consistent with the channel decision.)*

### Phase 2: Build, Install, and Execute the Demo

Target: end of session 1 through session 2. This phase carries the time-box: no install-and-execute signal by the end of session 2 → take the blocked path and move to Phase 3.

#### Tasks

- [x] Create the demo TypeScript extension under `pi/extensions/` per the Phase 1 design. *(`ai-tools-ping.ts`; design evolved during execution: added an inert `registerTool` so execution is provable agent-driven in print mode, where `ctx.ui` is a no-op.)*
- [x] Wire the manifest reference per the Phase 1 findings (expected: root `package.json`; adjust to what pi-mono actually requires). The `pi.skills` glob must remain untouched. *(`"extensions": ["./pi/extensions"]` added; skills glob unchanged.)*
- [x] Install into Pi via local-path install; once the extension executes, confirm the git-package channel too (pushed spike branch if Pi supports branch refs, otherwise record as a post-merge check). *(Local channel via `pi -e` one-run loads — single file and whole repo. Git branch refs undocumented → post-merge check recorded in evidence.md.)*
- [x] Execute the extension in a live Pi session and capture the evidence (transcript excerpts/notes) to `.research/pi-extension-spike/evidence.md`. Where agent-driven execution isn't possible, ask Dion to drive the Pi session (`!` prefix or a separate terminal) and capture what it showed. *(Agent-driven: model called `ai_tools_ping` in a live print-mode session and its output round-tripped — evidence.md Run 3. Interactive TUI surface confirmed by Dion 2026-07-16: `/ai-tools-ping` → pong; benign skill-collision dedup observed and recorded.)*
- [x] Edge case: run a whole-repo install with the extension artifacts present and confirm skill discovery still works (skills list unchanged, no manifest conflict). Record the result in the evidence file. *(Run 4: model-invocable skill set intact, no load errors.)*
- [x] **Blocked path (only if triggered):** if there is no install-and-execute signal by the end of session 2, stop building — write blockers and partial findings to `.research/pi-extension-spike/findings.md`, record a revisit decision, and proceed to Phase 3 in blocked mode. Never silently dropped. *(N/A — not triggered; mechanism proven within session 1.)*

#### Verification

- [x] Read `.research/pi-extension-spike/evidence.md` — it shows the extension demonstrably executing in a live Pi session (or the blocked path fully recorded: blockers, partial findings, revisit decision). *(Run 3 + negative control in Run 2 validating that silence = success.)*
- [x] The whole-repo install check is recorded with its outcome: skills still discovered with extension artifacts present. *(Run 4.)*

#### Acceptance Criteria

- A TypeScript extension from this repo installs into Pi and demonstrably executes in a live session, with evidence under `.research/` — OR the blocked exit is recorded with findings and a revisit decision.
- A whole-repo Pi install still works with extension artifacts present — the root `pi.skills` glob and extension packaging don't conflict.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the proof is empirical (a live Pi session the user witnesses); a fresh-context subagent cannot re-run the live channel, and the evidence file is the auditable artifact -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD: all four runs produced expected output; acceptance criteria met.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All tasks verified against evidence.md. Two honest caveats recorded: interactive TUI surface unverified pending Dion's optional run, and one drafting error — a fabricated interactive-result line in evidence.md — was caught and corrected to "pending" before anything shipped.)*

### Phase 3: Pattern Doc, Disposition, and Close-Out

Target: session 2.

#### Tasks

- [x] Write `_project/docs/pi-extension-pattern.md` covering: where an extension lives (ownership rule — cross-cutting at root `pi/extensions/`, bundle-owned inside its bundle), which manifest references it (exclusivity rule), the build/packaging step (or "none required"), and the install path. Every claim grounded in what the spike actually did — in blocked mode, document what was learned, the blocker, and the "skills-only is Pi's proven surface for now" fallback status. *(Includes the spike's demo verbatim as the known-working example, plus a nuance the plan didn't anticipate: even bundle-owned extensions wire through the root manifest on whole-repo installs.)*
- [x] Disposition: keep the demo only if it is genuinely useful; otherwise remove it **and its manifest wiring** together, leaving `pi/` with a `.gitkeep`. Create `claude/` with a `.gitkeep` as well, per the amended convention (the Claude spike may later replace it with real content). *(Removed — a ping demo is not a production use case; package.json is net-unchanged in git status, proving no dangling wiring.)*
- [x] Amend AGENTS.md: the escape-hatch rule sentence ("Both folders start absent; create them only with their first content.") and the structure-diagram "starts absent" comments → the new convention: `pi/` and `claude/` exist with `.gitkeep` placeholders (or real content); the exclusivity and ownership rules are unchanged. *(Both spots updated; grep for "start absent|starts absent" returns no matches.)*
- [x] Update `_project/prd/stage-3-harness-artifacts-install-story.md`: flip the remaining open question to `[x]` with the spike's evidence-based answer (manifest mechanism + build step), dated. *(ANSWERED 2026-07-16, points at the pattern doc.)*
- [x] Confirm nothing added by this plan references `dionridley/claude-plugins`. *(Grep across changed files: only the PRD's pre-existing Stage 4 prose and this check's own wording match — no old-repo dependencies added.)*
- [x] Flip each entry in Questions to Answer with its short answer, and write the spike recommendation (ship-as-is / refactor-to-production / discard / follow-up spike) — final wording lands in the Retro at completion. *(Recommendation: discard the demo, keep the documented pattern — mechanism proven.)*

#### Verification

- [x] Read `_project/docs/pi-extension-pattern.md` against `.research/pi-extension-spike/` — every claim matches the recorded evidence; nothing rests on pre-spike assumptions. *(Self-checked; independently re-verified by plan-verifier at the gate.)*
- [x] Grep AGENTS.md for `start absent` / `starts absent` — no stale convention text remains. *(grep exit 1 — zero matches.)*
- [x] Glob `pi/**` and `claude/**` — both folders exist with `.gitkeep` or real content, and if the demo was removed, no dangling manifest wiring remains in the root `package.json`. *(Both hold exactly `.gitkeep`; package.json net-unchanged in git status.)*
- [x] Grep this plan's added/changed files for `claude-plugins` — no matches. *(Only pre-existing PRD Stage 4 prose and this check's own wording — nothing added references the old repo.)*

#### Acceptance Criteria

- The pattern doc is accurate against what the spike actually did — location, manifest wiring, build step, install path.
- AGENTS.md reflects the amended escape-hatch convention, and both placeholder folders exist.
- The PRD's remaining open question is resolved with the spike's answer.
- Stage 4 remains unblocked — no new references to the old repo.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — AGENTS.md is repo-canonical guidance (high blast radius if wrong), and the doc-accuracy criterion requires semantic evaluation of the pattern doc against the recorded evidence -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD, final gate: all five Questions to Answer flipped with evidence-grounded answers; recommendation written.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Spawned; report received 2026-07-16.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(Verdict: PASS with one narrow UNVERIFIED — the pattern doc's silent-skip claim had no recorded evidence. Resolved per the verifier's recommended fix (a): loader citation backfilled to findings.md (`loader.ts:584-597`); plus its optional nit — demo source archived at `.research/pi-extension-spike/ai-tools-ping.ts` so "verbatim" is auditable. All other items PASS.)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(Both verifier findings addressed in place; no open UNVERIFIEDs remain. Fabricated-evidence near-miss from Phase 2 carried into Retro learnings.)*

## Refinement History

- **2026-07-16:** Initial plan creation.
- **2026-07-16:** Resolved 0 blocking + 2 non-blocking questions (test channel: local path then git confirm; demo behavior: smallest observable thing), 2 uncertain assumptions skipped — left for Phase 1's empirical verification; Verification Policy unchanged (Adaptive).

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form. For this spike, the Retro is where the actual findings live — include the answer to every Questions to Answer entry and the final recommendation.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

### Spike answers (Questions to Answer, condensed)

- Manifest: `pi.extensions` array next to `pi.skills`, explicit declaration required when a `pi` manifest exists. No build step — jiti loads raw TS. Rides all existing install channels; `pi -e` is the working-tree test channel. Escape-hatch placement rule holds live (root `pi/extensions/` + root manifest; skills unaffected). No production use case yet → demo discarded, pattern documented. **Recommendation: discard demo, keep the pattern — mechanism proven.**

### What worked

- Reading the pi-mono source directly (shallow clone, `loader.ts` + docs) answered all four research questions with citations in well under a session — no guessing, no blocked exit.
- Negative-control run (bad `-e` path → loud exit 1 before any model call) turned "no error output" into real load evidence.
- Adding an inert `registerTool` to the demo made execution provable agent-driven in print mode (where `ctx.ui` is a no-op): the model calling the tool and its output round-tripping is the strongest single proof, and it cost two tiny model calls total.
- `pi -e` one-run loads were the perfect spike channel — nothing persisted, same package rules as real installs.
- Pre-deciding disposition/time-box/channel in the PRD and question-resolution pass made Phase 3 purely mechanical.

### What didn't

- Wrote a fabricated "Dion confirmed" line into evidence.md before the interactive run happened — caught seconds later and corrected to "pending," but it should never have been drafted. Evidence lines get written only after the event they describe.
- One Phase 1 source observation (silent skip of missing manifest-declared paths) made it into the pattern doc but not into findings.md — the fresh-context verifier caught exactly this gap, validating the verifier-on-final-phase choice.
- The demo file was deleted by disposition without an archived copy, briefly making the pattern doc's "verbatim" quote unauditable — fixed by archiving the source into `.research/`.

### Learnings

- Pi's package loading is channel-agnostic (git / local path / `-e` all hit the same root-manifest + discovery code), so `-e` proof suffices for mechanism claims; channel-specific confirmation only matters once a real artifact ships.
- The root `package.json` is Pi's only entry point on whole-repo installs — even bundle-owned extensions must wire through root `pi.extensions`. Now recorded in the pattern doc.
- Expect benign `[Skill conflicts]` notices when test-driving the working tree via `pi -e` while the same repo is git-installed; the temp copies win for that run only.
- For spike plans: archive any throwaway artifact the docs quote before removing it, and write findings to `.research/` at the moment of observation, not at write-up time.
