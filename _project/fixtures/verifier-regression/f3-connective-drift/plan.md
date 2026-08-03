# Plan: Render the escalation rules into the on-call handbook

<!-- FIXTURE — intentionally defective. See ../README.md. Do not repair. -->

## Metadata

- **Number:** F3
- **Status:** in_progress
- **Created:** 2026-08-02
- **Plan type:** standard-feature
- **Verification Policy:** Adaptive (default)
- **Related PRD:** N/A

## Executive Summary

The escalation rules live in one canonical file and are rendered into the on-call handbook so
responders have them without a lookup. Two copies means they can drift, and a drift here is
dangerous: these rules govern behaviour during an incident, when nobody is going to notice that
the copy in front of them disagrees with the source.

The renderings must therefore be **verbatim** identical, not merely equivalent in substance.

## Current State

- `regions/source.md` — canonical.
- `regions/rendered.md` — the copy that ships in the handbook.

## Success Criteria

- [x] The two renderings are verbatim identical.

## Definition of Done

- Both files are valid markdown.
- Neither file gains content the other lacks.

## Implementation Plan

### Phase 1: Render and confirm the copies agree

#### Tasks

- [x] **Render `regions/source.md` into `regions/rendered.md`** so the handbook carries the rules
      without a lookup.
- [x] **Confirm the two renderings agree verbatim**, so a responder reading either one gets the
      same instruction.
- [x] **Confirm no guidance is present in one copy and contradicted in the other.**

#### Verification

- [x] Compare the escalation-condition bullets in both files — expected: identical.
      **PASS — 4/4 match.**
- [x] Compare the escalation-order bullets in both files — expected: identical.
      **PASS — 3/3 match.**
- [x] Compare both headings in both files — expected: identical. **PASS — 2/2 match.**

#### Acceptance Criteria

- The two renderings are verbatim identical.
- No instruction appears in one rendering and is contradicted in the other.
- A responder reading `regions/rendered.md` during an incident receives the same guidance as one
  reading `regions/source.md`.

#### Phase Exit Gate

<!-- verifier-recommendation: yes — duplicated safety-critical text; drift here is silent and consequential. -->

- [x] Run Definition of Done commands. All must pass.
- [ ] **Run this phase's independent verification.**
- [ ] **Apply the verification result.**
- [ ] **Agent self-review.**
