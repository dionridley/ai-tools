# Plan Overlay: AI / LLM Feature

Apply this overlay on top of `plan-base.md` when the work being planned involves LLM calls, model selection, prompt engineering, eval suites, or AI-specific guardrails.

## Sections to add

### New phase template — Eval Rubric Setup

This phase is usually inserted early (Phase 1 or 2), before any model-call code is written.

```
### Phase [N]: Eval Rubric Setup

#### Tasks

- [ ] Define eval dimensions (e.g., factual accuracy, tone, safety, format compliance).
- [ ] Write measurable criteria per dimension with explicit thresholds (e.g., "≥ 95% factual accuracy on the 50-prompt test set").
- [ ] Assemble the test prompt set (input examples + expected outputs or rubric-style judgments).
- [ ] Pick measurement method per dimension (automated check, LLM-as-judge, human review, or hybrid) — state the tradeoff.
- [ ] Set a regression threshold (e.g., "no eval dimension may drop more than 2% vs. last approved baseline").

#### Verification

- [ ] Eval harness runs end-to-end with a stub model response — expected: produces a report with all dimensions scored.
- [ ] Baseline is recorded somewhere durable (checked into repo or a tracked dashboard).

#### Acceptance Criteria

- Eval suite is runnable by anyone on the team with one command.
- Every dimension has a measurable target and a stated measurement method.
- Regression threshold is documented so future PRs know what "breaks the eval."

#### Phase Exit Gate

[Standard four-block gate. Typically `verifier-recommendation: yes` — rubric design errors cascade into every subsequent phase.]
```

### New phase template — Model / Prompt Selection

Usually follows Eval Rubric Setup.

```
### Phase [N]: Model and Prompt Selection

#### Tasks

- [ ] Choose primary model with a one-line rationale (capability match, cost, latency, availability).
- [ ] Choose a fallback model for availability or cost overflow, with the switchover condition.
- [ ] Draft the system prompt. Check into the repo (not inlined in code) so it's reviewable and diff-able.
- [ ] Specify the input and output schemas (JSON shape, required fields, validation rules).
- [ ] Set a token budget per call (input cap, output cap) and a cost ceiling.
- [ ] Run the eval suite against the chosen model+prompt; record scores.

#### Verification

- [ ] Eval scores recorded for baseline. All dimensions meet the target.
- [ ] Prompt file checked in at `[path]`.
- [ ] Cost estimate under ceiling on a representative input set — expected: $[X] per 1000 calls.

#### Acceptance Criteria

- Primary + fallback model choices documented with rationale.
- Prompt is version-controlled, not hardcoded.
- Baseline eval scores meet targets from the Eval Rubric phase.

#### Phase Exit Gate

[Standard four-block gate. Typically `verifier-recommendation: yes` — wrong model/prompt choice is expensive to unwind later.]
```

## Additional Acceptance Criteria patterns

AI features often need criteria that wouldn't appear in a standard-feature plan. Include these where relevant:

- **Eval thresholds:** "Eval suite scores ≥ [target] across all dimensions."
- **Regression guard:** "No eval dimension drops more than [X]% vs. the recorded baseline."
- **Latency:** "p95 end-to-end latency under [N]ms on the reference input set."
- **Cost:** "Cost per query under $[X] on the reference input set; cost ceiling enforced in code."
- **Guardrail tests:** "Refusal behavior matches spec on the red-team prompt set (10+ cases)."
- **Hallucination guard:** "For queries with no KB match, the system returns `[refusal/fallback]` rather than fabricating."
- **Prompt injection resistance:** "Known-injection test prompts do not change system behavior or leak the system prompt."

## Section replacements

### Success Criteria (plan-level)

The plan-level Success Criteria should include at least one eval-score outcome and one guardrail outcome:

- [ ] Eval suite scores ≥ [target] on release-blocker dimensions.
- [ ] Guardrail tests pass (red-team set, injection set).
- [ ] Cost and latency budgets hold on the reference input set.

## Rendering note for CREATE mode

Read `plan-base.md`, then:

1. Insert the Eval Rubric Setup phase as Phase 1 or 2 depending on dependencies.
2. Insert the Model/Prompt Selection phase immediately after Eval Rubric Setup.
3. In every downstream phase that touches the AI path, seed Acceptance Criteria with the relevant patterns above.
4. Extend plan-level Success Criteria per the replacements above.
5. Leave Definition of Done as-is — the eval suite is a criterion inside phases, not a DoD-every-phase command.
