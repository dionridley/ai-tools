# Plan: Harden the Phase Exit Gate Verifier Fallback

## Metadata

- **Number:** 013
- **Status:** draft
- **Created:** 2026-07-31
- **Last refreshed:** 2026-07-31
- **Refinement count:** 1
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Every Phase Exit Gate this plugin generates carries one sentence: *"If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass."* In `planaraid/par` plan 073 an agent that **could** spawn the verifier, and **was** authorized to, read that clause as covering its situation, self-verified, and recorded a pass. Nobody noticed until the user asked directly. When the verifier eventually ran it found a real defect a green test suite had missed. The clause conflates *cannot* with *may not*, and it assumes a binary that isn't harness-neutral — on Pi the verifier agent is unregistered, so the fallback branch is correct-by-design there, which is precisely why the bug is invisible: one clause covers both a defect and a normal operating mode.

The fix is wording plus one new file. The gate becomes three explicit capability-first branches, and — the load-bearing change — an inline fallback must **label itself** in the plan with a fixed `[INLINE FALLBACK YYYY-MM-DD: <condition>]` token, mirroring the `[WAIVED YYYY-MM-DD: reason]` convention `dr-ship` already greps for. This matters because the other two branches are prose guards, and prose guards are exactly what failed in 073; the label is the only part of the change that leaves a durable, greppable artifact after the fact. Had it existed, the 073 incident would have written `[INLINE FALLBACK …: session instruction suggested subagents were not authorized]` into the plan file — visible, honest, and caught on the next read.

Three things ride along. `dr-ship` learns to surface the label, because `--verify` gates a push and a PR and a fallback-labelled gate from an earlier phase currently passes its audit invisibly. The Verification Policy option text is neutralized, since it is the thing carrying the authorization and currently promises Claude-specific behaviour the plugin cannot deliver on Pi. And a new `references/verification-rubric.md` gives the inline branch the skepticism rules it needs — written fresh as a sibling, **not** moved out of `agents/plan-verifier.md`, because stubbing the agent file would risk the delegated path that works today in order to fix the fallback one.

## Current State

**The gate text is duplicated across eight sites**, all word-identical in their fallback clause, all verified at these exact lines on 2026-07-31:

| File | Line | Kind |
|---|---|---|
| `skills/dr-plan/templates/plan-base.md` | 104 | Spawn |
| `skills/dr-plan/references/create-mode.md` | 176 | Spawn |
| `skills/dr-plan/references/questions-mode.md` | 179 | Spawn |
| `skills/dr-plan/templates/plan-base.md` | 105 | Apply |
| `skills/dr-plan/references/create-mode.md` | 177 | Apply |
| `skills/dr-plan/references/questions-mode.md` | 180 | Apply |
| `skills/dr-ship/SKILL.md` | 24 | Skill prose |
| `skills/dr-ship/references/preflight.md` | 26 | Skill prose |

The originating handover listed five. The three **Apply verification report** sites are additions found while verifying it — they are written in branch-1-only language (*"Flip `[x]` only for tasks **the verifier** reports as PASS"*), which has no referent under a fallback. The first six generate text into a plan file; the last two are skill prose instructing the executing agent, and need the same logic phrased differently.

**Three further sites carry the Verification Policy option text:** `plan-base.md:45–47`, `questions-mode.md:135`, `create-mode.md:135`. Option A promises *"Every phase spawns `project-management:plan-verifier`"* — unsatisfiable on Pi as currently registered — and Option C ("Never") is indistinguishable in wording from the labelled inline fallback, though distinguishable in the artifact (`create-mode.md:192` omits the gate tasks entirely under `no`).

**The manifest asymmetry is real.** `bundles/project-management/.claude-plugin/plugin.json:25` registers `./agents/plan-verifier.md`; the root `package.json` — the only manifest Pi reads on a whole-repo install — globs `bundles/*/skills/*` and does not cover `bundles/*/agents/*`.

**A cross-skill reference precedent already exists.** `dr-ship/SKILL.md` documents reading `../dr-plan/references/summary-mode.md`, noting *"both ship together in the `project-management` bundle; a standalone copy of `dr-ship` alone will not resolve it."* This is the established escape from the skill-root rule for same-bundle siblings, and it is what makes a rubric under `dr-plan/references/` reachable from `dr-ship`. It does **not** help a generated plan file, which has no skill-relative anchor at all — resolved in the blocking question below.

**`draft/` and `in_progress/` are empty in this repo**, as they are in `par`. The old clause survives only in nine completed plans, which is correct history and must not be rewritten.

**This plan is generated from the template it fixes**, so its own gates below carry the old wording throughout. That is deliberate and must stay that way: retrofitting them mid-flight would put this plan's gates, the template that generates them, and the `dr-ship` audit that reads them all in motion simultaneously, which is the one configuration where a surprising result cannot be attributed to any single cause. The behavioural evidence comes from Phase 5's negative test instead, on a separately generated plan whose template is already final.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

### Validated

- [x] All five handover sites exist at the stated line numbers, and the three `Apply verification report` sites are real additions — both confirmed by `grep -rn` across `bundles/` on 2026-07-31.
- [x] `draft/` and `in_progress/` are empty here; `grep -rln "harness cannot spawn subagents" _project/plans/` matches only nine files in `completed/`.
- [x] The same-bundle cross-skill reference pattern is established and documented (`dr-ship/SKILL.md`, the `../dr-plan/references/summary-mode.md` note), so `verification-rubric.md` under `dr-plan/references/` is reachable from `dr-ship` by precedent rather than by invention.
- [x] This repo has no automated test, lint, or typecheck suite — markdown and JSON only, root `package.json` carries no `scripts` block. Established in plan 012; the Definition of Done below substitutes the integrity checks that are the real gates, per the base template's guidance.
- [x] The Ship Report is a deterministic fixed-shape template (`dr-ship/references/preflight.md:62–95`) with an explicit rule that row order is fixed and all rows are always present, `Verifier` being conditional on `--verify`. Adding or extending a row is therefore a deliberate template change, not a free addition.
- [x] Pi is installed locally at `~/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent`, so Q2 is answerable from disk without fetching pi-mono.
- [x] The harness prompt line that triggered the incident (*"Do not call the AgentTool unless the user requested it"*) biases but does not block — the handover confirms `Agent` was present and callable throughout, and the verifier ran the moment it was asked for. This plan therefore targets the gate, not the harness.

### Pending / uncertain

These three are empirical and are Phase 1's entire job. They were deliberately **left uncertain** during question resolution on 2026-07-31 rather than confirmed from reasoning — confirming them without observation would be precisely the false-record failure this plan exists to prevent.

- [ ] [?] **`Agent(<subagent_type>)` deny-rule syntax is plausible but unconfirmed.** Binary inspection of `claude.exe` 2.1.220 found an extractor pulling `subagent_type` for tools named `Agent`/`Task`, sitting immediately beside the equivalent `Skill(name)` extractor — but it was only directly observed feeding a telemetry properties object, not permission matching. Phase 1 settles it.
- [ ] [?] **An unregistered `subagent_type` may silently substitute `general-purpose` rather than rejecting.** If it substitutes, it is useless as a rejection test; if it rejects, it is the better test because it needs no settings syntax and works on any harness. Phase 1 settles it.
- [ ] [?] **Whether Pi has any delegation/subagent primitive at all is unknown** (Q2). If yes, branch 1 should name it beside the Claude example. If no, the inline fallback is Pi's permanent path, policy options A and B collapse into each other there, and the option text must say so rather than offering two identical choices.
- [x] **Q1 — whether a whole-repo `pi install git:…` vendors `bundles/*/agents/*` to disk — is answered by inference only.** `_project/docs/pi-extension-pattern.md:82` states `pi update --all` "reconciles the **clone**", implying a full repo clone in which the agent file is present but unregistered. Stated as inference, not verification; it does not change any decision in this plan, since the rubric is written fresh rather than moved.

## Open Questions & Decisions

### Resolved before drafting

Settled with the user on 2026-07-31 and recorded so a later reader does not reopen them:

- **The label is the fix.** Branches 1 and 3 are prose guards asking an agent to correctly classify its own permission state — the exact judgment that failed in 073. Only the label leaves a durable artifact. If one thing ships, it is the token.
- **Authorization wording must not override the harness.** The handover's proposed *"treat it as authorized, not as something needing fresh permission"* is rejected as written: it instructs an agent to override a harness-level withholding, which is worse than the original ambiguity because it is explicit. The permitted assertion is narrower — *the plan is not the thing withholding permission, so do not skip on the plan's account.* Branch 1 must additionally be conditioned on delegation not being withheld by the session.
- **The rubric is a new sibling file, not a move.** Reducing `agents/plan-verifier.md` to a stub that reads a shared rubric would trade a working delegated path for a portability fix. The two audiences genuinely differ: a fresh subagent needs *"a task marked `[x]` is not evidence"*; an in-context agent needs *"you wrote this code — that is a reason for more skepticism, not less"*, which is meaningless to a fresh-context verifier. `agents/plan-verifier.md` stays byte-unchanged.
- **Verification splits honestly.** Structural checks (all sites updated, token shape fixed, greps land, `dr-ship` rows render) are fully verifiable. The behavioural check — an agent facing rejection labels rather than self-passing — is a single-observation check and will be recorded as evidence, not proof, using the convention plan 012 used for SC1.
- **The mechanism check is the plan's first task**, not a pre-plan spike (user's call).

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

  Reviewed 2026-07-31 and kept at Adaptive: Phases 2, 3 and 4 are annotated `yes` (the generated-text contract, the nine-edit sweep, the push-gating `dr-ship` change); Phases 1 and 5 are `no` (findings whose only evidence is the transcript, and a mechanical release ritual).

### Blocking

Must resolve before implementation starts.

- [x] [DECIDED: 2026-07-31] **How does the inline branch reach the rubric from inside a generated plan file?**

  This shapes Phase 2 and Phase 3 and cannot be deferred. A generated plan lives at `_project/plans/in_progress/NNN-slug.md` in the *user's* repo. It has no skill-relative anchor, so it cannot reference `references/verification-rubric.md` the way `dr-ship` can. `dr-ship`'s own dangling reference is solved by the `../dr-plan/references/` precedent; the generated-plan case is not.

  - **Option A: render the rubric once into the plan header.** Add a conditional `## Inline Verification Rubric` section to `plan-base.md`, emitted only when at least one phase has a verifier task; each gate's branch 2 says *"follow the Inline Verification Rubric in this plan's header."*
  - **Option B: compress the essential rules into the gate task itself.** Four or five lines of skepticism rules inline in branch 2, with no separate section.
  - **Option C: point at the skill and accept best-effort.** Branch 2 says *"if the `dr-plan` skill is available, follow its `references/verification-rubric.md`."*

  > **Decision:** Option A — render the rubric once into the plan header.
  > **Rationale:** The plan stays self-contained, the rubric appears once rather than per-phase, and there is no cross-file path problem. **Consequence to carry into Phase 2:** the rubric exists in two renderings — the full reference file (`references/verification-rubric.md`, used by `dr-ship` via the same-bundle precedent) and a condensed form rendered into the plan header. They must not drift on substance. Rejected: Option B, because the block would repeat verbatim once per phase and the gate task grows noticeably; Option C, because a generated plan has no skill-relative anchor, so branch 2 would silently degrade to "be skeptical" — reintroducing the exact failure class this plan closes.

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-07-31] Should the label's date be the date the fallback occurred, or the plan's date?

  > **Decision:** The date the fallback occurred.
  > **Rationale:** Matches `[WAIVED YYYY-MM-DD: reason]`, which stamps the date the waiver was applied rather than the plan's date. Keeps both tokens readable the same way, and means a long-running plan shows when each fallback actually happened.

- [x] [DECIDED: 2026-07-31] Does the Ship Report gain a new always-present row for fallbacks, or does the existing conditional `Verifier` row absorb the signal?

  > **Decision:** A new always-present `Fallbacks` row in READINESS, **plus** the existing `--verify`-only `Verifier` row stating which branch it used.
  > **Rationale:** These are two distinct signals and one row cannot carry both. The `Fallbacks` row reports earlier-phase labels found by the 1a audit and is present on every run (`✅ Fallbacks  none` when clean), matching the template's "identical shape every run" philosophy and giving positive confirmation that the audit looked. The `Verifier` row reports which branch `--verify` itself took. Folding both into `Verifier` was rejected because that row only renders with `--verify`, so an earlier phase's label would stay invisible on a normal ship run — the exact hole this plan closes. Target shape:
  >
  > ```
  >   ℹ️ Fallbacks           1 — Phase 3 (spawn rejected)
  >   ⚠️ Verifier            inline fallback — 0 FAIL / 2 UNVERIFIED
  > ```

- [x] [DECIDED: 2026-07-31] Should `README.md:374` document the label as a user-facing concept, or only mention that the fallback self-labels?

  > **Decision:** Document it fully, including the audit grep.
  > **Rationale:** The label's whole value is being findable after the fact; one nobody knows to look for is only half a fix. Show the token's shape and `grep -rn "INLINE FALLBACK" _project/plans/`, at the cost of a few lines added to a currently-short paragraph.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] `grep -rn "harness cannot spawn subagents" bundles/` returns zero matches; the nine occurrences under `_project/plans/completed/` are untouched.
- [ ] All eight gate/apply sites carry capability-first three-branch logic, and all three Verification Policy sites are neutralized around independent verification as the outcome with delegation as the preferred mechanism.
- [ ] The `[INLINE FALLBACK YYYY-MM-DD: <condition>]` token has exactly one documented shape, dated to the fallback, and a generated plan that takes branch 2 is found by `grep -rn "INLINE FALLBACK" _project/plans/`.
- [ ] `dr-ship` surfaces a fallback: preflight 1a lists the token as informational-but-shown, the Ship Report carries an always-present `Fallbacks` row, and `--verify`'s `Verifier` row states which branch ran.
- [ ] `skills/dr-plan/references/verification-rubric.md` exists and is reachable from `dr-ship` via the documented same-bundle precedent; its condensed counterpart renders into generated plan headers under the Option A condition; `agents/plan-verifier.md` is byte-identical to its pre-plan state.
- [ ] No generated or skill text instructs an agent to override a harness-level withholding of delegation.
- [ ] `project-management` is 3.3.0 in all four locations, with a CHANGELOG entry citing `planaraid/par` plan 073 as the field report.
- [ ] The behavioural check is recorded with its evidentiary status stated explicitly — a single observation, not proof — or carried as an explicitly labelled unverified item if Phase 1 finds no mechanism produces a visible rejection.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- **Manifest integrity:** every JSON file touched parses; the `project-management` version string is identical in `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, and the `project-management` entry in `.claude-plugin/marketplace.json`; `plugin.json`'s `skills[]` lists every directory under `bundles/project-management/skills/` and `agents[]` lists every file under `agents/`.
- **Frontmatter validity:** every `SKILL.md` touched still parses as YAML and has `name` and `description`; `name` matches its own directory name.
- **Reference integrity:** every relative path referenced from a `SKILL.md` or reference file resolves to a file that exists — including the new rubric and the existing `../dr-plan/references/summary-mode.md`.
- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — **struck.** This repo is markdown and JSON with no `scripts` block and no automated suite; the three checks above are the real gates. Justified in Assumptions.

## Implementation Plan

### Phase 1: Settle the rejection mechanism and the Pi delegation question

Both unknowns gate design decisions downstream, and neither is answerable by reasoning. This phase produces facts, not edits.

#### Tasks

- [ ] **Determine which rejection mechanism produces a visible spawn rejection on Claude Code.** Two candidates; test whichever is cheaper first and stop when one works.
  - **Candidate A — deny rule.** Add `"deny": ["Agent(project-management:plan-verifier)"]` to `.claude/settings.local.json`, then in a fresh session ask an agent to spawn that verifier. Record whether the spawn is rejected with a visible error or silently proceeds.
  - **Candidate B — unregistered type.** Ask an agent to spawn `subagent_type="project-management:does-not-exist"`. Record whether it errors or silently substitutes `general-purpose`.
  - **This task requires the user to run it** — it needs a settings edit and an actual spawn attempt, and the current session withholds the `Agent` tool absent an explicit request. Do not attempt it unilaterally; ask, then wait.
- [ ] **Record the outcome and fix the negative-test design.** If A works, the negative test is a deny rule. If only B works, it is the better test anyway — no settings syntax, and it reproduces "attempted and rejected" on any harness. If neither produces a visible rejection, record that and carry the behavioural check as an explicitly labelled unverified item rather than inventing a weaker substitute.
- [ ] **Answer Q2 — does Pi have any delegation/subagent primitive?** Inspect the installed package at `~/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent` (README, CHANGELOG, and the extension API surface) for a spawn/delegate/subagent capability.
- [ ] **Flip the three `[?]` assumptions** to validated or restate them with what was actually observed.

#### Verification

- [ ] Read this plan's Assumptions section — expected: no `[?]` remains on the deny-syntax, unregistered-type, or Pi-delegation lines.
- [ ] Read this phase's recorded outcome — expected: a named mechanism for the negative test, or an explicit statement that none was found.

#### Acceptance Criteria

- The negative-test design for Phase 5 is fixed and justified by an observation, not an assumption.
- Q2 is answered yes or no, with the evidence cited, so Phase 3 knows whether policy options A and B collapse on Pi.

#### Phase Exit Gate

<!-- verifier-recommendation: no — this phase produces findings whose only evidence is the session transcript and the assumption flips; there is no code or structure for a fresh-context verifier to independently check. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: Design the gate contract and write the rubric

The single highest-stakes phase: this text is generated into every future plan and cannot be quietly corrected afterwards.

#### Tasks

- [ ] **Write the canonical three-branch gate text.** Branch 1 conditioned on delegation being available, registered, **and not withheld by the session**, with Claude Code named once as a parenthetical example in the style of `dr-plan/SKILL.md` rule 8. Branch 2 the labelled inline fallback, pointing at the Inline Verification Rubric in the plan header per the blocking decision. Branch 3 the ask, scoped as a narrow escape hatch per `SKILL.md` rule 7 — never a per-phase user checkpoint.
- [ ] **Fix the token shape** as `[INLINE FALLBACK YYYY-MM-DD: <condition>]`, dated to the fallback, where `<condition>` names which of the three fallback conditions applied (no subagent mechanism / agent not registered / spawn attempted and rejected). Confirm it does not collide with the `[WAIVED YYYY-MM-DD: reason]` parser at `dr-ship/references/preflight.md:17`.
- [ ] **Write `skills/dr-plan/references/verification-rubric.md`** fresh — verdict definitions (PASS/FAIL/UNVERIFIED), the skepticism rules, and a report shape. Include the self-verification framing that has no analogue in the agent file: *you wrote this code; that is a reason for more skepticism, not less.*
- [ ] **Draft the condensed header rendering** that Phase 3 will add to `plan-base.md`, and state explicitly which parts of the full rubric it drops. Two renderings now exist; record what keeps them from drifting on substance.
- [ ] **Confirm `agents/plan-verifier.md` is untouched** and will stay so for the rest of the plan.
- [ ] **Leave this plan's own Exit Gates on the old text.** Do not retrofit them — see Current State for why, and do not treat their old wording as an oversight to fix.
- [ ] **Write the authorization sentence and check it against the rejected form** — it must assert only that the plan is not withholding permission, never that the agent is authorized regardless of its harness.

#### Verification

- [ ] Read the drafted gate text — expected: three branches, delegation conditioned on not-withheld, no instruction to override a harness.
- [ ] Read `skills/dr-plan/references/verification-rubric.md` — expected: exists, contains verdict definitions, skepticism rules, report shape, and the self-verification framing.
- [ ] Read the condensed header draft alongside the full rubric — expected: no substantive rule present in one and contradicted in the other.
- [ ] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: no output.
- [ ] Read this plan's Phase 3–5 Exit Gates — expected: unchanged, still carrying the old wording.

#### Acceptance Criteria

- The gate text is complete enough to paste into all eight sites without per-site invention.
- The token has exactly one shape, documented in one place, and is greppable.
- An agent taking branch 2 with only the header rendering in hand can produce a report comparable to a delegated one.
- `agents/plan-verifier.md` is byte-identical to its pre-plan state.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase produces the user-visible contract for the whole plan (generated gate text plus a new reference file), and its failure mode is subtle wording drift that Verification commands cannot catch. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 3: Apply to `dr-plan` — six gate sites, three policy sites, and the header section

Scoped to one skill directory so the sweep is verifiable by a single directory-scoped grep.

#### Tasks

- [ ] **Replace the three Spawn sites** with the Phase 2 gate text: `templates/plan-base.md:104`, `references/create-mode.md:176`, `references/questions-mode.md:179`.
- [ ] **Rewrite the three Apply sites** so they work under both branches: `templates/plan-base.md:105`, `references/create-mode.md:177`, `references/questions-mode.md:180`. Remove branch-1-only phrasing ("the verifier reports as PASS") in favour of wording that covers a delegated report and an inline one.
- [ ] **Add the conditional `## Inline Verification Rubric` section** to `templates/plan-base.md`, and the rendering condition to `create-mode.md` Phase 7 — emitted only when at least one phase has a verifier task, omitted entirely otherwise.
- [ ] **Neutralize the three Verification Policy sites**: `templates/plan-base.md:45–47`, `references/questions-mode.md:135`, `references/create-mode.md:135`. Frame options around independent verification as the outcome, delegation as the preferred mechanism. If Phase 1 answered Q2 "no delegation primitive on Pi", say so in the option text rather than offering a Pi user two identical choices.
- [ ] **Keep `create-mode.md:192`'s omission rule correct** — under `verifier-recommendation: no`, the gate tasks are still omitted entirely, not rendered as skipped. Confirm this composes with the new header-section condition: a plan with no verifier-bearing phase gets neither the gate tasks nor the rubric section.

#### Verification

- [ ] Run `grep -rn "harness cannot spawn subagents" bundles/project-management/skills/dr-plan/` — expected: zero matches.
- [ ] Run `grep -rn "the verifier reports as PASS" bundles/project-management/skills/dr-plan/` — expected: zero matches.
- [ ] Run `grep -rn "INLINE FALLBACK" bundles/project-management/skills/dr-plan/` — expected: matches in all three gate-bearing files.
- [ ] Read `templates/plan-base.md:41–47` — expected: policy options framed around independent verification, no unsatisfiable "every phase spawns" promise.
- [ ] Read `templates/plan-base.md` for the rubric section — expected: present, with its conditional-rendering note.

#### Acceptance Criteria

- All six `dr-plan` gate/apply sites carry identical three-branch logic — word-identical where they are the same instruction, as they are today.
- The three policy sites describe an outcome, not a Claude-specific mechanism.
- A plan generated after this phase renders a gate with three branches and a token slot, plus the rubric section exactly when a verifier task exists.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — ten edits across three files, word-identical duplication that drifts silently, and a blast radius covering every plan the plugin will ever generate. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 4: Apply to `dr-ship` — two prose sites plus new fallback reporting

This is the half that gates a push and a PR. A fallback-labelled gate from an earlier phase currently passes the readiness audit invisibly, because it is a checked box.

#### Tasks

- [ ] **Rewrite the two prose sites** with the same three-branch logic phrased as instructions to the executing agent: `SKILL.md:24`, `references/preflight.md:26`.
- [ ] **Point `preflight.md:26`'s inline branch at the rubric** via `../dr-plan/references/verification-rubric.md`, following the documented same-bundle precedent — this closes a pre-existing dangling reference, since "run the verifier's checklist inline" currently names a document the skill has no legal path to.
- [ ] **Add the token to preflight 1a's informational list** (`references/preflight.md:15–20`), so a fallback-labelled gate is recognized rather than silently counted as a normal `[x]`.
- [ ] **Add the always-present `Fallbacks` row** to the Ship Report READINESS block (`references/preflight.md:62–95`), reporting earlier-phase labels found by the 1a audit and rendering `✅ Fallbacks  none` on a clean run. Update the template rules so fixed row order still holds.
- [ ] **Make `--verify` state which branch ran** in the `Verifier` row, since that row is the one gating a push.

#### Verification

- [ ] Run `grep -rn "harness cannot spawn subagents" bundles/project-management/skills/dr-ship/` — expected: zero matches.
- [ ] Read `references/preflight.md` §1a — expected: the `[INLINE FALLBACK …]` token appears in the non-blocking list with a note that it is shown, not hidden.
- [ ] Read the Ship Report template — expected: a `Fallbacks` row in fixed order, and the always-present rule updated to include it.
- [ ] Confirm `../dr-plan/references/verification-rubric.md` resolves from the `dr-ship` skill root.

#### Acceptance Criteria

- `dr-ship` can no longer approve a push while an earlier phase's inline fallback goes unmentioned.
- `--verify` output distinguishes a delegated verification from an inline one.
- The pre-existing unresolvable "run the verifier's checklist inline" instruction now names a reachable file.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase changes a deterministic user-facing template and the audit that gates commit, push, and PR; a wording error here ships unverified work. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 5: Behavioural check, docs, and the 3.3.0 release

#### Tasks

- [ ] **Run the negative test** using whichever mechanism Phase 1 established: generate or use a plan with a verifier-bearing gate, cause the spawn to be rejected, and observe whether the agent takes branch 2 and labels it. Record the transcript evidence. If Phase 1 found no mechanism, record this as an explicitly labelled unverified item with its reason, following plan 012's SC1 convention.
- [ ] **Run the audit greps end to end**: `grep -rn "harness cannot spawn subagents" bundles/` returns nothing, and `grep -rn "INLINE FALLBACK" _project/plans/` finds the labelled gate produced by the test.
- [ ] **Update `README.md:374`** to document the fallback, the token's shape, and the audit grep `grep -rn "INLINE FALLBACK" _project/plans/`.
- [ ] **Version ritual — all four locations to 3.3.0:** `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, the `project-management` entry in `.claude-plugin/marketplace.json`, and a new `CHANGELOG.md` section.
- [ ] **Write the CHANGELOG entry** under `### Changed`, citing `planaraid/par` plan 073 as the field report — matching how `CHANGELOG.md:55` cites plan 006 for the `dr-research` web guard, which is the closest precedent for this failure class.
- [ ] **Confirm no migration is needed** — `draft/` and `in_progress/` are empty, and the nine `completed/` plans keep the old text as history.

#### Verification

- [ ] Run `grep -rn "harness cannot spawn subagents" bundles/` — expected: zero matches.
- [ ] Run `grep -rn "INLINE FALLBACK" _project/plans/` — expected: at least one match from the negative test, or a recorded reason why none exists.
- [ ] Run `grep -rn '"version"' bundles/project-management/package.json bundles/project-management/.claude-plugin/plugin.json` and read the marketplace entry — expected: `3.3.0` in all three, matching the new CHANGELOG heading.
- [ ] Read `bundles/project-management/README.md` around line 374 — expected: the fallback, the token shape, and the grep are all documented.

#### Acceptance Criteria

- The behavioural check is recorded with its evidentiary status stated plainly — a single observation, not proof.
- Every Success Criterion above is satisfied or carries an individually-reasoned waiver.
- `project-management` 3.3.0 is consistent across all four locations and the bundle is shippable.

#### Phase Exit Gate

<!-- verifier-recommendation: no — the release ritual is mechanical and fully covered by the version and grep checks above; the behavioural test's evidence is the transcript, which a fresh-context verifier cannot re-observe. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

## Refinement History

- **2026-07-31:** Initial plan creation.
- **2026-07-31:** Resolved 1 blocking + 3 non-blocking questions, verified 0 assumptions (3 `[?]` deliberately left for Phase 1 to settle empirically), Verification Policy reviewed and kept at Adaptive so no exit gates were regenerated. The blocking decision (Option A — rubric rendered once into the plan header) added a deliverable: Phase 3 gains the `## Inline Verification Rubric` section task, Phase 2 gains the condensed-rendering draft and a drift note, and Success Criterion 5 was extended to cover it.

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
