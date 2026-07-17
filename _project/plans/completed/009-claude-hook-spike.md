# Plan: Claude Hook Spike

## Metadata

- **Number:** 009
- **Status:** completed
- **Created:** 2026-07-16
- **Last refreshed:** 2026-07-16
- **Refinement count:** 1
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
- [x] Hooks ride the plugin channel per-bundle — confirmed in Phase 1 (doc-grounded): plugin components must sit at the plugin root with `./`-relative manifest paths (plugin-structure SKILL.md), so root `claude/` is not loadable via the marketplace channel; it remains the home for non-plugin Claude artifacts. Details: `.research/claude-hook-spike/findings.md`.
- [x] Hook configuration is captured at session start — confirmed in Phase 1: "changes require restarting Claude Code," no hot-swap (hook-development SKILL.md, Hook Lifecycle section); headless `claude -p` runs are fresh sessions by construction, pending Phase 2's empirical confirmation that they load plugin hooks.
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

- [x] [DECIDED: 2026-07-16] Which bundle hosts the demo hook wiring during the spike?
  > **Decision:** Deferred to Phase 1 — placement follows the research evidence.
  > **Rationale:** The root-`claude/` viability question may reshape placement entirely; `experimental` remains the leading candidate if the evidence doesn't dictate otherwise (least load-bearing bundle in live sessions, charter fits a throwaway demo).
  > **Resolved in Phase 1 (2026-07-16):** hooks must be bundle-owned (documented path rules — see findings) — host = `experimental`.
- [x] [DECIDED: 2026-07-16] What is the demo hook's observable behavior?
  > **Decision:** Smallest observable thing — a log line, injected context, or debug-visible execution.
  > **Rationale:** Purely proves load + fire. The concrete form is picked in Phase 1 from whatever hook surface the docs actually expose (mirrors plan 008's demo decision).

## Questions to Answer

- [x] How does a plugin from this repo wire a hook — which manifest field(s) or files, what config shape (event, matcher, command), and what path variables resolve for hook commands? **A:** convention path `hooks/hooks.json` at the bundle's plugin root, auto-discovered when the plugin enables — zero plugin.json change (an explicit `"hooks": "./path"` field is the documented alternative). Wrapper format: events nest under a `"hooks"` key; handlers carry `type`/`command`/`timeout`; `${CLAUDE_PLUGIN_ROOT}` resolves for portable command paths.
- [x] Does the hook load and fire in a live Claude Code session served from the directory-marketplace install, and what is the reload story (fresh session required? plugin refresh? immediate)? **A:** yes — proven headless (evidence.md Run 2, marker round-trip) and interactively (Run 4, Dion-witnessed). Hooks load at session start only, no hot-swap; a fresh session — including headless `claude -p` — picks up even **uncommitted** working-tree changes, because directory-marketplace plugins serve in place (the version cache never saw the file, yet it fired).
- [x] What executes hook commands on Windows (which shell), and does an inert/read-only demo run cleanly in this environment? **A:** Git Bash by default on Windows (PowerShell only when Git Bash is absent or forced via `"shell"`); the inert POSIX echo ran cleanly in every run (2–4).
- [x] Does the escape-hatch ownership rule hold on the Claude side — can a cross-cutting hook live at root `claude/`, or are plugin-channel hooks necessarily bundle-owned? *(The answer may amend the rule's Claude-side wording — evidence-based, like plan 008's root-manifest nuance on the Pi side.)* **A:** necessarily bundle-owned — the documented plugin contract allows no outside-root references (doc-grounded; traversal hack deliberately not attempted). Root `claude/` serves only non-plugin, settings-wired artifacts. AGENTS.md amended accordingly (escape-hatch sentence + structure-diagram example corrected).
- [x] Is there a production-worthy first hook use case, or is the demo removed per the disposition convention (`.gitkeep` + pattern doc remain)? **A:** no production use case — a static echo in every session is noise; demo removed after Dion's interactive confirmation, `.gitkeep` + `_project/docs/claude-hook-pattern.md` remain. Recommendation: discard demo, keep the pattern — mechanism proven.

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

- [x] Locate the hook documentation: the plugin-dev toolkit installed in this environment (its plugin directory carries the plugin-spec docs) and the official Claude Code docs via WebFetch as needed. Identify: (a) the manifest wiring — how a plugin declares hooks (plugin.json field and/or a hooks config file), (b) the hook config shape — events, matchers, command, timeout, and any structured output (e.g., context injection), (c) which events are innocuous and observable enough for an inert demo (session start, prompt submit, notification, …), (d) the Windows execution story — which shell runs hook commands and what portability constraints follow, (e) the reload story for the directory-marketplace live channel, and whether a headless `claude -p` run from Bash can serve as an agent-drivable test channel (the analog of plan 008's `pi -e` + registerTool proof). *(plugin-dev hook-development + plugin-structure SKILL.md + official reference at code.claude.com/docs/en/hooks: wrapper-format `hooks/hooks.json` convention path or manifest `hooks` field; SessionStart stdout becomes model-visible context; Git Bash is the Windows default shell; no hot-swap — restart required; headless `-p` flagged EMPIRICAL for Phase 2.)*
- [x] Cross-check against the local environment for real-world examples of hook wiring: installed plugins that carry hooks (the plugin-dev plugin itself is a candidate), and this repo's `.claude-plugin/marketplace.json`. Read-only inspection; no settings changes. *(No installed plugin wires hooks today — the demo is this machine's first. ai-tools bundles enabled at user scope (hook fires in ALL projects while wired); versioned-cache installPath vs observed working-tree skill serving recorded as an EMPIRICAL wrinkle for Phase 2.)*
- [x] Answer the root-`claude/` question from evidence: can the marketplace/plugin channel load an artifact from outside a bundle at all, or is the Claude-side ownership rule "plugin-channel artifacts are necessarily bundle-owned"? Record the answer with citations — it shapes both placement and the pattern doc. *(Answer: necessarily bundle-owned — documented path rules allow no outside-root references; traversal hack deliberately not attempted (unsupported foundation, 008 precedent). Root `claude/` = non-plugin artifacts only.)*
- [x] Design the minimal inert demo hook per the decided constraints (inert/read-only; smallest observable thing): concrete event, exact command, file placement + manifest wiring, and the exact test recipe — including whether Dion must start a fresh session and what the agent can drive itself. Record the design in the findings file. *(SessionStart `echo` of a static marker in `bundles/experimental/hooks/hooks.json` — convention path, zero manifest change; agent-provable via headless context round-trip with a pre-wiring negative control; Dion's interactive confirm via `/hooks` + fresh session.)*
- [x] Safety review of the design: the command is read-only/log-only, touches nothing outside `.research/` or the session temp directory, embeds no secrets, and is safe to sit live in Dion's real sessions (the marketplace serves this working tree — wiring it IS enabling it on next load). *(Single static `echo`: no reads/writes/network/secrets, ignores stdin, explicit timeout 10s; user-scope blast radius — one labeled inert context line in every session — accepted for the spike window; deletion restores net-unchanged.)*
- [x] Write findings to `.research/claude-hook-spike/findings.md` with source citations (doc paths or URLs) for every claim, recorded at the moment of observation (plan 008 learning — the verifier caught an observation that skipped the findings file). *(Written; EMPIRICAL items explicitly flagged with their Phase 2 test plans.)*

#### Verification

- [x] Read `.research/claude-hook-spike/findings.md` — each of (a)–(e) has an evidence-backed answer with citations, or an explicit unknown with the blocker described. *((a)–(d) fully answered; (e)'s reload story answered, with two explicitly-flagged EMPIRICAL items (headless `-p` hook loading; cache-vs-working-tree serving) each carrying a Phase 2 test plan.)*
- [x] The Phase 2 recipe (demo design, placement, wiring, test steps including the reload story) is recorded in the findings file and follows from the cited evidence. *(Recipe includes exact hooks.json content, ordered test sequence with fallbacks, and a negative control.)*

#### Acceptance Criteria

- The manifest wiring, hook config shape, Windows execution story, and test/reload story are documented with citations — no guesses recorded as facts.
- A concrete Phase 2 build/wire/fire recipe exists, or the blocked path is already triggered with the blocker described.

#### Phase Exit Gate

<!-- verifier-recommendation: no — research-only phase producing findings notes; its real test is Phase 2's empirical load-and-fire, and no repo code changes yet -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD: verification outputs as expected; no repo code changes yet — findings live in gitignored `.research/`.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All 6 tasks verified against findings.md; both `[?]` assumptions flipped with citations; the deferred host-bundle decision resolved to `experimental` via the bundle-owned finding. Time-box check: mid-session 1 — well inside.)*

### Phase 2: Build, Wire, and Fire the Demo

Target: end of session 1 through session 2. This phase carries the time-box: no load-and-fire signal by the end of session 2 → take the blocked path and move to Phase 3.

#### Tasks

- [x] Create the demo hook artifact(s) per the Phase 1 design (expected: inside the chosen bundle; adjust to what the evidence actually requires). *(`bundles/experimental/hooks/hooks.json` — exactly the Phase 1 recipe: inert SessionStart echo, timeout 10.)*
- [x] Wire the manifest per the Phase 1 findings. The bundle's existing skills/agents wiring must remain untouched. *(Convention-path auto-discovery proved sufficient — zero plugin.json change; skills wiring untouched by construction.)*
- [x] **Pre-enable safety review:** re-read the final command as wired — inert/read-only, no secrets, no writes outside the agreed log target. This is the PRD's mitigation for "demo hook does something unsafe," and it happens before any session loads the hook. *(Re-read as wired: single static `echo`, ignores stdin, no reads/writes/network/secrets, explicit 10s timeout.)*
- [x] Fire the hook and capture evidence to `.research/claude-hook-spike/evidence.md`: agent-driven where possible (e.g., a headless `claude -p` smoke run from Bash with hook execution observable), plus Dion's interactive confirmation per the reload story (fresh session via a separate terminal or the `!` prefix). Evidence lines are written only **after** the event they describe (plan 008 learning). *(Agent-driven CORE PROOF: evidence.md Run 2 — the marker round-tripped through a fresh headless session's context, uncommitted working tree, with Run 1 as negative control. Dion's interactive confirmation landed 2026-07-16 — Run 4, recorded after the event — before the demo's removal.)*
- [x] Edge case: confirm the touched bundle's existing surface still works with the hook present — skills still listed and invocable, no manifest load errors. Record the result in the evidence file. *(Run 3 + full skill-list probe: model-visible surface exactly as expected; `mvp` absence is its `disable-model-invocation: true` frontmatter — cross-checked against plan 008's Pi list, which lacked it for the same reason.)*
- [x] **Blocked path (only if triggered):** if there is no load-and-fire signal by the end of session 2, stop building — write blockers and partial findings to `.research/claude-hook-spike/findings.md`, record a revisit decision that explicitly weighs the PRD's fallback candidates (statusline / output style), and proceed to Phase 3 in blocked mode. Never silently dropped. *(N/A — not triggered; mechanism proven mid-session 1, first positive run.)*

#### Verification

- [x] Read `.research/claude-hook-spike/evidence.md` — it shows the hook demonstrably loading and firing in a live Claude Code session served from this working tree (or the blocked path fully recorded: blockers, partial findings, revisit decision). *(Run 2 core proof with Run 1 negative control; serving-mechanism forensics resolved the cache wrinkle — plugins serve in place from the working tree.)*
- [x] The bundle-surface edge case is recorded with its outcome: skills unaffected with the hook present. *(Run 3 + list probe.)*

#### Acceptance Criteria

- A Claude Code-exclusive artifact from this repo loads and fires in a live session served from this working tree, with evidence under `.research/` — OR the blocked exit is recorded with findings and a revisit decision (fallbacks weighed).
- The touched bundle's existing plugin surface (skills, agents) is unaffected with the hook present.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the proof is empirical (a live Claude Code session the user witnesses); a fresh-context subagent cannot re-run the live channel, and the evidence file is the auditable artifact -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD: all four runs produced expected output; both Phase 2 acceptance criteria met via evidence.md.)*
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report. *(All tasks verified against evidence.md. One caveat, later resolved: Dion's interactive confirmation was pending at gate time and landed 2026-07-16 (Run 4). `--debug` stderr was empty in `-p` mode — recorded as forensics rather than evidence. Time-box: mid-session 1 — well inside.)*

### Phase 3: Pattern Doc, Disposition, and Close-Out

Target: session 2.

#### Tasks

- [x] Write `_project/docs/claude-hook-pattern.md` covering: where a hook lives (the ownership rule as actually proven — including whether root `claude/` is viable for plugin-channel artifacts or bundle-owned is the rule), the manifest wiring, the hook config shape, Windows execution notes, the reload/test story, and the install path (directory marketplace here; what a normal marketplace install would do). Every claim grounded in what the spike actually did — in blocked mode, document what was learned, the blocker, and the fallback status (statusline / output style candidates). *(Written while the demo was still wired; adds sections the plan didn't anticipate: blast radius (user-scope enablement = all projects), safety discipline, and the version-ritual boundary for kept hooks. Post-verifier fixes: the doc's JSON block had been genericized while claiming "verbatim" — replaced with the archived demo verbatim; the untraced `node` workaround got its citation backfilled into findings.md; "documented" restored to the ownership sentence; the untested normal-install claim hedged.)*
- [x] Disposition: keep the demo only if it is genuinely useful; otherwise remove it **and its manifest wiring** together, leaving `claude/` with its `.gitkeep`. **Before removing anything the pattern doc quotes, archive it into `.research/claude-hook-spike/`** (plan 008 learning). If removed: touched bundle manifests must end net-unchanged in git status — no version ritual. If kept: run the bundle version ritual (plugin.json + package.json + marketplace.json + CHANGELOG) before shipping. *(Removed after Dion's interactive confirmation (Run 4); archive taken first; there was never a manifest edit to revert (convention path), and git status shows nothing under `bundles/` — net-unchanged, no version ritual.)*
- [x] Amend AGENTS.md: add the Claude-side outcome sentence to the escape-hatch paragraph, parallel to the Pi sentence plan 008 added (pointing at `_project/docs/claude-hook-pattern.md`), and adjust the ownership-rule wording only if the spike's evidence requires it. *(Both spots: escape-hatch bullet gained the Claude sentence; the structure diagram's "(hooks/ …)" example for root `claude/` was corrected — the spike falsified it.)*
- [x] Confirm nothing added by this plan references `dionridley/claude-plugins`. *(Grep across AGENTS.md, pattern doc, and this plan: only this check's own wording matches.)*
- [x] Flip each entry in Questions to Answer with its short answer, and write the spike recommendation (ship-as-is / refactor-to-production / discard / follow-up spike) — final wording lands in the Retro at completion. *(All five flipped with evidence-grounded answers; recommendation: discard the demo, keep the pattern — mechanism proven.)*

#### Verification

- [x] Read `_project/docs/claude-hook-pattern.md` against `.research/claude-hook-spike/` — every claim matches the recorded evidence; nothing rests on pre-spike assumptions. *(Plan-verifier found three fidelity gaps — genericized block claiming "verbatim", untraced `node` detail, "no mechanism" overstating "no documented mechanism" — all fixed in place per its recommendations; every other claim traced cleanly.)*
- [x] Read the AGENTS.md escape-hatch paragraph — it now covers both harness pattern docs and contradicts nothing in the amended convention. *(Pi + Claude sentences side by side; ownership rule refined, not contradicted.)*
- [x] Glob `claude/**` and check `git status` on touched manifests — the disposition is consistent: `.gitkeep` + net-unchanged manifests, or a kept demo with the version ritual completed. *(`claude/` holds exactly `.gitkeep`; git status shows nothing under `bundles/` — no manifest was ever modified.)*
- [x] Grep this plan's added/changed files for `claude-plugins` — no new references. *(Only the check's own wording — nothing added references the old repo.)*

#### Acceptance Criteria

- The pattern doc is accurate against what the spike actually did — location, manifest wiring, config shape, reload story, install path.
- AGENTS.md reflects the Claude-side outcome; the escape-hatch convention stays coherent across both harnesses.
- The disposition left no dangling wiring (or a fully versioned kept artifact).
- Stage 4 remains unblocked — no new references to the old repo.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — AGENTS.md is repo-canonical guidance (high blast radius if wrong), and the doc-accuracy criterion requires semantic evaluation of the pattern doc against the recorded evidence -->

- [x] Run Definition of Done commands (see plan header). All must pass. *(Relaxed spike DoD, final gate: all five Questions to Answer flipped with evidence-grounded answers; recommendation written.)*
- [x] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Spawned; report received 2026-07-16.)*
- [x] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning. *(Verdict: all items PASS except one narrow FAIL cluster on pattern-doc evidence fidelity — genericized "verbatim" block, untraced `node` detail, over-strong ownership wording, plus an optional hedge on the untested normal-install claim. All four fixes applied per its recommendations; Task 1 and Verification item 1 re-flipped only after the fixes landed.)*
- [x] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro. *(All recommendations reflected in place; no open UNVERIFIEDs. The 008 lesson recurred in new form — a claim outran its recorded evidence — carried into Retro learnings. Time-box: completed within session 1 of 2.)*

## Refinement History

- **2026-07-16:** Initial plan creation.
- **2026-07-16:** Resolved 0 blocking + 2 non-blocking questions (host bundle: deferred to Phase 1's evidence, `experimental` leading candidate; demo behavior: smallest observable thing), 2 uncertain assumptions skipped — left for Phase 1's empirical verification; Verification Policy unchanged (Adaptive).

## Completion

After the final phase's Exit Gate passes, the executing agent performs these steps without prompting the user:

1. Populate the Retro section below from observable execution signals (what worked, what didn't, learnings). Write in terse bullet form. For this spike, the Retro is where the actual findings live — include the answer to every Questions to Answer entry and the final recommendation.
2. Move this plan file from `_project/plans/in_progress/` to `_project/plans/completed/`.
3. Suggest the user run `/dr-ship` to commit, push, and open a PR populated from this plan. (If steps 1–2 were missed, `/dr-ship` verifies and backstops them.)

If the final phase's Exit Gate has unresolved FAILs or UNVERIFIEDs after the allowed retries, do NOT move the file or write the retro. Escalate to the user with full context and stop.

## Retro

### Spike answers (Questions to Answer, condensed)

- Wiring: convention-path `hooks/hooks.json` (wrapper format) at the bundle's plugin root, auto-discovered — zero manifest change. Fired live: headless context round-trip + Dion-witnessed interactive session. Windows: Git Bash runs shell-form commands by default. No hot-swap — hooks load at session start; directory-marketplace installs serve in place, so even uncommitted working-tree hooks go live in the next session. Plugin-channel hooks are necessarily bundle-owned; root `claude/` serves only settings-wired non-plugin artifacts. No production use case yet → demo discarded, pattern documented. **Recommendation: discard demo, keep the pattern — mechanism proven.**

### What worked

- Mirroring plan 008's playbook (negative control → agent-provable round-trip → human-witnessed surface → archive-then-remove disposition) made execution nearly mechanical: core proof landed on the first positive run, mid-session 1 of a 2-session time-box.
- SessionStart's stdout-becomes-context is a perfect provability channel — a fresh headless session quoting its own injected marker is single-run proof of load + fire + content, with Claude Code's own `SessionStart:startup hook success:` label riding along as corroboration.
- The locally-installed plugin-dev toolkit plus one WebFetch of the official hooks reference answered every research question with citations — no source archaeology.
- Off-plan forensics paid for themselves: checking the version cache after the fire proved in-place serving (the cache never saw the file), resolving the cache-vs-working-tree wrinkle into a clean pattern-doc fact.

### What didn't

- The 008 lesson recurred in a new form: the pattern doc claimed "verbatim" over a genericized JSON block, and one official-docs detail (the `node` exec-form workaround) reached the doc without being recorded in findings.md first. The fresh-context verifier caught both — verifier-on-final-phase validated twice in two spikes.
- `claude --debug` wrote nothing to stderr in `-p` mode, so the documented debug surface was unobservable headless; the context round-trip had to carry the evidence (it did, and it's stronger anyway).
- The edge-case probe briefly looked like a regression ("mvp not listed") until cross-checked against the skill's `disable-model-invocation: true` frontmatter and 008's Pi skill list — absence needs a baseline check before it counts as breakage.

### Learnings

- "Verbatim" is a checkable claim: quote the artifact exactly or say "genericized template" — a fresh-context verifier will diff the doc against the archive.
- Every fact bound for a pattern doc goes through the findings file first, at the moment of observation — the doc cites the record, never the other way around (second spike in a row to relearn a variant of this).
- With in-place directory-marketplace serving and user-scope enablement, there is no staged state for hooks: writing the file IS deploying it to every project on the machine. Review the command before writing it; keep demo windows short.
- Headless `claude -p` is Claude Code's `pi -e` analog for spikes: fresh session by construction, loads plugins and hooks, agent-drivable, nothing persisted. Design probe prompts to demand exact quoting with a fixed absent-fallback string so positive and negative runs are both unambiguous.
