# QUESTION RESOLUTION Mode — Answer Open Questions in a Plan

This reference owns the full QUESTION RESOLUTION flow end-to-end. Walks the user through unresolved items in a plan — blocking questions, non-blocking questions, uncertain assumptions, and execution policy.

The flow is: parse → extract → summarize → resolve blocking → resolve non-blocking + policy → verify assumptions → write → report.

## Phase 1: Identify the Plan

The plan content is auto-expanded into the conversation via `@` reference. Extract:

- Plan name (from `# Plan: ...` heading).
- Plan number (from Metadata block).
- Status (from folder path — draft / in_progress / completed).
- File path (from the `@` reference).

If plan content is missing from the conversation:

```
❌ Plan content not found in context.

Usage: /dr-plan @_project/plans/[folder]/[NNN]-[slug].md answer questions
```

Stop.

If the plan is in `completed/`, refuse (same rule as REFINE mode):

```
❌ Cannot resolve questions in a completed plan.
Completed plans are historical records. Create a new plan if needed.
```

Stop.

## Phase 2: Extract Unresolved Items

Scan the plan for four categories:

1. **Uncertain assumptions** — `[ ]` items in `## Assumptions` marked with `[?]`.
2. **Blocking questions** — items in `### Blocking` with `[AWAITING]`.
3. **Non-blocking questions** — items in `### Non-Blocking` with `[OPEN]`.
4. **Execution Policy items** — items in `### Execution Policy`. Always include `Verification Policy` even if the user has set it before — this section is permanently tunable (stays `[OPEN]` across the plan's life).

For each item, parse:
- The topic/title.
- The question or assumption text.
- Any options listed (Option A, Option B, ...).
- Current state (for Policy items: the current value).

## Phase 3: Show Summary

```
📋 Plan Questions to Resolve

Plan #[NNN]: [Plan Name]
Status: [status]

Resolution needed:
  - [N] blocking questions ([AWAITING])  ⚠️  Must resolve before implementation
  - [N] non-blocking questions ([OPEN])
  - [N] uncertain assumptions ([?])
  - 1 execution policy [OPEN] — Verification Policy (Current: [value])

Starting interactive resolution...
```

If there are **zero** unresolved items across all four categories AND the user has touched Verification Policy at least once before (inferred from `Last changed` not being `never`), emit:

```
✅ No unresolved questions

Plan #[NNN]: [Plan Name]
Status: [status]

All assumptions confirmed, all questions resolved. Verification Policy is [value] — change via this command again any time.

Next steps:
  [If in draft/:] Move to in_progress: mv _project/plans/draft/[filename].md _project/plans/in_progress/
  [If in in_progress/:] Continue implementation.
```

Stop.

Otherwise (zero items but Policy has never been changed), proceed — the Policy surface is still worth offering.

## Phase 4: Resolve Blocking Questions First

Critical — blocking questions must resolve before implementation.

For each blocking question (in order):

1. Use `AskUserQuestion`:
   - **Question:** the question text from the plan.
   - **Header:** the topic (max 12 chars).
   - **Options:** the plan's Option A / Option B / etc. If no options given in the plan, synthesize 2-4 sensible options based on the question.
   - `multiSelect`: false.

2. Wait for the user's response.

3. Record the decision in the resolution log:
   - Topic.
   - Chosen option (label).
   - Rationale (option description, or user's notes if provided).

After all blocking questions are resolved, emit:

```
✅ All blocking questions resolved ([count] of [count])
```

## Phase 5: Resolve Non-Blocking Questions + Execution Policy (as a Group)

Ask once — a single gate prompt — whether to address the remaining non-blocking category and the Execution Policy items:

> Resolve non-blocking questions and review Execution Policy? ([N] non-blocking + Verification Policy)

Options:
- **Yes, go through them.**
- **Skip — use defaults.** Non-blocking questions stay `[OPEN]`. Verification Policy stays at its current value.

If **Skip** → go to Phase 6 (uncertain assumptions).

If **Yes:**

### 5a: Non-blocking questions

For each, use `AskUserQuestion` like Phase 4. Record each decision.

### 5b: Execution Policy — Verification Policy

Use `AskUserQuestion` with the three options from the plan:

> Verification Policy controls how Phase Exit Gates verify completion. Current: [value]. Change to?

- **Always** — every phase gets independent verification. Highest rigor, highest token cost.
- **Adaptive (default)** — each phase annotated at create-time; verification runs only where the model judged it worth the cost.
- **Never** — agent self-review only.
- **Keep current ([value]).**

Independent verification is the outcome; delegation is the preferred mechanism, not the definition. Where the harness supports subagents it runs as `plan-verifier`; where it does not — Pi has no built-in subagent primitive — it runs inline against the plan's Inline Verification Rubric and labels itself `[INLINE FALLBACK …]`. Always and Adaptive are meaningful on both harnesses; Never differs in kind, rendering no verification task at all.

If the user picks "Keep current," skip Phase 5b's downstream effects entirely. Otherwise, store the new policy and trigger Phase 7 (Exit Gate regeneration).

## Phase 6: Verify Uncertain Assumptions

If there are `[?]` items, ask once:

> Verify uncertain assumptions? ([N] items)

Options:
- **Yes, verify each.**
- **Skip — leave as uncertain.**

If **Yes,** for each assumption use `AskUserQuestion`:

> Is this assumption correct: "[assumption text]"?

Options:
- **Yes — confirmed.**
- **No — needs change.** (Follow up: ask what the correct assumption should be.)
- **Skip — leave as uncertain.**

Record the outcome for each.

## Phase 7: Regenerate Phase Exit Gates (only if Verification Policy changed)

**Skip this phase entirely if the Verification Policy did not change in Phase 5b.**

When Policy changes, regenerate every phase's Phase Exit Gate block to match. Regeneration touches exactly two things — **the Phase Exit Gate blocks, and the plan-wide `## Inline Verification Rubric` section** (which the new policy may require adding or removing; see the Preservation rule below). Everything else — Tasks, Verification, Acceptance Criteria, and existing `[x]` progress — is preserved verbatim.

### Rule per policy

- **→ Always** — every phase's Exit Gate renders with the Always shape:

  ```
  #### Phase Exit Gate

  <!-- verifier-recommendation: yes — policy: Always (forced) -->

  - [ ] Run Definition of Done commands (see plan header). All must pass.
  - [ ] **Run this phase's independent verification.** The Verification Policy in this plan's header is the user's standing request for independent verification — for the outcome, not for any particular mechanism. The plan is not what withholds permission, so never skip on the plan's account; if your harness withholds delegation, that is branch 2.
    1. **Delegated (preferred)** — if the harness supports subagents, `plan-verifier` is registered, and the session does not withhold delegation: delegate with this plan's path and phase number, then wait for the report. *(Claude Code: `subagent_type="project-management:plan-verifier"`.)*
    2. **Inline fallback** — otherwise verify this phase yourself against the **Inline Verification Rubric** in this plan's header: a fresh, skeptical pass that **records a verdict per item** — PASS / FAIL / UNVERIFIED for every task, Verification item, and Acceptance Criterion, each with its evidence. Then tag this task immediately after its checkbox: `[INLINE FALLBACK YYYY-MM-DD: <condition>]`. The rubric defines the condition values and how to choose between them.
    3. **Never silently self-pass** — if a mechanism exists but you are unsure you may use it, ask. Uncertainty about permission is not inability. If you do not ask, branch 2 with its label is still required: an unannotated pass is the one outcome this gate exists to prevent.
  - [ ] **Apply the verification result.** Flip `[x]` only for items the verification returned PASS — whether that came from the verifier or from your own inline pass. Keep `[ ]` for FAIL and UNVERIFIED with a short note referencing the reasoning.
  - [ ] **Agent self-review.** Re-read Tasks above, confirm the verification's findings are reflected, note any UNVERIFIEDs that need follow-up.
  ```

  Mechanical — no model judgment required.

- **→ Never** — every phase's Exit Gate renders with the Never shape:

  ```
  #### Phase Exit Gate

  <!-- verifier-recommendation: no — policy: Never (forced) -->

  - [ ] Run Definition of Done commands (see plan header). All must pass.
  - [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note. Under-report beats over-report.
  ```

  Mechanical — no model judgment required.

- **→ Adaptive** — use extended thinking to re-evaluate each phase's risk/complexity and write fresh `verifier-recommendation: yes|no — [reasoning]` annotations. Then render each Exit Gate per the `yes` or `no` shape from create-mode.md Phase 7. Requires model judgment.

### Preservation rule

Regeneration is **non-destructive** of everything except the Phase Exit Gate blocks and the plan-wide rubric section. In particular:

- `[x]` marks on Tasks, Verification checkboxes, and any other block outside the Exit Gate are untouched.
- Custom user edits inside Tasks / Verification / Acceptance Criteria are preserved.
- Only the `#### Phase Exit Gate` block (plus its HTML comment) is replaced.
- **A `[INLINE FALLBACK YYYY-MM-DD: …]` tag on an existing gate task is history — never strip it.** It records that a verification actually happened by the inline path on a date. Regenerating the gate around it is fine; deleting it would erase the only durable evidence of how that phase was verified.

**The `## Inline Verification Rubric` section is plan-wide, so a policy change can add or remove it:**

- **→ Always**, or **→ Adaptive** where at least one phase is `yes`: the section must be present. Add it if missing, generated from `references/verification-rubric.md` (everything above its `## Report` heading, headings demoted one level) — never retyped.
- **→ Never**, or **→ Adaptive** where every phase is `no`: no gate carries the verification task, so remove the section.

Getting this wrong is not cosmetic: a gate whose branch 2 points at a section that isn't there sends a falling-back agent nowhere, which is the failure this whole mechanism exists to prevent.

### Preview and confirm

Show a preview of the regenerated Exit Gate blocks (per-phase). Use `AskUserQuestion`:

- **Apply** — write the regenerated plan.
- **Cancel** — roll back the Policy change in Phase 5b (revert the metadata line); don't rewrite the Exit Gates.

## Phase 8: Write the Updated Plan

### Apply the updates (in order)

1. **Blocking questions resolved** (Phase 4):
   - Flip `[ ] [AWAITING]` → `[x] [DECIDED: YYYY-MM-DD]`.
   - Add quoted lines immediately after the original question:
     ```
     > **Decision:** [chosen option]
     > **Rationale:** [option description or user notes]
     ```

2. **Non-blocking questions resolved** (Phase 5a):
   - Same format as above: `[ ] [OPEN]` → `[x] [DECIDED: YYYY-MM-DD]` + Decision/Rationale.

3. **Execution Policy — Verification Policy** (Phase 5b):
   - Update the `**Verification Policy:**` line in Metadata.
   - In the `### Execution Policy` subsection, update the `Current:` value and set `Last changed: YYYY-MM-DD (was: [previous value])`.
   - **Do NOT** flip the checkbox or stamp `[DECIDED]` — Execution Policy items are permanently tunable. Leave as `[OPEN]`.

4. **Uncertain assumptions** (Phase 6):
   - `Yes, confirmed` → `[ ] [?] X` → `[x] X`.
   - `No, needs change` → rewrite the assumption text; keep `[x]` marker indicating the change was verified.
   - `Skip` → leave unchanged.

5. **Phase Exit Gate regeneration** (Phase 7, only if Policy changed):
   - Replace each `#### Phase Exit Gate` block per the rule for the new policy.
   - **Add or remove the plan-wide `## Inline Verification Rubric` section** to match: present if any phase now carries the verification task, absent if none does. Generate it — never retype it — from `references/verification-rubric.md`, everything above that file's `## Report` heading with headings demoted one level. Place it after `## Definition of Done`, before `## Implementation Plan`.
   - **Never strip an existing `[INLINE FALLBACK YYYY-MM-DD: …]` tag.** It records that a verification actually happened by the inline path on a date; regenerating the gate around it is fine, deleting it erases the only durable evidence of how that phase was verified.
   - Preserve all other per-phase content verbatim.

### Update metadata and history

- `Last refreshed`: today's date.
- `Refinement count`: increment by 1.
- Append to `## Refinement History`:
  ```
  - **[YYYY-MM-DD]:** Resolved [N] blocking + [M] non-blocking questions, verified [K] assumptions[, changed Verification Policy [old] → [new] and regenerated [P] phase exit gates if applicable].
  ```

### Write

Use `Write` to overwrite the plan file.

## Phase 9: Completion Summary

```
✅ Questions resolved

Plan #[NNN]: [Plan Name]
Location: _project/plans/[folder]/[filename].md

Resolution summary:
  - Blocking questions resolved: [X] of [Y]  ✓
  - Non-blocking questions resolved: [X] of [Y]
  - Uncertain assumptions verified: [X] of [Y]
  - Verification Policy: [old] → [new]  (if changed)
  - Phase Exit Gates regenerated: [N]   (if policy changed)

[If policy was changed:]
Exit Gates now follow the [new] policy. Phases with any [x] progress are preserved.

[If any items skipped:]
ℹ️  [N] items skipped — resolve later with:
  /dr-plan @_project/plans/[folder]/[filename].md answer questions

Next steps:
  [If all blocking resolved and plan is in draft/:]
  1. Move to in_progress: mv _project/plans/draft/[filename].md _project/plans/in_progress/
  [If in in_progress/:]
  1. Continue implementation.
  [If blocking items remain:]
  1. Resolve remaining blockers: /dr-plan @[plan] answer questions
```
