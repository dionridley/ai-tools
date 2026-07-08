# Plan Overlay: Migration / Infra / Refactor

Apply this overlay on top of `plan-base.md` when the work being planned is a data migration, infrastructure change, platform upgrade, or large refactor — anything where the primary risk surface is "does the change land safely in a live system."

## Sections to add

### New top-level section — Rollback Plan

Insert a `Rollback Plan` section after `Definition of Done` and before `Implementation Plan`. This is mandatory and must be filled in before Phase 1 starts.

```
## Rollback Plan

What it takes to undo this migration at each phase boundary. Not a one-liner — migrations frequently need staged rollback because phase N undoing phase N-1 isn't always trivial.

### Rollback by phase

- **Phase 1:** [Steps. E.g., "revert commit SHA, no data restore needed — schema change is additive."]
- **Phase 2:** [Steps. E.g., "feature flag off, run backfill-down script at `scripts/backfill-down.sql`, verify row counts."]
- **Phase [final]:** [Steps. E.g., "requires restore from snapshot taken in Phase N Entry Preconditions."]

### Rollback validation

- [ ] Rollback script(s) exist and are executable.
- [ ] Rollback has been rehearsed against a staging snapshot at least once before Phase [cutover].
- [ ] Runbook for the on-call engineer is updated with rollback steps.

### Point of no return

State when rollback stops being feasible (e.g., "after Phase [N] writes begin, rollback requires restore from snapshot"). The executing agent should pause for explicit user confirmation before crossing that boundary.
```

### New phase template — Verify-in-Prod (near end)

Insert as the last or second-to-last phase, before any cleanup phase.

```
### Phase [N]: Verify in Production

#### Tasks

- [ ] Run DB-level sanity queries against production (row counts, checksum comparisons, orphan checks).
- [ ] Spot-check dashboards that would be first to show breakage (error rates, latency, queue depth).
- [ ] Confirm no error spike in the first [1h / 24h / 1 week] window — state the window explicitly.
- [ ] Validate the rollback script is still usable against the post-migration state.
- [ ] Confirm stakeholders have been notified of completion (on-call handoff if cross-shift).

#### Verification

- [ ] Run `[sanity-query]` — expected: [row count / checksum].
- [ ] Read `[dashboard-url]` — expected: no red indicators in the last [window].

#### Acceptance Criteria

- Row counts / checksums match expectations from pre-migration baseline.
- No error-rate regression beyond [X%] in the observation window.
- Rollback script has been re-tested against current state and works.
- Runbook and on-call handoff note updated.

#### Phase Exit Gate

[Standard four-block gate. `verifier-recommendation: yes` — this is the final safety net before the migration is considered complete.]
```

## Per-phase additions

### Entry Preconditions block

Every phase in a migration plan gets an **Entry Preconditions** block between the phase header and the Tasks block. This captures external state that must be true before the phase's tasks are safe to run.

```
### Phase [N]: [Name]

#### Entry Preconditions

- [ ] Prior phase fully verified (DoD and verifier, if applicable).
- [ ] Database snapshot taken at `[location]` and restore tested.
- [ ] Feature flag `[flag-name]` state: [required state].
- [ ] Maintenance window confirmed: [window and notification status].
- [ ] On-call engineer acknowledged.

#### Tasks

- [ ] ...
```

Not every phase needs all five — fill in what applies. The block exists even if only one precondition is relevant, because migration plans fail by assuming external state that wasn't actually checked.

## Interim phase guidance

Migrations more often have genuine interim phases — the schema change lands broken for a minute, the data migration runs with inconsistent state, etc. Still prefer restructuring where possible, but accept interim phases more readily here than in a standard-feature plan.

When an interim phase is needed:

- Add `<!-- interim-phase: [reason] -->` marker immediately under the phase header.
- Add a prominent "DO NOT MERGE BEFORE PHASE [N]" callout at the top of the phase body.
- In Rollback Plan, explicitly address what it takes to undo if execution halts inside the interim phase.

## Definition of Done adjustments

For migration work, extend the base DoD with:

- Schema changes have migrations registered in the project's migration tool (if applicable).
- Feature flags have a defined state in every environment (staging + prod) at every phase boundary.

## Rendering note for CREATE mode

Read `plan-base.md`, then:

1. Insert the Rollback Plan section after `Definition of Done` and before `Implementation Plan`.
2. Add the Entry Preconditions block to every phase.
3. Append a Verify-in-Prod phase as the last or second-to-last phase.
4. Extend the Definition of Done block per the adjustments above.
5. When emitting the interim-phase marker, ensure the "DO NOT MERGE BEFORE PHASE N" callout is also rendered.
