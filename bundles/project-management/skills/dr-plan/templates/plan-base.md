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
  - Option A (Always): Every phase spawns `project-management:plan-verifier`. Highest rigor, highest token cost. Use for high-stakes work or when self-verification has been unreliable.
  - Option B (Adaptive): Each phase is annotated at create-time with `<!-- verifier-recommendation: yes|no -->`. The verifier runs only on phases the model judged worth the cost.
  - Option C (Never): No verifier subagent. Agent self-review only. Lowest cost, lowest rigor.

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
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report. If the harness cannot spawn subagents, run this phase's Verification checklist yourself in a fresh, skeptical pass and record PASS/FAIL per item. *(Only present when Verification Policy is Always, or Adaptive + this phase's recommendation is yes.)*
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the verifier's reasoning. *(Paired with Spawn.)*
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
