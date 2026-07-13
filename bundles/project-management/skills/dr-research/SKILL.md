---
name: dr-research
description: Conducts structured research on a topic with web search — a Standard path for speed, a Deep path that adds discovery and claim verification. Use when the user asks to research a topic, investigate a technology, compare approaches, or gather information for a decision. Produces canonical markdown plus a portable HTML microsite in _project/research/.
compatibility: Requires web search and fetch tools (built into Claude Code; other harnesses need a web-access package installed).
disable-model-invocation: true
allowed-tools: WebSearch, WebFetch, Read, Write, Glob, Bash(cp:*), Bash(mkdir:*)
effort: max
argument-hint: [research prompt — reference an existing research path for a deep dive; ask for "deep research" to get the verified path]
---

# Deep Research

Conduct research on a topic and produce structured, high-quality documentation: canonical markdown plus a portable HTML microsite view.

**Requires web access.** The research loop depends on web search and page fetching (`WebSearch`/`WebFetch` in Claude Code). If the harness provides no web tools, stop and tell the user this skill cannot run without them — name a remedy if one is known (Pi: `pi install npm:pi-web-access`) — rather than answering from memory.

## Phase 1: Understand & Plan

### Get the research prompt

Use `$ARGUMENTS` (the user's arguments — substituted here by Claude Code; on harnesses without substitution they arrive in the invoking message) as the research prompt. If the prompt is empty, ask the user interactively:

> What topic would you like me to research? Please provide as much detail as possible:
> - Core questions you want answered
> - Specific aspects to focus on
> - Context for why this research matters
> - Any constraints or requirements

### Detect deep-dive vs new research

Check whether the user is referencing existing research for a follow-up:

- **File/directory path provided** pointing to an existing `_project/research/` directory → this is a **deep-dive follow-up**. Verify the path exists with Glob, then read the existing `index.md` and `findings.md` to understand prior coverage.
- **No file reference** → this is **new research**, regardless of whether the user uses phrases like "deep dive" or "go deeper." Those phrases describe desired depth, not a follow-up.
- A file reference that exists in `_project/research/` is the key identifier. Language alone is not sufficient to trigger deep-dive mode.

### Choose the path: Standard or Deep

Both paths share the same output discipline (Phase 3). Deep adds the expensive work: discovery, collaborative question shaping, and claim verification.

- **Deep when the user asks for it** — "deep", "thorough", "verify this", "I need to be sure."
- **Suggest Deep when the ask is decision-critical** and the user didn't request it: architecture or library selection, buy-vs-build, migrations, security-sensitive choices, anything costly to reverse. Name what Deep buys ("the 3–6 claims the verdict rests on get independently verified, and we shape the questions together first") and its cost (one extra exchange up front, a handful of extra searches). **The user decides — never silently escalate.**
- **Otherwise run Standard.** It is the default and requires no extra input.

### Deep path only: discovery before planning

Ask the user (one exchange, keep it short):

1. **What decision does this research feed?** What happens differently depending on the answer?
2. **Priorities and constraints** — what matters most (cost, speed, maintenance, team skills…)?
3. **What's out of scope?** What should this research deliberately not cover?
4. **What do you already believe?** Current hypotheses, prior attempts, options already ruled out.

Use the answers to shape the research questions. On the Deep path, **the key questions are the negotiable artifact**: priority-ordered, with disqualifying questions first (the ones that could end the research early — "does X even support Y?"), each traceable to the decision it serves. The user approves questions, not just topics.

### Plan the research

Read `references/research-methodology.md` for research types, strategies, path details, and verification mechanics. (File paths in this skill are relative to the skill's directory, which the harness announces when the skill loads — resolve them against it, not the shell working directory.)

1. Identify the **research type** from the user's prompt
2. Select the appropriate **research strategy** (funnel, adversarial, temporal, multi-stakeholder). If not clear, ask the user. If the user suggests a strategy in their prompt, follow their lead.
3. Determine the **output files** — default is `index.md` + `findings.md` + `resources.md`, plus `recommendations.md` only for decision research. Propose a topic-specific file only when it will carry a **standalone artifact** (scored comparison matrix, schema/DDL, runnable setup guide) or the user explicitly asked for one.

### Present the plan and wait for approval

**For new research:**

```
## Research Plan: [Topic]  ([Standard|Deep] path)

**Research Type:** [Type]

**Context:** [Reflect back the user's situation — what they're trying
to accomplish and why, so they can correct any misunderstandings]

**Key Questions:**  [Deep: priority-ordered, disqualifiers first]
1. [Question]
2. [Question]
3. [Question]

**Research Strategy:** [Strategy name] — [Brief explanation of approach]

**Sources to Consult:**
- [Source category 1]
- [Source category 2]

**Planned Output:**
- `index.md` — direct answer, key takeaways, navigation
- `findings.md` — [what the analysis will cover]
- `resources.md` — bibliography of all sources consulted
- `recommendations.md` — [only for decision research]
- `[artifact].md` — [only if a standalone artifact is warranted — say which]
- Each file also gets a portable `.html` view (offline microsite, generated automatically)

[Deep only:]
**Verification:** the load-bearing claims (the ones the verdict rests on)
will be triangulated and get per-claim verdicts in a claim ledger.

Does this plan align with what you're looking for?
Would you like to adjust the focus, add questions, or change the output structure?
```

**For deep-dive follow-ups:**

```
## Deep Dive Plan: [Topic]  ([Standard|Deep] path)

**Parent Research:** [Title] ([date])
**Location:** [path to parent research directory]

**Existing Coverage:**
- [file.md] covers [summary of what's already there]
- Gap identified: [what the existing research flagged as unknown or shallow]

**Deep Dive Questions:**
1. [Question building on existing research]
2. [Question exploring the gap]

**Planned Output:**
- `deep-dives/[slug]-[date]/index.md`, `findings.md`, `resources.md`
- Plus `.html` views (shares the parent report's assets)

Shall I proceed, or would you like to adjust the focus?
```

**Wait for the user to approve or adjust before proceeding.**

## Phase 2: Research Execution

Execute the approved research plan.

### Research approach

- Follow the selected strategy pattern (funnel, adversarial, temporal, multi-stakeholder)
- Use **parallel WebSearch/WebFetch calls** for independent questions to improve efficiency. Don't over-fetch — parallel calls work best during the broad scan phase. Use sequential calls when later queries depend on earlier findings.
- **Progressive depth** — go deeper on findings central to the user's key questions. Stay surface-level on peripheral context.
- **Cite as you go** — capture the source link at the moment you learn a fact, so point-of-claim citations (Phase 3) are cheap.
- **Ground in the user's codebase where applicable** — claims tied to named files/symbols in the user's own repo are the most actionable findings.

### Conflicting sources

When sources disagree: document both perspectives, analyze which seems more credible and why, and cite both inline with links so the user can evaluate. Name the tiebreaker you applied. See `references/research-methodology.md` for the detailed approach.

### Deep path only: verify the load-bearing claims

Before synthesis, identify the **3–6 claims the verdict rests on** — the ones where, if the claim is false, the recommendation flips. (More than 6 means the research question is too broad: surface that to the user rather than verifying everything.) For each claim run the verification protocol from research-methodology.md:

1. **Primary source** — trace to where the fact originates, not a blog that repeats it
2. **Independence test** — a second source that is causally independent (not citing the same origin), ideally a different kind of evidence
3. **Adversarial search** — one search phrased to kill the claim ("X is slow", "X broken", "X vs benchmark")
4. **Recency gate** — stamp version/date on fast-moving claims; a stale source downgrades the verdict

Record the outcome per claim: **Confirmed / Single-source / Contested / Estimated / Unverified**. These verdicts feed the claim ledger table in findings.md and the answer block in index.md.

For **library/framework evaluations**, also gather community signal (maintenance cadence, license, issue tracker health, bus factor) — it becomes a standard findings section; metrics live there once and comparisons reference them.

### Circuit breaker (use sparingly)

Work to completion without interrupting the user in most cases. Contradictions, diverse viewpoints, and unexpected complexity should be documented, not used as reasons to stop.

**Stop and ask the user only if:**
1. The research premise is wrong — the technology doesn't exist, the approach isn't viable, or the question is based on a misunderstanding
2. Something truly impactful emerges that changes the entire direction of the research

Maximum 1-2 interruptions in exceptional cases. Zero in most research runs. The natural checkpoint, if needed, is after the broad scan before deep dives begin.

## Phase 3: Synthesis & Output

Read `references/output-formats.md` for file contents, quality standards, and formats (answer block, claim ledger table, gaps section). For annotated examples, see `examples/exemplar-index.md` and `examples/exemplar-findings.md`.

### Output discipline — mandatory on BOTH paths

These are structural requirements, not suggestions:

1. **Direct answer block first.** index.md opens with the answer: bolded verdict sentence, a confidence word, and the exceptions that flip it. On the Deep path it also cites the ledger verdicts ("rests on claims 1–2 Confirmed, claim 3 Single-source").
2. **Citation at point-of-claim.** Every decision-bearing fact gets an inline link where it is asserted. resources.md is the bibliography, never the only claim→source map.
3. **Measured vs estimated.** A decision-bearing number carries a citation/measurement or an explicit `(estimated, not measured)` tag. Never present an estimate as a measurement.
4. **Gaps & Limitations is mandatory** in findings.md: what was not verified, not prototyped, or not covered — and what that means for the conclusions.
5. **Confidence flags on load-bearing claims** (High/Medium/Low with one-line reasons).
6. **≥1 premise-level open question.** Open Questions must include at least one question that challenges the premise ("what would make this the wrong scope/product/approach entirely?"), not only tactical follow-ups.
7. **Adjective discipline.** No certainty language ("clearly", "killer feature", "near-zero risk") on claims the report itself flags as unverified. The answer block carries its exceptions.
8. **Supersession rule.** When later work (a spike, a deep dive) overturns an earlier conclusion, patch the claim where readers encounter it — or mark it "superseded by [link]" — not just in the index.
9. **Verdict stated at most twice**: the index answer block and recommendations.md. findings.md presents the evidence, not the verdict again.
10. **Decision research includes a risk table, decision gates, and testable exit criteria** ("if X still stutters with batching → switch to Y").

### File defaults

- **Default set:** `index.md` + `findings.md` + `resources.md`, plus `recommendations.md` for decision research.
- **Topic files** only when they carry a standalone artifact or were explicitly requested. findings.md must NOT become a summary of topic files; each claim lives in exactly one place, and other files link to it.
- **Backstop:** if de-duplicated findings would exceed ~1,500 lines, propose a split to the user instead of silently producing a monster or fragments.

### Diagrams

Apply the rubric from `references/diagrams.md` — default is **no diagram**:

- A diagram **EARNS** its place when it shows structure prose serializes poorly: data flow, interaction sequence, topology, process isolation — best of all, drawn against the user's actual system.
- It is **DECORATION** when it re-linearizes the report's own argument. Table-of-contents mindmaps are banned; the index gets no concept map by default.
- It is **HARMFUL** when it fabricates precision. Speculative Gantt charts for unstarted work are banned.

Dual representation: the `.md` carries a ```mermaid fence (or prose when the visual can't be expressed in Mermaid); the HTML page shows rendered Mermaid or a hand-authored inline SVG — choose per diagram whichever is clearer. Conventions for both are in diagrams.md.

### Claim ledger (Deep path only)

findings.md includes a **Claim Ledger** table near the top — one row per load-bearing claim: the claim, its verdict (Confirmed / Single-source / Contested / Estimated / Unverified), and the evidence links. Format in output-formats.md. The index answer block references these verdicts.

### Determine the output path

The Write tool creates parent directories automatically — decide the target path and write files to it.

- **New research:** `_project/research/[slug]-[date]/`
  - Create the slug from the topic: lowercase, hyphens for spaces, remove special characters
  - Use the current date from the conversation context (YYYY-MM-DD)
  - Use Glob to check whether `_project/research/` already exists. If it doesn't, inform the user they can run `/dr-init` for full project setup, but proceed — the first Write will create it.
  - If `_claude/research/` exists and `_project/` does not, the project predates the 3.0.0 directory rename — tell the user and suggest `/dr-init` (which offers the `git mv _claude _project` migration), then write to the old `_claude/` paths for this run.
- **Deep dive:** `_project/research/[parent-slug]-[date]/deep-dives/[deep-dive-slug]-[date]/`

### Write the files

Write clean canonical markdown — plain GFM tables, ```mermaid fences, `>` blockquotes for callouts, links to sibling `.md` files. The HTML layer adds all presentation; raw HTML inside markdown is reserved for hand-authored SVG figures only (see diagrams.md).

1. **findings.md** — Core analysis, organized by topic. Claim ledger table near the top (Deep). Gaps & Limitations and Open Questions sections are mandatory.
2. **Topic/artifact files** — Only if proposed in the plan and approved. Name descriptively (e.g., `comparison.md`, `schema.md`, `setup-guide.md`).
3. **resources.md** — Bibliography of all sources consulted, minimal grouping, every entry annotated.
4. **recommendations.md** — Decision research only: recommendation, risk table, decision gates, exit criteria.
5. **index.md** — Written last so it reflects everything produced. Answer block first, then key takeaways ("X, therefore Y" — not restated facts), then file navigation.

### Deep-dive additions

When this is a deep-dive follow-up:
- Write all output files into the `deep-dives/[slug]-[date]/` subdirectory
- The deep-dive `index.md` must link back to the parent research: `[← Back to [Parent Title]](../../index.md)`
- All deep-dive files should include a link to the parent research in their Related Documents section
- Update the parent research's `index.md` — add or update a "Deep Dives" section linking to the deep dive's `index.md` file (not the directory), with date and brief description
- **Apply the supersession rule:** if the deep dive overturns any parent conclusion, patch the parent's affected claims (or mark them "superseded by [link to deep dive]") in the files where readers encounter them — then regenerate the HTML for every parent page you touched

## Phase 3.5: Generate the HTML microsite

Every `.md` page gets a portable `.html` sibling. The report folder carries its own frozen copy of the assets, so it keeps working (offline, over `file://`) no matter how the template evolves later.

### Copy the assets (new research only)

Copy the template assets into the report root using Bash with **absolute paths**. `<skill-dir>` below is this skill's root directory — substitute its absolute path (announced by the harness when the skill loads) before running; a bare relative path would resolve against the shell's working directory, not the skill:

```bash
mkdir -p "<report-dir>/assets/vendor"
cp -r "<skill-dir>/assets/template/fonts" "<report-dir>/assets/"
cp "<skill-dir>/assets/template/styles.css" \
   "<skill-dir>/assets/template/render.js" \
   "<skill-dir>/assets/template/theme.js" "<report-dir>/assets/"
cp "<skill-dir>/assets/template/vendor/marked.min.js" \
   "<skill-dir>/assets/template/vendor/highlight.min.js" "<report-dir>/assets/vendor/"
```

**mermaid.min.js is large (~2.5 MB) — copy it only if at least one page in the report renders a Mermaid diagram:**

```bash
cp "<skill-dir>/assets/template/vendor/mermaid.min.js" "<report-dir>/assets/vendor/"
```

Deep-dives do **not** get their own assets — their pages reference the parent's via `../../assets`. If the deep dive introduces the report's first Mermaid diagram, copy `mermaid.min.js` into the **parent's** `assets/vendor/`. If the parent predates the HTML format (no `assets/` folder), copy the full assets to the parent root and generate `.html` for the parent's pages too — additive only; the parent's markdown content doesn't change beyond the standard index update.

### Generate each page

For every `.md` file in the report: Read `templates/page-template.html` once, then for each page replace the placeholders and Write the result next to the `.md` (same name, `.html` extension):

| Placeholder | Value |
|---|---|
| `{{TITLE}}` | index → `[Topic]`; others → `[Page] — [Topic]` |
| `{{ASSETS}}` | `assets` for report-root pages; `../../assets` for deep-dive pages |
| `{{FOOTER}}` | `Generated [YYYY-MM-DD] · dr-research · canonical source: [file].md` |
| `{{MERMAID_SCRIPT}}` | `<script src="[assets-path]/vendor/mermaid.min.js"></script>` if this page's markdown contains a ```mermaid fence; empty string otherwise |
| `{{CONTENT_MARKDOWN}}` | the page's full markdown, verbatim |

Notes:
- The markdown is embedded inert in a `<script type="text/markdown">` block and rendered client-side; if the content ever contains a literal `</script`, escape it as `<\/script`.
- Keep `.md` links in the markdown — the renderer rewrites relative `.md` hrefs to `.html` in the browser.
- **Whenever you edit any `.md` after generation (including parent-index updates from a deep dive), regenerate its `.html`.** An HTML page must never be staler than its markdown.

## Phase 4: Summary

After all files are written, present a summary to the user in the conversation.

### Completion summary

```
Research completed: [Topic]  ([Standard|Deep] path)

Created: _project/research/[slug]-[date]/
  - index.md (answer + navigation)
  - findings.md ([brief description of what's covered])
  - [additional files with descriptions]
  - resources.md (bibliography — N sources)
  - HTML microsite: open index.html in a browser
    (width + palette + light/dark controls in the top bar; works offline)

Answer: [the one-sentence verdict with its confidence word]

Key Findings:
  - [Finding 1 — the most important insight]
  - [Finding 2]
  - [Finding 3]

What surprised me:
  - [An unexpected or particularly impactful finding the user
    might not have anticipated]
```

On the Deep path, also show the ledger outcome: `Claims: N Confirmed, N Single-source, N Contested/Unverified`.

### Deep-dive suggestions

If the research genuinely uncovered areas worth further investigation, suggest specific topics:

```
Areas worth deeper investigation:
  - [Topic] — [Why it's worth exploring further]
  - [Topic] — [What the research found that warrants a follow-up]
```

Only include when there are real gaps or promising threads. Don't manufacture suggestions.

### Follow-up actions

Suggest the most appropriate next steps for this specific research (pick 1-3):
- Deep dive: "Investigate further with `/dr-research [aspect] [path to this research]`"
- Decision: "This research supports a decision — consider documenting it as an ADR"
- PRD: "Ready to define the product? `/dr-prd [topic]`"
- Plan: "Ready to implement? `/dr-plan [topic]`"

Tailor to the research type and findings — don't always suggest the same actions.

### Deep-dive summary additions

When this was a deep-dive follow-up, also include:
- The parent research title and confirmation that its index.md was updated (and its index.html regenerated)
- Any parent claims that were patched or marked superseded
- Focus on what this deep dive specifically contributes — don't rehash the parent research
