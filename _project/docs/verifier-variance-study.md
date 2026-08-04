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

## Threats to validity, and what this design does about them

Three of these were found by review *before* Arm A ran. They are recorded because a reader who
only sees the results cannot tell which confounds were controlled and which were never considered.

### T1 — The answer keys leak outside `_answers/`, and they leak asymmetrically

`_answers/` and `_runs/` are not the only files that hand a verifier the answers. Three committed
files describe the planted defects and the extra findings in prose:

| File | What it leaks |
|---|---|
| `_project/docs/verifier-variance-study.md` (this file) | names F3's `rendered.md` self-contradiction — *the exact extra finding the hypothesis turns on* |
| `_project/docs/verifier-regression-baseline.md` | "Findings exceeded the keys in three places" names F1's `plan-base.md:209` referent, F2's three-way AC3 contradiction, F4's Task 2 split |
| `_project/plans/completed/014-optimize-plan-verifier-latency.md` | Phase 5 findings |

And `_project/fixtures/verifier-regression/README.md` points a reader straight at the second one.

**This is not a symmetric nuisance. The post-change definition explicitly licenses ranging freely;
the pre-change one does not.** So Arm A is structurally more likely to wander into the leaking docs
than Arm B — and if it does, "it read the write-up" explains a higher extra-findings count just as
well as "it verifies better." The confound points in the same direction as the hypothesis, which is
the worst kind.

Note also that the baseline doc leaked *less* on 2026-08-02 than it does now: its post-change
results and findings sections were appended after those baseline runs. The 2026-08-02 baseline arm
therefore ran against a cleaner tree than a baseline arm run today would.

**Control:** the void grep widens from `_answers|_runs` to:

```
_answers | _runs | verifier-regression-baseline | verifier-variance-study | 014-optimize-plan-verifier
```

Applied to all 24 reports and to the Step 0 probe. **Log which files each report cites, not just
pass/fail** — a report citing only the fixture directory is clean; one citing `_project/docs/` is
discarded and re-run. Report the discard count per arm: a large asymmetry there is itself a finding.

*Rejected alternative:* temporarily moving the three docs out of the tree would be experimentally
cleaner, but it stacks a second must-restore hazard on top of the `plan-verifier.md` swap. The grep
is auditable and reversible; file-shuffling under a study that already reverts a live agent
definition is not worth the risk.

### T2 — Scoring cannot be done by whoever ran the arms

The runs are sequential by necessity (each swap is user-gated), so at scoring time the arm of every
report is known, and plan 014 already records "post-change found more" as the expected direction.
That is precisely the setup where a judgment metric absorbs the expectation.

**Control:**

1. Each report is written to `<scratchpad>/variance/r<NN>.md` under an **opaque sequential ID** as
   it completes. The ID→(arm, fixture, round) mapping goes to a separate file that is not opened
   until scoring is finished.
2. **Scoring is delegated to a fresh subagent** that receives report text and `_answers/` only —
   no arm labels, **and no statement of which direction the hypothesis predicts.**
3. Only after scores are fixed is the mapping joined.

**Blinding is imperfect and saying otherwise would be a lie.** The two definitions produce
differently-shaped reports — Phase 4's asymmetric length and uncited-PASS rule are visible in the
output — so a careful scorer may infer the arm from shape. What the control actually removes is
knowledge of *which arm is expected to win*. That is the part that biases a count.

### T3 — "Extra findings" currently confounds detection with citation policy

Phase 4 added *"an uncited PASS is not a permitted output."* The post-change definition is
**instructed** to emit `file:line`. The counting rule requires "names a specific file and location."
Arm A therefore has an instruction-level advantage at producing findings that satisfy the rule,
independent of whether it noticed anything more.

**Control:** for every extra finding, record a discriminator — *does the other arm's report contain
the same observation in uncited or informal form?* If Arm B mentions it in passing and Arm A
formalises it, that is **report shape, not detection**, and must be logged as such. Decide this per
finding during scoring, never at aggregation.

### T4 — Confounds that are acknowledged but not controlled

- **Sequential arms.** Any time-varying factor — system load, model serving, cache state — is
  aliased with arm. Randomising or interleaving would need a user-gated `/reload-plugins` per run,
  which is impractical. **Stated, not fixed.** It is a reason to distrust a small difference.
- **Version drift.** This study runs on **Claude Code 2.1.221**; the 2026-08-02 baseline table
  records **2.1.220**. Both arms run here, so the *within-study* A-vs-B comparison is unaffected.
  But absolute latency and token figures from this study are **not** directly comparable to the
  2026-08-02 tables.

### T5 — In-flight reports must live outside the repo

Writing the 24 reports into the repo as they complete would create a fresh answer key for runs 2–24
— `.research/` being gitignored does not stop a verifier from reading it. In-flight reports
therefore go to the **session scratchpad, outside the repo entirely.** The scored summary lands in
`_runs/` only after the last run, where the existing "do not read during a run" rule covers it.

Cost of this choice: if the session dies mid-study the in-flight reports are lost and the study
restarts. That is the correct trade against contaminating the thing being measured.

## Procedure

Conditions must match `verifier-regression-baseline.md`: `CLAUDE_EFFORT=xhigh`. Subagents inherit
session effort — check it before each arm, not once at the start. Record the Claude Code version
with the results; see T4 on version drift.

### Arm A — post-change (current definition)

1. Run **Step 0** from the baseline doc. Expect: step 1 = *"Read the target phase and four named
   sections"*, ranging step present, **7** numbered steps.
2. For each of the three rounds, spawn all four fixtures **concurrently** — matching how both
   earlier batches ran, since concurrency affects wall-clock.
3. Record all five metrics per run (below). Do not compare arms yet.

### Arm B — baseline (pre-change definition)

3b. **Write the revert marker first.** Before touching the file, create
   `_project/docs/VERIFIER-REVERTED.md` stating that `plan-verifier.md` is deliberately reverted to
   `30ba775` for this study and giving the exact restore command. **A session that ends mid-Arm-B
   leaves a live agent definition rolled back with nothing on disk saying so.** The marker is what
   makes that recoverable by someone with no memory of this study. Delete it at step 8.
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

- Score every run against the answer key **independently, before any arm comparison**, under the
  blinding protocol in **T2** — opaque IDs, mapping withheld, hypothesis direction withheld.
- Whoever scores must not be the run being scored — the rule already in the baseline doc.
- **Widened void check applies** (see **T1**): any report citing `_answers`, `_runs`,
  `verifier-regression-baseline`, `verifier-variance-study` or `014-optimize-plan-verifier` is
  discarded and re-run. Log the discard count per arm.
- **Every extra finding carries the T3 discriminator** — cited-vs-informal presence in the other
  arm — recorded per finding, not inferred later.
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

## Execution log

**Started 2026-08-04.** Conditions at start: `CLAUDE_EFFORT=xhigh`, Claude Code **2.1.221**,
`plan-verifier.md` clean against `HEAD` (10,548 bytes = post-change), working tree clean at
`78c50c0`.

### Arm A Step 0 — passed

Solo F3 probe with the instructions-check appendix returned the **post-change** signature:

- step 1 reads the target phase plus the four named top-matter sections, **not** the whole plan
- the ranging step is present ("Range freely the moment the phase points somewhere")
- first ten words of step 1: *"Read the target phase and four named sections — not the"*
- **7** numbered top-level steps

The probe is **excluded from the arms** — solo rather than 4-concurrent, and its prompt carried the
appendix, so neither its latency nor its findings are comparable to a round.

It was also clean on the widened void check. It *mentioned* `_answers/f3.md` only to state it had
declined to open it. **Refinement to the T1 rule, matching how the 2026-08-02 baseline treated the
same behaviour from F1 and F4:** a report is void if it cites *content from* a leaking file, not if
it discloses noticing one and declining. Disclosure is the behaviour the protocol wants.

### Arm A complete — 12 runs, 0 discards

All twelve were clean on the widened T1 void check; none cited a leaking doc. Several disclosed
noticing `_answers/` — and one named the regression baseline doc — purely to state they had
declined to open it. **The T1 leak is reachable, not hypothetical: the verifier knows those files
are there.** The refined rule held: disclosure of a refusal is not contamination.

*Findings are deliberately NOT recorded here.* Writing them into the repo before Arm B runs would
make this file a fresh answer key for Arm B — the exact failure T1 and T5 exist to prevent. They
stay in the session scratchpad until both arms are done. **The timing data below leaks nothing
about the fixtures and is safe to commit now.**

#### The round effect swamps latency

| Fixture | R1 | R2 | R3 | min→max |
|---|---|---|---|---|
| F1 | 252.0 | 234.5 | 363.5 | +55.0% |
| F2 | 249.4 | 220.5 | 423.7 | +92.2% |
| F3 | 178.7 | 129.9 | 328.7 | **+153.0%** |
| F4 | 216.5 | 254.7 | 430.7 | +98.9% |
| **round mean** | **224.2** | **209.9** | **386.7** | |

Round 3 was slower on **all four** fixtures, by 43–153%. That is a whole-round shift — system load
or serving conditions — not fixture noise, and it is far larger than any effect plan 014 attributed
to the definition change.

**Two consequences, the first landing on the plan-014 record:**

1. **The per-fixture latency comparison in `verifier-regression-baseline.md` is not
   interpretable.** Its post-change deltas were +12.5%, +25.1%, −25.5%, +28.5%; every one sits
   inside the same-arm spread above, and the whole-batch +11.4% is smaller than the gap between two
   consecutive rounds of the *same definition*. This conclusion does not depend on how extra
   findings score.
2. **Arm-vs-arm latency is unrecoverable by this design.** Arms run sequentially because the reload
   is user-gated, so an arm-level latency difference cannot be separated from a round-level one.
   **No A-vs-B latency comparison will be reported.** T4 listed this as acknowledged-not-controlled;
   it turns out to be the dominant term.

#### Tokens are stable, and that vindicates the metric the decision rests on

| Fixture | R1 | R2 | R3 | spread |
|---|---|---|---|---|
| F1 | 34,616 | 39,314 | 39,014 | 13.6% |
| F2 | 29,557 | 27,947 | 29,773 | 6.5% |
| F3 | 27,781 | 24,312 | 26,686 | 14.3% |
| F4 | 30,316 | 31,615 | 33,244 | 9.7% |
| **total** | **122,270** | **123,188** | **128,717** | **5.3%** |

Round totals vary by **5.3%** while round latency varies by **84%**. **Tokens track the work;
wall-clock tracks the weather.** The −21.8% token result that the keep-the-change decision rests on
was measured on the metric that reproduces; the latency figures never could have been.

Extra findings — the study's actual question — should be unaffected by load, so Arm B is still
worth running.

## RESULTS — both arms complete, scored blind

24 runs, 0 discards. Scored by a subagent that saw report text and answer keys only — no arm
labels, no statement of the predicted direction. Mapping joined afterward.

Arm A = post-change (current). Arm B = baseline (`30ba775`).

### Detection: dead even, and the 2026-08-02 figure sits inside the noise

| | Round 1 | Round 2 | Round 3 | **Total** |
|---|---|---|---|---|
| **Arm A** | 14/14 | 13/14 | 13/14 | **40/42** |
| **Arm B** | 13/14 | 13/14 | 14/14 | **40/42** |

**Identical totals.** Both arms range 13–14 per round, so the 13/14 recorded on 2026-08-02 for
each arm was a single draw from a distribution that also produces 14/14. **The change costs no
detection — now established at n=3 rather than n=1.** That is the question the harness exists for,
and it is answered.

False positives: **1 each**. Arm A's is real (a post-change F3 run failed the heading check over a
"2/2" vs 3-headings count while conceding "the underlying property holds" — and another run in the
*same arm* hit the identical fact and resolved it correctly). Arm B's is arguable. No run in either
arm flagged F4's deliberately-true control.

### Auditability: a real, measurable improvement that plan 014 missed

| | PASS verdicts carrying `file:line` or command output |
|---|---|
| **Arm A** | **36/37 — 97.3%** |
| **Arm B** | **32/39 — 82.1%** |

**Phase 4's "an uncited PASS is not a permitted output" rule is doing measurable work.** Plan 014
recorded 100% for *both* arms and concluded auditability was unchanged — that was n=1 on small
fixtures getting a lucky baseline draw. At n=3 the baseline is 82%, and the gap is one of only two
places in this study where the arms cleanly separate.

### Tokens: clean separation on the large fixture, nothing on the small ones

F1 is the largest fixture and the only one built from real snapshotted files.

| | run 1 | run 2 | run 3 | range |
|---|---|---|---|---|
| **Arm A** | 34,616 | 39,314 | 39,014 | **34,616–39,314** |
| **Arm B** | 46,193 | 47,675 | 46,945 | **46,193–47,675** |

**Non-overlapping, ~6,900 tokens apart. Mean 37,648 vs 46,938 — the post-change definition spends
19.8% fewer tokens.** Consistent with the −21.8% measured on the 92KB plan, and it is the metric
the keep-the-change decision rests on. The three small fixtures show no gap, matching the +14.1%
already recorded.

### Latency: not reported, as committed before Arm B ran

Arm A's round effect was 43–153% between consecutive rounds of an *unchanged* definition. Arms run
sequentially. The two cannot be separated. See the Arm A section above.

### Extra findings: mixed, and the direction is not uniform

| Fixture | Arm A | Arm B | overlap? |
|---|---|---|---|
| F1 | 2, 3, 5 | 1, 3, 3 | yes |
| F2 | 4, 4, 5 | 2, 3, 3 | **no — A higher** |
| F3 | 2, 3, 4 | 4, 4, 4 | **B at the top of A's range** |
| F4 | 4, 4, 4 | 2, 3, 3 | **no — A higher** |
| **round totals** | **13, 15, 16** | **11, 11, 13** | **overlap at 13** |

Arm A found more overall (44 vs 35) and separates cleanly on two fixtures — **but Arm B beats it on
F3, and the round-level ranges touch.** This is a lean, not a result. **The hypothesis as written —
"post-change runs surface more substantive findings" — is not supported as a general claim.**

## The plan-014 correction, and it is sharper than "within variance"

> **The claim that the F3 `rendered.md` self-contradiction was found only post-change is not
> merely unsupported. It is backwards.**

Blinded scoring, cross-checked against the files:

- **All three Arm B (baseline) runs found it**, one calling it its "sharpest evidence" and another
  "more seriously" than the cross-file drift.
- **Only two of three Arm A runs found it**, and one of those **mis-cited the line** (`:11`; the
  suspicion-keyed trigger is at `:10`).

Plan 014 recorded it as *"not found at baseline, found in two post-change runs."* The second half
was right by count and wrong by implication; the first half is false. A single baseline run had
simply not mentioned it.

**This is the failure mode the whole study was built to catch** — and it is worth naming precisely,
because it is not the failure mode that was anticipated. The anticipated risk was that a real
difference would be too small to see at n=1. The actual failure was **treating one run's silence as
evidence of absence.** A verifier not mentioning something is not a verifier failing to find it.

### Two factual errors, one per arm — neither is a definition effect

- **Arm B, F1:** a run asserted `plan-base.md:209` is "byte-identical" to `create-mode.md:192`.
  **It is not** — they differ by the word `all` (`Re-read Tasks above` vs `Re-read all Tasks
  above`). The run **contradicted itself**: its own md5 table lists the two lines under different
  hashes. Scoring reproduced all five hashes; the table is right and the prose is wrong.
- **Arm A, F2:** a run claimed `audit-guide.md:6-10` gives the abstract form
  `[NEEDS REVIEW YYYY-MM-DD: reason]`. **The guide contains zero occurrences of `YYYY-MM-DD`** —
  that form lives only in `plan.md:17`. The irony is that this is precisely the fact that would
  have carried it to the defect it missed.

One error per arm, both self-inflicted, neither attributable to the definition.

## What this study actually settled

| Claim | Verdict |
|---|---|
| The change costs detection | **No** — 40/42 both arms |
| The change improves auditability | **Yes** — 97.3% vs 82.1% |
| The change saves tokens on large plans | **Yes** — 19.8%, non-overlapping ranges |
| The change makes runs faster | **Unmeasurable** by this design |
| The change surfaces more findings | **Not supported** — mixed, ranges touch |
| F3 self-contradiction was post-change-only | **False** — baseline found it 3/3 |

## If the result is null

Then the plan-014 record needs a correction, not a footnote: the "found more" observations in
`014-optimize-plan-verifier-latency.md` (Phase 5 Findings) and in the baseline doc's post-change
section must be restated as within-variance rather than left implying an improvement. **That
correction is part of this study, not optional follow-up.**
