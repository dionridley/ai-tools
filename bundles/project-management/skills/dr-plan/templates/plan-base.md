# Plan: {{PLAN_NAME}}

## Metadata

- **Number:** {{PLAN_NUMBER}}
- **Status:** draft
- **Created:** {{CURRENT_DATE}}
- **Last refreshed:** {{CURRENT_DATE}}
- **Refinement count:** 0
- **Plan type:** {{PLAN_TYPE}}
- **Verification Policy:** Adaptive (default)
- **Related PRD:** {{RELATED_PRD}}

## Executive Summary

One to three paragraphs: what is being built, why, and the shape of the approach. Be specific — a reader who only read this section should know what this plan is for.

## Current State

What exists today that this plan modifies or extends. For greenfield work, state that explicitly and describe the surrounding context the new work plugs into.

## Assumptions

Each assumption is in one of three states. The checkbox carries the validation state; `[?]` is a separate tag, not a checkbox value.

- `- [ ] Assumption text` — pending. Will be validated implicitly as implementation exercises it.
- `- [ ] [?] Assumption text` — uncertain. Surfaced by `/dr-plan answer questions` for explicit review.
- `- [x] Assumption text` — validated. Confirmed by evidence (cite the source in the bullet).

To validate an assumption, flip `[ ]` to `[x]`. Do **not** write `- [ ] [x] text` — `[x]` is the checkbox state, not a tag that sits next to `[ ]`. When validating a `[ ] [?]` line, drop the `[?]` as well: it becomes `- [x] text`.

- [ ] Pending assumption text here
- [ ] [?] Uncertain assumption text here — note where/when it will be verified

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

### Blocking

Must resolve before implementation starts.

- [ ] [AWAITING] [Question]
  - Option A: [...]
  - Option B: [...]

### Non-Blocking

Can resolve during implementation.

- [ ] [OPEN] [Question]

## Success Criteria

Plan-level outcomes. Flipping all of these is how we know the plan succeeded.

- [ ] [Outcome 1]
- [ ] [Outcome 2]

## Definition of Done

Every Phase Exit Gate must confirm these before flipping any `[x]` in the phase:

- Tests pass: `{{TEST_COMMAND}}`
- Lint clean: `{{LINT_COMMAND}}`
- Typecheck clean: `{{TYPECHECK_COMMAND}}`

(If a command is not applicable to this repo, replace it with the closest equivalent — e.g., "schema validates" for a docs-only repo — or strike the line with a short justification in the Assumptions section.)

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

### Phase 1: {{PHASE_1_NAME}}

#### Tasks

- [ ] [Task 1]
- [ ] [Task 2]

#### Verification

- [ ] Run `[command]` — expected: [result].
- [ ] Read `[file]` — expected: [what's there].

#### Acceptance Criteria

- [Testable outcome 1]
- [Testable outcome 2]

#### Phase Exit Gate

<!-- verifier-recommendation: {{YES_OR_NO}} — {{REASONING}} -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
  1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
  2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
  3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
  *(Only present when Verification Policy is Always, or Adaptive + this phase's recommendation is yes. Renders together with the `## Inline Verification Rubric` section in the plan header.)*
- [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning. *(Paired with the verification task.)*
- [ ] **Agent self-review.** Re-read Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.

### Phase 2: {{PHASE_2_NAME}}

[Same structure as Phase 1.]

## Refinement History

- **{{CURRENT_DATE}}:** Initial plan creation.

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
