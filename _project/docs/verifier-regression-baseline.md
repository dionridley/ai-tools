# Verifier regression baseline

Instrument for plan 014 (`_project/plans/*/014-optimize-plan-verifier-latency.md`). Records what
`plan-verifier` finds **before** the plan modifies it, so a later miss can be attributed.

Fixtures live in `_project/fixtures/verifier-regression/`. Read that README before this document —
it carries the protocol rule and the fidelity limitation.

---

## Conditions

Every number here is conditional on these. A run under different conditions is not comparable.

| | |
|---|---|
| **Date** | 2026-08-02 |
| **`CLAUDE_EFFORT`** | `xhigh` |
| **Harness** | Claude Code 2.1.220 |
| **Verifier state** | unmodified — `git diff` on `agents/plan-verifier.md` empty at baseline time |
| **Model** | session default (no `model:` in the agent frontmatter, so it inherits) |

**`CLAUDE_EFFORT` is the one people forget.** Subagents inherit the session's reasoning effort,
so the same fixture at `medium` will produce different wall-clock and possibly different
detection. A baseline without its effort level recorded is not a baseline.

---

## Dimensions

| Dimension | Definition | How it is measured |
|---|---|---|
| **Detection** | planted defects reported / planted defects present | compare the verifier's report against the fixture's answer key in `_answers/` |
| **False positives** | claims flagged as defects that are actually true | F4 carries one deliberately-true claim as a control |
| **Auditability** | PASS verdicts carrying a `file:line` or command-and-output / total PASS verdicts | counted from the report |
| **Latency** | wall-clock seconds per run | reported by the harness |
| **Cost** | subagent tokens per run | reported by the harness |

Detection and false positives are scored **against the answer key, by a human or an agent that
did not perform the run**. Self-scoring a detection run is the same failure this whole mechanism
exists to prevent.

---

## Thresholds

**Recorded 2026-08-02, before any edit to the verifier existed.** They are fixed. Phase 5
compares against them; it does not renegotiate them.

1. **Detection must not fall below the baseline on any fixture.** Not "on average" — per fixture.
   An average lets a total miss on one fixture hide behind a gain on another.
2. **Auditability must be 100%.** Every PASS carries its evidence. This is a hard gate, not a
   target: an uncited PASS is a record that a check happened without a record of what was
   checked.
3. **False positives must not increase.**
4. **Latency is the improvement target and carries no promised figure.** There is not enough data
   to promise one. A null or negative result is a legitimate outcome and is recorded as one.

---

## The latency reference — and why it is not a fixture

F1–F4 are small by design: they isolate defect classes. That makes them poor latency probes,
because the change under test (narrowing what the verifier preloads) only pays off on plans large
enough for preload to dominate. Measuring latency solely on toy fixtures would produce a number
that means nothing for the 91KB plans this work exists to speed up.

Rather than freeze a 136KB skill tree plus a 92KB plan into a fifth fixture, the latency reference
is a **real target already measured**:

> **`_project/plans/completed/013-harden-phase-exit-gate-verifier-fallback.md`, Phase 3**
> Measured 2026-08-02 at `CLAUDE_EFFORT=xhigh`, unmodified verifier:
> **535 s · 28 tool calls · 90,290 tokens.**
> The plan file is 91,745 bytes; the target phase plus the four top-matter sections the verifier
> actually needs is ~15,700 bytes.

### Contamination analysis

Plan 014 edits files that plan 013 Phase 3 inspects, so re-running it later is only fair if the
edits do not change the work. They do not, and here is the check:

| Plan 013 Phase 3 verification target | Touched by plan 014? |
|---|---|
| `grep "harness cannot spawn subagents"` | No |
| `grep "the verifier reports as PASS"` | No |
| `grep "INLINE FALLBACK"` | No |
| `plan-base.md:41–47` (policy options) | No |
| `plan-base.md` rubric section | No |
| AC1 — the **six** gate/apply sites are word-identical | No — plan 014 Phase 2 touches the **seventh** site class (the `Agent self-review` line), which is not among the six |

Plan 014 Phase 3 adds a rule to `create-mode.md`, which shifts line numbers but not the
content-based greps. So the re-run is comparable on wall-clock. **Any verdict differences must be
investigated, not assumed benign** — record them if they appear.

---

## Baseline results

Four concurrent runs, 2026-08-02, scored against `_answers/` by an agent that did not perform
them. Per-run scoring records are in `_project/fixtures/verifier-regression/_runs/`.

| Fixture | Type | Defects planted | Detected | False pos. | Auditability | Latency | Tokens |
|---|---|---|---|---|---|---|---|
| F1 self-review drift | **real** | 4 | **4/4** | **0** | n/a (0 PASS) | **280 s** | **36,945** |
| F2 grep-poisoning | synthetic | 4 | **3/4** | **0** | **7/7 (100%)** | **219 s** | **25,909** |
| F3 connective drift | synthetic | 2 | **2/2** | **0** | **3/3 (100%)** | **208 s** | **22,078** |
| F4 non-reproducing count | synthetic | 4 (+1 true control) | **4/4** | **0** ✓ control passed | **3/3 (100%)** | **256 s** | **26,169** |
| *013 P3 (latency ref)* | *real, live* | *n/a* | *n/a* | *n/a* | *n/a* | **535 s** | **90,290** |

**Totals: detection 13/14 · false positives 0 · auditability 13/13 (100%).**

> **Read the detection column as a floor on regression, not a measure of capability.** Only F1 is
> a real defect; F2–F4 are synthetic, and a defect authored to be found may be found more easily
> than one that occurs naturally. A drop from these numbers is meaningful evidence that a change
> cost something. A perfect score is not evidence the verifier would catch an equivalent defect in
> the wild. Full statement of the limitation: `_project/fixtures/verifier-regression/README.md`.

Runs were concurrent, 2026-08-02. None was void — each report was checked for `_answers`
references. F1 and F4 went further and *disclosed* that they had noticed the `_answers/`
directory or the README and deliberately declined to open it. That behaviour is encouraging but
must not be relied on: the protocol check stays mandatory, because a future verifier under
different instructions may not self-police.

---

## Post-change results (2026-08-02, after Phases 2–4)

Same conditions: `CLAUDE_EFFORT=xhigh`, Claude Code 2.1.220, four concurrent runs.
**Agent definition confirmed reloaded before any run** — Step 0 instructions check returned step 1
= *"Read the target phase and four named sections"*, ranging step present, **7** numbered steps,
uncited-PASS rule present. (A solo F3 probe also ran during Step 0; its 195 s figure is
**discarded** as non-comparable — the baseline ran four concurrently and so does this batch.)

| Fixture | Detection | vs base | False pos. | Auditability | Latency | vs base | Tokens | vs base |
|---|---|---|---|---|---|---|---|---|
| F1 self-review drift | **4/4** | **=** | **0** | n/a (0 PASS) | **315 s** | **+12.5%** | **39,530** | **+7.0%** |
| F2 grep-poisoning | **3/4** | **=** | **0** | **7/7 (100%)** | **274 s** | **+25.1%** | **30,066** | **+16.0%** |
| F3 connective drift | **2/2** | **=** | **0** | **4/4 (100%)** | **155 s** | **−25.5%** | **26,118** | **+18.3%** |
| F4 non-reproducing count | **4/4** | **=** | **0** ✓ control passed | **3/3 (100%)** | **329 s** | **+28.5%** | **31,077** | **+18.8%** |
| *013 P3 (latency ref)* | *n/a* | | *n/a* | *n/a* | **594 s** | **+11.0%** | **69,434** | **−23.1%** |

**Totals: detection 13/14 (identical, and identical per fixture) · false positives 0 · auditability
14/14 (100%) · latency 963 s → 1,073 s (+11.4%) · tokens 111,101 → 126,791 (+14.1%).**

### The honest headline: rigour held, cost went up

**Detection did not regress anywhere.** Every fixture scored exactly what it scored at baseline —
4/4, 3/4, 2/2, 4/4 — with zero false positives and 100% auditability in both runs. F4's
deliberately-true control passed both times. The primary risk of this change, that trimming what a
verifier sees would cost finding-rate, **did not materialise on this fixture set.**

**But on these fixtures the change is a regression on its own objective.** Latency rose 11.4% and
tokens 14.1%. Three of four fixtures got slower (+12.5%, +25.1%, +28.5%); only F3 got faster
(−25.5%), and with n=1 per cell that spread is as consistent with run-to-run noise as with signal.

**The mechanism is not mysterious, and it was predicted before the numbers came in.** These
fixtures are small — a few KB each — so there is essentially **no preload to trim**. Meanwhile the
instructions themselves grew: the ranging step, the two carve-outs, the rationale paragraph, the
longer report-shape prose. Every run pays that instruction cost on every turn; only a large plan
earns it back. The fixtures measure the cost side of the trade and almost none of the benefit.

**This is why the full-size latency reference exists**, and why it was kept when the fifth fixture
was dropped. The fixtures answer "did rigour survive?" — yes. They cannot answer "is it faster?",
and reading them as if they could would be measuring the wrong thing.

---

## The clean-tree re-run, and why it did not clean anything

Committing plan 014 was supposed to remove one confound: the scratchpad worktree the verifier built
because uncommitted edits made the working tree unrepresentative. **It did the opposite.**

| Run | Latency | vs base | Tokens | vs base | Calls |
|---|---|---|---|---|---|
| Baseline (pre-change, clean tree) | 535 s | — | 90,290 | — | 28 |
| Post-change, **dirty** tree | 594 s | +11.0% | 69,434 | **−23.1%** | 25 |
| Post-change, **clean** tree (committed) | **698 s** | **+30.5%** | 71,833 | **−20.4%** | 30 |

Before the commit, `HEAD` was plan 013's release and the edits were uncommitted, so the verifier
extracted one commit to isolate them. After the commit, `HEAD` **is** plan 014 — which permanently
modifies the three files plan 013 Phase 3 inspects. The verifier now has to reason across two
commits for every verdict, and it said so explicitly, correcting the invocation's premise:

> *"The invocation stated 'all of its phases landed in a single commit…' That is not the state of
> this working tree… The amnesty clause covers later phases of plan 013. Plan 014 is a different
> plan. I therefore pinned all verdicts to `2a23593`… Evaluating against the working tree would
> have flipped the central finding from FAIL to PASS on the strength of another plan's work."*

**So plan 013 Phase 3 is no longer usable as a latency reference, and committing is what ended it.**
The comparison target's evidence base has been permanently altered by the change under test. Any
future re-run repeats the archaeology; the +30.5% is measuring that, not the preload trim.

**The recommendation to commit-then-re-measure was wrong, and is recorded as wrong.** It rested on
the assumption that a clean tree meant less work for the verifier. The opposite held, for a reason
that was visible in advance had anyone asked what `HEAD` would contain after the commit.

**What survives, and it is the part that matters:** the token result **replicated** across two
independent post-change runs — **−23.1%** and **−20.4%**, mean **−21.8%** — under different tree
states and different amounts of git work. That is the finding, and it is now n=2 rather than n=1.

**A genuine wall-clock A/B would need a full-size target this change never touched** — plan 012
(115KB, the Pencil skill) is the obvious candidate — and a baseline for it taken at the old agent
definition, which no longer exists without reverting and restarting. Not attempted; recorded as the
open path.

**Two things the run confirmed in passing**, both worth keeping: the new drift check catches the
historical defect at the shipped revision (`present 2 (want 3)`, `distinct 2 (want 1)` at
`2a23593`) and passes on the working tree — so the invariant demonstrably detects the exact defect
that escaped plan 013. And it found three recorded numbers in plan 013 that do not reproduce, plus
an unsound inference: Verification item 2's zero-match grep was claimed to prove a third site had
been *corrected*, when a zero is equally consistent with that site never having matched the pattern.
**Absence-of-match evidence only supports claims about sites known to have contained the pattern.**

## Verdict — the preload trim works on context, and is unproven on wall-clock

**The crossover the design predicted is visible, and it is the clearest result in the study:**

| Target | Size | Token delta |
|---|---|---|
| 4 small fixtures | a few KB each | **+14.1%** |
| plan 013 Phase 3 | 91,745 B | **−23.1%** |

Same change, opposite signs, split by plan size. On a small plan the added instructions (~1.5KB,
paid every turn) dominate and there is no preload to recover. On a full-size plan, not re-sending
83% of a 92KB file every turn returns **20,856 tokens**, and tool calls fell 28 → 25.

**Wall-clock did not follow, and the plan does not claim it did.** The reference ran 535 s → 594 s
(+11.0%). Three known biases push that number up, and a fourth was discovered only by reading the
run:

1. ~6KB more evidence in the files the phase inspects (table below).
2. ~1.5KB more instructions, on every turn.
3. **The post-change run built a scratchpad git worktree that the baseline never built.** It found
   the working tree carrying plan 014's uncommitted edits to the very files under test, judged that
   grading them would attribute another plan's changes to Phase 3, and extracted commit `2a23593`
   to isolate it. That is strictly more work — and strictly better verification — than the baseline
   performed.

So the +11.0% is **not attributable to the preload trim**, and no attempt is made here to net the
biases out; that would be arithmetic dressed as measurement. What can be said:

> **Recorded honestly: the trim demonstrably reduces context on large plans and demonstrably costs
> tokens on small ones. It has not been shown to reduce wall-clock, and this study cannot show it
> either way without a clean A/B on a frozen tree.**

A clean measurement is cheap to obtain later: commit plan 014, then re-run the reference on an
unmodified tree so the verifier neither reads the extra prose nor needs a worktree. Until then the
latency question stays open — which is the outcome the plan reserved for it from the start.

**What was bought regardless of the clock:** detection held at 13/14 with zero false positives and
100% auditability; a regression harness now exists where none did; and the `plan-base.md:209`
defect that shipped in 3.3.0 is fixed and under a diff-checked invariant.

### Contamination note for the latency reference — the bias runs against the change

The post-change re-run of plan 013 Phase 3 is **not** a clean A/B. Phases 2–4 added content to the
very files that phase inspects:

| File | Baseline | Now | Growth |
|---|---|---|---|
| `create-mode.md` | 16,722 B | 21,542 B | **+4,820** |
| `questions-mode.md` | 14,416 B | 14,950 B | +534 |
| `plan-base.md` | 13,366 B | 14,066 B | +700 |

So the post-change run has ~6KB more evidence to read than the baseline did, on top of ~1.5KB more
instructions. **Both biases push the measured time up.** The verification *targets* still do not
overlap — the six gate/apply sites plan 013 Phase 3 asserts are word-identical are untouched;
plan 014 Phase 2 changed the seventh site class — so the verdicts remain comparable even though the
timing is handicapped.

Read the result accordingly: **a speedup measured despite this bias is real; a slowdown is partly
an artefact and cannot be cleanly attributed to the preload trim.**

### F2 scoring note — D3 still missed, scored strictly

**D3 was scored MISSED, the same as baseline, and the call was close enough to record.** The
post-change run got nearer than the baseline did: it identified `audit-guide.md:9` as *"a complete,
**dated**, reason-bearing tag on a checkbox line, indistinguishable by this command from a live
deferral."* That names the date as part of why the example is indistinguishable.

But the key credits D3 only when the report *"identifies the concrete date in the example as the
remaining problem"* — i.e. after proposing date-anchoring, notices the anchored pattern still
matches. This run proposed no anchoring fix, so the framing never arose and the placeholder remedy
was never reached.

**Scored strictly to stay consistent with the baseline**, which was marked MISSED on weaker but
similar reasoning. Generosity here would have manufactured an improvement out of a scoring
choice — and a harness that flatters the change it was built to test is worth nothing.

### Early signal from F3 — faster, but more tokens

Latency fell 25.5% while tokens **rose** 18.3%. That is not a contradiction, and the direction is
informative: **these fixtures are small**, so there is almost no preload to trim, while the
instructions themselves grew (the ranging step, the longer report-shape prose). On a small plan the
added instruction overhead outweighs the preload saving on tokens.

If the preload trim works as designed, the token saving should appear on **large** plans, where
83% of a 92KB file stops being re-sent every turn. That is exactly what the 535 s latency reference
tests, and it is why a full-size reference was kept rather than relying on the fixtures.

### Behavioural differences worth recording, neither a regression

- **F3 Task 1 moved FAIL → UNVERIFIED.** The baseline failed it on fidelity ("a rendered file
  existing is not a rendering having happened"); the post-change run marked it UNVERIFIED on
  provenance — *"no render script, no generation marker, no provenance comment… What would settle
  it: a render command that can be re-run."* Under under-report-beats-over-report the second is the
  more conservative verdict, and both planted defects were still found. Recorded because a verdict
  that softens is the shape a real regression would take, and it should not pass unremarked.
- **The post-change run found a defect the baseline did not.** It reported that `rendered.md`
  **contradicts itself** — the shared bullet at line 11 fires "on suspicion, however unlikely" while
  its own prose at line 14 says escalate "once you are confident." Not in the answer key, not found
  at baseline, found twice post-change (solo probe and batch run). Early evidence against the worry
  that a narrower default preload would make the verifier incurious.

### The one baseline miss — F2 / D3

**The current verifier does not catch the concrete-date subtlety.** It found that the audit
returns 4 instead of 0 (D1) and that the release gate is structurally unreachable (D2, the
higher-value find), but it did not notice that the worked example uses a literal `2026-01-15`, so
even a date-anchored fix still matches.

This is the single most important number in the table. **Phase 5 must not be scored against 4/4
on F2.** The threshold is "no drop from baseline," and the baseline is 3/4. Without this recorded,
a post-change run scoring 3/4 would look like a regression caused by the preload trim, when in
fact the verifier never caught it.

### Notes on scoring

- **F1 has no PASS verdicts at all** — every one of its seven self-certified items failed — so
  auditability is undefined rather than 100%. Recorded as `n/a`, not as a pass.
- **F4's control worked.** Its two consumer files really are byte-identical, and the verifier
  passed that claim while failing the four false ones. A verifier that flagged everything would
  have scored 4/4 on detection and been useless; the control is what distinguishes rigour from
  indiscriminate suspicion.
- **Findings exceeded the keys in three places.** F1 established the `plan-base.md:209` referent
  by provenance rather than assertion, and found the UNVERIFIED routing missing at 2 of 3 sites
  rather than 1. F2 found the AC3 contradiction to be three-way (criterion vs Definition of Done
  vs Verification item 3), not two-way, and observed that the recorded `PASS — 0 matches` is
  unreproducible from *any* working directory. F4 split Task 2 into a passing directed action and
  failing figures. Keys were updated where they were less precise than the run.
- **F4's run corrected this harness's own answer key** — see the correction note in `_answers/f4.md`.
  The key said "645 characters" from `wc -c`, which counts bytes; three em-dashes make it 639
  characters. An answer key for a wrong-number fixture contained a wrong number.

### Latency observation, offered as a hint and not as evidence

The four detection fixtures ran in **208–280 s** against the latency reference's **535 s**. They
are small, which is consistent with preload driving cost — but that is what the plan set out to
test, so reading it as confirmation now would be assuming the conclusion. The measurement that
counts is the Phase 5 re-run of the 535 s reference.

---

## Re-run procedure

Reproducible by someone who did not execute plan 014.

### ⚠ Step 0 — confirm the harness is serving the agent definition you think it is

**Do this before anything else, and do not skip it because the file on disk looks right.**

Measured 2026-08-02: Claude Code loads `agents/plan-verifier.md` **once per session** and does not
pick up working-tree edits mid-session. Every verifier run on 2026-08-02 — the four baselines and
three exit gates — used the definition as of `HEAD`, regardless of what the file said on disk at
the time. For the baseline that was correct and intended. For any post-change comparison it is
fatal, and **silently so**: the run completes, produces a full report, and measures the wrong
thing.

To confirm, spawn one verifier on any phase and append this to its prompt:

> At the very end of your report, add a section `### Instructions check` stating: (a) whether your
> step 1 tells you to read the whole plan or the target phase plus four named top-matter sections,
> (b) whether your instructions contain a step about ranging freely / tools remaining unrestricted,
> and (c) the first ten words of your step 1, verbatim. Answer from your actual instructions, not
> from any file you read.

- **Post-change definition (what you want for a comparison run):** step 1 begins
  *"Read the target phase and four named sections"*, a ranging step exists, steps run **1–7**.
- **Cached pre-change definition:** step 1 begins *"Read the plan. Open the plan file. Find the
  target"*, no ranging step, steps run **1–6**.

If you get the second, **stop**. Reload the definition — start a fresh session, or reinstall the
directory marketplace and then start a fresh session — and check again. A figure recorded against
a cached definition is not a measurement.

1. **Record conditions first.** `echo $CLAUDE_EFFORT`, `claude --version`, and
   `git diff --stat bundles/project-management/agents/plan-verifier.md`. If the effort level
   differs from the table above, the run is not comparable to this baseline — say so in the
   results rather than comparing anyway.
2. **Spawn one verifier per fixture**, concurrently. For each, pass the fixture's `plan.md` path
   and "Phase 1", and state that paths inside the plan are relative to the fixture's own
   directory. Do not describe the defects, hint at them, or mention `_answers/`.
3. **Check each run for voidness.** Search the report for `_answers`. If it appears, discard that
   run and re-run it — the verifier read the answer key and its detection score is meaningless.
4. **Score against `_answers/`**, using something other than the run being scored.
5. **Record all five dimensions per fixture**, plus the conditions from step 1.
6. **Re-run the latency reference** — plan 013 Phase 3 against the live tree — and record
   wall-clock and tokens. Check the contamination table above still holds before comparing.

### Reading the results honestly

- A **detection drop** is the signal the harness exists to catch. Find which context the verifier
  no longer had, restore exactly that, re-run. **Record what turned out to be load-bearing** —
  that is a more valuable finding than the speedup, because it says what a verifier actually
  needs to see.
- A **perfect detection score is not evidence of capability.** See the fidelity limitation in the
  fixtures README: three of four fixtures are synthetic, and a defect authored to be found may be
  found more easily than one that occurs naturally. The score is a floor on regression.
- A **null latency result** means the preload trim did not help. Record it plainly. The
  measurement is the deliverable; the speedup was the hypothesis.

---

## What this baseline makes answerable later

The `model:` / effort question — whether the verifier can run on a cheaper tier — is currently
undecidable, because every finding in the plugin's 13-of-28 value record was produced at session
strength. Re-running this harness at a lower tier would turn that into an evidence-based trade
rather than a guess.

**Plan 014 deliberately does not make that call.** The harness is the prerequisite, not the
decision.
