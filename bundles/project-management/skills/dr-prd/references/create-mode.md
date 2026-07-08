# CREATE Mode — Draft a New PRD

This reference owns the full CREATE flow end-to-end. Follow each phase in order.

The flow is: gather → clarify → confirm approach → draft → report.

## Phase 1: Gather the Feature Description

### Read `$ARGUMENTS`

- If `$ARGUMENTS` has content → use it as the starting description.
- If `$ARGUMENTS` is empty or only whitespace → ask the user:

  > What feature should this PRD cover? Share as much or as little as you'd like — I'll ask follow-up questions after.

Wait for the user's response before continuing.

### Assess richness of the initial description

Score the initial description against four anchors:

1. **Problem** — is the actual pain named, with who experiences it?
2. **Users** — who the feature is for, beyond "users."
3. **Success** — how we'd know it worked (even roughly).
4. **Feature type** — is it obvious whether this is user-facing, internal, infra, AI/LLM, or a spike?

If all four are strong, **compress** the clarifying phase in Phase 2 — ask only about weak or missing anchors. If two or more are weak, run the full clarifying phase.

If the user explicitly says something like "just draft it" or "skip questions," compress fully and proceed with best-effort assumptions, flagging them in the draft.

## Phase 2: Clarifying Phase

The goal of this phase is to prevent generic, hallucinated, or shallow PRDs. It's the skill's most important phase — do not skip or rush it unless Phase 1 established the description is already rich.

### Fixed core questions

Ask these four (or any still-weak subset) conversationally — not as a numbered form. Weave follow-ups in naturally:

1. **Problem** — "Who experiences this problem today, and what's the evidence? Abandoned flows, support tickets, user quotes, a metric trending the wrong way?"
2. **Users** — "Who is this feature for specifically? Are there multiple user types with different needs?"
3. **Success** — "What would make this feature a clear win? Ideally something measurable — a metric that moves, a behavior change, a cost reduction."
4. **Feature type** — (If not obvious from the description.) "Is this user-facing, an internal tool, infrastructure, an AI/LLM feature, or a quick spike?"

For question 4, prefer **inference + confirmation** over a cold ask. If the description suggests a category, offer it back: "This sounds like an AI/LLM feature because you mentioned summarizing documents — is that right?" Fall back to asking directly only when inference fails.

### Adaptive follow-ups

Based on answers, pick 1-3 follow-ups that sharpen the riskiest or thinnest area. Examples:

- User mentions summarization, generation, classification, agents, or chat → route to AI-feature follow-ups (see `${CLAUDE_SKILL_DIR}/references/ai-feature-sections.md`, Clarifying Questions section).
- User gave a vague metric ("engagement goes up") → push for a specific measurement.
- User named a user type but not their context → ask when/where they use the feature.
- User hasn't mentioned constraints → ask about integration points, existing systems, platform.

Ask at most 3 follow-ups before moving on. Diminishing returns kick in fast.

### Handling thin answers — the nudge

If the user answers "I don't know" or gives thin answers to **two or more core questions**, surface a non-blocking nudge once:

> A couple of the core questions are fuzzy. A few options:
> - Run `/dr-research [topic]` first to ground the PRD in evidence.
> - Brainstorm with me here — I can ask sharper questions to help surface what you know.
> - Share any docs, research, or prior PRDs you want me to incorporate (paste `@path/to/file.md`).
> - Or we can proceed with what we have and flag assumptions in the draft.
>
> Which do you want?

Respect the user's choice. If they proceed with gaps, the draft must call out assumptions as open questions (not as facts).

### Confidence checkpoint before drafting

After the clarifying phase, do a quick conversational check — not a numeric score:

> Before I draft: I have a clear picture of [concrete thing X] and [concrete thing Y], but I'm fuzzy on [thing Z]. Want to clarify, or should I proceed and flag it as an open question?

Only surface this if there's a genuinely unresolved area. If everything is clear, skip the checkpoint and go straight to Phase 3.

## Phase 3: Confirm Feature Type and Template Variant

Read `${CLAUDE_SKILL_DIR}/references/template-variants.md` for the section-inclusion rules per feature type.

State the detected feature type back to the user plus which sections the draft will include/skip:

> Based on our conversation, I'll draft this as a **[feature type]** PRD. That means:
> - Included: [list the sections that will be included]
> - Skipped: [list sections not needed for this type, with brief why]
> - Added: [any type-specific sections, e.g. "Eval Rubric (AI feature)"]
>
> Sound right, or adjust before I draft?

If the feature type is AI/LLM, also note: "I'll add model/eval/guardrail sections — detail as we discussed."

Wait for the user to confirm or adjust, then proceed.

## Phase 4: Draft the PRD

### Derive a slug

From the feature name/description:
- Lowercase.
- Spaces → hyphens.
- Strip punctuation and special characters.
- Keep it short but descriptive. Example: `Real-time Collaboration v2` → `realtime-collaboration-v2`.

### Determine the output path

Target: `_claude/prd/[slug].md`.

`Write` creates parent directories automatically — do not shell out to `mkdir`. If `_claude/prd/` does not already exist, note in the completion summary that the user can run `/dr-init` for a full project scaffold, but don't block.

Use `Glob` to check whether the target path already exists. If it does, ask the user whether to overwrite, use a different slug, or switch to REFINE mode.

### Load and populate the template

Read `${CLAUDE_SKILL_DIR}/templates/prd-base.md`. Apply the template-variant rules from Phase 3:

- Remove sections that don't apply (per `template-variants.md`).
- For AI/LLM features, inject the sections described in `${CLAUDE_SKILL_DIR}/references/ai-feature-sections.md` at the appropriate anchor points.
- Replace placeholders:
  - `{{FEATURE_NAME}}` — human-readable name.
  - `{{CURRENT_DATE}}` — today's date from conversation context (`YYYY-MM-DD`).
  - `{{AUTHOR}}` — `Claude Code` unless the user provided a name.
  - `{{FEATURE_TYPE}}` — the confirmed type from Phase 3.

### Populate every included section thoughtfully

Use extended thinking. Do not leave placeholder text in a final draft.

- **Problem Statement** — concrete, evidence-grounded when possible. If evidence is thin, flag that in Open Questions, don't invent statistics.
- **Hypothesis** — fill the `We believe X will produce Y because Z` sentence with real content; state the testable signal.
- **Success Metrics** — specific, measurable, with a baseline if known and a target. If you don't know the baseline, mark it as `[needs baseline]` rather than inventing one.
- **User Stories** — one line each: `As a [user], I want [capability], so that [benefit].` 2-6 stories is typical.
- **Functional Requirements** — lead with Core (what's required for the feature to exist). Add Enhancements only if they surfaced explicitly in the conversation.
- **Acceptance Criteria** — testable behaviors that prove the feature works. Write each as something `/dr-plan` can turn into a failing test. Include at least one edge case and one failure-mode handler.
- **Technical Considerations** — architecture, technology choices, constraints, integration points. Keep concrete; don't list every conceivable concern.
- **Dependencies** — external or internal things that must exist first. Empty list is fine — don't manufacture items.
- **Release Strategy** — one line. If unclear, write `[To be determined during planning]`.
- **Risks and Mitigation** — the 2-4 most material risks. Not a risk inventory.
- **Open Questions** — use the format `[ ] Question — owner: [name], needs by: [YYYY-MM-DD]`. Put unknowns and assumptions here, not in the body.
- **References** — include any `@_claude/research/...` paths, `@_claude/prd/...` files, or external links the user provided. Never invent references. If the user provided none, replace the bulleted placeholders with a single line — no bullet, no placeholder: `No external references — no research documents, prior PRDs, or external resources were cited during drafting.`

### Provisional-content callouts

When a section contains meaningful assumptions — invented targets, inferred thresholds, starting-point numbers, or defaults surfaced during drafting rather than given by the user — mark them with a blockquote callout immediately after the provisional content:

```
> These are starting-point defaults — confirm with [owner] before [milestone] (see Open Questions).
```

This keeps the normative content clean while flagging provisional claims for the reader. Use sparingly: at most one callout per section, and only when the assumption is material. If a claim is both provisional and load-bearing, it also belongs as an Open Question — the callout can reference it.

Most-common locations: Hypothesis (inferred testable signals), Success Metrics (invented targets), Eval Rubric targets, Performance Budgets numbers.

### Handling requirements with pending decisions

When a requirement is definitely in scope but a design decision inside it is still open (e.g., "the system must handle missed recurrences, but the exact behavior — skip / catch up / notify — is undecided"):

- **Name the requirement in Functional Requirements** with a short `pending — see Open Questions` suffix.
- **File the decision in Open Questions** using the standard owner/needs-by format.
- **Add an Acceptance Criterion** that points to the pending decision: `[ ] Missed-recurrence behavior matches the decision recorded in Open Questions (acceptance to be tightened once decided).`

Do not omit the requirement from Functional Requirements — losing it risks the requirement disappearing from planning. Do not guess the decision — let Open Questions carry it until the owner resolves it.

### Never hallucinate

- No fabricated statistics, user counts, revenue figures, or competitor data.
- No invented user research or quotes.
- No made-up links — References only lists materials the user provided or that the skill produced.
- If you don't know something, it goes in Open Questions.

### Flag assumptions

If the user proceeded past the nudge with gaps, every assumption made to fill a section gets a corresponding Open Question.

## Phase 5: Write the File

Use `Write` with the full populated content. `Write` creates parent directories as needed.

## Phase 6: Completion Summary

Emit a concise success message:

```
✅ PRD created: _claude/prd/[slug].md

Feature type: [type]
Sections included: [count]
Assumptions flagged as open questions: [count]

Key things identified during drafting:
  - [3-5 non-obvious points surfaced in the clarifying phase or draft]

Next steps:
  1. Review the draft and refine: /dr-prd @_claude/prd/[slug].md [changes]
  2. Update status when ready (Draft → Under Review → Approved)
  3. When ready to implement: /dr-plan [implementation context]
```

If `_claude/prd/` did not exist before this write, add a one-line note:

> Note: Created `_claude/prd/` on the fly. Run `/dr-init` if you'd like the full project scaffolding (`_claude/plans/`, `_claude/research/`, etc.) plus a versioned CLAUDE.md.
