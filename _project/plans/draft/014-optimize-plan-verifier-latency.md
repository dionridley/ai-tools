# Plan: Optimize Plan-Verifier Latency

## Metadata

- **Number:** 014
- **Status:** draft
- **Created:** 2026-08-02
- **Last refreshed:** 2026-08-02
- **Refinement count:** 1
- **Plan type:** ai-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

A `plan-verifier` run takes 8–20 minutes per phase. Measured on 2026-08-02: a real run against plan 013 Phase 3 took **535 s, 28 tool calls, 90,290 tokens**. The cause is not what it looks like. Tool execution is **40 ms** — that phase's five Verification commands run in under half a second — and the verifier **already batches** independent calls unprompted, in nine parallel groups. What remains is ~19 turns at ~28 s each of per-turn model work: prefill of a large resent context, thinking, and a long structured report. Turn count is not the lever, and parallelism attacks the wrong term.

The plan therefore does three things to the verifier and one thing before them. It **bounds what the verifier preloads** — plan 013 is 91,745 bytes, but the target phase plus the four top-matter sections it actually needs is ~15,700, so ~83% of the file is loaded and re-sent every turn for nothing. It **compresses PASS prose in the report** while keeping every citation, since the report is the largest single generation burst and immune to batching. And it **fixes a live correctness defect found during the measurement**: `templates/plan-base.md:209` carries the `no`-shape self-review line inside the `yes`-shape gate, so every generated plan's *final* gate instruction keys the `[x]` flip to the Verification command block while the line above it keys the flip to the verifier's verdict — a task with a passing command and a FAIL verdict is flippable under the last thing the gate says.

The thing that comes first is a **regression harness**, because none exists. The verifier earns its cost: across 13 completed plans there are 28 recorded runs and 13 changed an artifact, concentrated almost entirely on semantic and contract phases (plan 012 went 6-for-6; one entry records *"the self-review pass found two things; the verifier found eleven"*). Trimming what a verifier sees is exactly the kind of change that silently costs finding-rate, so the baseline is recorded **before** any edit — otherwise a later miss cannot be distinguished between "the trim broke it" and "it was never caught anyway."

## Current State

**The verifier's instructions.** `bundles/project-management/agents/plan-verifier.md` is 127 lines. Frontmatter declares `name`, `description`, and `tools: Read, Grep, Glob, Bash` — no `model:` field and no reasoning-effort field, so it inherits the session's. Step 1 tells it to read the target phase's four blocks *plus* the plan's `Metadata`, `Definition of Done`, `Success Criteria`, and cross-cutting notes, which in practice means reading the whole file. Nothing in the file mentions batching, and nothing bounds evidence-gathering depth.

**Measured behaviour (2026-08-02, `CLAUDE_EFFORT=xhigh`).** A real run against plan 013 Phase 3: 535 s, 28 tool calls, 90,290 tokens, self-reporting nine parallel batches and serial execution only where a call genuinely depended on the previous result. The same phase's five Verification commands, run directly: 208–389 ms.

**The Read cap is a harness limit, not ours.** Reading plan 013 in full returns `showing lines 1-437 of 670 total (32532 tokens, cap 25000)`. It is not settable from the plugin, and raising it would not help — it would remove a round trip while leaving the same volume in context on every turn. The volume is the cost, not the pagination.

**The self-review line has drifted at every site.** Five instances, five distinct texts:

| | Site | Shape | Divergence |
|---|---|---|---|
| A | `create-mode.md:181` | yes | "…follow-up **in future phases or the Retro**." |
| B | `questions-mode.md:186` | yes | "…follow-up." — routing dropped |
| C | `plan-base.md:209` | **yes gate** | carries **no**-shape wording, and is a *third* variant of it |
| D | `create-mode.md:192` | no | "Re-read **all** Tasks above…short note **explaining why**" |
| E | `questions-mode.md:199` | no | "Re-read **all** Tasks above…short note." |

A≠B, D≠E, C≠D. Plan 013 held the *six* gate/apply sites byte-identical under a checked invariant and its AC1 was scoped to exactly those six; the self-review line is a **seventh site class no criterion covers**, which is why it drifted while the audited sites stayed clean. Plan 013's Findings (line 440) claim this fix landed as "a fourth branch-1-only phrasing" — it landed in `create-mode.md` and `questions-mode.md`, not in `plan-base.md`. Shipped in 3.3.0.

**`plan-base.md` carries one gate block that the generator prunes**, where `create-mode.md` carries two separate renderings. So `:209` must serve both shapes — likely how it acquired the `no`-shape text. The fix needs a conditional parenthetical in the style already used at `:207` and `:208`, not a sentence swap.

**This plan's own gates follow `create-mode.md:181`**, the authoritative CREATE-mode rendering instruction, which is correct. An agent that had followed `plan-base.md:209` instead would have emitted the `no`-shape line into these same gates. Both sites are "correct" depending on which one you read — that *is* the defect.

**No regression test exists for the verifier.** There is no fixture set, no recorded baseline, and no procedure for asking whether a change to the verifier's instructions cost finding-rate.

**Plans land as single squashed commits**, so no defective intermediate state is recoverable from git — established during question resolution on 2026-08-02 and detailed in Assumptions. This is why the fixture set is built rather than recovered.

**Repo shape.** Markdown and JSON only; root `package.json` has `scripts: null` (checked 2026-08-02). `project-management` is at 3.3.0 in `plugin.json` and `package.json`.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

### Validated

- [x] This repo has no automated test, lint, or typecheck suite — root `package.json` `scripts` is `null`, checked 2026-08-02. Established in plans 012 and 013; the Definition of Done below substitutes the integrity checks that are the real gates.
- [x] Claude Code's `Read` tool caps at 25,000 tokens — measured 2026-08-02: reading the 669-line plan 013 returned `showing lines 1-437 of 670 total (32532 tokens, cap 25000)`. A harness limit, not plugin-controllable.
- [x] The verifier already batches independent tool calls without being instructed to — measured 2026-08-02 from a real run's own process report: nine batches of 2–3 calls, serial only on genuinely dependent chains.
- [x] A real verifier run on plan 013 Phase 3 cost 535 s / 28 tool calls / 90,290 tokens, at `CLAUDE_EFFORT=xhigh`.
- [x] Subagents inherit the session's reasoning effort — `CLAUDE_EFFORT=xhigh` observed in this session's environment, so the probe figure is an xhigh figure and is not comparable to a run at another tier.
- [x] Five `Agent self-review` instances exist with five distinct texts — verified 2026-08-02 by extracting each line and comparing for byte-identity.
- [x] The verifier's value is real and heterogeneous — 28 recorded runs across 13 completed plans, 13 changed an artifact; near-100% on semantic/contract phases, near-zero on mechanical/docs/release phases. Citations spot-checked against the plan files.
- [x] `project-management` is 3.3.0 in `plugin.json` and `package.json`.

### Resolved during question resolution (2026-08-02)

- [x] **The pre-fix defective states of plan 012 Phase 3 and plan 013 Phase 2 are NOT recoverable from git.** Settled 2026-08-02 by inspecting the history: each plan landed as exactly **one squashed commit** — plan 012 at `2829256` ("Add Pencil design skill (#14)"), plan 013 at `2a23593` ("Harden Phase Exit Gate verifier fallback (#15)"), each being the only commit touching both the plan file and its implementation area. The defects were found and fixed within the session, before the squash, so no intermediate state exists to check out. **Consequence carried into Phase 1:** every fixture except F1 must be constructed from the defect descriptions recorded in the plans' Findings, not recovered. F1 — the live `plan-base.md:209` drift — is the only real one available.

### Pending / uncertain

- [ ] [?] **Whether reducing preload measurably reduces wall-clock at all.** The probe is n=1, and the link between context size and per-turn latency is inferred rather than measured. Phase 5 measures it. **A null result is a legitimate outcome and must be recorded as one** rather than explained away. Deliberately left uncertain — this is the question the plan exists to answer, and confirming it now from reasoning would be exactly the false-record failure the verifier mechanism exists to prevent.
- [ ] [?] **Whether a synthetically planted defect predicts behaviour on a real one.** A defect built to be found may be found easily, and the git finding above means all fixtures but F1 are synthetic — so this risk is now load-bearing rather than hypothetical. **Disposition decided 2026-08-02 (see Non-Blocking Q2):** accept synthetic fixtures, anchor the set on F1, and record the limitation in the baseline — the detection score is a floor on regression, not a measure of absolute capability. The assumption stays uncertain because the disposition manages the risk without resolving the underlying question.

## Open Questions & Decisions

### Execution Policy

These settings control how phases verify completion. They can be changed at any time via `/dr-plan @[this-plan] answer questions` — they are not terminal decisions.

- [ ] **Verification Policy** [OPEN] Current: Adaptive (default)
  Last changed: never

  How should Phase Exit Gates verify completion?
  - Option A (Always): Every phase gets independent verification. Highest rigor, highest token cost. Use for high-stakes work or when self-verification has been unreliable.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. Verification runs only on phases the model judged worth the cost.
  - Option C (Never): No independent verification at all. Agent self-review only. Lowest cost, lowest rigor.

  **Independent verification is the outcome; delegation is the preferred mechanism, not the definition.** Where the harness supports subagents, it runs as `project-management:plan-verifier`. Where it does not — Pi has no built-in subagent primitive — it runs inline against the Inline Verification Rubric in this plan's header and labels itself `[INLINE FALLBACK …]`. That is a normal operating mode there, not a degradation, and A and B remain meaningful on both. Option C is different in kind: it renders no verification task at all, so "Never" and "fell back" are distinguishable in the artifact rather than only in intent.

  Set at create-time and **re-confirmed during question resolution on 2026-08-02**, on the strength of the measured base rate: 28 runs, 13 with findings, near-100% on semantic/contract phases and near-zero on mechanical ones. That heterogeneity is precisely what Adaptive encodes, so the policy is now evidence-backed rather than assumed. Phases 1, 2 and 3 are `yes` (the measurement instrument, the generated-text contract, the behavioural change with the widest blast radius); Phases 4 and 5 are `no` (a bounded text edit whose real test is Phase 5's empirical re-run, and a measurement-plus-release phase whose own deliverable is the independent record).

### Blocking

Must resolve before implementation starts.

None. The one genuinely open design question — whether real defective states could be recovered from git — was settled during question resolution on 2026-08-02 rather than deferred to execution; see Assumptions.

### Non-Blocking

Can resolve during implementation.

- [x] [DECIDED: 2026-08-02] **Should the fixture set be committed, or kept in gitignored `.research/`?**

  > **Decision:** Committed to the repo, under `_project/fixtures/verifier-regression/`, with the baseline at `_project/docs/verifier-regression-baseline.md`.
  > **Rationale:** A baseline is only worth recording if it can be re-run later — by a future session, by another contributor, or by the user after a model upgrade changes verifier behaviour. Gitignoring it would make the Phase 5 comparison unreproducible, which undercuts the entire reason for putting the harness first. **Placement constraint:** the fixtures must live under `_project/`, **not** under `bundles/`. Fixtures deliberately contain defective text; shipping them inside a bundle would distribute broken examples to users and would put stray directories under the Definition of Done's "`plugin.json`'s `skills[]` lists every directory under `skills/`" check. The fixture directory carries a README stating the files are intentionally defective, so a future reader or a naive grep audit is not misled.

- [x] [DECIDED: 2026-08-02] **Should the measured latency delta appear in the CHANGELOG, or only in the baseline doc?**

  > **Decision:** Baseline document only. The CHANGELOG describes the change qualitatively.
  > **Rationale:** A figure in a changelog reads as a promise, and this one is n=1, on one machine, at `CLAUDE_EFFORT=xhigh` — a user at a different effort level would not reproduce it, and subagents inherit session effort. The CHANGELOG says what changed ("the verifier now preloads only the target phase and named top-matter sections, and keeps an explicit license to range"); the numbers live in the baseline document with their effort level attached, where the conditions travel with the measurement.

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] **Detection did not regress.** Across the Phase 1 fixture set, the modified verifier finds every planted defect the baseline verifier found — or each regression is recorded together with the specific context that restored it.
- [ ] **Auditability guardrail holds.** Every PASS verdict in every post-change verifier report carries a `file:line` citation or a command-and-output. No uncited PASS, anywhere.
- [ ] **The latency delta is measured, not estimated** — stated as a number, with the `CLAUDE_EFFORT` level it was measured at, including the case where the delta is zero or negative.
- [ ] **The `Agent self-review` line is byte-identical within each shape across all five sites**, and is covered by the same diff-checked invariant as the six gate/apply sites.
- [ ] **A committed, re-runnable verifier regression harness exists** where none did before, with one documented procedure for re-running it and a stated limitation about synthetic-fixture fidelity.
- [ ] `project-management` is 3.4.0 in `plugin.json`, `package.json`, `marketplace.json`, and the CHANGELOG.

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- **Manifest integrity:** every JSON file touched parses; the `project-management` version string is identical in `bundles/project-management/.claude-plugin/plugin.json`, `bundles/project-management/package.json`, and the `project-management` entry in `.claude-plugin/marketplace.json`; `plugin.json`'s `skills[]` lists every directory under `bundles/project-management/skills/` and `agents[]` lists every file under `agents/`.
- **Frontmatter validity:** every `SKILL.md` and agent file touched still parses as YAML and has `name` and `description`; a skill's `name` matches its own directory name.
- **Reference integrity:** every relative path referenced from a `SKILL.md` or reference file resolves to a file that exists.
- ~~Tests pass~~ / ~~Lint clean~~ / ~~Typecheck clean~~ — **struck.** This repo is markdown and JSON with no `scripts` block and no automated suite; the three checks above are the real gates. Justified in Assumptions.

## Inline Verification Rubric

<!-- Rendered only when at least one phase carries the independent-verification task.
     Omit entirely when Verification Policy is Never, or when every phase is
     verifier-recommendation: no. GENERATED from dr-plan/references/verification-rubric.md
     (everything above its "## Report" heading, headings demoted one level) — never retyped. -->

How to verify a plan phase **yourself**, when independent verification could not be delegated.

This is the fallback branch of a Phase Exit Gate, and of `/dr-ship --verify`. When delegation
succeeds, the `plan-verifier` agent carries its own copy of these rules and this rubric is not
used — the two are deliberately separate, because a fresh-context subagent and an agent grading
its own work need different framing.

**The thing that makes this branch dangerous is not that it is less capable. It is that it is
not independent.** Everything below exists to supply, deliberately, the independence that
delegation would have given for free.

### Verdicts

One per task, per Verification item, and per Acceptance Criterion:

- **PASS** — evidence is direct and observable. Cite it (`file:line`, or the command and output).
- **FAIL** — evidence shows the opposite of what is required. Cite it.
- **UNVERIFIED** — evidence is missing, ambiguous, or could not be gathered. State why.

**Under-report beats over-report.** When you are unsure, the answer is `UNVERIFIED`, not `PASS`.
A second pass is cheap. A false `PASS` is silently corrosive: it is a *record* that a check
happened, and nothing downstream — no later phase, no retro, no `/dr-ship` audit — will ever
re-examine it. A missing check is recoverable; a false record of a check is not.

### Skepticism rules

- A test file existing is not a test passing. Run it.
- A function being defined is not the behaviour working. Check a call site or a test.
- An import being added is not a feature being used. Check for actual use.
- A config change is not a deployment. Check that the change is loaded.
- A `TODO` removed does not mean the work behind it is done. Check the replacement.
- No inference from naming. `login-handler.ts` existing is not login being implemented. Open it.
- **A task marked `[x]` is not evidence.** That mark is the claim under test, not proof of it.
- **You wrote this code. That is a reason for more skepticism, not less.** You know what you intended, which makes it easy to read intent into what is actually there. Delegation would have bought that independence for free; inline, you supply it deliberately. Go and look at what is actually there, and actively seek the thing you would rather not find.

### Naming the condition in the label

An inline verification must record that it happened, by tagging the gate task **immediately
after the checkbox** — the same position `[WAIVED …]` occupies:

```
- [x] [INLINE FALLBACK YYYY-MM-DD: agent not registered] **Run this phase's independent
      verification.** …
```

**The date stays a literal `YYYY-MM-DD` placeholder in this example, deliberately.** These words
ship verbatim into every generated plan, so a concrete date here would put a string shaped
exactly like a real label into plans where no fallback ever occurred — making the audit
unfindable by the very grep that justifies the label. Detection therefore anchors on a real
date, and this example cannot match it:

```
grep -rnE '\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:' _project/plans/
```

Dated the day the fallback occurred — matching the `[WAIVED YYYY-MM-DD: reason]` convention,
which stamps the action, not the plan. Neither parser matches the other's prefix, and the two
tags **can** legitimately share a line: `/dr-ship` appends a waiver to an already-`[x]` item
when shipping proceeds despite an adverse verdict, and that item may be one this label already
marks. Order them fallback first, waiver second — *how it was verified*, then *what was decided
about the result*. `<condition>` is exactly one of:

| Value | When |
|---|---|
| `no subagent mechanism` | The harness has no delegation tool at all. |
| `agent not registered` | A spawn was refused, and `plan-verifier` was **not** among the agents the refusal listed. |
| `spawn attempted and rejected` | A spawn was refused, and `plan-verifier` **was** listed — it exists, something else refused. |
| `delegation withheld` | A mechanism exists and `plan-verifier` is registered, but the session withholds delegation, so no spawn was attempted. |
| `permission uncertain, not resolved` | A mechanism exists, you were unsure whether you could use it, and you did not ask. |

**The last two values exist because the first three cannot describe the incident this rubric
was written for.** In that case a mechanism was present, the agent *was* registered, and no
spawn was ever attempted — so there was no refusal to read and none of the first three values
fit. An agent with no legal value to write is an agent that writes nothing, which is the
unannotated pass this whole mechanism exists to prevent.

`permission uncertain, not resolved` is deliberately uncomfortable to write. Branch 3 tells you
to ask; this value is the record that you did not. Write it anyway — it is far better than the
alternative, and a reviewer seeing it knows exactly what to re-check.

**Read the refusal before naming the condition.** This applies to the second and third values,
which a refusal distinguishes directly, so there is no reason to guess between them. Measured on
Claude Code 2.1.220: an unregistered `subagent_type` returns
`Agent type '…' not found. Available agents: …` and runs nothing. The fourth and fifth values
have no refusal to read — they are reached without an attempt.

**The first four are not admissions of failure.** On a harness with no delegation primitive, or
a session that withholds it, the label is the normal, correct operating record — it says which
path ran, not that something went wrong. Write it plainly and without apology.

## Implementation Plan

### Phase 1: Build the verifier regression harness and record the baseline

The instrument comes before the change. Every later phase is judged against what this phase records, and the baseline must be taken with the **unmodified** verifier — otherwise a Phase 5 miss is ambiguous between "the trim broke it" and "it was never caught anyway."

**This phase must snapshot `templates/plan-base.md` before Phase 2 edits it.** The live `:209` drift is fixture F1, and Phase 2 removes it from the working tree. The fixture is a copy, so it survives the fix.

**Git archaeology is already settled and must not be repeated.** Question resolution on 2026-08-02 established that plans land as single squashed commits (012 → `2829256`, 013 → `2a23593`), so no pre-fix defective state exists to recover. Every fixture except F1 is constructed.

#### Tasks

- [ ] **Create `_project/fixtures/verifier-regression/` with a README** stating plainly that every file under it is *intentionally defective* and exists to test the verifier — so a future reader, a naive grep audit, or a later `/dr-ship` fallback scan is not misled by its contents. Fixtures live under `_project/`, never under `bundles/`, so nothing defective ships to users and no stray directory disturbs the manifest completeness checks in the Definition of Done.
- [ ] **Snapshot fixture F1 — the live `plan-base.md:209` drift — before any edit.** Copy the current `templates/plan-base.md`, `references/create-mode.md`, and `references/questions-mode.md` into the fixture tree, alongside a short plan file whose Phase Exit Gate claims *"the Agent self-review line is word-identical within each shape across all sites."* The planted defect is real, currently on main, and known-findable: the 2026-08-02 probe found it unprompted. **F1 is the anchor of the set** — the only fixture whose defect was not authored for the test.
- [ ] **Construct three synthetic fixtures from the defect classes recorded in the plans' Findings**, since the git finding above rules out recovering real ones: (a) **grep-poisoning** — a worked example containing a literal token a naive audit grep would match, so a plan with no real occurrence reports one (plan 013 Phase 3's finding); (b) **connective-sentence drift** — two nominally-identical text regions differing only in a sentence *between* two lists, which a bullet-scoped comparison structurally cannot see (`verification-rubric.md:181`); (c) **a recorded count that does not reproduce** — an annotation asserting a character or line count that measurement contradicts.
- [ ] **Write the fidelity limitation into the baseline document, not just the plan.** A synthetic defect built to be found may be found more easily than a live one, so the detection score is a **floor on regression, not a measure of absolute capability**. A future reader comparing a later run against this baseline must see that caveat next to the numbers.
- [ ] **Define the four eval dimensions and their measurement methods.** **Detection:** fraction of planted defects the verifier reports, measured by comparing its report against the fixture's known defect list. **Auditability:** fraction of PASS verdicts carrying a `file:line` or command-and-output, counted from the report. **Latency:** wall-clock seconds per run. **Cost:** subagent tokens per run.
- [ ] **Set the regression thresholds as numbers, before any verifier edit exists.** Detection must not fall below the baseline on any fixture. Auditability must be 100%. Latency is the improvement target and carries **no promised figure** — the plan does not have the data to promise one.
- [ ] **Run the unmodified verifier against every fixture and record the baseline** at `_project/docs/verifier-regression-baseline.md`, scoring all four dimensions per fixture.
- [ ] **Record the session's `CLAUDE_EFFORT` value alongside the baseline.** Subagents inherit it, so a baseline taken at one effort level is not comparable to a run at another. A baseline without this value is not a baseline.
- [ ] **Document the re-run procedure** in the baseline document — the exact invocation, in enough detail that someone who did not execute this plan can reproduce the comparison.

#### Verification

- [ ] Run `ls _project/fixtures/verifier-regression/` — expected: a README plus one subdirectory per fixture (F1 + three synthetic), each containing both the defective artifact and the plan file that claims it is clean.
- [ ] Read `_project/fixtures/verifier-regression/README.md` — expected: states that the contents are intentionally defective and why.
- [ ] Read `_project/docs/verifier-regression-baseline.md` — expected: four dimensions scored per fixture, the recorded `CLAUDE_EFFORT` value, the stated thresholds, the synthetic-fidelity caveat, and the re-run procedure.
- [ ] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: empty output, confirming the baseline was taken against the unmodified verifier.
- [ ] Run `grep -c "Flip .x. only for tasks whose Verification passed" _project/fixtures/verifier-regression/f1-*/plan-base.md` — expected: at least 1, confirming F1's copy preserves the `no`-shape text.
- [ ] Run `grep -rn "bundles/" _project/fixtures/verifier-regression/ --include=README.md` — expected: no instruction placing fixtures under `bundles/`; the placement constraint holds.

#### Acceptance Criteria

- Every fixture contains a defect whose presence is checkable **without running the verifier**, so a "not found" verdict is unambiguous rather than a disagreement about whether the defect was there.
- The baseline records, per fixture, which planted defects the current verifier found **and which it missed**. A baseline miss is a fact about the verifier, not a failure of the harness, and must be recorded as such rather than quietly fixed.
- Thresholds are stated as numbers before any verifier edit is made, so Phase 5 cannot move the goalposts after seeing the result.
- The baseline states the effort level it was taken at, because a run at a different level is not comparable to it.
- The baseline states the synthetic-fidelity limitation next to the scores, so the detection number is read as a regression floor rather than a capability measure.
- Fixture F1 preserves the `plan-base.md:209` defect independently of the working tree, so Phase 2's fix does not destroy the test case.
- Nothing defective is written under `bundles/`, so no fixture ships to a plugin user.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this phase builds the instrument every later phase is judged by; a fixture that does not actually contain its defect, or a threshold set loosely, would silently validate a regression. The circularity is only apparent: the unmodified verifier is checking harness construction here, not grading its own future performance. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 2: Fix the Agent self-review drift and put it under an invariant

A correctness fix, not a performance one. It ships regardless of what Phase 5 measures.

**Entry condition, stated inline so this phase is readable on its own:** Phase 1 copies the current `templates/plan-base.md` into the fixture tree as fixture F1. This phase edits the live file and therefore destroys the defect in the working tree. Do not start until that copy exists.

#### Tasks

- [ ] **Give `templates/plan-base.md:209` the `yes`-shape wording plus a conditional parenthetical**, in the style already used at `:207` and `:208`, so the single pruned gate block is correct under both shapes without the generator inventing wording. The `yes` text is `create-mode.md:181`'s; the parenthetical names the `no`-shape substitute.
- [ ] **Align `questions-mode.md:186` with `create-mode.md:181`** — restore the dropped "in future phases or the Retro" routing, so UNVERIFIEDs are carried forward from every site that renders the `yes` shape.
- [ ] **Align `questions-mode.md:199` with `create-mode.md:192`** — restore "explaining why".
- [ ] **Extend the diff-checked invariant to cover the self-review line.** Wherever the six gate/apply sites are held byte-identical, add the seventh site class, so this line is checked by `diff` rather than by nobody. Plan 013's AC1 was scoped to "the six gate/apply sites"; that scope is why this drifted undetected.
- [ ] **Leave `agents/plan-verifier.md` byte-identical.** It is the subject of Phases 3 and 4 and must stay in its Phase 1 baseline state until then, or the Phase 5 comparison loses its control.

#### Verification

- [ ] Extract the self-review line from the three `yes`-shape sites (`create-mode.md`, `questions-mode.md`, `plan-base.md`) and compare — expected: byte-identical after stripping `questions-mode`'s uniform structural indent.
- [ ] Extract the same line from the two `no`-shape sites and compare — expected: byte-identical.
- [ ] Run `grep -c "Agent self-review" ` on each of the three files — expected: `create-mode.md` 2, `questions-mode.md` 2, `plan-base.md` 1 (plus its unrelated Option C mention, which must not be counted as a gate site).
- [ ] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: empty.

#### Acceptance Criteria

- A plan generated after this phase carries a final gate instruction that keys the `[x]` flip to **the verification's verdict**, not to the Verification command block — so a task with a passing command and a FAIL verdict is no longer flippable under the gate's last line.
- The instruction to carry UNVERIFIEDs into future phases or the Retro is present in the `yes`-shape rendering at every site that produces it.
- `plan-base.md`'s single gate block reads correctly under both shapes, with the conditional stated in the template rather than left to the generator's judgment.
- The self-review line is covered by the same diff-checked invariant as the six gate/apply sites, so a future divergence is caught mechanically.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — generated-text contract whose failure mode is subtle wording drift that Verification commands catch only if you already know which strings to compare; this exact site class drifted once already without any criterion noticing. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 3: Bound what the verifier preloads, and keep its license to range

The change with the widest blast radius, and the one whose failure mode is invisible until Phase 5 measures it. **The design constraint is that this narrows the default, not the permission.**

#### Tasks

- [ ] **Rewrite step 1 of `agents/plan-verifier.md`.** Locate the target phase by grepping its heading, read it by line range, and read only `Metadata`, `Definition of Done`, `Success Criteria`, and `Execution Policy` from the top matter. Replace the current instruction to read the plan's top matter and cross-cutting notes, which in practice loads the whole file.
- [ ] **Add the explicit license to range.** If anything in the phase points elsewhere — a cross-phase reference, an interim-phase marker, a named file, a criterion that spans sites — go and read it. State plainly that `Read`, `Grep`, and `Glob` remain unrestricted, and that the narrowed default governs what is loaded up front, never what may be looked at. **This clause is load-bearing:** plan 012's highest-value finding was one the verifier *"had not asked about"*, and narrowing preload must not narrow curiosity.
- [ ] **Record the reason in the file itself**, so a later editor does not helpfully restore the whole-plan read: the plan is re-sent on every turn, the target phase plus four sections is a fraction of it, and per-turn context is the measured cost.
- [ ] **Add the phase-self-containment rule to `create-mode.md` Phase 6.** A phase's Verification items and Acceptance Criteria must be interpretable without reading another phase. They may span **files** freely — *"all six gate sites are word-identical"* is normal and correct. They may not require another **phase's** text to interpret; where a criterion genuinely must, it states inline what it needs from that phase. Keep it to a short rule, not a new subsystem.
- [ ] **Do not touch the report shape in this phase.** That is Phase 4. Separating the two edits is what lets Phase 5 attribute a regression to one of them.

#### Verification

- [ ] Read step 1 of `agents/plan-verifier.md` — expected: the four top-matter sections named explicitly, the phase located by range, and no instruction to read the plan in full.
- [ ] Run `grep -n "remain unrestricted" bundles/project-management/agents/plan-verifier.md` — expected: at least one match, the ranging license.
- [ ] Read `create-mode.md` Phase 6 — expected: the self-containment rule present, stating the files-allowed / phases-must-be-inline distinction.
- [ ] Compute the preload byte count for `_project/plans/completed/013-harden-phase-exit-gate-verifier-fallback.md` (Phase 3's line range plus the four named sections) against the file's 91,745 bytes — expected: a materially smaller number, recorded in the phase notes rather than asserted.

#### Acceptance Criteria

- The verifier's default preload for a representative plan is a stated fraction of the whole file, recorded as a measured number rather than claimed.
- The file states that tool access is unchanged, so a later reader cannot mistake a narrower default for a narrower remit.
- The self-containment rule distinguishes spanning files (allowed) from spanning phases (must be stated inline), because conflating them would forbid the cross-site criteria this plugin depends on.
- `agents/plan-verifier.md`'s report shape is unchanged in this phase, keeping Phase 4's edit separately attributable.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this is the semantic change most likely to cost finding-rate, its failure mode is silent, and the Verification commands here can confirm the text landed but cannot confirm the verifier still notices what it used to. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 4: Compress PASS prose in the report, keep failures at full evidence

The report is the largest single generation burst — a cited verdict per item across three sections, at 11–21 items — and no amount of batching touches it. Most of those verdicts are PASS, and PASS lines are the ones nobody re-reads.

#### Tasks

- [ ] **Rewrite the report shape in `agents/plan-verifier.md`** so PASS gets one terse line that still carries its citation, while FAIL and UNVERIFIED keep full evidence and reasoning. The asymmetry is the point: shorten what is skimmed, not what is acted on.
- [ ] **State the hard constraint in the file, in words and not only by example:** an uncited PASS is not a permitted output. Compression applies to prose, never to evidence. Auditability is the property the entire gate rests on — a report whose passes cannot be traced is a record that a check happened without a record of what was checked.
- [ ] **Leave "Recommended next actions" and "Observations" as they are.** They are already short, and they are what the caller acts on.
- [ ] **Do not change step 1 in this phase.** Phase 3 owns it; keeping the two edits separate is what makes a Phase 5 regression attributable to one of them.

#### Verification

- [ ] Read the report skeleton in `agents/plan-verifier.md` — expected: the PASS example carries a `file:line` or command-and-output; the FAIL and UNVERIFIED examples are undiminished in detail.
- [ ] Run `grep -n "uncited" bundles/project-management/agents/plan-verifier.md` — expected: at least one match, the constraint stated in prose.
- [ ] Run `git diff bundles/project-management/agents/plan-verifier.md` and inspect the hunks — expected: changes confined to the report-shape section; step 1 identical to its Phase 3 state.

#### Acceptance Criteria

- Every verdict class in the report skeleton still shows its evidence; only PASS prose is shortened.
- The file forbids an uncited PASS in words, so the rule survives an editor who rewrites the examples.
- The change is confined to the report section, leaving Phase 3's edit separately attributable in Phase 5's comparison.

#### Phase Exit Gate

<!-- verifier-recommendation: no — a bounded, single-section text edit whose Verification commands inspect the delivered text directly, and whose real test is Phase 5's empirical re-run of the whole fixture set against the modified verifier. An extra fresh read here would cost a full verifier run to re-check what the next phase measures outright. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 5: Re-run the harness, measure the delta, and ship 3.4.0

Where the plan finds out whether it worked. **A null or negative result is a legitimate outcome** and is recorded as one — the measurement is the deliverable, not the speedup.

#### Tasks

- [ ] **Re-run every Phase 1 fixture against the modified verifier**, at the same `CLAUDE_EFFORT` the baseline was taken at, following the re-run procedure Phase 1 documented. Record all four dimensions per fixture.
- [ ] **Compare against the baseline.** If detection dropped on any fixture, identify which context the verifier no longer had, widen the preload to restore exactly that, and re-run. **Record what turned out to be load-bearing** — that record is a more valuable finding than the speedup, because it says what a verifier actually needs to see.
- [ ] **Record the latency and token delta as measured numbers** in the baseline document, with the effort level attached. If there is no improvement, say so plainly there and in the retro. Do not convert a null result into a hedge.
- [ ] **Note in the baseline document that the model/effort question is now answerable** by re-running the same harness at a lower tier — and do **not** run it or decide it here. Every finding in the 13/28 value record was produced at session-model strength; the harness is what would let that trade be made on evidence.
- [ ] **Update `bundles/project-management/README.md`'s verifier tuning section** to describe the preload behaviour, the ranging license, and where the harness lives and how to re-run it.
- [ ] **Add the CHANGELOG entry for 3.4.0** and bump the version in `plugin.json`, `package.json`, and the `project-management` entry in `marketplace.json`. **Per the decision in Non-Blocking Q2, the CHANGELOG describes the change qualitatively and carries no latency figure** — the numbers stay in the baseline document where their effort level and single-machine caveat travel with them.

#### Verification

- [ ] Read the post-change results in `_project/docs/verifier-regression-baseline.md` — expected: four dimensions scored per fixture, each with an explicit baseline comparison and the effort level stated.
- [ ] Run `grep -rn '"version"' bundles/project-management/.claude-plugin/plugin.json bundles/project-management/package.json` and check the `project-management` entry in `.claude-plugin/marketplace.json` — expected: `3.4.0` in all three.
- [ ] Run `grep -n "3.4.0" bundles/project-management/CHANGELOG.md` — expected: a dated entry describing the preload trim, the report change, and the self-review fix.
- [ ] Run `grep -nE "[0-9]+ ?(s|sec|seconds|%|ms)" bundles/project-management/CHANGELOG.md` scoped to the 3.4.0 entry — expected: no latency figure, per the Q2 decision.
- [ ] Read the README tuning section — expected: describes the narrowed preload, the ranging license, and the harness re-run procedure.
- [ ] Count uncited PASS verdicts across every post-change fixture report — expected: zero.

#### Acceptance Criteria

- Detection did not regress on any fixture, **or** every regression is recorded together with the specific context that restored it and a re-run confirming the restoration.
- Auditability is 100% across all post-change reports — no PASS without a citation.
- The latency delta is stated as a measured number with its effort level, including the case where it is zero or negative.
- The CHANGELOG describes the change without quoting a latency figure, so no number outlives the conditions it was measured under.
- The README documents where the harness lives and how to re-run it, so the baseline is reproducible by someone who did not execute this plan.
- `project-management` is 3.4.0 in all three manifests and carries a dated CHANGELOG entry.

#### Phase Exit Gate

<!-- verifier-recommendation: no — this phase's own deliverable is an independent measurement record produced by the harness against fixtures with externally-checkable defects, which is stronger evidence than a fresh-context re-read of the same numbers; the remainder is a mechanical release ritual. Note /dr-ship --verify will still spawn a verifier on this final phase if the user asks for it. -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

## Refinement History

- **2026-08-02:** Initial plan creation.
- **2026-08-02:** Resolved 0 blocking + 2 non-blocking questions, verified 1 of 3 uncertain assumptions (git-recoverability settled by inspecting the commit history — plans land as single squashed commits, so no pre-fix state is recoverable; the remaining two are deliberately left uncertain as the empirical questions the plan exists to answer). Verification Policy re-confirmed at Adaptive — unchanged, so no exit gates were regenerated. Phase 1 restructured to drop the now-answered git-archaeology task and adopt the committed-fixture placement; Phase 5 updated for the CHANGELOG decision.

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
