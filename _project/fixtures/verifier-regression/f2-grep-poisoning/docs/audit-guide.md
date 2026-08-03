# Audit guide — the `NEEDS REVIEW` tag

<!-- FIXTURE — intentionally defective. See ../../README.md. Do not repair. -->

When a reviewer defers a decision rather than resolving it, they tag the line so the deferral is
findable later. The tag goes immediately after the checkbox:

```
- [x] [NEEDS REVIEW 2026-01-15: perf impact unmeasured] **Enable the new cache layer.**
```

The date is the day the deferral was made, not the day the document was written.

## Finding deferrals

Every deferral in the tree can be listed with:

```
grep -rn "NEEDS REVIEW" docs/
```

A tree with no outstanding deferrals returns nothing, which is how a release check confirms
there is nothing left to resolve.

## When to use it

Use `NEEDS REVIEW` when you have made a judgement call that a later reader should re-examine.
Do not use it as a general TODO — it is specifically for decisions that were taken but not
validated.
