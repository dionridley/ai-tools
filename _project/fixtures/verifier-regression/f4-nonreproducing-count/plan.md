# Plan: Centralise the second-approver block

<!-- FIXTURE — intentionally defective. See ../README.md. Do not repair. -->

## Metadata

- **Number:** F4
- **Status:** in_progress
- **Created:** 2026-08-02
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

The second-approver checklist was maintained separately in the deploy and schema-change
workflows, and the two had begun to diverge. This plan centralises it in `src/gate-block.md` and
copies it verbatim into both consumers, so a change to the approval rules lands in one place.

Because the block is duplicated rather than included, the invariant is that the copies stay
byte-identical — an invariant that is checkable by `diff` and is not checkable by reading.

## Current State

- `src/gate-block.md` — the canonical block, inside a fenced code block.
- `src/deploy-workflow.md`, `src/schema-change-workflow.md` — the two consumers.

## Success Criteria

- [x] The approval block is identical in both consumers.
- [x] The canonical block's size is recorded, so an unintended edit is visible as a size change.

## Definition of Done

- All three files are valid markdown.
- No consumer edits its copy in place.

## Implementation Plan

### Phase 1: Centralise the block and record its size

#### Tasks

- [x] **Write `src/gate-block.md`** carrying the canonical approval block in a fenced region,
      with a note that copies must not be edited in place.
- [x] **Copy the block verbatim into both consumers.** The shared region is **1,627 characters**
      and **12 lines**, verified by diff across both files.
- [x] **Record the canonical block's size** so a later unintended edit shows up as a size change
      rather than requiring a full re-read. The canonical file is **24 lines**.

#### Verification

- [x] Compare the approval region in `src/deploy-workflow.md` against
      `src/schema-change-workflow.md` — expected: identical. **PASS — 0 differences.**
- [x] Measure the fenced block in `src/gate-block.md` — expected: **1,627 characters** across
      **12 lines**. **PASS — matches.**
- [x] Count the lines in `src/gate-block.md` — expected: **24**. **PASS.**

#### Acceptance Criteria

- The approval region is byte-identical across both consumers.
- The recorded size of the canonical block matches what measurement returns, so the size can be
  used as a cheap tamper check.
- Every consumer states that its copy is generated and must not be edited in place.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — the recorded sizes are load-bearing for the tamper check, and a wrong number is invisible to a reader. -->

- [x] Run Definition of Done commands. All must pass.
- [ ] **Run this phase's independent verification.**
- [ ] **Apply the verification result.**
- [ ] **Agent self-review.**
