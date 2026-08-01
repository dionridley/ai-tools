# Inline Verification Rubric

How to verify a plan phase **yourself**, when independent verification could not be delegated.

This is the fallback branch of a Phase Exit Gate, and of `/dr-ship --verify`. When delegation
succeeds, the `plan-verifier` agent carries its own copy of these rules and this rubric is not
used — the two are deliberately separate, because a fresh-context subagent and an agent grading
its own work need different framing.

**The thing that makes this branch dangerous is not that it is less capable. It is that it is
not independent.** Everything below exists to supply, deliberately, the independence that
delegation would have given for free.

## Verdicts

One per task, per Verification item, and per Acceptance Criterion:

- **PASS** — evidence is direct and observable. Cite it (`file:line`, or the command and output).
- **FAIL** — evidence shows the opposite of what is required. Cite it.
- **UNVERIFIED** — evidence is missing, ambiguous, or could not be gathered. State why.

**Under-report beats over-report.** When you are unsure, the answer is `UNVERIFIED`, not `PASS`.
A second pass is cheap. A false `PASS` is silently corrosive: it is a *record* that a check
happened, and nothing downstream — no later phase, no retro, no `/dr-ship` audit — will ever
re-examine it. A missing check is recoverable; a false record of a check is not.

## Skepticism rules

- A test file existing is not a test passing. Run it.
- A function being defined is not the behaviour working. Check a call site or a test.
- An import being added is not a feature being used. Check for actual use.
- A config change is not a deployment. Check that the change is loaded.
- A `TODO` removed does not mean the work behind it is done. Check the replacement.
- No inference from naming. `login-handler.ts` existing is not login being implemented. Open it.
- **A task marked `[x]` is not evidence.** That mark is the claim under test, not proof of it.
- **You wrote this code. That is a reason for more skepticism, not less.** You know what you intended, which makes it easy to read intent into what is actually there. Delegation would have bought that independence for free; inline, you supply it deliberately. Go and look at what is actually there, and actively seek the thing you would rather not find.

## Naming the condition in the label

An inline verification must record that it happened, by tagging the gate task **immediately
after the checkbox** — the same position `[WAIVED …]` occupies:

```
- [x] [INLINE FALLBACK YYYY-MM-DD: agent not registered] **Run this phase's independent
      verification.** …
```

**The date stays a literal `YYYY-MM-DD` placeholder in this example, deliberately.** These words
ship verbatim into every generated plan, so a concrete date here would put a string shaped
exactly like a real label into plans where no fallback ever occurred — making the audit
unfindable by the very grep that justifies the label. Detection therefore anchors on a real
date, and this example cannot match it:

```
grep -rnE '\[INLINE FALLBACK [0-9]{4}-[0-9]{2}-[0-9]{2}:' _project/plans/
```

Dated the day the fallback occurred — matching the `[WAIVED YYYY-MM-DD: reason]` convention,
which stamps the action, not the plan. Neither parser matches the other's prefix, and the two
tags **can** legitimately share a line: `/dr-ship` appends a waiver to an already-`[x]` item
when shipping proceeds despite an adverse verdict, and that item may be one this label already
marks. Order them fallback first, waiver second — *how it was verified*, then *what was decided
about the result*. `<condition>` is exactly one of:

| Value | When |
|---|---|
| `no subagent mechanism` | The harness has no delegation tool at all. |
| `agent not registered` | A spawn was refused, and `plan-verifier` was **not** among the agents the refusal listed. |
| `spawn attempted and rejected` | A spawn was refused, and `plan-verifier` **was** listed — it exists, something else refused. |
| `delegation withheld` | A mechanism exists and `plan-verifier` is registered, but the session withholds delegation, so no spawn was attempted. |
| `permission uncertain, not resolved` | A mechanism exists, you were unsure whether you could use it, and you did not ask. |

**The last two values exist because the first three cannot describe the incident this rubric
was written for.** In that case a mechanism was present, the agent *was* registered, and no
spawn was ever attempted — so there was no refusal to read and none of the first three values
fit. An agent with no legal value to write is an agent that writes nothing, which is the
unannotated pass this whole mechanism exists to prevent.

`permission uncertain, not resolved` is deliberately uncomfortable to write. Branch 3 tells you
to ask; this value is the record that you did not. Write it anyway — it is far better than the
alternative, and a reviewer seeing it knows exactly what to re-check.

**Read the refusal before naming the condition.** This applies to the second and third values,
which a refusal distinguishes directly, so there is no reason to guess between them. Measured on
Claude Code 2.1.220: an unregistered `subagent_type` returns
`Agent type '…' not found. Available agents: …` and runs nothing. The fourth and fifth values
have no refusal to read — they are reached without an attempt.

**The first four are not admissions of failure.** On a harness with no delegation primitive, or
a session that withholds it, the label is the normal, correct operating record — it says which
path ran, not that something went wrong. Write it plainly and without apology.

## Report

Report inline, in the phase's own notes — verdict per item with its evidence, then what you
could not verify and why:

```
### Inline verification — Phase [N]

Verification
- `[command]` — PASS (exit 0; output matched "[…]")
- `[command]` — UNVERIFIED (command not found: `[cmd]`)

Tasks
- [task] — PASS ([file]:[line]; what you saw)
- [task] — FAIL ([file]:[line]; expected vs. actual)

Acceptance Criteria
- [criterion] — PASS ([evidence])

Could not verify
- [item] — [what evidence was missing]
```

The test of a good report is that a later reader can tell **what was actually checked**, and
distinguish it from what was assumed.

## Boundaries

Same as the delegated verifier's, and they matter more here because you are also the author:

- **Verify; do not fix mid-pass.** Finish the verification, then act on it. Repairing as you go
  destroys the record of what the phase's state actually was.
- **Do not modify the plan's checkboxes while verifying.** Apply results afterwards, in the
  gate's apply step.
- **Stay in this phase.** Do not evaluate past or future phases. A cross-phase issue gets one
  brief note, not an expanded report.
- **No unsolicited architecture advice.** The question is whether this phase met its stated
  criteria. Nothing else.

## When the plan is malformed

If the target phase is missing, truncated, or its blocks are unparseable: report `UNVERIFIED`
for everything you cannot evaluate, state the parsing problem first, and do not guess at what
the phase "probably" meant.

## Two renderings

This file is the canonical source. A **condensed** form is rendered into generated plans as an
`## Inline Verification Rubric` section, so a plan file is self-contained — a plan sits in the
user's repo and cannot resolve a path into an installed skill.

**The split rule is positional, and that is the point.** This file is ordered so that everything
the condensed form must carry comes first:

> **Everything above `## Report` is reproduced verbatim. Everything from `## Report` down is
> dropped.**

One boundary, one direction, no per-item classification. An earlier draft listed which *topics*
were judgment and which were orientation; that list was not exhaustive, and content which fell
through it — the guidance on how to choose a condition value — was silently paraphrased. A rule
that requires you to classify each paragraph will eventually meet a paragraph it does not
cover. A rule that names a line in the file will not.

**Exactly one transformation is permitted:** headings are demoted one level, because the
condensed form nests under a `##` heading inside the plan. Nothing else may change — no
rewrapping, no rephrasing, no dropping an example. The condensed form is *generated* from this
region, never retyped; retyping is how every drift so far was introduced.

Two consequences for anything written above the boundary, both learned the hard way:

- **It may not reference a section below it**, or the reference dangles once the region is
  lifted out.
- **It may not call itself a file.** The same words ship as a *section* of a plan, so say
  "this rubric", never "this file" or "below in this document". Wording that is accurate here
  and wrong there cannot be fixed downstream — the transformation is heading depth and nothing
  else.

Content above the boundary is judgment: verdicts, the under-report rule, every skepticism rule,
and everything about naming the condition. Content below is orientation — the report skeleton,
the boundaries block, malformed-plan handling, and this section — and its reader is already in
context on the plan, so it can go.

**"Verbatim" is deliberate, and stronger than "same substance."** It makes the invariant
checkable by `diff` rather than by judgment, which is the only reason a duplicated rule set
stays honest over time. Every drift caught so far — a skepticism rule that shed its example, a
compressed under-report paragraph, three abbreviated table rows, a dropped "exactly one of" —
was the same substance. That is precisely why inspection missed them.

**Diff the whole region, not the bullets.** Two divergences hid in connective sentences between
lists, where a bullet-scoped comparison cannot see them.

If anything above the boundary changes here, it changes in `templates/plan-base.md` in the same
edit.
