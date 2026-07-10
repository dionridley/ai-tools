# AI-Feature Overlay — Additional Sections for LLM/ML Features

Load this reference when the detected feature type is `ai-feature`. These sections are injected into the base template at specific anchor points. The rationale: deterministic acceptance criteria don't capture what makes an LLM/ML feature succeed. Eval rubrics, prompt specs, and quality budgets are the real spec.

## Clarifying Questions (used in CREATE Phase 2 follow-ups)

When the feature type is detected as `ai-feature`, add 1-3 of these follow-ups — pick the ones most relevant to what the user described:

- **Model** — "Which model are you targeting? Opus / Sonnet / Haiku / something else? Are you open on model choice, or is it fixed?"
- **Quality dimensions** — "What does 'good' output look like here? Accurate, concise, on-tone, safe, factual — which of these matter most?"
- **Failure tolerance** — "What's the worst acceptable failure? A wrong answer, a hallucinated citation, a slow response, a refusal when it shouldn't refuse?"
- **Latency/cost ceiling** — "Is there a latency or cost budget? (p95 response time, cost-per-query ceiling)"
- **Guardrails** — "Are there things the model must refuse to do, or topics it must stay away from?"
- **Ground truth** — "How will we evaluate output quality? LLM-as-judge, human review, automated regex/structure checks, or something else?"

Do not ask all of them — pick the 1-3 that cover the biggest unknowns.

## Sections to Inject

Inject these in the order listed. They slot into the base template at the anchor points noted.

### 1. Model and Constraints

**Anchor:** after `Technical Considerations`.

```markdown
## Model and Constraints

- **Primary model:** [e.g., claude-opus-4-7]
- **Fallback model:** [e.g., claude-sonnet-4-6 — or "none" if single-model]
- **Context window:** [required input size; note if approaching model limits]
- **Streaming:** [Yes / No — impacts UX and latency perception]
- **Fine-tuning / adaptation:** [None / Prompt-only / RAG / Fine-tuned — and why]
- **Other constraints:** [Tool use, structured output, specific output format, etc.]
```

### 2. Prompt Spec

**Anchor:** after `Model and Constraints`.

Prompts are specification, not implementation detail. Treat the system prompt as part of the PRD.

```markdown
## Prompt Spec

### System prompt (v1 draft)

> [Full draft of the system prompt. If still forming, leave as a placeholder:
> "[To be drafted during implementation — key requirements captured in Eval Rubric below.]"]

### Input shape

[What the user/caller provides — format, fields, constraints.]

### Output shape

[What the model should return — JSON schema, markdown structure, plain text with constraints.]

### Few-shot examples (optional)

[0-3 examples if they'd meaningfully shape behavior. Otherwise skip this subsection.]
```

### 3. Eval Rubric

**Anchor:** replaces the standard `Acceptance Criteria` section (which doesn't work for probabilistic outputs).

The eval rubric *is* the acceptance criteria for AI features. `/dr-plan` consumes this directly to generate eval scaffolding.

```markdown
## Eval Rubric

Each dimension is evaluated independently. A feature "passes" when every dimension meets its target.

| Dimension | Definition | Target | Measurement method |
|-----------|------------|--------|---------------------|
| [Accuracy / Correctness] | [What "correct" means for this feature] | [e.g., ≥ 0.9 on eval set of N examples] | [LLM-as-judge / human review / exact match / structured diff] |
| [Hallucination rate] | [Statements not supported by input/source] | [e.g., ≤ 2%] | [Human spot-check / judge LLM with source] |
| [Tone / Style] | [Expected voice, formality, length] | [e.g., ≥ 0.85 on tone rubric] | [Judge LLM with rubric] |
| [Safety / Refusal correctness] | [Refuses the right things, doesn't over-refuse] | [e.g., 100% on harm set, ≤ 5% false refusal] | [Red-team set + legitimate-use set] |

### Regression threshold

[Minimum eval scores that must hold before merging changes. Example: "No dimension may drop more than 3 percentage points from the previous release."]
```

### 4. Performance Budgets

**Anchor:** after `Eval Rubric`.

```markdown
## Performance Budgets

- **Latency p50:** [target — e.g., 1.5s]
- **Latency p95:** [target — e.g., 4s]
- **Latency p99:** [target — e.g., 8s]
- **Cost per query:** [ceiling — e.g., $0.02]
- **Tokens per response:** [max — e.g., 1500]
- **Throughput:** [if relevant — e.g., sustains 50 concurrent requests]

Breach policy: [What happens if a budget is exceeded? Block release / page on-call / degrade gracefully / fallback model?]
```

### 5. Guardrails

**Anchor:** after `Performance Budgets`.

```markdown
## Guardrails

- **Must refuse:** [Categories of requests the model must not fulfill — list specific trigger topics]
- **Refusal style:** [Polite + explain? Hard decline? Redirect to human? Standard boilerplate?]
- **Jailbreak resistance:** [Expected behavior against prompt-injection attempts — escape sequences, role-play attacks, data-exfiltration attempts]
- **PII handling:** [What PII can flow through? What must be redacted? Logging policy?]
- **Content moderation:** [Upstream filter, downstream filter, both, or none — with reasoning]
```

## Writing Guidelines

- **Be concrete about targets.** "Accuracy should be high" is not a target; "≥ 0.9 on a 100-example eval set, judged by [method]" is.
- **Don't spec the full prompt if it's not yet drafted.** Placeholder is fine — the point of the PRD is to frame what the prompt must accomplish, not to commit to final wording.
- **Only include dimensions that matter.** A summarization feature likely cares about accuracy, hallucination, and tone — not about refusal correctness. Trim to what's relevant.
- **Regression thresholds are load-bearing.** Without them, eval scores drift downward across releases. Pick a real number.
- **Use exact model IDs.** Reference the exact published model identifier (e.g., `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`). Don't abbreviate, drop date suffixes, or guess a version — if you're unsure of the exact current ID, flag it as an Open Question rather than inventing one. The date suffix convention varies by model family; verify before writing.

## Integration with `/dr-plan`

The downstream plan will:

- Read `Eval Rubric` to generate eval scaffolding tasks.
- Read `Prompt Spec` to generate prompt-drafting and prompt-test tasks.
- Read `Performance Budgets` to generate load-testing and latency-instrumentation tasks.
- Read `Guardrails` to generate red-team-set authoring tasks.

Keep these sections well-structured so `/dr-plan` can parse them reliably.
