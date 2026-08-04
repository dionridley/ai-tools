# Plan: Optimize Plan-Verifier Latency

## Metadata

- **Number:** 014
- **Status:** completed
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

- [x] **Reducing preload measurably reduces *context*, and was NOT shown to reduce *wall-clock*.** Measured in Phase 5 at `CLAUDE_EFFORT=xhigh`: tokens **−23.1%** on a full-size 92KB plan (90,290 → 69,434) and **+14.1%** on small fixtures, where the ~1.5KB of added instructions costs more than the trim returns. Wall-clock went the wrong way on both — reference 535 → 594 s (+11.0%), fixtures +11.4% — under four biases that all push upward, one of them (a scratchpad worktree the baseline never built) discovered only by reading the run. **Rewritten rather than ticked as originally worded**, because the original asked about wall-clock and the honest answer is "not demonstrated." A clean A/B on a committed, unmodified tree would settle it; this plan did not obtain one. Recorded as a null result, per the rule this assumption set for itself.
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

- [x] **Detection did not regress.** Across the Phase 1 fixture set, the modified verifier finds every planted defect the baseline verifier found — or each regression is recorded together with the specific context that restored it.
- [x] **Auditability guardrail holds.** Every PASS verdict in every post-change verifier report carries a `file:line` citation or a command-and-output. No uncited PASS, anywhere.
- [x] **The latency delta is measured, not estimated** — stated as a number, with the `CLAUDE_EFFORT` level it was measured at, including the case where the delta is zero or negative.
- [x] **The `Agent self-review` line is byte-identical within each shape across all five sites**, and is covered by the same diff-checked invariant as the six gate/apply sites.
- [x] **A committed, re-runnable verifier regression harness exists** where none did before, with one documented procedure for re-running it and a stated limitation about synthetic-fixture fidelity.
- [x] `project-management` is 3.4.0 in `plugin.json`, `package.json`, `marketplace.json`, and the CHANGELOG.

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

- [x] **[FAILED BY GATE VERIFIER, FIXED, RE-VERIFIED 2026-08-02]** **Create `_project/fixtures/verifier-regression/` with a README** stating plainly that every file under it is *intentionally defective* and exists to test the verifier — so a future reader, a naive grep audit, or a later `/dr-ship` fallback scan is not misled by its contents. Fixtures live under `_project/`, never under `bundles/`, so nothing defective ships to users and no stray directory disturbs the manifest completeness checks in the Definition of Done.
- [x] **Snapshot fixture F1 — the live `plan-base.md:209` drift — before any edit.** Copy the current `templates/plan-base.md`, `references/create-mode.md`, and `references/questions-mode.md` into the fixture tree, alongside a short plan file whose Phase Exit Gate claims *"the Agent self-review line is word-identical within each shape across all sites."* The planted defect is real, currently on main, and known-findable: the 2026-08-02 probe found it unprompted. **F1 is the anchor of the set** — the only fixture whose defect was not authored for the test.
- [x] **Construct three synthetic fixtures from the defect classes recorded in the plans' Findings**, since the git finding above rules out recovering real ones: (a) **grep-poisoning** — a worked example containing a literal token a naive audit grep would match, so a plan with no real occurrence reports one (plan 013 Phase 3's finding); (b) **connective-sentence drift** — two nominally-identical text regions differing only in a sentence *between* two lists, which a bullet-scoped comparison structurally cannot see (`verification-rubric.md:181`); (c) **a recorded count that does not reproduce** — an annotation asserting a character or line count that measurement contradicts.
- [x] **Write the fidelity limitation into the baseline document, not just the plan.** A synthetic defect built to be found may be found more easily than a live one, so the detection score is a **floor on regression, not a measure of absolute capability**. A future reader comparing a later run against this baseline must see that caveat next to the numbers.
- [x] **Define the four eval dimensions and their measurement methods.** **Detection:** fraction of planted defects the verifier reports, measured by comparing its report against the fixture's known defect list. **Auditability:** fraction of PASS verdicts carrying a `file:line` or command-and-output, counted from the report. **Latency:** wall-clock seconds per run. **Cost:** subagent tokens per run.
- [x] **Set the regression thresholds as numbers, before any verifier edit exists.** Detection must not fall below the baseline on any fixture. Auditability must be 100%. Latency is the improvement target and carries **no promised figure** — the plan does not have the data to promise one.
- [ ] [WAIVED 2026-08-02: baseline runs completed and scored; the harness wrote zero-byte task-output files, so primary transcripts cannot be produced. Per-defect scoring record with verbatim quotations retained at `_project/fixtures/verifier-regression/_runs/baseline-2026-08-02.md`, which states its own evidentiary limit.] **Run the unmodified verifier against every fixture and record the baseline** at `_project/docs/verifier-regression-baseline.md`, scoring all four dimensions per fixture. **Gate verifier returned UNVERIFIED and this box honestly stays `[ ]`.** The four runs happened and the baseline is recorded, but the harness's task-output files are zero bytes, so the primary transcripts no longer exist and nothing downstream can re-derive the scores. Partially remediated by a per-defect scoring record with verbatim quotations at `_project/fixtures/verifier-regression/_runs/baseline-2026-08-02.md`, which states its own limit. **Not flipped, because a scoring record written from reports that no longer exist is weaker evidence than the reports** — and this plan's whole thesis is that a false record of a check is worse than a missing one. Carried to the Retro: persist full reports for the Phase 5 runs.
- [x] **Record the session's `CLAUDE_EFFORT` value alongside the baseline.** Subagents inherit it, so a baseline taken at one effort level is not comparable to a run at another. A baseline without this value is not a baseline.
- [x] **Document the re-run procedure** in the baseline document — the exact invocation, in enough detail that someone who did not execute this plan can reproduce the comparison.

#### Verification

- [x] Run `ls _project/fixtures/verifier-regression/` — expected: a README plus one subdirectory per fixture (F1 + three synthetic), each containing both the defective artifact and the plan file that claims it is clean. **PASS** — `README.md`, `_answers/`, and `f1-self-review-drift/`, `f2-grep-poisoning/`, `f3-connective-drift/`, `f4-nonreproducing-count/`.
- [x] Read `_project/fixtures/verifier-regression/README.md` — expected: states that the contents are intentionally defective and why. **PASS** — first line of the body, plus the do-not-repair instruction and the protocol rule.
- [x] Read `_project/docs/verifier-regression-baseline.md` — expected: four dimensions scored per fixture, the recorded `CLAUDE_EFFORT` value, the stated thresholds, the synthetic-fidelity caveat, and the re-run procedure. **PASS** — five dimensions, not four: **false positives** was added during construction, because F4's true-claim control is meaningless without somewhere to record it.
- [x] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: empty output, confirming the baseline was taken against the unmodified verifier. **PASS** — empty.
- [x] **[COMMAND CORRECTED 2026-08-02 — see Findings]** Run `grep -cF 'Flip `[x]` only for tasks whose Verification passed' _project/fixtures/verifier-regression/f1-self-review-drift/sites/plan-base.md` — expected: at least 1, confirming F1's copy preserves the `no`-shape text. **PASS — 1.** As originally written this command was broken twice over and returned 0 on a fixture where the defect is present.
- [x] **[COMMAND CORRECTED TWICE 2026-08-02 — see Findings]** Confirm the placement constraint holds: run `git ls-files bundles/ | grep -ic 'fixture\|verifier-regression'` and `grep -rl 'intentionally defective\|verifier-regression' bundles/ | wc -l` and `find bundles -type d -iname '*fixture*' | wc -l` — expected: **0, 0, 0**. **PASS — 0, 0, 0.** The original `grep -rn "bundles/"` over the README was a naive substring check. Its first replacement, `git status --porcelain bundles/`, was *also* wrong — it reports only uncommitted changes, so it would pass just as readily if a fixture had been committed there, and fail on any unrelated local edit. Caught by the Phase 1 gate verifier.

#### Findings

**Baseline recorded 2026-08-02 at `CLAUDE_EFFORT=xhigh`, unmodified verifier, four concurrent runs.**
Totals: **detection 13/14 · false positives 0 · auditability 13/13 (100%)**. Per fixture:
F1 4/4 (280 s, 36,945 tok) · F2 **3/4** (219 s, 25,909 tok) · F3 2/2 (208 s, 22,078 tok) ·
F4 4/4 + control passed (256 s, 26,169 tok). Full table and scoring notes in
`_project/docs/verifier-regression-baseline.md`.

**The F2 miss is the most important number in the phase.** The current verifier does *not* catch
the concrete-date subtlety: it found the audit returns 4 instead of 0, and that the release gate
is structurally unreachable, but not that the worked example's literal `2026-01-15` defeats even
a date-anchored fix. **Phase 5 must score F2 against 3/4, not 4/4.** Without this recorded, a
post-change run scoring 3/4 would read as a regression the preload trim caused, when the verifier
never caught it to begin with.

**Two of this phase's own Verification commands were defective, and both failed in the exact ways
the fixtures exist to catch.** Recorded rather than quietly corrected, because a silently-fixed
check is indistinguishable from one that always worked:

1. **A check that could never pass** (F2's class). The original
   `grep -c "Flip .x. only for tasks whose Verification passed" …/f1-*/plan-base.md` was wrong
   twice: the glob `f1-*/plan-base.md` misses the real path (`f1-self-review-drift/sites/…`), and
   the regex `.x.` assumes one character either side of `x` where the text has two — the line
   reads ``Flip `[x]` only …``, so `` ` `` and `[` both sit between. Corrected to `grep -cF` with
   the literal string and the true path; returns 1. **The defect was always present** — only the
   check was broken, which is worse than a failing check because it reports absence.
2. **A check that fires on legitimate content** (F2's class again). `grep -rn "bundles/"` over the
   fixtures README was meant to prove no instruction places fixtures under `bundles/`. It matched
   the README's necessary reference to `bundles/project-management/agents/plan-verifier.md` — the
   file under test. Replaced with `git status --porcelain bundles/`, which tests the actual
   property (nothing defective written there) rather than a substring.

**The F4 answer key contained a wrong number — in the fixture about wrong numbers.** It recorded
the fenced block as "645 characters" from `wc -c`, which counts bytes; three em-dashes make it
639 characters / 645 bytes. The baseline run reported both readings and caught the conflation.
Key corrected; either value is now accepted provided the unit is stated. No score changed, since
both falsify the plan's 1,627.

**Two verifiers self-policed the answer key without being told to.** F4 recorded *"I deliberately
did not read `../README.md` … to avoid consulting an answer key"*; F1 recorded that `_answers/`
*"was not opened or consulted"*. Encouraging, and deliberately **not** relied upon — the void-run
protocol stays mandatory, because a verifier under Phase 3's explicit ranging licence may behave
differently.

**Two deviations from the phase as planned, both recorded:**

- **A fifth dimension, false positives**, was added. F4's true-claim control has nowhere to be
  scored otherwise, and a verifier that flags everything would otherwise score perfectly on
  detection while being useless.
- **The planned fifth fixture was dropped.** F1–F4 are small by design, which makes them poor
  latency probes for a change that only pays off where preload dominates. Freezing a full-size
  plan plus the 136KB skill tree it inspects would have committed ~228KB of duplicated content.
  Instead the latency reference is plan 013 Phase 3 — a real target already measured at
  **535 s / 28 calls / 90,290 tokens**. A contamination table in the baseline document checks each
  of its six verification targets against what this plan edits; none overlap, because Phase 2
  touches the *seventh* site class rather than the six that plan 013 Phase 3 asserts are
  word-identical.

**Gate verification (delegated, 509 s · 25 tool calls · 72,459 tokens, against this 55,573-byte
plan).** Returned **3 adverse verdicts**, all real, all acted on:

1. **Task 1 FAIL — the README advertised a fixture that does not exist.** Its layout block still
   listed `f5-latency-reference/` after the decision to drop it was recorded *in the baseline
   document only*. A README whose stated job is to stop a future reader being misled was itself
   misleading. Fixed: the entry is replaced with an explicit "there is no latency fixture here,
   deliberately" note pointing at the baseline's latency-reference section. Re-verified: `grep -c
   f5-latency-reference` → 0.
2. **AC5 FAIL on placement — the fidelity limitation was 71 lines from the scores.** The substance
   was present but buried in the re-run procedure and phrased as a redirect, so a reader who read
   only the table would not meet it. Fixed: a blockquote caveat now sits **2 lines** under the
   totals. The criterion said *next to the scores* and meant it.
3. **Task 7 UNVERIFIED — the baseline scores have no surviving primary source.** See that task's
   note. This one is not fully fixable and the box stays `[ ]`.

It also caught a **third defective verification command — my own replacement for the second one.**
`git status --porcelain bundles/` reports only *uncommitted* changes, so it would have passed just
as readily if a fixture had been committed under `bundles/`, and failed on any unrelated local
edit. That is the same "check that cannot fail correctly" class the Findings above congratulate
themselves for catching, committed while writing the congratulation. Now three independent
commands test the actual property. **Three broken checks in one phase, in a plan about verification
integrity, is the phase's most useful result** — every one was written by an agent who had just
finished explaining the failure mode.

Finally it flagged a defect in **Phase 2's** Verification block before that phase began: a bare
`grep -c "Agent self-review"` returns 2 for `plan-base.md`, not the expected 1, because `:47`
mentions self-review in the Verification Policy Option C text. Corrected to a gate-anchored
pattern, verified 2 / 2 / 1.

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

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [x] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 2: Fix the Agent self-review drift and put it under an invariant

A correctness fix, not a performance one. It ships regardless of what Phase 5 measures.

**Entry condition, stated inline so this phase is readable on its own:** Phase 1 copies the current `templates/plan-base.md` into the fixture tree as fixture F1. This phase edits the live file and therefore destroys the defect in the working tree. Do not start until that copy exists.

#### Tasks

- [x] **Give `templates/plan-base.md:209` the `yes`-shape wording plus a conditional parenthetical**, in the style already used at `:207` and `:208`, so the single pruned gate block is correct under both shapes without the generator inventing wording. The `yes` text is `create-mode.md:181`'s; the parenthetical names the `no`-shape substitute.
- [x] **Align `questions-mode.md:186` with `create-mode.md:181`** — restore the dropped "in future phases or the Retro" routing, so UNVERIFIEDs are carried forward from every site that renders the `yes` shape.
- [x] **Align `questions-mode.md:199` with `create-mode.md:192`** — restore "explaining why".
- [x] **Extend the diff-checked invariant to cover the self-review line.** Wherever the six gate/apply sites are held byte-identical, add the seventh site class, so this line is checked by `diff` rather than by nobody. Plan 013's AC1 was scoped to "the six gate/apply sites"; that scope is why this drifted undetected.
- [x] **Leave `agents/plan-verifier.md` byte-identical.** It is the subject of Phases 3 and 4 and must stay in its Phase 1 baseline state until then, or the Phase 5 comparison loses its control.

#### Verification

- [x] Extract the self-review line from the three `yes`-shape sites (`create-mode.md`, `questions-mode.md`, `plan-base.md`) and compare — expected: byte-identical after stripping `questions-mode`'s uniform structural indent **and `plan-base.md`'s trailing template-only `*(…)*` annotation**, which the Apply line at `plan-base.md:208` already carries and which never ships into a generated plan. **PASS — `sort -u` returns 1 distinct line.**
- [x] Extract the same line from the two `no`-shape sites and compare — expected: byte-identical. **PASS — 1 distinct.** Also checked the Apply line across all three sites: **1 distinct.**
- [x] Run `grep -cE '^ *- \[ \] \*\*Agent self-review\.\*\*'` on each of the three files — expected: `create-mode.md` 2, `questions-mode.md` 2, `plan-base.md` 1. **The pattern must be gate-anchored, not a bare `grep -c "Agent self-review"`** — a bare count returns 2 for `plan-base.md`, because `plan-base.md:47` mentions self-review in the Verification Policy Option C text. Verified 2026-08-02: anchored gives 2 / 2 / 1, bare gives 2 / 2 / 2. *(Flagged by the Phase 1 gate verifier before this phase started.)* **PASS — 2 / 2 / 1.**
- [x] Run `git diff --stat bundles/project-management/agents/plan-verifier.md` — expected: empty. **PASS** — empty against both the index and `HEAD`, so the file is unmodified against committed state, not merely against staged state.

#### Findings

**Three text fixes plus one invariant; `agents/plan-verifier.md` untouched.** Diffstat for the
phase: `create-mode.md` +49, `questions-mode.md` +4/−2, `plan-base.md` +1/−1.

**The `plan-base.md` fix deliberately does *not* restate the `no` shape.** The obvious way to make
one pruned gate block serve two shapes is to write both into the template. That would have created
a **sixth** rendering of a line that already drifted across five, in a phase whose entire subject
is that duplication drifts. Instead `:209` now carries the `yes` shape — the one that ships when
the gate has a verification task — plus a parenthetical pointing at create-mode.md Phase 7 for the
`no` substitute, and saying why no copy lives there.

**The invariant is stated over the whole gate block, not over a list of sites.** That is the actual
lesson of this defect: plan 013's criterion named six sites and held all six, and the drift
happened at the seventh. A criterion scoped to a list stops at the end of the list. The new
section in create-mode.md Phase 7 states the rule over *every line of a rendered Phase Exit Gate*,
names the two permitted structural differences, and gives three `sort -u | wc -l` checks that
return 1 or reveal drift. It also names `refine-mode.md` as a third path that would join the list
if it ever grows a gate copy.

**Two permitted differences had to be written into the rule, not designed away.**
`questions-mode.md` carries a uniform two-space indent because its copies sit in fenced blocks
nested inside list items, and `plan-base.md` carries trailing `*(…)*` annotations addressed to the
composing model. The Apply line at `plan-base.md:208` already had one before this phase, so the
"identical up to a trailing annotation" convention predates the fix — the rule now records it
rather than pretending the lines are byte-identical when they are not.

**Verified after the edits:** yes-shape self-review across 3 renderings → 1 distinct; no-shape
across 2 → 1 distinct; Apply line across 3 → 1 distinct. Fences balanced in all three edited files
(12 / 12 / 4, all even). Every SKILL.md still parses with `name` matching its directory. All
relative paths under `dr-plan/` resolve.

**Gate verification (delegated, 485 s · 21 tool calls · 72,700 tokens).** All five Tasks, all four
Verification items and all four Acceptance Criteria **PASS**. Two results worth keeping:

**It validated the no-sixth-copy decision with an argument the phase had not made.** The worry was
that pointing at create-mode.md for the `no`-shape text might leave the template unusable. The
verifier established that it does not, structurally: create-mode.md Phase 7 sits at `:133` and
Phase 8 — the phase that instructs `Read templates/plan-base.md` — at `:248` **in the same file**,
so a composing model provably holds the `no`-shape block in context by the time it reaches the
template. It also checked all four plan-type overlays (`plan-ai-feature`, `plan-bug-fix`,
`plan-migration`, `plan-spike`) and confirmed none carries a gate copy, so there is no fourth site.

**It found three holes in the instrument this phase had just built — all now fixed.** The
instrument was the deliverable, so these were defects in the phase, not follow-ups:

1. **The normaliser was broader than the rule it implemented.** The blockquote scopes the trailing
   `*(…)*` exemption to `plan-base.md`; the shared `norm()` applied it to all three files. The
   verifier proved it by injecting `*(INJECTED DIVERGENCE)*` into a copy of the `create-mode.md`
   line and watching the check pass. That matters because create-mode.md's block ships **verbatim**
   into generated plans, so an annotation there is a defect rather than an exemption. Fixed with
   per-file normalisation (`cm`/`qm`/`pb`). Re-probed: old normaliser → 1 distinct (missed it),
   new → 2 distinct (caught).
2. **`sort -u | wc -l == 1` passes when a site is deleted.** Identity says "every rendering that
   exists agrees" and says nothing about how many exist. Fixed by asserting **presence and identity
   separately** — one number cannot carry both properties, which is the same shape of error as a
   criterion that names six sites when there are seven. Re-probed: deleting a site now fails on
   presence (2 vs want 3).
3. **The invariant was discoverable from only one of the three files it governs** — the most
   consequential of the three. An agent editing `questions-mode.md` in QUESTIONS mode had no
   in-file signal that two other copies existed. **That is the exact failure geometry of the defect
   being fixed:** plan 013's fix landed at the two sites its author was looking at and missed the
   third. Fixed with reciprocal back-pointers — a maintainer HTML comment in `plan-base.md`'s gate
   block and a blockquote in `questions-mode.md`'s Rule-per-policy section, both naming the
   invariant section. The repo already had this convention at `verification-rubric.md:184`.

**And one defect of my own, found while verifying the fix for the third.** My back-pointer check
reported `0` for `questions-mode.md`. The pointer was present; the *section title* was split
across a blockquote continuation (`> `), so neither a plain grep nor a newline-flattened grep
matched it. Reworded so `Hold the gate blocks byte-identical` sits intact on one line in all three
files. **A pointer nobody can grep for is half a pointer** — and the check that told me it was
missing was itself the naive-substring failure this plan keeps meeting.

**One grep-poisoning instance introduced, checked, and left alone.** `create-mode.md`'s bare
`Agent self-review` count went 2 → 5, from the new prose and the literal grep patterns inside the
fenced block. The gate-anchored pattern is immune (still 2). The verifier swept `_project/docs/`,
`dr-ship/` and `agents/` for any check doing a bare count against this file and found none, so
nothing downstream is poisoned.

#### Acceptance Criteria

- A plan generated after this phase carries a final gate instruction that keys the `[x]` flip to **the verification's verdict**, not to the Verification command block — so a task with a passing command and a FAIL verdict is no longer flippable under the gate's last line.
- The instruction to carry UNVERIFIEDs into future phases or the Retro is present in the `yes`-shape rendering at every site that produces it.
- `plan-base.md`'s single gate block reads correctly under both shapes, with the conditional stated in the template rather than left to the generator's judgment.
- The self-review line is covered by the same diff-checked invariant as the six gate/apply sites, so a future divergence is caught mechanically.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — generated-text contract whose failure mode is subtle wording drift that Verification commands catch only if you already know which strings to compare; this exact site class drifted once already without any criterion noticing. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [x] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 3: Bound what the verifier preloads, and keep its license to range

The change with the widest blast radius, and the one whose failure mode is invisible until Phase 5 measures it. **The design constraint is that this narrows the default, not the permission.**

#### Tasks

- [x] **Rewrite step 1 of `agents/plan-verifier.md`.** Locate the target phase by grepping its heading, read it by line range, and read only `Metadata`, `Definition of Done`, `Success Criteria`, and `Execution Policy` from the top matter. Replace the current instruction to read the plan's top matter and cross-cutting notes, which in practice loads the whole file.
- [x] **Add the explicit license to range.** If anything in the phase points elsewhere — a cross-phase reference, an interim-phase marker, a named file, a criterion that spans sites — go and read it. State plainly that `Read`, `Grep`, and `Glob` remain unrestricted, and that the narrowed default governs what is loaded up front, never what may be looked at. **This clause is load-bearing:** plan 012's highest-value finding was one the verifier *"had not asked about"*, and narrowing preload must not narrow curiosity.
- [x] **Record the reason in the file itself**, so a later editor does not helpfully restore the whole-plan read: the plan is re-sent on every turn, the target phase plus four sections is a fraction of it, and per-turn context is the measured cost.
- [x] **Add the phase-self-containment rule to `create-mode.md` Phase 6.** A phase's Verification items and Acceptance Criteria must be interpretable without reading another phase. They may span **files** freely — *"all six gate sites are word-identical"* is normal and correct. They may not require another **phase's** text to interpret; where a criterion genuinely must, it states inline what it needs from that phase. Keep it to a short rule, not a new subsystem.
- [x] **Do not touch the report shape in this phase.** That is Phase 4. Separating the two edits is what lets Phase 5 attribute a regression to one of them.

#### Verification

- [x] Read step 1 of `agents/plan-verifier.md` — expected: the four top-matter sections named explicitly, the phase located by range, and no instruction to read the plan in full. **PASS** — `Metadata`, `Definition of Done`, `Success Criteria`, `Execution Policy` all named at `:34`; phase located by `^### Phase` grep + line range at `:26–28`; the old "Also read the plan's top matter" instruction returns 0 matches.
- [x] Run `grep -n "remain unrestricted" bundles/project-management/agents/plan-verifier.md` — expected: at least one match, the ranging license. **PASS — 1 match at `:40`.** *The implementation was changed to meet this command, not the command to meet the implementation:* the first draft read "access is **unrestricted**", which fails the check as written. The plan specified the property, so the file was reworded — and "remain unrestricted" is the better phrasing anyway, because the point is that access is **unchanged**.
- [x] Read `create-mode.md` Phase 6 — expected: the self-containment rule present, stating the files-allowed / phases-must-be-inline distinction. **PASS** — new subsection *"Write phases that can be verified on their own"* at `create-mode.md:121`, with the files-versus-phases split and a worked example of each.
- [x] Compute the preload byte count for `_project/plans/completed/013-harden-phase-exit-gate-verifier-fallback.md` (Phase 3's line range plus the four named sections) against the file's 91,745 bytes — expected: a materially smaller number, recorded in the phase notes rather than asserted. **PASS — measured 16,203 bytes = 17.7% of the file** (phase 9,752 + sections 6,451). The plan's create-time estimate was ~15,700; the measurement is 3% above it.

#### Acceptance Criteria

- The verifier's default preload for a representative plan is a stated fraction of the whole file, recorded as a measured number rather than claimed.
- The file states that tool access is unchanged, so a later reader cannot mistake a narrower default for a narrower remit.
- The self-containment rule distinguishes spanning files (allowed) from spanning phases (must be stated inline), because conflating them would forbid the cross-site criteria this plugin depends on.
- `agents/plan-verifier.md`'s report shape is unchanged in this phase, keeping Phase 4's edit separately attributable.

#### Findings

**Preload measured at 17.7% of the file** — 16,203 of 91,745 bytes for plan 013 Phase 3 (phase
9,752 + the four named sections 6,451). The create-time estimate was ~15,700, so the plan was 3%
optimistic. **This is the size of the change, not the size of the saving**: whether ~83% less
preload actually reduces wall-clock is the open assumption Phase 5 measures, and a null result
stays a legitimate outcome.

**The narrowing is of the default, never of the remit.** Step 1 bounds what is loaded up front;
a new step 2 states that `Read`, `Grep` and `Glob` **remain unrestricted**, that the verifier
should follow anything the phase points at — a named file, an interim-phase marker, a cross-site
criterion, a claim about another phase — and that it should follow a suspicion too, citing the
plugin's own record that the highest-value finding was one the verifier *"had not asked about"*.
The section closes: *"A default that made you incurious would cost more than it saves."*

**Two carve-outs written in deliberately**, because a narrowed default is easy to over-read:

1. **The `## Inline Verification Rubric` section is skipped as *instructions* but read as an
   *artifact*.** It is the inline fallback's rulebook and the delegated verifier carries its own,
   so loading it by default is waste. But on a plan that *edits* the rubric, that text is the
   thing under test — an unconditional skip would send the verifier past the artifact. This
   distinction is stated in the file rather than left to judgment.
2. **Other phases are out of scope to *evaluate* but not out of bounds to *read*.** The existing
   "No scope expansion" rule could otherwise be read as forbidding the lookup the ranging licence
   requires. Both now say so explicitly, and cross-reference each other.

**The rationale is recorded in the file itself**, so a later editor does not restore the
whole-plan read as a kindness: mature plans run 90–120KB, the `Read` cap is 25,000 tokens, a
whole-plan read costs 2+ calls before any code is examined, and every byte is re-sent each turn.

**A verification command drove an implementation change, which is the right direction.** The
plan's V2 greps for `remain unrestricted`; the first draft said "access is **unrestricted**" and
would have failed. Rather than rewrite the check to match what I happened to write, I reworded the
file — and the plan's phrasing is better, because *remain* is what carries the "nothing about your
access changed" meaning that AC2 asks for. Three of the four broken checks in this plan were fixed
by correcting the check; this one was correctly fixed by correcting the code.

**Report shape untouched, as Phase 4 requires.** Every diff hunk falls between lines 24 and 71 —
the `## What you do` section. The one apparent hit in a report-shape grep is the step *pointer*
renumbering from `6.` to `7.`, caused by inserting the ranging step; the `## Report shape` section
itself is byte-unchanged. Steps 2–6 became 3–7 and no cross-reference to a step number exists
anywhere in the file.

**Gate verification (delegated, 362 s · 13 tool calls · 66,002 tokens).** All four Verification
items, all five Tasks and all four Acceptance Criteria **PASS**, with the preload figure
independently re-derived to the byte (phase 9,752 + Metadata 244 + Success Criteria 4,103 +
Definition of Done 1,113 + Execution Policy 991 = 16,203).

---

### ⚠ BLOCKER FOR PHASE 5 — the harness serves a cached agent definition

**This is the most consequential finding in the plan, and it was found only because the gate run
was instrumented to ask.** The verifier reported its own step 1 verbatim:

> *"Read the plan. Open the plan file. Find the target"*

That is the **pre-Phase-3** text from `HEAD`. It had no ranging step, no `remain unrestricted`,
neither carve-out, and its numbered steps ran **1–6, not 1–7**. Claude Code loaded the agent
definition once and did not pick up the working-tree edit.

**Consequences, stated plainly:**

- **Every verifier run in this session — including all four baseline runs and all three gate runs
  — used the baseline instructions.** That is *correct* for the Phase 1 baseline, which wanted the
  unmodified verifier. It is fatal for Phase 5, which needs the modified one.
- **Phase 5 cannot produce a valid post-change measurement in this session.** It needs the agent
  definition reloaded first — a new session, or a reinstall of the directory marketplace — and the
  reload must be *confirmed*, by the same instructions check, before any figure is recorded.
- **This phase's gate verdicts remain valid.** They are text-and-state verdicts derived from
  reading the files on disk, not from the verifier's own behaviour, and the verifier said so itself
  rather than letting the distinction pass.

**Recorded as a hard precondition on Phase 5, not as a footnote.** A post-change run against a
cached baseline verifier would produce numbers that look like a result and mean nothing — the
precise failure mode this plan exists to prevent, arriving through the instrument rather than the
subject.

---

**Two real defects in the new step 1, both found by the gate and both fixed:**

1. **`Execution Policy` had no workable location method.** Step 1c listed all four sections as
   peers, but three are `##` headings and `Execution Policy` is a `###` nested under
   `## Open Questions & Decisions`. A verifier grepping `^## Execution Policy` finds nothing; one
   falling back to the parent loads the whole of Open Questions — which would *increase* preload
   over the measured figure. Now stated explicitly, with the correct grep.
2. **Step 1b had no terminator for the final phase.** "Runs from its own heading to the next one"
   is undefined when the target *is* the last `### Phase`, so the range would run to EOF through
   `Refinement History`, `Completion` and `Retro`. Now ends at the next `^## ` heading. This would
   have hit **Phase 5 of this very plan** on its own gate.

**One inaccurate claim in this phase's own Findings, fixed by making it true.** The text asserted
that the "other phases" carve-out and the `No scope expansion` bullet *"cross-reference each
other"*. Only one direction existed — step 2 pointed at the bullet, the bullet pointed nowhere.
Rather than weaken the sentence, the reciprocal pointer was added at `plan-verifier.md:81`
(*"This governs what you evaluate, not what you read … see step 2"*), which is the better fix: the
bullet was the half of the pair that could be misread as forbidding the ranging licence.

**And a number corrected: 17% → 17.7%.** 16,203 / 91,745 = 17.66%, so "17%" was a truncation, not
a rounding. Caught by the gate and worth the correction precisely because this plan built fixture
F4 about recorded counts that do not reproduce — and Phase 1 already caught a wrong number inside
that fixture's own answer key.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — this is the semantic change most likely to cost finding-rate, its failure mode is silent, and the Verification commands here can confirm the text landed but cannot confirm the verifier still notices what it used to. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
- [x] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
- [x] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.

### Phase 4: Compress PASS prose in the report, keep failures at full evidence

The report is the largest single generation burst — a cited verdict per item across three sections, at 11–21 items — and no amount of batching touches it. Most of those verdicts are PASS, and PASS lines are the ones nobody re-reads.

#### Tasks

- [x] **Rewrite the report shape in `agents/plan-verifier.md`** so PASS gets one terse line that still carries its citation, while FAIL and UNVERIFIED keep full evidence and reasoning. The asymmetry is the point: shorten what is skimmed, not what is acted on.
- [x] **State the hard constraint in the file, in words and not only by example:** an uncited PASS is not a permitted output. Compression applies to prose, never to evidence. Auditability is the property the entire gate rests on — a report whose passes cannot be traced is a record that a check happened without a record of what was checked.
- [x] **Leave "Recommended next actions" and "Observations" as they are.** They are already short, and they are what the caller acts on.
- [x] **Do not change step 1 in this phase.** Phase 3 owns it; keeping the two edits separate is what makes a Phase 5 regression attributable to one of them.

#### Verification

- [x] Read the report skeleton in `agents/plan-verifier.md` — expected: the PASS example carries a `file:line` or command-and-output; the FAIL and UNVERIFIED examples are undiminished in detail. **PASS** — all three PASS examples carry evidence (`exit 0; output matched [expected]`, `[file]:[line]`, `[file]:[line], or the command and its output`); FAIL and UNVERIFIED each gained an explicit `— [what to say]` tail and are longer than before, not shorter.
- [x] Run `grep -n "uncited" bundles/project-management/agents/plan-verifier.md` — expected: at least one match, the constraint stated in prose. **PASS — 1 match at `:91`**, "An uncited PASS is not a permitted output," stated as a rule rather than implied by the examples.
- [x] Run `git diff bundles/project-management/agents/plan-verifier.md` and inspect the hunks — expected: changes confined to the report-shape section; step 1 identical to its Phase 3 state. **PASS** — two hunks, both inside `## Report shape` (`@@ -84,7 +84,15 @@` and `@@ -94,21 +102,21 @@`). Checked more strongly than the item asks: the whole `## What you do` section (54 lines, steps 1–7) is **byte-identical** to its staged Phase 3 state by `diff`, and `### Recommended next actions` through `### Observations` is byte-identical to `HEAD`.

#### Findings

**The asymmetry is stated as a rule, not left to the examples.** *"Length is asymmetric by design.
A PASS is one line. A FAIL or UNVERIFIED is as long as its evidence requires."* Passes are the part
nobody re-reads; failures are what the caller acts on. The example block was rewritten to show the
shape rather than merely permit it — PASS lines lost their prose tail, FAIL and UNVERIFIED gained
an explicit one.

**The guardrail is prose, so it survives an editor who rewrites the examples.** *"An uncited PASS
is not a permitted output. Compression applies to prose, never to evidence."* Stated with the
reason attached: a report whose passes cannot be traced is a record that a check happened without a
record of what was checked — worse than no report, because nothing downstream re-examines it.

**One escape valve, deliberately not routed to UNVERIFIED.** *"If a PASS genuinely needs a
qualifier, add one clause. Not a paragraph."* The tempting alternative — "if a PASS needs
explaining, mark it UNVERIFIED" — was rejected on the same grounds that killed the per-item
evidence budget during planning: it would give UNVERIFIED a second, indistinguishable meaning and
push borderline passes into a bucket the caller treats as blocking. A caveat belongs stated
plainly, not converted into a different verdict.

**Scope isolation held, which is the point of splitting this from Phase 3.** Phase 4 touched only
`## Report shape`; the `## What you do` section is byte-identical to Phase 3's staged state. If
Phase 5 measures a detection regression, it is attributable to one edit or the other rather than
to "the changes".

**Untested by construction.** Every claim here is about the *text* of the instructions. Whether a
shorter report actually reduces generation time, and whether the asymmetry costs any detection, is
Phase 5's measurement — and per the Phase 3 blocker, that measurement cannot run until the harness
reloads the agent definition.

#### Acceptance Criteria

- Every verdict class in the report skeleton still shows its evidence; only PASS prose is shortened.
- The file forbids an uncited PASS in words, so the rule survives an editor who rewrites the examples.
- The change is confined to the report section, leaving Phase 3's edit separately attributable in Phase 5's comparison.

#### Phase Exit Gate

<!-- verifier-recommendation: no — a bounded, single-section text edit whose Verification commands inspect the delivered text directly, and whose real test is Phase 5's empirical re-run of the whole fixture set against the modified verifier. An extra fresh read here would cost a full verifier run to re-check what the next phase measures outright. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 5: Re-run the harness, measure the delta, and ship 3.4.0

Where the plan finds out whether it worked. **A null or negative result is a legitimate outcome** and is recorded as one — the measurement is the deliverable, not the speedup.

#### Tasks

- [x] **Re-run every Phase 1 fixture against the modified verifier**, at the same `CLAUDE_EFFORT` the baseline was taken at, following the re-run procedure Phase 1 documented. Record all four dimensions per fixture.
- [x] **Compare against the baseline.** If detection dropped on any fixture, identify which context the verifier no longer had, widen the preload to restore exactly that, and re-run. **Record what turned out to be load-bearing** — that record is a more valuable finding than the speedup, because it says what a verifier actually needs to see.
- [x] **Record the latency and token delta as measured numbers** in the baseline document, with the effort level attached. If there is no improvement, say so plainly there and in the retro. Do not convert a null result into a hedge.
- [x] **Note in the baseline document that the model/effort question is now answerable** by re-running the same harness at a lower tier — and do **not** run it or decide it here. Every finding in the 13/28 value record was produced at session-model strength; the harness is what would let that trade be made on evidence.
- [x] **Update `bundles/project-management/README.md`'s verifier tuning section** to describe the preload behaviour, the ranging license, and where the harness lives and how to re-run it.
- [x] **Add the CHANGELOG entry for 3.4.0** and bump the version in `plugin.json`, `package.json`, and the `project-management` entry in `marketplace.json`. **Per the decision in Non-Blocking Q2, the CHANGELOG describes the change qualitatively and carries no latency figure** — the numbers stay in the baseline document where their effort level and single-machine caveat travel with them.

#### Verification

- [x] Read the post-change results in `_project/docs/verifier-regression-baseline.md` — expected: four dimensions scored per fixture, each with an explicit baseline comparison and the effort level stated. **PASS** — five dimensions per fixture (the fifth, false positives, was added in Phase 1), each with a `vs base` column; `CLAUDE_EFFORT=xhigh` and Claude Code 2.1.220 recorded for both runs; Step 0 reload confirmation recorded above the table.
- [x] Run `grep -rn '"version"' bundles/project-management/.claude-plugin/plugin.json bundles/project-management/package.json` and check the `project-management` entry in `.claude-plugin/marketplace.json` — expected: `3.4.0` in all three. **PASS — 3.4.0 in all three**, compared programmatically rather than by eye. `bundles/engineering-tools` and `bundles/experimental` confirmed untouched.
- [x] Run `grep -n "3.4.0" bundles/project-management/CHANGELOG.md` — expected: a dated entry describing the preload trim, the report change, and the self-review fix. **PASS** — `## [3.4.0] - 2026-08-02`, with Added / Changed / Fixed sections covering the harness, the ranging step, the self-containment rule, the drift invariant, the preload trim, the report asymmetry, and both halves of the self-review defect.
- [x] **[COMMAND CORRECTED 2026-08-02 — see Findings]** Confirm the Q2 decision holds: the 3.4.0 entry claims **no wall-clock delta**. Run, scoped to the entry, `grep -inE 'faster|slower|speedup|latency (fell|dropped|improved|reduced)'` — expected: **zero matches** — and `grep -o 'Wall-clock was not shown to improve'` — expected: **one match**. **PASS — 0 and 1.** The original `grep -nE "[0-9]+ ?(s|sec|seconds|%|ms)"` was a character-pattern check standing in for a property check, and it failed in both directions: it flagged `40 ms` (a machine-independent diagnostic fact, not a delta) and it **missed** `−23.1%` and `+14.1%` entirely, because `\b` finds no word boundary between `%` and markdown's `**`. Every numeric in the entry was then enumerated and judged by hand: token deltas with opposite signs stated against the plan size each applies to, share-of-file figures, version and plan numbers. No wall-clock delta is claimed anywhere.
- [x] Read the README tuning section — expected: describes the narrowed preload, the ranging license, and the harness re-run procedure. **PASS** — two new subsections: *"What it loads, and what it may look at"* (the four sections, the unrestricted-tools statement, both carve-outs, the report asymmetry, and the measured token deltas with the wall-clock null result stated) and *"Testing a change to the verifier"* (the harness, plus the two traps — the once-per-session agent-definition load and inherited reasoning effort).
- [x] Count uncited PASS verdicts across every post-change fixture report — expected: zero. **PASS — zero across all five reports.** F2 7/7 cited, F3 4/4, F4 3/3, latency reference 13/13; F1 produced no PASS verdicts at all (every one of its seven self-certified items failed), so its ratio is undefined rather than 100% — recorded as `n/a`, not as a pass.

#### Acceptance Criteria

- Detection did not regress on any fixture, **or** every regression is recorded together with the specific context that restored it and a re-run confirming the restoration.
- Auditability is 100% across all post-change reports — no PASS without a citation.
- The latency delta is stated as a measured number with its effort level, including the case where it is zero or negative.
- The CHANGELOG describes the change without quoting a latency figure, so no number outlives the conditions it was measured under.
- The README documents where the harness lives and how to re-run it, so the baseline is reproducible by someone who did not execute this plan.
- `project-management` is 3.4.0 in all three manifests and carries a dated CHANGELOG entry.

#### Findings

**Detection did not regress anywhere. The trim reduces context on large plans. Wall-clock is unproven.**

| | Baseline | Post-change | |
|---|---|---|---|
| Detection (14 planted defects) | 13/14 | **13/14** | identical per fixture |
| False positives | 0 | **0** | control passed both runs |
| Auditability | 13/13 | **14/14** | 100% both |
| Fixture latency | 963 s | 1,073 s | +11.4% |
| Fixture tokens | 111,101 | 126,791 | +14.1% |
| **Reference latency** (92KB plan) | 535 s | 594 s | **+11.0%** |
| **Reference tokens** (92KB plan) | 90,290 | **69,434** | **−23.1%** |

**The crossover the design predicted is the clearest result here: −23.1% tokens on a full-size
plan, +14.1% on small ones.** Same change, opposite signs, split by plan size. On a small plan the
~1.5KB of added instructions is paid every turn with no preload to recover; on a 92KB plan, not
re-sending 83% of the file each turn returns 20,856 tokens and three tool calls.

**Wall-clock did not follow, and this is recorded as a null result rather than explained away.**
The reference went 535 → 594 s. Three biases were declared *before* the number existed — ~6KB more
evidence in the inspected files, ~1.5KB more instructions — and a fourth was discovered only by
reading the run: **it built a scratchpad git worktree the baseline never built**, having noticed
the working tree carried plan 014's uncommitted edits to the very files under test and judged that
grading them would attribute another plan's changes to Phase 3. That is more work, and better
verification, than the baseline did. No attempt is made to net these out; that would be arithmetic
dressed as measurement. A clean A/B is cheap later: commit this plan, re-run the reference on an
unmodified tree.

**Two behavioural changes worth recording, neither a regression:**

- **F3 Task 1 moved FAIL → UNVERIFIED**, on provenance rather than fidelity — *"no render script, no
  generation marker… What would settle it: a render command that can be re-run."* The more
  conservative verdict, and both planted defects were still found. Recorded because **a softening
  verdict is the shape a real regression would take**, and it should not pass unremarked merely
  because this instance is defensible.
- ~~**The post-change runs found things the baseline did not.**~~ **RETRACTED 2026-08-04 — this was
  backwards.** The original claim was that F3 caught `rendered.md` contradicting *itself* "found
  twice post-change, never at baseline."

  The variance study (`_project/docs/verifier-variance-study.md`, 24 runs, blind-scored) ran F3
  three times per arm. **All three baseline runs found the self-contradiction** — one calling it its
  "sharpest evidence," another "more seriously" than the cross-file drift. **Only two of three
  post-change runs found it, and one of those mis-cited the line** (`:11`; the trigger is at `:10`).

  **The error was not a small sample. It was treating one baseline run's silence as evidence of
  absence.** A verifier that does not mention something has not been shown to have missed it. The
  broader "found more" claim is also unsupported: extra findings came out mixed across fixtures,
  with the baseline arm *ahead* on F3, and round-level ranges overlapping.

  What the study *did* confirm, and what this bullet should have said: **detection is unchanged
  (40/42 both arms) and auditability is measurably better (97.3% vs 82.1%)** — the latter being a
  real gain that the n=1 measurement missed entirely, because it recorded 100% for both arms.

**F2's D3 was scored MISSED again, strictly.** The post-change run came closer — it named
`audit-guide.md:9` as *"a complete, **dated**, reason-bearing tag… indistinguishable from a live
deferral"* — but never proposed date-anchoring, so it never reached the placeholder remedy the key
requires. **Scored consistently with the baseline rather than generously: a harness that flatters
the change it exists to test is worth nothing.**

**The fifth broken check of this plan, and the most instructive.** Phase 5's Q2 check was
`grep -nE "[0-9]+ ?(s|sec|seconds|%|ms)"` — a character pattern standing in for a property. It
failed in **both** directions at once: it flagged `40 ms` (a machine-independent diagnostic fact,
not a delta) and it silently **missed** `−23.1%` and `+14.1%`, because `\b` finds no word boundary
between `%` and markdown's `**`. Replaced with a check that tests the actual property — no
wall-clock delta claimed, and the null result stated — after enumerating and judging every numeric
in the entry by hand. Five checks across five phases, every one written by an agent who had just
finished explaining this exact failure mode.

**One disclosure the reference run volunteered, which the plan should not bury.** It had read plan
014's uncommitted prose describing the self-review drift *before* confirming the defect mechanically
at commit `2a23593`, and said so: *"The confirmation is my own — extraction, `sort -u`, and `diff`
against the commit — but the lead was not."* Its confirmation is independent; its attention was not.
That is the ranging licence working as intended and being honest about its cost.

#### Phase Exit Gate

<!-- verifier-recommendation: no — this phase's own deliverable is an independent measurement record produced by the harness against fixtures with externally-checkable defects, which is stronger evidence than a fresh-context re-read of the same numbers; the remainder is a mechanical release ritual. Note /dr-ship --verify will still spawn a verifier on this final phase if the user asks for it. -->

- [x] Run Definition of Done commands (see plan header). All must pass.
- [x] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

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

- **Building the harness before touching the subject.** The Phase 1 baseline is the only reason the F2 result means anything: the verifier scored 3/4 before *and* after, so the post-change 3/4 is "no regression" rather than "the trim broke something." Without the baseline that number was uninterpretable, and the temptation would have been to read it either way.
- **Instrumenting a gate run to report its own instructions.** One paragraph appended to a prompt caught that Claude Code loads the agent definition once per session and was still serving the pre-change text. Every run in that session — four baselines, three gates — had used the old instructions. Had Phase 5 run there, it would have produced a complete, confident, meaningless measurement.
- **Keeping a full-size latency reference instead of a fifth fixture.** The four fixtures said tokens **rose** 14.1%; the 92KB reference said they **fell** 23.1%. Only the reference could show the crossover, and the fixtures alone would have supported exactly the wrong conclusion. The 228KB the fifth fixture would have cost bought nothing the reference did not.
- **Declaring the contamination before the number existed.** The reference run's biases were written into the baseline doc while it was still in flight, so the +11.0% could not be retro-fitted into an excuse.
- **The verifier repeatedly earned its cost on this plan.** It found the live `plan-base.md:209` defect on an unrelated already-complete phase; three holes in the invariant Phase 2 had just built, one proved with an injection probe; two defects in Phase 3's new step 1, one of which would have hit Phase 5's own gate; a false claim in Phase 3's own Findings; and a truncated percentage in a plan that had built a fixture about truncated percentages.

### What didn't

- **Five broken verification checks, one per phase, every one written immediately after explaining the failure mode.** A wrong path glob; a regex assuming one character either side of `x` where the text is ``Flip `[x]` only``; a naive substring that fired on legitimate prose; `git status` standing in for a property it could not test; and a character pattern that over-matched and under-matched *at the same time*. Three were caught by me, two by the verifier.
- **The headline objective is unproven.** The plan set out to reduce latency and delivered a context reduction with no demonstrated speedup. That is a real outcome, not a framing problem.
- **The reference measurement was contaminated four ways, and only three were anticipated.** The fourth — the post-change run building a scratchpad git worktree the baseline never built, because our own uncommitted edits made the working tree unrepresentative — was discovered by reading the report, not by design.
- **The baseline's primary transcripts were never persisted.** The harness's task-output files were zero bytes, so Phase 1 Task 7 stays `[ ]`. A per-defect scoring record with verbatim quotations exists, but it is weaker than the reports and says so.

### Learnings

- **State an invariant over a region, never over a list of sites.** Plan 013's criterion named six sites and held all six; the drift landed at the seventh. A criterion scoped to a list stops at the end of the list.
- **Presence and identity are different properties and one number cannot carry both.** `sort -u | wc -l == 1` passes when a site is deleted outright. Assert both, always.
- **Check the property, not a character pattern.** Every one of the five broken checks was a pattern standing in for a property — "does the text contain X" where the question was "does this hold." When a `grep` is the check, write down what it would take for the grep to be right and wrong at the same time.
- **A failing verification command is a fork, not a bug report.** Three times the right fix was correcting the check; once (`remain unrestricted`) it was correcting the code, because the plan had specified the property and the implementation had drifted from it. Decide which side is authoritative *before* editing either.
- **Agent definitions load once per session.** Any measurement whose meaning depends on which definition is live must confirm it first. The check costs one paragraph; skipping it costs the whole measurement, silently.
- **Fixtures sized to isolate defects cannot measure performance.** They carry the instruction overhead and none of the payload. Keep one full-size reference, and expect the two to disagree.
- **A harness that flatters the change it was built to test is worth nothing.** F2's D3 was scored MISSED post-change on reasoning that was *closer* than the baseline's — scored strictly, because generosity there would have manufactured an improvement out of a scoring choice.

### Follow-up: the variance study (2026-08-04)

Everything above was written at completion, from n=1 per cell. A 24-run study
(`_project/docs/verifier-variance-study.md`, run record at
`_project/fixtures/verifier-regression/_runs/variance-2026-08-04.md`) later measured the spread
those single draws came from. Kept separate rather than folded in, because the difference between
what this plan believed at completion and what turned out to be true *is* the lesson.

**What it confirmed**

- **Detection did not regress:** 40/42 in both arms, each ranging 13–14 per round. The primary risk
  is closed at n=3.
- **Tokens were the right thing to decide on:** on the large fixture the arms separate cleanly and
  do not overlap — 34,616–39,314 post-change against 46,193–47,675 pre-change, **19.8% lower**.

**What it overturned**

- **This plan recorded a claim that was backwards, not merely thin.** Phase 5 Findings said the F3
  `rendered.md` self-contradiction was found post-change and "never at baseline." In fact **all
  three baseline runs found it** and only two of three post-change runs did, one mis-citing the
  line. Retracted in place above.
- **Auditability was a real gain this plan missed.** It scored 100% for both arms and concluded
  nothing changed; at n=3 the baseline is **82.1%** against **97.3%**. The n=1 measurement drew a
  lucky baseline and hid the improvement.
- **"Latency is unproven" understated it.** Consecutive rounds of an *unchanged* definition varied
  **43–153%** — larger than every delta this plan attributed to the change. The question was not
  unanswered; it was **unanswerable by that design**.

**Learnings**

- **Silence is not absence.** The wrong entry came from one baseline run not mentioning a finding
  and that being read as failing to find it. A verifier that does not mention something has not
  been shown to miss it. This is the single most transferable lesson of the whole plan.
- **Never record a comparative claim from n=1 as a finding.** Not "record it with a caveat" —
  the caveat was present and the claim still hardened into the record and into two other documents.
- **Design the confound controls before the first run, and write down which ones you rejected.**
  Review before Arm A found that three committed docs — including the study's own design file —
  described the planted defects in prose, and that the post-change definition's licence to range
  made the leak *asymmetric* toward the hypothesis. Found afterwards, that is uninterpretable.
- **Check whether the tidy number is the true one.** The first scoring pass recorded "false
  positives: 1 each." Re-checking against the keys gave **1 and 0** — and the study's only false
  positive came from the arm being advocated for.
