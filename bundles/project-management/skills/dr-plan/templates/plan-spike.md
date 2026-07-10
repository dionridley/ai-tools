# Plan Overlay: Spike / Research

Apply this overlay on top of `plan-base.md` when the work being planned is a time-boxed spike: exploration, prototype, feasibility check, or open-ended investigation. The output of a spike is an answered question, not shipped code.

## Section replacements

### Success Criteria → Questions to Answer

Replace the `Success Criteria` section with a `Questions to Answer` section. A spike completes when the questions are answered, not when code is merged.

```
## Questions to Answer

- [ ] [Specific question 1 — e.g., "Can we reach the target p95 latency with [approach A]?"]
- [ ] [Specific question 2 — e.g., "What's the migration cost from [X] to [Y] for the events table?"]
- [ ] [Specific question 3 — e.g., "Does [library] support [our specific case]?"]

Each question should be answerable with evidence, not opinion. By the end of the spike, each `[ ]` flips to `[x]` with a short answer recorded in the Retro section.
```

## Section omissions

- **Rollback Plan** — spikes don't ship. Drop entirely. (Base template doesn't include it; this overlay just confirms we don't add it via migration.)
- **Release Strategy** — n/a.
- **Dependencies** — usually n/a, but include if the spike is gated on another spike finishing.

## Phase structure

Spikes are typically 1-3 phases:

1. **Set up the experiment** — scaffold enough infrastructure to observe the thing (benchmark harness, prototype env, data sample).
2. **Run the experiment** — gather data.
3. **Analyze and decide** — write up findings, recommend next steps.

Phase bodies use the standard four-block structure, but tasks skew toward measurement and observation rather than production engineering.

## Definition of Done (relaxed)

For spikes, the strict DoD (tests / lint / typecheck green at every phase) is relaxed. Spike code is throwaway by default — investing in test coverage for code that's about to be deleted is waste.

Replace the base DoD section with:

```
## Definition of Done

Spike code is **throwaway by default.** Strict DoD (tests / lint / typecheck) is relaxed.

**At every Phase Exit Gate:**

- The phase's Verification commands produce the expected output (or explicit `UNVERIFIED` with reasoning).
- The phase's Acceptance Criteria are met or explicitly deferred with a note.

**At the final Phase Exit Gate, additionally:**

- Every question in "Questions to Answer" is flipped `[x]` with an evidence-grounded answer, OR explicitly marked unanswered with reasoning.
- A clear recommendation is written: ship-as-is / refactor-to-production / discard / do a follow-up spike.

If the spike outcome is "keep some of this code in production," a follow-up plan must bring that code to the full DoD standard — this plan does not.
```

## Interim phases

Not applicable to spikes. Spikes are already "code that may not work" by design — there's no concept of "broken intermediate state that must be restored by phase N." Drop that entire concept for spike plans.

## Time-boxing

Spikes benefit from an explicit time-box. Add to the plan's Metadata section:

- **Time-box:** [N days/weeks]. If no clear signal by that date, exit and document.

The executing agent should check the time-box at each Phase Exit Gate and escalate to the user if the spike is running significantly over.

## Rendering note for CREATE mode

Read `plan-base.md`, then:

1. Replace `Success Criteria` with `Questions to Answer`.
2. Drop Dependencies if empty (usually it will be).
3. Use the relaxed Definition of Done block above.
4. Add `Time-box: [N]` to Metadata.
5. Typically 1-3 phases; resist the urge to over-structure.
6. Leave Completion + Retro — the Retro is especially valuable for spikes because it's where the actual findings live.
