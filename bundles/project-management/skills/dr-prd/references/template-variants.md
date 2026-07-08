# Template Variants — Section Inclusion Rules by Feature Type

Load this reference from either CREATE mode (Phase 3) or REFINE mode (when generating a migrated PRD). It defines which sections of `prd-base.md` to include, skip, or replace based on the feature type.

## Feature Type Catalog

Detect one of these types. Prefer inference from the clarifying phase; confirm with the user before drafting.

| Type | Typical signals |
|------|-----------------|
| `user-facing` | UI, customer-visible flow, mobile/web app feature, marketing-surfaced |
| `internal-tool` | Admin panel, staff-only, ops dashboard, data-entry tool |
| `infra` | Deployment, CI/CD, observability, platform, migration, performance |
| `ai-feature` | LLM, ML model, summarize, generate, classify, chat, agent, embedding, RAG |
| `spike` | Exploratory, research-oriented, time-boxed, one-off experiment |

If a feature spans two types (e.g., user-facing AND AI), treat `ai-feature` as dominant — it brings the most additional structure. Confirm with the user.

## Section Inclusion Rules

`✓ include`, `✗ skip`, `± optional based on signal`.

| Section | user-facing | internal-tool | infra | ai-feature | spike |
|---------|:-:|:-:|:-:|:-:|:-:|
| Metadata | ✓ | ✓ | ✓ | ✓ | ✓ |
| Problem Statement | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hypothesis | ✓ | ± | ± | ✓ | ✓ |
| Success Metrics | ✓ | ± | ✓ | ✓ | ± |
| User Stories | ✓ | ✓ | ✗ | ✓ | ± |
| Functional Requirements | ✓ | ✓ | ✓ | ✓ | ± |
| Acceptance Criteria | ✓ | ✓ | ✓ | replaced by Eval Rubric | ± |
| Technical Considerations | ✓ | ± | ✓ | ✓ | ✓ |
| Dependencies | ± | ± | ✓ | ✓ | ± |
| Release Strategy | ✓ | ± | ✓ | ✓ | ✗ |
| Risks and Mitigation | ✓ | ± | ✓ | ✓ | ± |
| Open Questions | ✓ | ✓ | ✓ | ✓ | ✓ |
| References | ✓ | ✓ | ✓ | ✓ | ✓ |
| Refinement History | ✓ | ✓ | ✓ | ✓ | ✓ |

**Optional-based-on-signal (`±`) guidance:**

- **Hypothesis** for internal-tool/infra — include when there's a genuine behavior change being bet on. Skip if the feature is "we need X to exist" with no uncertain outcome.
- **Success Metrics** for internal-tool — include when there's a measurable outcome (time saved, tickets reduced). Skip for pure-enablement features.
- **User Stories** for spike — include if the spike has a known user; skip if it's purely technical exploration.
- **Functional Requirements** for spike — often too early to define; prefer Open Questions instead.
- **Dependencies** for user-facing / internal-tool — include when there are explicit blockers; skip empty lists rather than leaving a placeholder.
- **Release Strategy** for internal-tool — include when rollout strategy matters (e.g., training required, phased by team); skip for a simple deploy.

## AI-Feature Additions

For `ai-feature` type, inject the sections described in `ai-feature-sections.md`. The overlay adds:

- `Model and Constraints` (after `Technical Considerations`)
- `Prompt Spec` (after `Model and Constraints`)
- `Eval Rubric` (replaces the standard `Acceptance Criteria` section)
- `Performance Budgets` (after `Eval Rubric`)
- `Guardrails` (after `Performance Budgets`)

## Infra-Feature Adjustments

For `infra`:

- `User Stories` is typically replaced with an "Operator Stories" framing: "As an on-call engineer, I want [capability], so that [benefit]." Keep the section header as `User Stories` for consistency but use operator framing internally.
- `Technical Considerations` is usually the load-bearing section — spend most of the drafting effort here.
- `Acceptance Criteria` should include observable rollout signals (dashboards green, error rate below X, runbook updated) in addition to functional bullets.

## Spike Adjustments

For `spike`:

- Most sections are optional. The PRD's job is to frame the question and define exit criteria, not to spec the implementation.
- Prefer a larger `Open Questions` section over fleshed-out `Functional Requirements`.
- `Release Strategy` is always skipped — spikes don't ship.
- Add a clear time-box in `Technical Considerations` ("Time-box: 3 days. If no clear signal by then, exit.").

## How to Apply in CREATE Mode

1. Start with the full `prd-base.md`.
2. Remove sections marked `✗` for the detected type.
3. Keep or drop `±` sections based on the signal guidance above.
4. For `ai-feature`, apply the overlay from `ai-feature-sections.md`.
5. State the inclusion decisions back to the user in Phase 3's confirmation message so they can correct before drafting.

## How to Apply in REFINE Mode

Only relevant when the user explicitly requested a structural migration. The default refine flow preserves the existing structure. See `refine-mode.md` Phase 6 for the migration-mapping rules.
