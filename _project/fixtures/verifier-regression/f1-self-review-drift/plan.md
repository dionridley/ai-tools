# Plan: Align the Agent self-review line across gate-rendering sites

<!-- FIXTURE — intentionally defective. See ../README.md. Do not repair. -->

## Metadata

- **Number:** F1
- **Status:** in_progress
- **Created:** 2026-08-02
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

The `Agent self-review` task is the last line of every Phase Exit Gate, and it is rendered from
three different files. Two of them render both a `yes`-shape variant (used when a phase carries
an independent-verification task) and a `no`-shape variant (used when it does not); the base
template carries a single gate block that the generator prunes.

Because the line is duplicated, it can drift. This plan aligns all of them so that the wording is
identical within each shape, and so the base template's single block carries the `yes`-shape
wording that the reference files specify.

## Current State

Three files render the line:

| File | Renders |
|---|---|
| `sites/create-mode.md` | both shapes — the authoritative rendering spec |
| `sites/questions-mode.md` | both shapes — used when a policy change regenerates gates |
| `sites/plan-base.md` | one pruned gate block |

All paths below are relative to this fixture directory.

## Success Criteria

- [x] The `Agent self-review` line is word-identical within each shape across every site.

## Definition of Done

- Every file touched is still valid markdown.
- No file outside `sites/` is modified.

## Implementation Plan

### Phase 1: Align the self-review line across all three sites

#### Tasks

- [x] **Align the `yes`-shape line across all three sites.** `sites/create-mode.md`,
      `sites/questions-mode.md`, and `sites/plan-base.md` all carry the same `yes`-shape
      wording, word-for-word.
- [x] **Align the `no`-shape line across the two sites that render it.**
      `sites/create-mode.md` and `sites/questions-mode.md` carry identical `no`-shape wording.
- [x] **Give `sites/plan-base.md`'s gate block the `yes`-shape wording**, so a plan generated
      from the base template carries the same final gate instruction the reference files
      specify.
- [x] **Confirm the UNVERIFIED routing survives at every `yes`-shape site** — each one tells the
      executing agent where UNVERIFIEDs go for follow-up.

#### Verification

- [x] Extract the `Agent self-review` line from the three `yes`-shape sites and compare —
      expected: byte-identical after stripping `questions-mode.md`'s uniform structural indent.
- [x] Extract the `Agent self-review` line from the two `no`-shape sites and compare —
      expected: byte-identical.
- [x] Read `sites/plan-base.md`'s Phase Exit Gate block — expected: its self-review line keys the
      `[x]` flip to the verification's findings, consistent with the line above it.

#### Acceptance Criteria

- The `Agent self-review` line is word-identical within each shape across all five renderings.
- `sites/plan-base.md`'s gate block renders the `yes`-shape self-review wording.
- No `yes`-shape site instructs the agent to flip `[x]` on the basis of the Verification command
  block rather than the verification's verdict.
- Every `yes`-shape site states where UNVERIFIEDs are carried for follow-up.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — duplicated generated text whose failure mode is silent wording drift. -->

- [x] Run Definition of Done commands. All must pass.
- [ ] **Run this phase's independent verification.**
- [ ] **Apply the verification result.**
- [ ] **Agent self-review.**
