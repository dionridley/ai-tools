# Pi.dev Capability Matrix

**Date:** 2026-07-06 — stamped against `@earendil-works/pi-coding-agent` 0.80.3 / main-branch docs. Pi ships patches every 1–3 days; re-verify load-bearing rows at Phase 8.

[← Back to Index](./index.md)

This table is formatted to be appended to `.research/skill-portability-plan.md` as the Phase 0 output. Status vocabulary: **Supported** (core), **Via package** (absent in core, available as installable package), **Partial**, **Absent**.

## Capability Matrix

| Capability | Pi status | Evidence | Portability impact |
|---|---|---|---|
| Agent Skills spec (SKILL.md discovery) | Supported — lenient superset (allows name ≠ dir name) | [docs/skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md); [agentskills.io clients](https://agentskills.io/clients) | Skills work as-is once paths are relative (Phase 1) |
| Skill auto-discovery by description | Supported — name/description/path injected into system prompt; model `read`s SKILL.md on match | [skills.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts) | Description quality matters on Pi exactly as on Claude Code |
| Explicit skill invocation | Supported — `/skill:name args` (not `/name`) | [docs/skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) | Trigger-gate prose: keep the `/dr-plan` token convention but don't assume it's the invocation mechanism; a Pi prompt template can restore `/dr-plan` UX |
| `disable-model-invocation` frontmatter | Supported natively — hidden from model, explicit-only | [skills.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts) | dr-init/dr-research/dr-ship explicit-only behavior survives on Pi |
| `$ARGUMENTS` substitution in skills | Absent — args appended after skill content as `User: <args>` | [docs/skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) | Use "provided as `$ARGUMENTS` or in the invoking message" phrasing (Phase 2/B) |
| `$ARGUMENTS` in prompt templates | Supported — `$1`, `$@`, `$ARGUMENTS`, `${1:-default}` | [docs/prompt-templates.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/prompt-templates.md) | Optional: ship thin templates for `/dr-plan`-style UX on Pi |
| Unknown frontmatter fields | Supported — silently ignored, no warnings | [skills.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts) | Keep `effort`, `argument-hint`; they're inert on Pi |
| `allowed-tools` enforcement | Absent — parsed into catch-all, not enforced | [skills.ts](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts) | dr-ship safety rules MUST live in prose (Phase 2 audit is load-bearing) |
| bash / read / write / edit | Supported — plus `grep`, `find`, `ls`; that's the complete built-in list | [docs/index.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) | All file/shell mechanics in our skills work |
| Web search / web fetch | Via package — e.g. `pi install npm:pi-web-access` (~128K/mo); many alternatives | [pi-web-access](https://github.com/nicobailon/pi-web-access); [pi.dev/packages](https://pi.dev/packages) | dr-research declares the requirement up front and names a remedy |
| Structured question tool (AskUserQuestion equiv.) | Via package — [@juicesharp/rpiv-ask-user-question](https://pi.dev/packages); extension API `ctx.ui.select/confirm/input` exists | [docs/extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Conditional phrasing: structured tool if available, else plain-text question (all ~25 sites) |
| Subagent spawning | Via package — excluded from core by design; ≥7 competing packages, several using Claude-style `agents/*.md` | [README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md); [nicobailon/pi-subagents](https://github.com/nicobailon/pi-subagents), [tintinweb/pi-subagents](https://github.com/tintinweb/pi-subagents) | plan-verifier spawn needs inline fallback (common case on stock Pi); mvp: see recommendations |
| Background processes / PID mgmt | Absent — "No background bash. Use tmux." | [README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) | mvp's PID/background patterns need conditional rewording (tmux or sequential) |
| Task-list tooling (TaskCreate/Update equiv.) | Via package — [@mjasnikovs/pi-task](https://pi.dev/packages), [pi-soly](https://pi.dev/packages); no standard | [docs/index.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) design exclusions | mvp: `.mvp/state.json` stays canonical; harness tasks framed as optional mirror ✓ |
| Worktree isolation | Partial/unknown — only [pi-crew](https://pi.dev/packages) mentions worktrees; not investigated | [pi.dev/packages](https://pi.dev/packages) | mvp Phase 6: treat as unavailable; partition files or run sequential |
| AGENTS.md project context | Supported — loads `AGENTS.md` or `CLAUDE.md` from global + parent dirs + cwd, concatenated | [docs/index.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) | dr-init AGENTS.md-canonical decision validated; test both-files precedence in Phase 8 |
| Skill locations | Supported — `~/.pi/agent/skills/`, `~/.agents/skills/`, `.pi/skills/`, `.agents/skills/`, packages, `--skill` | [docs/skills.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) | `.agents/skills/` is a harness-neutral install target |
| Packaging / bundling manifest | Supported — `package.json` `pi` key: `{extensions, skills, prompts, themes}` glob arrays; auto-discovery conventions without manifest | [docs/packages.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) | One repo = Claude marketplace + Pi package simultaneously (Stage 3) |
| Package install / distribution | Supported — `pi install npm:… / git:… / local path`; `pi config` per-resource enable/disable; browser at [pi.dev/packages](https://pi.dev/packages) | [docs/packages.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) | `pi install git:github.com/dionridley/ai-tools` works with zero registry setup |
| Agent definitions as artifact type | Absent in core — subagent packages read `.pi/agents/*.md` with Claude-like frontmatter (`name`, `description`, `tools`, `model`) | [pi-subagents ecosystem](https://github.com/nicobailon/pi-subagents) | `agents/` folder stays in the shared taxonomy; Pi mapping goes through whichever subagent package is targeted |
| MCP | Absent in core (by design); via extensions/packages | [docs/index.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) | Not load-bearing for our skills |
| Permission prompts / plan mode | Absent in core (by design) | [docs/index.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/index.md) | Reinforces prose-level safety for dr-ship |
| Headless modes | Supported — `tui`, `rpc`, `json`, `print`; extensions see `ctx.hasUI` | [docs/extensions.md](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) | Even on Pi, dialogs aren't guaranteed — conditional phrasing should say "if available" |

## Related Documents

- [Index](./index.md) — research overview
- [Findings](./findings.md) — full analysis behind each row
- [Recommendations](./recommendations.md) — what to do with this per phase
