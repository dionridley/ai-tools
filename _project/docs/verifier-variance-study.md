# Verifier variance study — design

**Status:** designed, not run. Written 2026-08-04 so it survives a compaction or a fresh session.

Companion to `verifier-regression-baseline.md`. Read that first — this reuses its fixtures,
answer keys, conditions and Step 0 reload check.

## The question

Plan 014 measured detection **13/14 before and after, identical per fixture**. Alongside that,
three single-run observations were noted and explicitly *not* counted as evidence:

- Post-change, F3 found `rendered.md` contradicting itself — not in the answer key, not found at
  baseline, found in two post-change runs.
- Post-change, the latency reference found three non-reproducing counts in plan 013 plus an unsound
  inference, none recorded at baseline.
- Against that, post-change F3 moved Task 1 **FAIL → UNVERIFIED** — a softening, which is the shape
  a real regression would take.

**None of these can currently be distinguished from run-to-run variance, because the study never
ran the same fixture twice under identical conditions.** There is no variance estimate for any
metric. This study produces one.

> **Hypothesis under test:** post-change runs surface *more* substantive findings than baseline
> runs, beyond the planted defect set.
>
> **Null:** the difference is within the spread of repeated runs of the same arm.

## Why this needs deliberate setup

**The baseline arm cannot be run as things stand.** Claude Code loads the agent definition once per
session, and the current definition is post-change. Running the baseline arm requires swapping the
file and reloading — and `/reload-plugins` is a **user-invoked** command, so this study cannot be
executed end-to-end without the user at two points.

Verified working on 2026-08-02: `/reload-plugins` does reload agent definitions mid-session; a full
restart is not required.

## Procedure

Conditions must match `verifier-regression-baseline.md`: `CLAUDE_EFFORT=xhigh`, Claude Code
2.1.220. Subagents inherit session effort — check it before each arm, not once at the start.

### Arm A — post-change (current definition)

1. Run **Step 0** from the baseline doc. Expect: step 1 = *"Read the target phase and four named
   sections"*, ranging step present, **7** numbered steps.
2. For each of the three rounds, spawn all four fixtures **concurrently** — matching how both
   earlier batches ran, since concurrency affects wall-clock.
3. Record all five metrics per run (below). Do not compare arms yet.

### Arm B — baseline (pre-change definition)

4. `git checkout 30ba775 -- bundles/project-management/agents/plan-verifier.md`
5. **Ask the user to run `/reload-plugins`.**
6. Run **Step 0** again. Expect the *stale* signature: step 1 = *"Read the plan. Open the plan
   file. Find the target"*, no ranging step, **6** numbered steps. **If it returns 7 steps, stop —
   the swap did not take and Arm B would silently re-measure Arm A.**
7. Three rounds × four fixtures concurrently, as above.
8. `git checkout HEAD -- bundles/project-management/agents/plan-verifier.md`, ask the user to
   reload again, and confirm 7 steps before doing anything else.

**Leaving the repo on the reverted definition is the worst outcome of this study.** Step 8 is not
optional and its confirmation is not optional.

## Metrics, per run

| Metric | Definition |
|---|---|
| **Detection** | planted defects reported / planted, scored against `_answers/` |
| **Extra findings** | substantive findings *not* in the answer key — the metric the hypothesis turns on |
| **False positives** | true claims reported as defects (F4 carries the control) |
| **Auditability** | PASS verdicts carrying `file:line` or command-and-output / total PASS |
| **Latency · tokens** | as reported by the harness |

**Extra findings needs a stated rule before scoring, or it will absorb whatever the scorer wants.**
Count a finding only if it (a) names a specific file and location, (b) is checkable without
re-running the verifier, and (c) is not a restatement of a planted defect. Log each one; do not
report a bare count.

## Scoring discipline

- Score every run against the answer key **independently, before any arm comparison**. Arm labels
  invite pattern-matching to the expected result.
- Whoever scores must not be the run being scored — the rule already in the baseline doc.
- **Void-run check applies:** any report mentioning `_answers` or `_runs` is discarded and re-run.
- Score strictly and identically across arms. The baseline doc records one case where a
  post-change run came *closer* on F2/D3 and was still scored MISSED for consistency. Do that again.

## What n=3 can and cannot support

**Can:** a rough spread per cell, and whether the arms' ranges overlap. If Arm A's extra-findings
range sits entirely above Arm B's across multiple fixtures, that is real signal. If they interleave,
the plan-014 anecdotes were noise and should be struck from the record as evidence.

**Cannot:** significance. Three runs per cell is a sanity check, not a test. Do not compute a
p-value; report ranges and say plainly whether they overlap.

**Expected cost:** 24 verifier runs, ~4–6 min each, four concurrent → roughly 60–90 min wall-clock
plus scoring. Each report is 2–4k tokens to read and score, so **budget ~100k context** and prefer
a fresh session.

## If the result is null

Then the plan-014 record needs a correction, not a footnote: the "found more" observations in
`014-optimize-plan-verifier-latency.md` (Phase 5 Findings) and in the baseline doc's post-change
section must be restated as within-variance rather than left implying an improvement. **That
correction is part of this study, not optional follow-up.**
