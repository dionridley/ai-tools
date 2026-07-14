# Research: Pi.dev Agent Harness Capability Audit

**Date:** 2026-07-06
**Research Question:** What does the Pi coding agent (pi.dev, badlogic/pi-mono) actually support — skills, arguments, tools, subagents, AGENTS.md, frontmatter, packaging — so every capability-conditional wording decision in the skill-portability plan rests on evidence?

> **Answer: Pi supports the portability plan as designed — it implements the Agent Skills spec (leniently), natively honors `disable-model-invocation`, reads AGENTS.md, silently ignores unknown frontmatter, and offers a first-class package manifest that makes the dual-manifest shared-artifact repo buildable today.** Confidence: High.
> **Exceptions:** everything beyond the seven built-in tools (`read, bash, edit, write, grep, find, ls`) — web access, subagents, task lists, structured questions — is absent from core *by design* and arrives only via third-party packages, so conditional prose must treat those as optional even on Pi; and `allowed-tools` is not enforced, so dr-ship's safety model must live entirely in prose.
> **Verification (Deep path):** rests on claims 1–6, all Confirmed — see the [Claim Ledger](./findings.md#claim-ledger).

## Scope

Documentation- and source-level audit of Pi's capabilities (main-branch docs + `skills.ts` source, v0.80.3 era, 2026-07-06). Deliberately excluded: hands-on installation/testing (that's portability Phase 8), other harnesses individually (the Agent Skills spec is the contract), and Stage 3 restructure design itself (this research feeds it).

## Key Takeaways

1. **The `$ARGUMENTS` phrasing planned in the portability plan is exactly right** — Pi does no substitution in skills; `/skill:name args` arrive appended as a user message, so "provided as `$ARGUMENTS` or in the invoking message" describes both harnesses accurately.
2. **dr-ship's Phase 2 prose audit is load-bearing, not redundant** — Pi parses `allowed-tools` into a catch-all and enforces nothing, so every safety rule that isn't a sentence doesn't exist on Pi.
3. **Your dual-manifest vision is natively supported** — a `pi` key in `package.json` maps glob paths to skills/extensions/prompts/themes, coexisting with `.claude-plugin/marketplace.json` over the same directories; `pi install git:github.com/dionridley/ai-tools` would work with zero registry setup, therefore Stage 3 needs no Pi-side invention.
4. **Subagents/web/tasks/questions are package-land on Pi** — thriving but fragmented (7+ subagent packages, none official), therefore mvp should state "requires a subagent-capable harness" with a sequential fallback rather than couple to any package's conventions before Phase 8 testing.
5. **Pi moves fast (patches every 1–3 days)** — therefore re-verify the six ledger claims when Phase 8 starts; all findings are date-stamped.

## Research Files

- **[Findings](./findings.md)** — claim ledger + per-question analysis: skills, arguments, tools, questions, subagents, tasks, AGENTS.md, frontmatter, packaging, premise check
- **[Capability Matrix](./capability-matrix.md)** — the appendable artifact: 22 capabilities × status × evidence × portability impact
- **[Recommendations](./recommendations.md)** — actions per portability-plan phase, the mvp decision, the Stage 3 layout sketch, risk gates
- **[Resources](./resources.md)** — annotated bibliography (docs, source, ecosystem, community)

## Deep Dives

- **[One Repo, Many Bundles — Pi Packaging Options](./deep-dives/one-repo-many-bundles-2026-07-06/index.md)** — 2026-07-06 — Packaging-granularity follow-up: how one repo serves selectable plugin-like bundles on Pi (install anatomy source-verified, settings-filter selection, the official workspaces monorepo pattern, npm-publishing and meta-package options, scored against the one-repo constraint)
