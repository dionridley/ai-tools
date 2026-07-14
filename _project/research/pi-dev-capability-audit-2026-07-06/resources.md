# Research Resources: Pi.dev Capability Audit

**Date:** 2026-07-06

[← Back to Index](./index.md)

## Documentation (primary sources)

- [Pi docs — index/usage](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) — built-in tools list, context-file loading (AGENTS.md/CLAUDE.md), design exclusions ("intentionally does not include built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash")
- [Pi docs — skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) — SKILL.md format, skill locations, discovery/invocation, argument appending, unknown-frontmatter handling, spec leniency note
- [Pi docs — packages.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) — the `pi` manifest key in package.json, auto-discovery conventions, install sources, `pi config`
- [Pi docs — extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — full TypeScript extension API: registerTool/registerCommand, events, `ctx.ui.*` dialogs, loading paths, headless modes
- [Pi docs — prompt-templates.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/prompt-templates.md) — template locations, frontmatter, bash-style argument substitution (`$ARGUMENTS`, `$1`, `${1:-default}`)
- [Agent Skills specification](https://agentskills.io/specification) — frontmatter fields, file-reference rules, progressive disclosure, validation (`skills-ref validate`)
- [Agent Skills — Client Showcase](https://agentskills.io/clients) — official adoption list; pi's entry with links to its skills docs

## Source Code (verification)

- [skills.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts) — `SkillFrontmatter` interface (name/description/disable-model-invocation + `[key: string]: unknown` catch-all), XML system-prompt listing, validation warnings
- [pi-mono src/core directory](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/src/core) — located skills.ts, prompt-templates.ts, resource-loader.ts, package-manager.ts
- [coding-agent README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) — design stance quotes ("No sub-agents…", "No background bash. Use tmux."), slash commands, session model

## Repositories & Registry

- [badlogic/pi-mono](https://github.com/badlogic/pi-mono) — the monorepo (pi-ai, pi-agent-core, pi-coding-agent, pi-tui); npm scope `@earendil-works`
- [npm registry — @earendil-works/pi-coding-agent](https://registry.npmjs.org/@earendil-works/pi-coding-agent) — version 0.80.3 latest; 1–3 day patch cadence (June–July 2026)
- [pi.dev](https://pi.dev) — official site; skills/extensions/packages overview, subagent stance
- [pi.dev/packages](https://pi.dev/packages) — package browser (npm keyword `pi-package`); download counts cited in findings

## Ecosystem Packages (existence proofs & conventions)

- [nicobailon/pi-web-access](https://github.com/nicobailon/pi-web-access) — web search/fetch package, ~128K downloads/mo, keyless default provider
- [code-yeongyu/pi-webfetch](https://github.com/code-yeongyu/pi-webfetch), [code-yeongyu/pi-websearch](https://github.com/code-yeongyu/pi-websearch), [edlsh/pi-web-tools](https://github.com/edlsh/pi-web-tools), [shantanugoel/pi-web-utils](https://github.com/shantanugoel/pi-web-utils), [georgebashi/pi-web-fetch](https://github.com/georgebashi/pi-web-fetch), [@ollama/pi-web-search](https://www.npmjs.com/package/@ollama/pi-web-search) — the crowded web-tools category
- [nicobailon/pi-subagents](https://github.com/nicobailon/pi-subagents) — leading subagent package (~103K/mo); async delegation, artifacts, session sharing
- [tintinweb/pi-subagents](https://github.com/tintinweb/pi-subagents) — "Claude Code look and feel" subagents; custom agent types, parallel execution
- [mjakl/pi-subagent](https://github.com/mjakl/pi-subagent), [AlexParamonov/pi-subagents-lite](https://github.com/AlexParamonov/pi-subagents-lite), [gdanov/pi-subagents-eff](https://github.com/gdanov/pi-subagents-eff/blob/main/README.md) — further subagent variants (fragmentation evidence)
- [PizzaPi — subagents docs](https://pizzaface.github.io/PizzaPi/customization/subagents/) — documents `agents/*.md` frontmatter convention (`name`, `description`, `tools`, `model`, `thinking`)
- @juicesharp/rpiv-ask-user-question, @juicesharp/rpiv-web-tools, @mjasnikovs/pi-task, pi-soly, @narumitw/pi-goal, pi-crew, @quintinshaw/pi-dynamic-workflows, bigpowers — seen in the [pi.dev package browser](https://pi.dev/packages) with descriptions and download counts

## Articles & Community

- [Setting Up and Using the Pi Coding Agent — DeepakNess](https://deepakness.com/blog/pi-agent-setup/) — third-party setup walkthrough (corroborates install flow)

## Related Documents

- [Index](./index.md) — research overview
- [Findings](./findings.md) — core research findings
- [Capability Matrix](./capability-matrix.md) — the appendable artifact
- [Recommendations](./recommendations.md) — actions per plan phase
