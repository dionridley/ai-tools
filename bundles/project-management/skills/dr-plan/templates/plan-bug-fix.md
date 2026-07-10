# Plan Overlay: Bug Fix

Apply this overlay on top of `plan-base.md` when the work being planned is a discrete bug fix. Bug-fix plans tend to be small — often one or two phases — and much of the base template's structure is overkill. This overlay trims it down.

## Section omissions

Sections to **drop entirely** from the base template for bug-fix plans:

- **Dependencies** — bug fixes rarely depend on external work. If a dependency surfaces, promote the plan to standard-feature.

Sections to **collapse** (keep, but minimal):

- **Executive Summary** — one paragraph: what's broken, where, impact.
- **Current State** — the bug and how it reproduces. Link to the failing test, error log, or ticket if there is one.
- **Assumptions** — usually one bullet: the root cause you're targeting. If you're not certain, tag it with `[?]` next to the checkbox: `- [ ] [?] Root cause is X`. See `plan-base.md` for the full three-state convention.
- **Success Criteria** — typically two bullets: bug no longer reproduces; regression test added.

## Phase collapse

Most bug-fix plans work with one phase. Two phases only if the fix has a natural split (diagnose → fix, or fix → verify in prod). Structure:

```
### Phase 1: Fix [specific bug]

#### Tasks

- [ ] Reproduce the bug in a test (failing test first — test-driven).
- [ ] Identify root cause at [file:line].
- [ ] Apply the fix.
- [ ] Confirm the test passes.
- [ ] Run the broader test suite — no regressions.

#### Verification

- [ ] Run `[specific test command for the new regression test]` — expected: passes.
- [ ] Run `[full test command]` — expected: all tests pass.

#### Acceptance Criteria

- The regression test would have failed before this fix (verify by reverting locally).
- The regression test passes after the fix.
- No existing tests regress.
- [Behavior-level criterion: e.g., "The form no longer accepts null in the date field" or "The API returns 400 instead of 500 for malformed input"]

#### Phase Exit Gate

[Standard four-block gate. `verifier-recommendation: no` by default — self-review is sufficient for a scoped fix with a regression test. Switch to `yes` only if the fix touches security-sensitive code or shared infrastructure.]
```

## Rollback simplification

Bug fixes almost always roll back with a single `git revert`. Do not add a Rollback Plan section. The only exception: if the bug fix involves a schema change, data migration, or config-value change to a live system. In that case, promote the plan to use the migration overlay.

## Definition of Done adjustments

No changes — the base DoD (tests / lint / typecheck) is exactly right for bug fixes.

## Rendering note for CREATE mode

Read `plan-base.md`, then:

1. Drop the Dependencies section.
2. Condense Executive Summary, Current State, Assumptions, and Success Criteria to their minimal form.
3. Collapse to one phase unless the fix has a natural split.
4. Leave Rollback Plan out (base template doesn't include it anyway — this overlay just confirms we don't add it via the migration overlay).
5. Leave Completion + Retro sections as-is — even tiny plans benefit from a retro when something surprising came up.
