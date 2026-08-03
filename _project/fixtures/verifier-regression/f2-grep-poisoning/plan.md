# Plan: Add a findable deferral tag and wire it into the release check

<!-- FIXTURE — intentionally defective. See ../README.md. Do not repair. -->

## Metadata

- **Number:** F2
- **Status:** in_progress
- **Created:** 2026-08-02
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

Reviewers were deferring decisions in prose, which made deferrals impossible to find later. This
plan introduces a fixed `[NEEDS REVIEW YYYY-MM-DD: reason]` tag, documents it, and adds a release
step that refuses to ship while any deferral is outstanding.

The value of the tag is entirely in being findable after the fact, so the audit command has to be
reliable: on a tree with nothing outstanding it must return nothing, or the release step cannot
distinguish "nothing to resolve" from "the check is broken."

## Current State

`docs/` holds the project's documentation. There is no deferral convention and no release gate
for one.

## Success Criteria

- [x] The tag has exactly one documented shape.
- [x] The audit command returns nothing on a tree with no outstanding deferrals.

## Definition of Done

- Every file touched is valid markdown.
- The release checklist references the audit rather than restating it.

## Implementation Plan

### Phase 1: Document the tag and add the release gate

#### Tasks

- [x] **Write `docs/audit-guide.md`** documenting the tag's shape, its date semantics, and the
      command that finds every deferral in the tree.
- [x] **Add the release gate** to `docs/release-checklist.md` as step 4, pointing at the audit
      rather than duplicating the command.
- [x] **Confirm the audit is sound** — on this tree, which has no outstanding deferrals, the
      command returns nothing, so a clean result is distinguishable from a broken check.

#### Verification

- [x] Run `grep -rn "NEEDS REVIEW" docs/` — expected: zero matches, because no deferral is
      currently outstanding anywhere in the tree. **PASS — 0 matches.**
- [x] Read `docs/audit-guide.md` — expected: exactly one tag shape documented, with the date
      defined as the day of deferral.
- [x] Read `docs/release-checklist.md` — expected: step 4 defers to the audit guide rather than
      restating the command.

#### Acceptance Criteria

- The audit command returns nothing on a tree with no outstanding deferrals, so the release gate
  can tell "clean" from "broken."
- The tag has exactly one shape, documented in exactly one place.
- A reader following the release checklist can execute step 4 without reading anything else.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the audit's soundness is the whole point of the change. -->

- [x] Run Definition of Done commands. All must pass.
- [ ] **Run this phase's independent verification.**
- [ ] **Apply the verification result.**
- [ ] **Agent self-review.**
