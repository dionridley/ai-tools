# Verifier regression fixtures

**Every file under this directory is intentionally defective.** Nothing here is production
content, nothing here should be "fixed," and nothing here ships to a plugin user. These files
exist so that a change to `bundles/project-management/agents/plan-verifier.md` can be tested for
whether it costs finding-rate.

If you arrived here from a grep, a link-check, or a `/dr-ship` audit that flagged something in
this tree: that is the fixture working as designed. Do not repair it.

Created by plan 014 (`_project/plans/*/014-optimize-plan-verifier-latency.md`).

## Why this exists

The verifier earns its cost — across 13 completed plans there are 28 recorded runs and 13
changed an artifact. Plan 014 narrows what the verifier preloads and shortens its report, and
both changes could silently cost detection. Before this directory existed there was no way to
ask whether they did.

## Layout

```
verifier-regression/
├── README.md                    ← you are here
├── _answers/                    ← the answer keys. NOT to be read during a run — see below.
├── _runs/                       ← scoring records per run. Also NOT to be read during a run.
├── f1-self-review-drift/        ← REAL defect, snapshotted from main on 2026-08-02
├── f2-grep-poisoning/           ← synthetic
├── f3-connective-drift/         ← synthetic
└── f4-nonreproducing-count/     ← synthetic
```

**There is no latency fixture here, deliberately.** The four fixtures above are small, which makes
them poor probes for a change that only pays off on large plans. Rather than freeze a full-size
plan plus the 136KB skill tree it inspects, the latency reference is a real target already
measured — see *"The latency reference — and why it is not a fixture"* in
`_project/docs/verifier-regression-baseline.md`.

Each fixture directory holds a `plan.md` — a plan whose phase claims work is complete — plus the
artifacts that plan makes claims about. The claims are false. The verifier's job is to notice.

## The one protocol rule that matters

**A run in which the verifier reads anything under `_answers/` or `_runs/` is void and must be
re-run.**

The answer keys list exactly which defects are planted, and the run records under `_runs/` quote
the defects a previous run found. A verifier that reads either can "find" every defect without
doing any work, and the run would report perfect detection while measuring nothing. This is a real
risk, not a theoretical one: plan 014 gives the verifier an explicit license to range beyond its
target phase, which is precisely what would lead it here.

Checking for a void run is mechanical — search the verifier's report for `_answers` or `_runs`.
If either appears, discard the run.

The keys are committed anyway, because a scoring rubric nobody can read is not a rubric. The
protection is the protocol, not concealment.

## Fidelity limitation — read this before trusting a detection score

**Only F1 is a real defect.** It is the `plan-base.md:209` self-review drift as it existed on
`main` on 2026-08-02, snapshotted before plan 014 Phase 2 fixed it.

F2, F3 and F4 are **synthetic** — constructed from defect classes documented in the Findings of
plans 012 and 013, but authored for this test. They had to be: plans in this repo land as single
squashed commits (012 → `2829256`, 013 → `2a23593`), so no pre-fix state survives in git to
recover.

A defect authored to be found may be found more easily than one that occurs naturally. So:

> **The detection score is a floor on regression, not a measure of absolute capability.**
> A drop from baseline is meaningful evidence that a change cost something. A perfect score is
> *not* evidence that the verifier would catch an equivalent defect in the wild.

F1 is the anchor that keeps the set honest — it is the only fixture whose defect nobody designed.

## Running the harness

See `_project/docs/verifier-regression-baseline.md` for the dimensions, the thresholds, the
recorded baseline, and the exact re-run procedure.
