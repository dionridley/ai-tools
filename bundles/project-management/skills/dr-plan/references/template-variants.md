# Template Variants — Plan-Type Detection and Overlay Composition

Load this reference from `create-mode.md` (Phase 2). Defines how to detect a plan type from signals and how to compose the base template with an overlay.

## Detection Philosophy

The **default is `standard-feature`** and it is used **silently**. Most work is feature work and doesn't need an overlay. Overlays exist because certain categories of work have specialized structural needs that don't fit the standard shape — extra sections (Rollback, Entry Preconditions), phase templates (Eval Rubric Setup), or omissions (Dependencies for bug fixes).

Overlay detection is **exclusion-based:** find signals that say "this isn't standard-feature" rather than trying to classify every plan into one of five buckets. When no signals surface, don't prompt — just silently use the base template.

When signals do surface, **announce and confirm** before applying. The user sees that an overlay was detected, picks it or opts out, and the flow continues.

## Overlay Types

| Overlay | When it applies | Key additions |
|---------|-----------------|---------------|
| `standard-feature` | Default. No signals for other overlays. | (base template, unchanged) |
| `ai-feature` | LLM calls, model choice, prompt design, eval suites | Eval Rubric phase, Model/Prompt phase, AI-specific Acceptance Criteria |
| `migration/infra/refactor` | Data migration, infra change, refactor, platform upgrade | Rollback Plan section, Entry Preconditions per phase, Verify-in-Prod phase |
| `bug-fix` | Targeted fix for a specific bug | Collapsed phases, Dependencies dropped, simplified rollback |
| `spike` | Time-boxed exploration / prototype / investigation | Questions to Answer (instead of Success Criteria), relaxed DoD, time-box |

## Detection Signals (Precedence Order)

Evaluate in order. A signal in an earlier level overrides signals in a later level.

### Level 1: PRD Feature Type (if `@_claude/prd/*.md` is referenced)

Map the PRD's `Feature Type` metadata field:

| PRD Feature Type | Overlay |
|------------------|---------|
| `ai-feature` | `ai-feature` |
| `infra` | `migration/infra/refactor` |
| `spike` | `spike` |
| `user-facing`, `internal-tool` | `standard-feature` (unless a Level 2 keyword refines it) |

PRD type wins when present — it's the most deliberate signal available.

### Level 2: Keyword Scan in `$ARGUMENTS`

Case-insensitive match against these keyword sets:

| Keywords | Overlay |
|----------|---------|
| `migrate`, `migration`, `refactor`, `upgrade`, `platform`, `infra`, `rewrite`, `cutover` | `migration/infra/refactor` |
| `fix`, `bug`, `regression`, `hotfix`, `broken`, `crash` | `bug-fix` |
| `explore`, `spike`, `prototype`, `feasibility`, `investigate`, `poc`, `proof of concept` | `spike` |
| `llm`, `model`, `prompt`, `eval`, `agent`, `rag`, `embedding`, `summariz`, `classif`, `chat`, `generate` | `ai-feature` |

### Level 3: Repo Signals (`Glob` — use sparingly)

Only evaluate if Levels 1 and 2 left it ambiguous. Do not search exhaustively; one or two targeted `Glob` calls is enough.

| Glob pattern matches (relative to repo root) | Lean |
|---------------------------------------------|------|
| `migrations/**`, `schema.sql`, `db/migrate/**` | `migration/infra/refactor` |
| `evals/**`, `prompts/**`, `prompt.md`, `*.prompt.md` | `ai-feature` |

## Conflict Resolution

When multiple overlays surface from the same level:

- **`ai-feature` + `migration/infra/refactor`** → `ai-feature` wins. AI features often run on migrated infrastructure, but the AI-specific needs (evals, prompts) are the load-bearing additions.
- **`bug-fix` + `migration/infra/refactor`** → `migration/infra/refactor` wins. A bug fix that requires a data migration needs the migration overlay's safety structure.
- **`spike` + anything** → `spike` wins. A spike is a spike; other overlays' structure is usually overkill.
- **`ai-feature` + `bug-fix`** → prefer `bug-fix` if the scope is a single fix; prefer `ai-feature` if the fix involves re-tuning prompts / evals.

When the detection is genuinely ambiguous, announce the dominant overlay but mention the secondary signal in the confirm prompt so the user can override.

## Composition Rules

Overlays are additive fragments applied on top of `plan-base.md`. They describe three kinds of changes:

1. **Section additions** — new sections injected at a specific anchor (e.g., migration's `Rollback Plan` goes after `Definition of Done`, before `Implementation Plan`).
2. **Section replacements** — sections in base replaced wholesale (e.g., spike's `Success Criteria` → `Questions to Answer`).
3. **Section omissions** — sections in base dropped (e.g., bug-fix drops `Dependencies`).

### Merge order

1. Start with the full `plan-base.md`.
2. Read the overlay file's "Rendering note for CREATE mode" section — it's the authoritative recipe for that overlay.
3. Apply additions first (insert at the specified anchor).
4. Apply replacements second (swap whole sections).
5. Apply omissions last (drop skipped sections).

### Anchor conventions

Overlays reference sections by heading text (e.g., "after `Definition of Done`"). Match on the exact H2 heading. If an H2 heading moved or is missing in base, overlays should degrade gracefully — insert at the closest reasonable anchor and flag it in the completion summary.

### Per-phase blocks (Entry Preconditions, etc.)

Overlays that add per-phase blocks (like migration's Entry Preconditions) apply to every phase except ones explicitly excluded in the overlay's rendering note.

## Overlay-Specific Notes

### migration/infra/refactor

The base template enforces strict Definition of Done at every phase boundary. Migrations sometimes have genuine interim states (a schema rename that's mid-flight, a backfill that's partway through). When create-mode.md Phase 6 restructures-or-interim-phase decides in favor of interim phases, the migration overlay gives guidance: accept interim phases more readily here than in standard-feature work, but still prefer restructuring when possible.

The overlay's Rollback Plan section is **mandatory** — do not omit it. A migration without a rollback plan is not shippable.

### ai-feature

The AI-feature overlay does not replace the base's `Acceptance Criteria` block at the phase level — it augments it with AI-specific patterns (eval thresholds, cost budgets, guardrail tests). Phase-level Acceptance Criteria for non-AI phases in an AI plan (e.g., a backend wiring phase) remain standard.

The overlay adds two new **phase templates** (Eval Rubric Setup, Model/Prompt Selection). These are recommended as Phase 1 and Phase 2 of an AI plan; create-mode.md places them where they make sense given dependencies.

### spike

The spike overlay is the most structurally aggressive — it replaces `Success Criteria` with `Questions to Answer`, relaxes the DoD, and adds a time-box. The `Retro` section is especially valuable for spikes because it's where the actual findings are recorded. Never omit Completion + Retro from a spike plan.

### bug-fix

The bug-fix overlay is the least structurally aggressive — mostly omissions and collapse. If a bug fix turns out to require a migration or an eval re-tune during execution, the user should REFINE the plan to use the correct overlay rather than forcing the bug-fix shape to hold.

## Rendering Confirmation (Phase 2 of create-mode.md)

After detection, the announce-and-confirm prompt looks like:

> This looks like a [detected overlay] — [one-line reasoning from detection]. Should I use the [detected overlay] overlay?
>
> - Yes, use [detected overlay]
> - No, use standard-feature
> - Use a different overlay: [list the three alternatives]

The confirmation prompt is shown once. After the user answers, proceed without further check-ins on plan type.
