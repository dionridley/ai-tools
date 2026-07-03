# Research Methodology Reference

This document guides how to plan and execute research. Read this during Phase 1 (planning) to select the right approach, and consult the verification section during Phase 2 on the Deep path.

## The Two Paths

Both paths produce the same output structure and follow the same output discipline (SKILL.md Phase 3). They differ only in the expensive work:

| | Standard (default) | Deep |
|---|---|---|
| Discovery | None — plan from the prompt | One discovery exchange before planning |
| Question shaping | Skill drafts the questions | Questions co-shaped, priority-ordered, disqualifiers first |
| Verification | Cite-as-you-go; flag single-source claims | + Claim ledger: 3–6 load-bearing claims verified |
| Recency | Date sources when it matters | Recency gate on all fast-moving claims |
| Cost | No extra user time | One extra exchange + ~2–4 searches per load-bearing claim |

**Triggers for Deep:**
- The user asks for it ("deep", "thorough", "verify", "I need to be sure")
- The skill suggests it for decision-critical asks: architecture/library selection, buy-vs-build, migrations, security-sensitive choices, anything costly to reverse. Name what it buys and what it costs; **the user decides — never silently escalate.**

**Why the split exists:** review of real reports showed most quality failures are output discipline (which costs nothing and is now mandatory everywhere), while the failures that discipline can't fix — unverified load-bearing numbers, questions aimed at the wrong decision — need verification and discovery, which cost real time. Standard stays fast; Deep buys calibration where the stakes justify it.

## Deep Path: Discovery

One short exchange before planning. Ask:

1. **What decision does this research feed?** What will be done differently depending on the answer? (If nothing would change, the research question needs rework.)
2. **Priorities and constraints** — cost, speed, maintenance burden, team skills, existing stack commitments.
3. **What's out of scope?** Deliberate exclusions prevent scope drift mid-research.
4. **What do you already believe?** Current hypotheses, prior attempts, options already ruled out — so the research can confirm/refute rather than rediscover, and so adversarial checks target the user's actual assumptions.

## Deep Path: Question Shaping

On the Deep path, the key questions — not the topic — are the artifact the user approves:

- **Priority-ordered:** if research time runs short, the top questions got the depth.
- **Disqualifiers first:** questions that could end the research early go on top ("does X even support our license model?" before "how nice is X's API?").
- **Traceable:** each question maps to the decision from discovery. A question that doesn't change the decision gets cut.
- **Premise included:** at least one question interrogates the framing itself — "is this the right scope/approach at all?" Discovery answers (#4 especially) tell you which premise to test.

Still one approval round-trip: present the shaped questions in the research plan; the user adjusts there.

## Research Types

Identify which type best matches the user's request. This determines strategy selection and output structure.

| Type | Signals in User Prompt | Core Question |
|------|----------------------|---------------|
| **Technology Evaluation** | "should we use," "compare," "X vs Y," "evaluate" | Which option is the best fit? |
| **Implementation Guide** | "how to," "integrate," "set up," "implement" | How do we build this? |
| **Landscape Survey** | "what options exist," "what libraries," "overview of" | What's out there? |
| **Architecture Decision** | "how should we design," "what pattern," "structure for" | What's the right design? |
| **Best Practices** | "best practices," "patterns," "how should we approach" | What's the right way to do this? |
| **Investigation** | "why is," "what's causing," "troubleshoot," "debug" | What's going on and how do we fix it? |

If the type isn't clear from the prompt, ask the user. Multiple types can overlap — pick the primary one and note secondary aspects in the research plan.

Technology Evaluation and Architecture Decision are **decision research**: recommendations.md with risk table + decision gates is required, and they are the usual candidates for suggesting the Deep path. Library/framework evaluations also get a Community Signal section (output-formats.md).

## Research Strategies

Select the strategy that best fits the research type. The user may also suggest a strategy in their prompt — follow their lead if they do.

### Funnel Strategy (Default)

**How it works:** Start broad to map the landscape, then progressively narrow into the areas that matter most.

**Flow:** Broad scan → Identify key areas → Deep dives on high-value findings → Synthesis

**Best for:** Implementation guides, landscape surveys, best practices — most research defaults to this.

**When to use:** When you need to understand the full picture before knowing where to focus depth.

### Adversarial Strategy

**How it works:** Research the case FOR and AGAINST separately, then arbitrate between them.

**Flow:** Bull case research → Bear case research → Compare evidence → Balanced assessment

**Best for:** Technology evaluations, "should we use X?" decisions, controversial or polarizing topics.

**When to use:** When the user needs to make a choice between options and wants an honest assessment of trade-offs, not a sales pitch for one option.

### Temporal Strategy

**How it works:** Research how something evolved over time to understand where it's heading.

**Flow:** Historical context → Current state → Emerging trends → Future trajectory

**Best for:** "State of X" research, understanding why something is the way it is, predicting where a technology or approach is heading.

**When to use:** When history and trajectory matter as much as current state — e.g., researching a framework that's undergone major version changes.

### Multi-Stakeholder Strategy

**How it works:** Research the topic from multiple distinct perspectives, then synthesize into a unified assessment.

**Flow:** Perspective A research → Perspective B research → Perspective C research → Unified synthesis

**Best for:** Architecture decisions with multiple concerns (performance, security, developer experience), organizational decisions, topics where different roles have different priorities.

**When to use:** When the right answer depends on who you ask — e.g., "how should we handle auth?" has different answers from a security, UX, and backend perspective.

### Strategy-Type Pairing Guide

| Research Type | Primary Strategy | Alternative |
|---------------|-----------------|-------------|
| Technology Evaluation | Adversarial | Funnel |
| Implementation Guide | Funnel | Temporal |
| Landscape Survey | Funnel | — |
| Architecture Decision | Multi-Stakeholder | Adversarial |
| Best Practices | Funnel | Temporal |
| Investigation | Funnel | — |

If unsure which strategy to use, ask the user. Present the options briefly and let them choose.

## Source Quality

Don't restrict research to specific source types. The best source depends on the topic:

- A mature framework will have excellent official docs — lean on them
- A brand-new library might only have blog posts and GitHub issues — that's fine
- A niche technique might live in academic papers or conference talks
- Community discussions (Stack Overflow, GitHub Discussions, forums) capture real-world experience that docs miss
- The user's own codebase is a first-class source — a claim grounded in a named file/symbol beats a general claim

**Cite as you go.** Capture the link at the moment you learn a fact. Point-of-claim citations (mandatory in output) are nearly free if collected during research and expensive to reconstruct afterward.

## Verification

### Both paths: baseline triangulation

- For findings that will influence decisions, try to confirm across independent sources
- A single-source finding is acceptable — but it must be flagged (confidence note in output)
- Don't over-research well-established facts just to hit a source count
- Decision-bearing **numbers** get special handling: cite a measurement, run/request one, or tag `(estimated, not measured)`. Never let an extrapolation dress as a benchmark.

### Deep path: the claim verification protocol

At the transition from research to synthesis, identify the **load-bearing claims**: the 3–6 statements where, if the claim is false, the verdict flips. (If you find more than 6, the research question is too broad — tell the user which sub-questions are competing rather than verifying everything shallowly.) Then, per claim:

1. **Primary source.** Trace the claim to where it originates — the changelog, the benchmark, the maintainer's statement — not a blog that repeats it.
2. **Independence test.** Find a second source that is *causally independent*: it doesn't cite, quote, or derive from the first. Ideally a different kind of evidence entirely (docs + issue tracker; benchmark + user report; changelog + your own repro in the user's repo). Three blogs citing the same benchmark are one source wearing three hats.
3. **Adversarial search.** Run one search phrased to kill the claim: "X slow", "X broken", "X problems", "X vs [counter-benchmark]". Finding nothing strengthens the claim; finding something gets documented, not discarded.
4. **Recency gate.** Stamp the version/date the evidence applies to. For fast-moving claims (library capabilities, pricing, performance), a source older than the subject's last major release downgrades the verdict.

**Verdicts** (exactly this vocabulary — the output layer styles it):

| Verdict | Meaning |
|---|---|
| `Confirmed` | Primary source + independent second source, current |
| `Single-source` | One origin only; no independent confirmation found |
| `Contested` | Credible sources disagree; both cited, tiebreaker named |
| `Estimated` | Number is extrapolated/inferred, not measured |
| `Unverified` | Could not trace to a primary source at all |

Record the outcomes in the Claim Ledger table in findings.md (format in output-formats.md). The index answer block cites the verdicts. Cost is bounded: ~2–4 extra searches per claim; everything below the load-bearing line stays cite-as-you-go.

### Conflicting Sources

When sources disagree:
1. Document both perspectives — don't silently pick a winner
2. Offer your analysis of which seems more credible and why (recency, authority, specificity)
3. **Name the tiebreaker** you applied ("freshness outweighs stars here because...")
4. Cite both sources inline with links so the user can evaluate the competing claims directly

> **Conflicting information:** [Source A (date)](url) states X, while [Source B (date)](url) describes Y. Source A appears more current and references the latest version, but verify against your specific version.

### What NOT to Do

- Don't dismiss sources just because they're blog posts or forum answers
- Don't manufacture consensus by ignoring the dissenting source
- Don't over-fetch sources trying to reach a magic number — quality over quantity
- Don't chase down every tangential reference — stay focused on the key questions
- Don't let citation volume on safe claims (API existence, version numbers) stand in for verification of the load-bearing ones

## Premise Questioning

The most expensive research failure observed in practice is scope blindness: rigorous answers to tactical questions while the question that mattered — "is this even the right scope?" — appears nowhere, until a follow-up overturns the work days later.

- **Both paths:** Open Questions must include ≥1 premise-level question ("what would make this the wrong product/scope/approach entirely?").
- **Deep path:** interrogate the premise up front — discovery question #4 (what the user already believes) tells you which assumption to stress-test, and the disqualifier questions test it early.
- If mid-research evidence suggests the premise is wrong, that's circuit-breaker condition 1 — stop and ask.

## Circuit Breaker

During research execution, work to completion without interrupting the user. Contradictions, diverse viewpoints, unexpected complexity, and interesting tangents should all be documented in the output, not used as reasons to stop.

**Stop and ask the user only under these two conditions:**

1. **The research premise is wrong.** The broad scan reveals that the user's question is based on a misunderstanding, the technology doesn't exist, or the approach they're asking about is fundamentally not viable. Example: User asks to research "integrating Library X with Framework Y" but Library X was abandoned and replaced by Library Z two years ago.

2. **A discovery changes everything.** During deep dives, you find something so impactful that it would change the entire direction of the research. Example: User asks to research self-hosting solution options, and you discover their cloud provider just launched a managed service that eliminates the need entirely.

**Timing:**
- The natural checkpoint is after the broad scan, before deep dives begin. One pause maximum at this point.
- The second condition is an emergency brake during deep dives — no scheduled check, just permission to interrupt if genuinely warranted.
- **Goal: 0 interruptions in most research runs, 1-2 maximum in exceptional cases.**

## Parallel Research

Use parallel WebSearch and WebFetch calls where it makes sense for efficiency:

- **Good for parallel:** Independent questions that don't depend on each other (e.g., searching for library docs AND community blog posts simultaneously). The adversarial searches for different ledger claims are independent — run them in parallel.
- **Bad for parallel:** Queries where the next search depends on what you find first (e.g., identifying the right library THEN reading its docs)
- Don't over-fetch without knowing what's needed next — parallel calls work best for the broad scan phase, less so for progressive deep dives

## Deep-Dive Follow-Up Detection

### How to Detect

- **Strong signal (deep dive):** User provides a file or directory path to existing research in `_claude/research/`. This is the key identifier. Load the existing research context.
- **Weak signal (new research):** User uses phrases like "deep dive" or "go further into" without referencing an existing research path. Treat as new research with thorough depth.
- **Combined signal (deep dive):** User references an existing research path AND uses follow-up language. This is a deep-dive follow-up.

Language alone ("deep dive," "go deeper") is NOT sufficient to trigger deep-dive mode. The file/directory reference must exist.

### Deep-Dive Planning

When a deep dive is detected:
1. Read the existing research (index.md and findings.md at minimum) to understand what's already covered
2. Identify gaps, shallow areas, or specific aspects the user wants to explore further
3. Present the deep-dive plan showing existing coverage and what new ground will be covered
4. Deep dives can be just as comprehensive as original research — don't artificially limit scope

### Reconciliation (mandatory)

A deep dive is not done until it is reconciled with its parent: if any conclusion of the parent is overturned or weakened, apply the supersession rule (output-formats.md) — patch or mark the parent's claims where readers encounter them, and regenerate the affected parent `.html` pages. A deep dive that silently contradicts its parent leaves the report set lying to readers.
