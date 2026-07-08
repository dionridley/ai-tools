# MVP Brainstorm: {{PROJECT_NAME}}

**Created:** {{CREATED_AT}}
**Stack:** {{STACK_NAME}}
**Status:** {{STATUS}}
**Last Updated:** {{UPDATED_AT}}
**Playwright E2E:** {{PLAYWRIGHT_ENABLED}}

---

## Vision

{{VISION_DESCRIPTION}}

---

## Decisions

| # | Decision | Choice | Rationale | Decided |
|---|----------|--------|-----------|---------|
| 1 | App Type | Web Application | {{APP_TYPE_RATIONALE}} | {{CREATED_AT}} |
| 2 | Tech Stack | {{STACK_NAME}} | {{STACK_RATIONALE}} | {{CREATED_AT}} |
| 3 | Core Flow | {{CORE_FLOW_NAME}} | {{CORE_FLOW_RATIONALE}} | {{CREATED_AT}} |
| 4 | E2E Testing | {{PLAYWRIGHT_ENABLED}} | {{PLAYWRIGHT_RATIONALE}} | {{CREATED_AT}} |

---

## Scope Boundary

### In Scope (MVP)

{{IN_SCOPE_FEATURES}}

### Explicitly Out of Scope

{{OUT_OF_SCOPE_FEATURES}}

### Core User Flow

{{CORE_USER_FLOW_STEPS}}

---

## Screens

### Screen 1: {{SCREEN_1_NAME}}
- **Purpose:** {{SCREEN_1_PURPOSE}}
- **Key Elements:** {{SCREEN_1_ELEMENTS}}
- **Data:** {{SCREEN_1_DATA}}
- **Navigation:** {{SCREEN_1_NAV}}

### Screen 2: {{SCREEN_2_NAME}}
- **Purpose:** {{SCREEN_2_PURPOSE}}
- **Key Elements:** {{SCREEN_2_ELEMENTS}}
- **Data:** {{SCREEN_2_DATA}}
- **Navigation:** {{SCREEN_2_NAV}}

### Screen 3: {{SCREEN_3_NAME}}
- **Purpose:** {{SCREEN_3_PURPOSE}}
- **Key Elements:** {{SCREEN_3_ELEMENTS}}
- **Data:** {{SCREEN_3_DATA}}
- **Navigation:** {{SCREEN_3_NAV}}

{{ADDITIONAL_SCREENS}}

---

## Implementation Phases

### Phase 1: Project Scaffold & Foundation
**Estimated:** 10-15 min

- [ ] Project initialization ({{SCAFFOLD_COMMAND}})
- [ ] Install core dependencies
- [ ] Configure {{STACK_SHORT}} project settings
- [ ] Set up routing structure with placeholder pages/LiveViews
- [ ] Create base layout component
- [ ] Verify dev server starts and compiles assets cleanly

**Gate:** Dev server starts, assets compile, base route renders without errors.

### Phase 2: Data Layer & Schema
**Estimated:** 15-20 min

- [ ] Define data models / schemas
- [ ] Write migration files
- [ ] Run migrations
- [ ] Create realistic seed data (using Faker/factory helpers)
- [ ] Verify data layer compiles and seeds load

**Gate:** Database created, migrations run cleanly, seed data loads successfully.

### Phase 3: Test Scaffolding
**Estimated:** 15-20 min

- [ ] Create test factory / data helpers
- [ ] Write unit tests for each context / data module (happy path)
- [ ] Verify all tests pass before proceeding

**Gate:** `mix test` / `npm test` passes with 0 failures. All context/data functions have test coverage.

### Phase 4: Design Brief
**Estimated:** 5-10 min

- [ ] Generate design brief for this specific app using frontend-design skill
- [ ] Save design brief to `.mvp/research/design-brief.md`
- [ ] Define color palette, typography, component patterns, and visual tone

**Gate:** Design brief exists at `.mvp/research/design-brief.md` and is populated.

### Phase 5: Core Feature — {{CORE_FEATURE_NAME}}
**Estimated:** 30-45 min

{{CORE_FEATURE_TASKS}}

**Gate:** Core user flow works end-to-end.{{PLAYWRIGHT_GATE}}

### Phase 6: UI Polish & Remaining Screens
**Estimated:** 20-30 min

{{UI_POLISH_TASKS}}

**Gate:** All screens render, navigation works between all routes.

### Phase 7: Integration & Smoke Test
**Estimated:** 15-25 min

- [ ] End-to-end flow verification
- [ ] Write LiveView / component interaction tests for each screen
- [ ] Fix broken connections between components
- [ ] Run full test suite — must pass with 0 failures
- [ ] Final visual polish and responsive check
- [ ] Write README with run instructions
- [ ] Clean up unused boilerplate

**Gate:** `mix test` / `npm test` passes with 0 failures, full user flow works, README is accurate.

---

## Task Tracking

| Metric | Count |
|--------|-------|
| Total tasks | {{TOTAL_TASKS}} |
| Completed | 0 |
| In Progress | 0 |
| Failed | 0 |
| Remaining | {{TOTAL_TASKS}} |

---

## Analytics

| Metric | Value |
|--------|-------|
| Brainstorm started | {{CREATED_AT}} |
| Brainstorm completed | -- |
| Build started | -- |
| Build completed | -- |
| Total sessions | 1 |
| Total agent dispatches | 0 |
| Total quality reviews | 0 |
| Quality reviews passed | 0 |
| Quality reviews failed | 0 |
| Total git commits | 0 |
| Total elapsed time | -- |

### Time Per Phase

| Phase | Estimated | Actual | Started | Completed |
|-------|-----------|--------|---------|-----------|
| 1. Scaffold | 10-15 min | -- | -- | -- |
| 2. Data Layer | 15-20 min | -- | -- | -- |
| 3. Test Scaffolding | 15-20 min | -- | -- | -- |
| 4. Design Brief | 5-10 min | -- | -- | -- |
| 5. Core Feature | 30-45 min | -- | -- | -- |
| 6. UI Polish | 20-30 min | -- | -- | -- |
| 7. Integration | 15-25 min | -- | -- | -- |

---

## Agent Log

<!-- Each agent dispatch gets appended here with the following format:
### Agent #[ID] — [Task Name]
- **Phase:** [N] - [Phase Name]
- **Status:** SUCCESS / PARTIAL / FAILED
- **Started:** [timestamp]
- **Completed:** [timestamp]
- **Duration:** [Xm Ys]
- **Files:** [list of files modified/created]
- **Quality Review:** PASS / FAIL / SKIPPED (low-risk)
- **Notes:** [any relevant details]
-->

_No agents dispatched yet._

---

## Notes

{{BRAINSTORM_NOTES}}
