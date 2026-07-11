# Output Formats Reference

This document guides how to structure research output files. Read this during Phase 3 (synthesis) when writing the research documentation.

## General Principles

- **Prescribe quality, not rigid structure.** Every finding must have supporting evidence. Every claim must be traceable to a source. But the exact section headings and organization should adapt to the topic.
- **Write for a developer who will act on this research.** Be specific, include code examples when relevant, and make the research actionable — not academic.
- **The discipline rules in SKILL.md Phase 3 are structural requirements.** Answer block, point-of-claim citations, measured-vs-estimated tags, mandatory Gaps, premise-level open question, adjective discipline, supersession, verdict ≤2 places. A report missing any of them is incomplete.
- **Markdown is canonical.** Write clean GFM: plain tables, ```mermaid fences, `>` blockquotes for callouts, relative links to sibling `.md` files. The HTML layer adds all presentation (see "How markdown becomes HTML" below). Raw HTML in markdown is reserved for hand-authored SVG figures only (see diagrams.md).

## File Defaults

- **Default set:** `index.md` + `findings.md` + `resources.md`. Add `recommendations.md` for decision research only.
- **Topic/artifact files** only when they carry a standalone artifact (scored comparison matrix, schema/DDL, runnable guide) or the user explicitly requested one.
- **Each claim lives in exactly one place.** Other files link to it instead of restating it. findings.md must never become a summary of topic files, and no file re-narrates another.
- **The verdict appears at most twice:** the index answer block and recommendations.md. findings.md presents evidence, not the verdict again.
- **Backstop:** if de-duplicated findings would exceed ~1,500 lines, propose a split to the user rather than silently producing a monster or fragments.

## File Writing Order

1. `findings.md` — core analysis (written first because everything else depends on it)
2. Topic/artifact files — only if planned and approved
3. `resources.md` — bibliography (written after research is complete)
4. `recommendations.md` — decision research only
5. `index.md` — overview and navigation (written last so it reflects everything produced)
6. `.html` siblings for every page (SKILL.md Phase 3.5)

## The Answer Block

index.md opens with the answer — before background, before methodology. Format it as a blockquote callout so the HTML view renders it as the highlighted box:

```markdown
> **Answer: [One-sentence verdict].** Confidence: [High/Medium/Low].
> **Exceptions:** [the 1–2 conditions under which this flips — every crisp
> answer carries its exceptions].
> **Verification (Deep path):** rests on claims 1–2 Confirmed, claim 3
> Single-source — see the [Claim Ledger](./findings.md#claim-ledger).
```

Rules:
- The verdict sentence is bolded and answers the research question directly — "Use X", "Y is viable but not for Z", "No — the premise doesn't hold."
- The confidence word must be consistent with the evidence. If the report flags its own core claims as unverified, the answer cannot say "clearly" or "definitively."
- Exceptions are part of the answer, not a footnote. A 1-of-N failure case the reader might hit belongs here.

## index.md

**Purpose:** The landing page. Answer first, then the shortest path to the details.

**Written last** so it accurately reflects everything produced.

**Should include:**
- The answer block (above) immediately after the header
- Research question and scope (what was and wasn't researched)
- Key takeaways (top 3–5) — each an insight of the form "X, therefore Y", not a restated fact
- File navigation with brief descriptions
- Deep Dives section (only in parent research when deep-dive follow-ups exist)
- **No concept map by default.** A diagram appears in index.md only if it passes the rubric in diagrams.md (TOC-mindmaps are banned — a diagram that re-lists the sections is decoration).

**Example structure:**

```markdown
# Research: [Topic]

**Date:** [YYYY-MM-DD]
**Research Question:** [The specific question investigated]

> **Answer: [Verdict].** Confidence: [word]. **Exceptions:** [conditions].

## Scope

[What was and wasn't researched — 2-3 lines]

## Key Takeaways

1. **[Insight]** — [why it matters / what to do because of it]
2. **[Insight]** — [...]
3. **[Insight]** — [...]

## Research Files

- **[Findings](./findings.md)** — [What's covered]
- **[Resources](./resources.md)** — Bibliography of all sources consulted
- **[Recommendations](./recommendations.md)** — [Decision research only]

## Deep Dives

- **[Deep Dive Title](./deep-dives/slug-date/index.md)** — [Date] — [Why this follow-up was done]
```

## findings.md

**Purpose:** The core analytical document — evidence and analysis, organized however fits the topic. It does NOT restate the verdict (that lives in index and recommendations).

**Should include:**
- Claim Ledger near the top (Deep path — format below)
- Detailed findings organized by topic, each with: what was learned, why it matters, and the evidence
- Community Signal section (library/framework evaluations — format below)
- Cross-cutting themes when patterns span findings
- **Gaps & Limitations — mandatory**
- **Open Questions — mandatory, with ≥1 premise-level question**

**Quality standards:**
- **Citation at point-of-claim:** every decision-bearing fact gets an inline link where it is asserted. "The docs confirm X ([source](url))" — not a bare assertion with the link quarantined in resources.md.
- **Measured vs estimated:** any decision-bearing number carries a citation/measurement or an explicit `(estimated, not measured)` tag. "Sub-10ms at 10M rows" without a benchmark link is a defect.
- Findings include analysis, not just facts — "what does this mean for us?"
- Ground claims in the user's own codebase where applicable — name the file/symbol.
- Code examples when they make a concept concrete; tables for structured comparisons.

### Claim Ledger (Deep path)

One row per load-bearing claim — the 3–6 claims where, if false, the verdict flips. The Verdict column values are exactly: `Confirmed`, `Single-source`, `Contested`, `Estimated`, `Unverified` (the HTML view auto-styles this column).

```markdown
## Claim Ledger

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | [Library] supports [capability] as of v3.2 | Confirmed | [changelog](url); [maintainer comment](url) (independent) |
| 2 | Lookup stays under ~10ms at 10M rows | Estimated | [docs on index behavior](url); no benchmark run — extrapolated |
| 3 | [Framework] will keep LTS until 2027 | Single-source | [roadmap blog post](url) only; no second origin found |
```

- Evidence cells name the sources AND why they're independent (or why independence couldn't be established).
- `Contested` rows link both sides and name the tiebreaker applied.
- The index answer block references these verdicts by number.

### Community Signal (library/framework evaluations)

Raw project-health metrics live here **once**; comparison tables and prose reference this section instead of restating numbers:

```markdown
## Community Signal

| Signal | [Option A] | [Option B] |
|--------|-----------|-----------|
| Last release / cadence | [date, cadence](url) | ... |
| License | [MIT](url-to-LICENSE) | ... |
| Open/closed issue health | [ratio, responsiveness](url) | ... |
| Bus factor | [N active maintainers](url) | ... |
| Adoption (dated) | [downloads/stars as of YYYY-MM](url) | ... |
```

### Confidence flags

Flag load-bearing claims with High/Medium/Low and a one-line reason. Use a blockquote callout for claims the reader should treat skeptically:

```markdown
> **Low confidence:** based on a single 2024 blog post; the library has had
> two major releases since. Verify before relying on this.
```

Never pair certainty language with a flagged claim — "clearly the best option" cannot sit above "we did not prototype this."

### Conflicting sources — cite inline

```markdown
> **Conflicting information:** [Official docs (2026-03)](https://...) state
> that runtime compilation was removed in v3.0, while [this post (2025-08)](https://...)
> describes it as recommended. The post references v2.x. Tiebreaker: recency +
> authority — the docs win, but verify against your target version.
```

### Gaps & Limitations (mandatory)

What was not verified, not prototyped, or not covered — and what that means:

```markdown
## Gaps & Limitations

- We did NOT prototype [X] — the "[claim]" finding is extrapolated (see ledger #2)
- [Source type] was unavailable ([npm endpoint 404'd]); adoption numbers are from [fallback]
- [Area] was out of scope per the plan; it could change [which conclusion]
```

### Open Questions (mandatory, ≥1 premise-level)

Tactical follow-ups are fine, but at least one question must challenge the premise:

```markdown
## Open Questions

- [Tactical: which plan tier do we need for X?]
- [Tactical: does Y work behind our proxy?]
- **Premise:** [What would make this the wrong scope/product/approach entirely?
  e.g., "If most usage is on managed hosting, is self-hosting research solving
  the right problem?"]
```

**Example structure:**

```markdown
# Research Findings: [Topic]

**Date:** [YYYY-MM-DD]

[← Back to Index](./index.md)

## Claim Ledger        [Deep path]

[table]

## [Topic Area 1]

[Analysis, evidence with inline citations, code examples, diagrams that pass the rubric]

## [Topic Area N]

[...]

## Community Signal    [library evaluations]

[table]

## Cross-Cutting Themes

1. **[Theme]:** [How this pattern appears across multiple findings]

## Gaps & Limitations

[mandatory]

## Open Questions

[mandatory, ≥1 premise-level]

## Related Documents

- [Index](./index.md) — Research overview
- [Resources](./resources.md) — All sources consulted
```

## resources.md

**Purpose:** Bibliography of all sources consulted. It is NOT the claim→source map — claims are cited inline where asserted; this file is for coverage and re-finding sources.

**Always created.** Use minimal grouping:

```markdown
# Research Resources: [Topic]

**Date:** [YYYY-MM-DD]

[← Back to Index](./index.md)

## Documentation

- [Resource title](URL) — Brief annotation of what this covers and why it's relevant

## Articles & Blog Posts

- [Resource title](URL) — Author/publication — Brief annotation

## Repositories & Libraries

- [Repository name](URL) — Brief annotation

## Community Discussions

- [Thread title](URL) — Platform — Brief annotation of key insight

## Related Documents

- [Index](./index.md) — Research overview
- [Findings](./findings.md) — Core research findings
```

**Guidelines:**
- Every entry gets a brief annotation — not just a bare URL
- Don't force categories that don't fit
- Include everything consulted, not just the "best" sources

## recommendations.md

**Purpose:** Actionable next steps. **Decision research only** — technology evaluations, architecture decisions, implementation choices. Skip for exploratory or knowledge-gathering research.

This file is the verdict's second (and last) allowed appearance.

**Must include for decision research:**
- The recommendation with rationale
- Prioritized next steps (why this order?)
- What to avoid — anti-patterns, pitfalls
- **Risk table with decision gates and testable exit criteria** — "what we're betting on" made falsifiable

**Example structure:**

```markdown
# Research Recommendations: [Topic]

**Date:** [YYYY-MM-DD]

[← Back to Index](./index.md)

## Recommendation

[What to do and why — consistent with the index answer block]

## Next Steps

### Priority 1: [Action]
**Why:** [Rationale for this being first]
**What:** [Specific actions]

## What to Avoid

- **[Anti-pattern]:** [Why, and what to do instead]

## Risks & Decision Gates

| Risk | Impact | Gate / Exit Criterion |
|------|--------|----------------------|
| [What we're betting on] | [High/Med/Low] | [Testable: "if X still stutters with batching → switch to Y"] |

## Open Questions

- [Question that would sharpen this decision if investigated]
```

## Topic/Artifact Files

Created only when they carry a **standalone artifact** — something with its own shape that doesn't belong inline in findings:

- `comparison.md` — a scored matrix (scores + weights, not prose re-narration of findings)
- `schema.md` — DDL/data model the user can apply
- `setup-guide.md` — runnable step-by-step guide
- `decision-record.md` — ADR-style capture

**Guidelines:**
- The artifact is the file. If a draft reads as commentary on findings.md, fold it back into findings.
- Metrics and claims referenced by the artifact link back to where they live (findings/community signal) instead of restating them.
- Include navigation links back to index.md.

## Supersession

When later work (a spike, a deep dive, new evidence) overturns a conclusion, **patch the claim where readers encounter it** — every file where it appears — either by correcting it in place or marking it:

```markdown
> **Superseded (2026-04-20):** the recommendation below was overturned by
> [Deep Dive: Tunneling vs Port Flipping](./deep-dives/tunneling-vs-port-flipping-2026-04-20/index.md).
> [One-line statement of the corrected conclusion.]
```

A note in the index alone is not enough — readers of findings.md or recommendations.md must hit the correction at the claim. Regenerate the `.html` for every file touched.

## Deep-Dive Output Structure

When research is a follow-up deep dive on existing research:

**Directory structure:**
```
_project/research/[parent-slug]-[date]/
├── index.md / index.html                 (updated with deep-dive link)
├── findings.md / findings.html
├── resources.md / resources.html
├── assets/                               (shared by parent + deep dives)
└── deep-dives/
    └── [deep-dive-slug]-[date]/
        ├── index.md / index.html         (assets via ../../assets)
        ├── findings.md / findings.html
        └── resources.md / resources.html
```

**Deep-dive index.md additions:**
- Link back to the parent research index: `[← Back to [Parent Title]](../../index.md)`
- Reference the parent research title and date
- Explain why this deep dive was done (what gap or question it addresses)
- A "How This Differs" note and a "Sources NOT Used" list when they clarify scope
- Don't rehash the parent research — focus on what's new

**Deep-dive navigation pattern** — all files within a deep dive include:

```markdown
## Related Documents

- [← Parent Research: [Title]](../../index.md) — Original research overview
- [Index](./index.md) — This deep dive's overview
- [Findings](./findings.md) — Deep dive findings
```

**Parent updates:**
- Add or update a "Deep Dives" section in the parent index — link the deep dive's `index.md` file directly, never the directory (directory links break in markdown viewers)
- **Apply the supersession rule** to any parent claims the deep dive overturned
- Regenerate the `.html` of every parent file touched

## How Markdown Becomes HTML

The `.html` sibling embeds the page's markdown verbatim and renders it client-side (works offline over `file://`). Author the markdown knowing what the presentation layer does:

- **Blockquotes become callout boxes** — this is why the answer block, confidence flags, and supersession markers use `>` blockquotes.
- **Tables with a `Confidence`, `Priority`, or `Verdict` column** get those values styled as pills automatically. Use the exact verdict vocabulary so the styling maps correctly.
- **Wide tables are safe.** Every table gets a horizontal-scroll wrapper, and in the default width mode ("Breakout") tables wider than the prose column automatically expand beyond it. Readers can also switch the whole page to 800/1000/Full Width from the top bar. Don't contort a comparison into a narrow shape to fit a column — write the table the data needs.
- **```mermaid fences render as diagrams**; the first paragraph after the H1 renders as a lead; headings get anchor IDs and pages with ≥3 h2 sections get an in-page TOC.
- **Links to sibling `.md` files are rewritten to `.html` in the browser** — always link to `.md` in markdown.
- **Raw HTML passes through** — reserved for hand-authored SVG figures only (conventions in diagrams.md).
- If content ever contains a literal `</script`, escape it as `<\/script` when generating the HTML (it's embedded in a script block).

Generation procedure, placeholders, and asset copying: SKILL.md Phase 3.5.
