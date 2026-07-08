# CREATE Mode — Draft a New Implementation Plan

This reference owns the full CREATE flow end-to-end. Follow each phase in order.

The flow is: gather → detect plan type → determine number → analyze → populate DoD → structure phases → annotate gates → write → report.

## Phase 1: Gather the Implementation Context

### Read `$ARGUMENTS` and conversation context

Determine the starting context using this precedence:

- **`$ARGUMENTS` has substantive content** → use it directly as the starting context.
- **`$ARGUMENTS` is empty, whitespace-only, or trivially short (a pronoun like "this" or "it") AND the preceding conversation contains substantive context about what's being planned** → summarize that context back to the user:

  > Based on our conversation, I understand you want to plan: [concise summary of the work from the preceding conversation — include any referenced PRDs, constraints, or decisions].
  >
  > Should I proceed with this as the starting context, or do you want to adjust it before I draft?

  Wait for confirmation or correction before continuing.

- **`$ARGUMENTS` is empty AND there's no useful prior conversation context** → ask:

  > What would you like to implement? Share as much or as little as you'd like — describe the work, the why, any constraints, and reference a PRD with `@_claude/prd/[file].md` if you have one.

  Wait for the user's response before continuing.

### Check for flags and PRD reference

- **`--in-progress` flag** — if present, the plan will be created in `_claude/plans/in_progress/` instead of `_claude/plans/draft/`.
- **PRD reference** (`@_claude/prd/[file].md`) — when the user includes one, the content is auto-expanded into the conversation by Claude Code. The `@path` token itself is removed from `$ARGUMENTS` after expansion. Use the expanded PRD content as input to the plan. Store the PRD path for the `Related PRD` metadata field.

## Phase 2: Detect Plan Type (Overlay Signals)

Load `${CLAUDE_SKILL_DIR}/references/template-variants.md` for detection rules and overlay composition.

The default plan type is **`standard-feature`** and it is used **silently**. Overlays only apply when detection signals are present.

### Signal sources (in precedence order)

1. **PRD Feature Type** — if a PRD was referenced, check its `Feature Type` metadata. If it's `ai-feature` → propose `ai-feature` overlay. If it's `infra` → propose `migration/infra/refactor`. If it's `spike` → propose `spike`. If it's `user-facing` or `internal-tool` → default to `standard-feature` (unless keywords suggest otherwise).
2. **Keyword scan** in `$ARGUMENTS` — look for:
   - `migrate`, `migration`, `refactor`, `upgrade`, `platform`, `infra` → `migration/infra/refactor`.
   - `fix`, `bug`, `regression`, `hotfix` → `bug-fix`.
   - `explore`, `spike`, `prototype`, `feasibility`, `investigate` → `spike`.
   - `llm`, `model`, `prompt`, `eval`, `agent`, `rag`, `embedding`, `summariz`, `classif` → `ai-feature`.
3. **Repo signals** (use `Glob` sparingly — only if keyword/PRD inference left it ambiguous):
   - `migrations/` or `schema.sql` present → lean toward `migration/infra/refactor`.
   - `evals/`, `prompts/`, or `prompt.md` files present → lean toward `ai-feature`.

### Decision

- **No signal detected → silently use `standard-feature`.** Do not prompt the user. Do not mention the plan type in any pre-draft message.
- **Signal detected → announce and confirm.** Use `AskUserQuestion` once:

  > This looks like a [detected type] — [one-line reasoning, e.g., "you mentioned migrating the users table"]. Should I use the [detected type] overlay?
  >
  > Options:
  > - Yes, use [detected type] overlay
  > - No, use standard-feature (no overlay)
  > - Use a different overlay: [list the other four]

### Multiple-signal case

If two overlays surface (e.g., `ai-feature` keywords AND `migration` keywords), propose the dominant one and mention the secondary as a note in the confirm prompt. AI features often use infra patterns underneath — `ai-feature` wins. Bug fixes with schema changes → `migration/infra/refactor` wins.

Store the confirmed plan type for Phase 5 (template composition) and Phase 8 (metadata).

## Phase 3: Determine Plan Number

Plans are numbered sequentially across ALL three folders.

1. Use `Glob` with pattern `_claude/plans/**/*.md`.
2. Filter matches to files whose name starts with `NNN-` or `NNNN-` (one or more leading digits, then a hyphen).
3. Parse the leading number from each.
4. Next number = highest + 1.
5. Format: zero-padded to 3 digits if ≤ 999 (`001`, `042`, `999`); no padding if > 999 (`1000`, `1001`).
6. If no plans exist anywhere → start at `001`.

Concurrent-create edge cases (two plans ending up with the same number) are acceptable — the slugs differ and nothing downstream breaks.

## Phase 4: Analyze the Implementation (Extended Thinking)

Use extended thinking. Think about:

- What exactly is being built, and how does it split into phases?
- What exists today that the work modifies or extends?
- What assumptions are you making — which are grounded in the PRD/codebase (write as `- [x] text` — checkbox flipped, evidence cited), which are uncertain (write as `- [ ] [?] text` — pending checkbox + uncertain tag)?
- What blocking questions must resolve before implementation can start (`[AWAITING]`)?
- What non-blocking questions can be answered during implementation (`[OPEN]`)?
- What could go wrong? Where do the risks concentrate?
- Where is verification hardest — and where should a fresh-context verifier be worth the cost?

### Critical-assumption escape hatch

If an assumption is so load-bearing that getting it wrong invalidates the whole plan shape, consider using `AskUserQuestion` *before* drafting to resolve it. Only for truly plan-shaping assumptions — not routine uncertainties. Most uncertainties belong in `Open Questions & Decisions`, not as pre-draft blockers.

## Phase 5: Populate Definition of Done

The DoD block in the plan's header references concrete project commands. Populate them by reading config in this precedence order:

1. `CLAUDE.md` at repo root — look for Build/Test/Lint/Typecheck sections.
2. `AGENTS.md` at repo root — same purpose, different convention.
3. `package.json` — scripts section (`test`, `lint`, `typecheck`, `check`).
4. `Cargo.toml` — implies `cargo test`, `cargo clippy`, `cargo check`.
5. `go.mod` — implies `go test ./...`, `go vet ./...`.
6. `pyproject.toml` / `setup.py` — look for `pytest`, `ruff`, `mypy` configured.

If the stack is unclear (multi-language monorepo, no standard config found), ask once during the clarifying phase:

> I couldn't confidently identify the test/lint/typecheck commands for this repo. Can you share the commands for: run tests, run lint, run typecheck?

If a category genuinely doesn't apply (e.g., no type system in a pure JS repo, no tests in a docs-only repo), strike that line and add a note in the Assumptions section explaining why.

## Phase 6: Structure Phases (Strict DoD Discipline)

Every phase must leave the codebase shippable — tests, lint, and typecheck green at every phase boundary. This is the hard rule.

### Restructure to satisfy strict DoD

Analyze your proposed phases. If Phase N as drafted leaves the codebase broken (failing tests, broken build, type errors) with Phase N+1 as the fix, **restructure them.** Combine into one larger phase, reorder work, or extract a prerequisite into an earlier phase. Prefer restructuring over interim phases in ~95% of cases.

### Interim phase escape hatch

Only when restructuring is genuinely impossible (e.g., a schema rename truly has to be split across commits, or a large rename cannot be done atomically):

- Add an HTML comment marker at the top of the phase: `<!-- interim-phase: [short reason] — SKIPPED, restored in Phase N -->`.
- Add a prominent callout at the top of the phase body: `**DO NOT MERGE BEFORE PHASE [N]**`.
- In the final phase's Acceptance Criteria, confirm the interim-phase condition has been restored.

## Phase 7: Annotate Phase Exit Gates (Adaptive Verifier)

For each phase, decide whether spawning `project-management:plan-verifier` is worth the cost, given the Adaptive default Verification Policy.

Write a single HTML comment in each phase's Phase Exit Gate block:

```
<!-- verifier-recommendation: yes — [one-line reasoning] -->
```

or

```
<!-- verifier-recommendation: no — [one-line reasoning] -->
```

### When to recommend `yes`

- The phase touches security-sensitive code (auth, crypto, input validation, permissions).
- The phase produces the user-visible contract for the plan (e.g., template files, config schemas, API shapes).
- The phase has a high blast radius if wrong (shared infrastructure, cross-service code, migrations).
- The work is subtle — naming/structural errors would not be caught by Verification commands alone.
- Acceptance Criteria include assertions that require semantic evaluation (e.g., "cost ≥ 12", "no fabricated references").

### When to recommend `no`

- Isolated new-file additions where Verification commands cover the surface.
- CSS-only or purely visual changes.
- Documentation edits.
- Trivial one-line fixes with a regression test.

### Rendering the Exit Gate tasks

Based on the recommendation and the Verification Policy (`Adaptive` by default):

**If `verifier-recommendation: yes`** (or Policy = Always), render the gate as:

```
#### Phase Exit Gate

<!-- verifier-recommendation: yes — [reasoning] -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Spawn plan-verifier.** Invoke `subagent_type="project-management:plan-verifier"` with the plan file path and phase number. Wait for its report.
- [ ] **Apply verification report.** Flip `[x]` only for tasks the verifier reports as PASS. Keep `[ ]` for FAIL and UNVERIFIED with a note referencing the verifier's reasoning.
- [ ] **Agent self-review.** Re-read Tasks above, confirm the verifier's recommendations are reflected, note any UNVERIFIEDs that need follow-up in future phases or the Retro.
```

**If `verifier-recommendation: no`** (and Policy is not Always), render the gate as:

```
#### Phase Exit Gate

<!-- verifier-recommendation: no — [reasoning] -->

- [ ] Run Definition of Done commands (see plan header). All must pass.
- [ ] **Agent self-review.** Re-read all Tasks above. Flip `[x]` only for tasks whose Verification passed. Any failing or skipped task stays `[ ]` with a short note explaining why. Under-report beats over-report.
```

Leave the `Spawn plan-verifier` and `Apply verification report` tasks out entirely when the recommendation is `no` — don't render them as skipped.

## Phase 8: Compose the Template

### Load the base

Read `${CLAUDE_SKILL_DIR}/templates/plan-base.md`.

### Apply the overlay (if any)

If an overlay was confirmed in Phase 2, read its file from `${CLAUDE_SKILL_DIR}/templates/plan-[type].md` and apply per that overlay's "Rendering note for CREATE mode" section. Overlays additively describe sections to add, replace, or omit.

### Fill placeholders

Replace the template placeholders:

- `{{PLAN_NAME}}` — a readable name derived from the implementation context (e.g., "Add User Authentication").
- `{{PLAN_NUMBER}}` — the number from Phase 3.
- `{{PLAN_TYPE}}` — `standard-feature`, `ai-feature`, `migration/infra/refactor`, `bug-fix`, or `spike`.
- `{{CURRENT_DATE}}` — today's date (`YYYY-MM-DD`) from conversation context.
- `{{RELATED_PRD}}` — the PRD path (if referenced) or `N/A`.
- `{{TEST_COMMAND}}` / `{{LINT_COMMAND}}` / `{{TYPECHECK_COMMAND}}` — from Phase 5.
- `{{PHASE_1_NAME}}`, `{{PHASE_2_NAME}}`, etc. — concrete phase names.

Populate every section with real content — do not leave bracketed placeholders in a final draft except for genuinely-open items in `Open Questions & Decisions`.

### Emit Completion and Retro sections

Always render these at the bottom of the plan. They are unconditional — every plan has autonomous completion instructions. Do not add a skip flag, do not condition on plan type (even bug-fix plans get them; the retro will be short but may still surface something).

## Phase 9: Derive the Slug

From `{{PLAN_NAME}}`:
- Lowercase.
- Spaces → hyphens.
- Strip punctuation and special characters.
- Keep it short but descriptive.

Example: `Add User Authentication` → `add-user-authentication`.

## Phase 10: Write the File

- Target: `_claude/plans/draft/[NNN]-[slug].md` by default, or `_claude/plans/in_progress/[NNN]-[slug].md` if `--in-progress` was provided.
- Use `Write` — it creates parent directories as needed.
- If `_claude/plans/` does not exist before this write, add a one-line note in the completion summary suggesting the user run `/dr-init` for full scaffolding.

## Phase 11: Completion Summary

Emit:

```
✅ Plan created: _claude/plans/[folder]/[NNN]-[slug].md

Plan #[NNN]: [Plan Name]
Plan type: [type]
Related PRD: [path or N/A]

Sections populated: [count]
Phases: [N]
Verification-recommended phases: [N of M]
Blocking questions ([AWAITING]): [count]
Non-blocking questions ([OPEN]): [count]
Uncertain assumptions ([?]): [count]

Verification Policy: Adaptive (default). Change with `/dr-plan @[path] answer questions`.
```

Conditional additions:

- **If any interim phases were emitted**, add:
  ```
  ⚠ Contains [N] interim phase(s): [list of phase names]. DO NOT MERGE before Phase [final restoration phase] completes.
  ```

- **If a plan-type overlay was applied**, add the overlay name on its own line near the top of the summary (e.g., `Overlay: migration/infra/refactor`).

- **If blocking questions exist**, add:
  ```
  Next step: /dr-plan @_claude/plans/[folder]/[NNN]-[slug].md answer questions
  ```

- **If no blocking questions**, add:
  ```
  Next step: review the plan, then move to in_progress when ready.
  ```

- **If `_claude/plans/` did not exist before this write**, add:
  ```
  Note: Created `_claude/plans/` on the fly. Run `/dr-init` for full project scaffolding.
  ```
