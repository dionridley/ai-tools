# Changelog

All notable changes to the Experimental plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-07-12

### Added

- **`compatibility` frontmatter on mvp**, per the Agent Skills spec's optional field: declares Claude Code design intent (subagent dispatch, worktree isolation, settings-based permissions), the Reduced Sequential Mode + single-session degradation on other Agent Skills harnesses, and the hard requirements (git; bash background execution for the agent-managed dev server).

## [0.9.0] - 2026-07-12

Skill portability (mvp structural port): the deep Claude-Code-specific machinery — the two-session permissions/restart flow and the subagent build orchestration — is now capability-conditional. mvp runs on any Agent Skills harness; no behavior change on Claude Code. Live Pi validation (background exec, MCP config) lands with the test-in-Pi portability phase.

### Added

- **Reduced Sequential Mode** — a documented degradation for harnesses without subagent dispatch (Subagent Orchestration convention in SKILL.md's Shared Conventions): the main agent executes delegatable build tasks inline, one at a time; locks still bookkept, per-task reports still written to `.mvp/agent-logs/` as self-reports, quality review runs as a fresh skeptical self-review, `analytics.agentSpawns` counts real dispatches only.
- **Single-session setup path** — on harnesses that don't read tool permissions from `.claude/settings.local.json` (e.g. Pi), `/mvp start` skips every permissions write and restart pause and runs setup in one continuous session; the file-based state statuses work identically on both paths.
- **Zero-spawn ratio guards** — status and summary render agent-statistics ratios as "N/A" instead of dividing by zero when a build ran without dispatches.

### Changed

- **start.md session mechanics are capability-conditional** — the Claude Code two-session flow (settings write → restart → `--resume`, `.mcp.json`, restart notices) is preserved verbatim inside its branch; the Playwright E2E offer and `.mcp.json` phase are gated on MCP support with the HTTP-check fallback named.
- **build.md orchestration is capability-conditional** — batch dispatch, `isolation: "worktree"` choice (including a new sequencing rule for subagent harnesses without worktrees), worktree merge-before-review, browser-test agents, and error recovery all reference the convention; Claude Code batching, isolation defaults, and merge ordering unchanged.
- **Branded prose neutralized** — "Instructions for Claude" headings are now "Instructions for the Agent" across all four mode files; dev-server question wording says "the agent".

### Fixed

- **Pre-existing doc bugs** (caught during the conditional rework): the intro and Phase 5b claimed permissions were written in "Phase 4" (actual: Phase 2 Step 1); build.md's Step B list had duplicate "3." and "5." item numbers (now 1–7); build.md pointed to a non-existent "Phase 11 (Completion)" (actual: Phase 7).

## [0.8.0] - 2026-07-10

Skill portability (mvp's simple call sites): Agent Skills spec relative paths plus graceful-degradation notes. No behavior change on Claude Code. The deeper mvp port (subagent orchestration, background processes, worktree isolation) is a later portability phase.

### Changed

- **Relative paths per the Agent Skills spec** — all 14 `${CLAUDE_SKILL_DIR}` references across SKILL.md and references replaced with skill-root-relative paths; the mode router states the convention once.
- **Capability-conditional prose** — "Structured Questions" convention added to Shared Conventions (structured tool if available, else plain text + options); TaskCreate/TaskUpdate progress mirroring marked optional with `.mvp/state.json` remaining canonical; `$ARGUMENTS` first-use note for harnesses that don't substitute.

## [0.7.0] - 2026-07-08

Cross-harness repo restructure: the plugin is unchanged in name and behavior, but its home and packaging grew a second harness.

### Changed

- **Folder moved** to `bundles/experimental/` as part of the ai-tools cross-harness restructure. Plugin name and skills are unchanged; file history preserved via `git mv`.

### Added

- **Pi package manifest** (`package.json`, `@dionridley/experimental`) — the bundle is now consumable from the Pi coding agent as part of the repo package (`pi install git:github.com/dionridley/ai-tools`) or standalone via a local-path install. Inert for Claude Code.

## [0.6.0] - 2026-04-11

### Changed
- **Migrated `/mvp` from command to skill** — converted from legacy `commands/mvp.md` router pattern to skills 2.0 `skills/mvp/SKILL.md` with progressive disclosure. Mode files (start, build, status, summary) moved to `references/` directory. Templates moved into the skill directory.
- **Plugin description updated** — now reads "Work in Progress Tools" to reflect the experimental nature of the plugin, not just the MVP builder.
- **`${CLAUDE_PLUGIN_ROOT}` replaced with `${CLAUDE_SKILL_DIR}`** — all path references updated to use the skill-scoped variable.
- **`<command-args>` replaced with `$ARGUMENTS`** — uses skills 2.0 argument substitution syntax.
- **`disable-model-invocation: true`** — skill is only triggered by explicit `/mvp` invocation, never auto-matched to tasks.
- **`effort: high` set in frontmatter** — build sessions default to high effort with a startup notice informing the user.
- **Extracted DaisyUI + code patterns** from `conventions/elixir.md` into separate `references/elixir-patterns.md` — only loaded for screen-building agents in `core` and `polish` phases, reducing context for other agents.
- **Fixed TypeScript conventions** — corrected Tidewave setup section to match actual scaffold (`tidewave/vite-plugin`, not middleware), removed duplicate project structure listing.
- **Updated `allowed-tools`** — added `Agent`, `AskUserQuestion`, `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`; removed non-existent `Task` tool.
- **Windows `cmd /c` wrapper for `.mcp.json`** — `npx` commands in generated `.mcp.json` are now wrapped with `cmd /c` on Windows to prevent MCP server startup warnings.
- **Summary mode shows full absolute path** — `/mvp summary` now resolves and displays the full path to the generated HTML file so users can copy-paste it directly into a browser.

### Removed
- **`commands/` directory** — clean cut migration, no backwards compatibility shim.
- **Root `templates/` directory** — templates now live inside the skill at `skills/mvp/templates/`.

## [0.5.1] - 2026-03-11

### Fixed
- **Restart moved earlier in `/mvp start`** — permissions are now written immediately after stack choice (Phase 2 Step 1) rather than after all brainstorm questions. This means all prerequisite checks (Phase 3) and scaffold commands (Phase 5) run with pre-approved permissions — no per-command approval prompts during the build setup.
- **Settings files audited for missing bash patterns** — added `Bash(ps:*)`, `Bash(sleep:*)`, `Bash(echo:*)`, `Bash(basename:*)`, `Bash(date:*)`, `Bash(if:*)`, `Bash(case:*)`, `Bash(command:*)`, `Bash(which:*)`, `Bash(/usr/bin/curl:*)` to both stack settings files; consolidated `npm create:*`/`npm install:*`/`npm run:*` to `Bash(npm:*)` in the JS settings; consolidated `asdf list:*`/`asdf local:*` to `Bash(asdf:*)` and added `Bash(npx:*)` in the Elixir settings

## [0.5.0] - 2026-03-11

### Added
- **`concurrently` for unified dev server** — `npm run dev` now starts both Vite (port 3600) and Express (port 3500) via a single concurrently process; killing the parent process terminates the entire process tree, eliminating the zombie process risk of managing two PIDs separately
- **Dedicated `browser-test` phase** (Phase 7 of 8) between `polish` and `integration` — mandatory when Playwright is enabled; runs two sequential test agents: (1) blank slate walkthrough from a truly empty state, (2) happy path with seeded data. Gates on zero failures before advancing to `integration`
- **`drizzle.config.ts`** created at scaffold time — was missing, causing silent migration failures
- **`server/lib/types.ts`** stub created at scaffold time — shared type definitions for server API responses and client state; both sides import from this single source of truth
- **`db:generate`, `db:migrate`, `db:studio`** scripts added to `package.json` at scaffold time
- **Single-owner file rule** in agent dispatch — `src/lib/api.ts`, `server/lib/routes.ts`, and `server/lib/types.ts` are flagged as write-contention hotspots; only one agent per batch may be assigned to each
- **Missing prerequisite state guard check** added to quality review agent — guard clauses that silently `return` when required state is absent (e.g. no pages in a form) are now a FAIL; handler must either auto-create or show visible feedback
- **Blank slate as first browser test** — `browser-test` phase always begins with a test from a completely empty state (no seeded data), not from pre-populated fixtures

### Fixed
- **Vite boilerplate `index.css` now stripped at scaffold** — the default `body { display: flex; place-items: center }` and dark-mode CSS variables broke full-page layouts; `src/index.css` is now overwritten with just `@import "tailwindcss";`
- **Playwright detection no longer uses `npx playwright --version`** — npx shows an interactive install prompt when playwright is not in local `node_modules`, which fails non-interactively and caused the detection to always return false. Now uses `command -v playwright` with a fallback to `./node_modules/.bin/playwright`, and detects Chromium via the OS cache directory (`~/Library/Caches/ms-playwright/` on macOS, `~/.cache/ms-playwright/` on Linux, `%LOCALAPPDATA%\ms-playwright\` on Windows) rather than `show-browser-path`
- **Worktree + quality review visibility** — when a subagent runs with `isolation: "worktree"`, the worktree branch is now merged back to main BEFORE the quality review agent is dispatched; previously the reviewer was reading stale files in the main working directory

### Changed
- **Shared types convention** added to `conventions/typescript.md`: types in both server responses and client state must live in `server/lib/types.ts`
- **API mutation response shape convention** added: `PATCH`/`PUT`/`POST` must return the full nested resource, same shape as `GET`
- **Express route ordering rule** added: parameterized routes (`:id`, `:slug`) must be declared after literal path segments at the same level
- **React `onChange + setTimeout` anti-pattern** added as an explicit FAIL in conventions: pass values directly to handlers instead of reading state on the next tick
- Project structure in `conventions/typescript.md` corrected — `server/db/` and `server/lib/` paths now match actual scaffold output

## [0.4.0] - 2026-03-11

Retrospective improvements based on lessons learned building the Former prototype. All 8 issues from `.research/former-01-lessons-learn.md` addressed.

### Added
- **Non-default ports** to avoid collisions with standard framework defaults: JS Express API on `3500`, Vite on `3600`, Phoenix on `4500`
- **Port health check at every `/mvp build` session start** — verifies ports in `state.json` are free; kills known stale MVP PIDs with command verification, stops with a clear message for unknown processes
- **Process kill reference at session end** — when `serverManagement == "agent"`, every session pause and completion prints exact `kill [pid]` commands for all processes started during the session
- `"typecheck": "tsc --noEmit"` script added to `package.json` at scaffold time (JS stack)
- **Silent failure check** in quality review agent — reviewer reads every event handler, form action, and button in modified files and fails any that return early or catch errors without visible user feedback
- **Empty state + error path steps** as mandatory items in every Playwright per-screen browser test script
- **End-of-phase regression smoke test** after `core` and `polish` phases (when Playwright is enabled) — walks the complete core user flow and navigates every screen before advancing
- **Richer `resumePoint` schema** — includes `nextAction`, `lastCompletedTask`, `recentFilesChanged` (up to 5 files), and `openIssues`; updated after every completed task
- **Structured agent logs** written to `.mvp/agent-logs/[agent-id].json` after each agent completes — includes task, files, quality review verdict, browser test result, and a `decisions` field
- **Session-start context reconstruction** — Phase 1 of `/mvp build` reads `state.json`, brainstorm file, and 3 most recent agent logs before doing anything else

### Fixed
- Scaffold now uses a named subdirectory (`[slug]/`) for both Vite and Phoenix, then copies files up — avoids the interactive "directory not empty" TTY prompt when `.mvp/` files already exist in the project root
- `vite.config.ts` written from scratch with `defineConfig` from `'vitest/config'` (not `'vite'`) — prevents the `'test' does not exist in type 'UserConfigExport'` error that only surfaces at production build time
- Tidewave Vite plugin import corrected to `tidewave/vite-plugin` (was `tidewave/vite`)
- `git init` now runs in Phase 4 of `/mvp start` alongside `.mvp/` creation — ensures worktree isolation is available from the first build agent dispatch
- `/mvp build` Phase 1 checks `git rev-parse --git-dir` before dispatching agents; initializes repo if missing — worktree isolation can no longer silently fail
- Playwright browser binary check was unconditional in the Elixir scaffold path — now matches the conditional check behavior of the TypeScript scaffold

### Changed
- Quality review agent now runs `npm run typecheck` (`tsc --noEmit`) for JS tasks — catches type errors at the per-task level rather than only at final build time
- Elixir quality review compile check explicitly treats warnings as failures
- Phase `polish` browser testing expanded to per-screen tests for all new screens, matching Phase `core` behavior
- Port conflicts now stop with a clear error instead of silently auto-incrementing
- `conventions/typescript.md` port section updated to document the non-default port strategy and remove the dangerous `lsof -ti | xargs kill` pattern

## [0.3.0] - 2026-03-09

### Added
- **Auto-configured MCP servers** — `/mvp start` writes `.mcp.json` and `.claude/settings.local.json` into the project directory automatically; no manual Claude Code settings required
  - Tidewave MCP (`mcp__tidewave__*`) configured for both Elixir and JavaScript stacks
  - Playwright MCP (`@playwright/mcp@latest --isolated --caps=vision`) configured when E2E testing is opted in
- **Stack permissions files** — `commands/mvp/settings/elixir.json` and `commands/mvp/settings/typescript.json` define all required tool permissions written to new projects at setup time
- **Server management choice** — `/mvp start` now asks whether the dev server should be agent-managed (fully autonomous) or user-managed (user runs server in a separate terminal; agent instructs when to restart). Stored in `state.json` and respected throughout the build.
- **Tidewave in TypeScript scaffold** — `@tidewave/tidewave` installed, Express middleware wired up, MCP server available at `/tidewave`
- **Prescriptive TypeScript server structure** — scaffold now creates `server/index.ts`, `server/db/schema.ts`, `server/db/client.ts`, `server/db/seed.ts`, and `server/lib/routes.ts` (shared API route constants used by both Express and the fetch client to prevent URL mismatches)
- **Playwright browser binaries installed at setup** — `npx playwright install chromium` runs during scaffold if Playwright is opted in; restart-and-resume instructions shown at completion
- **Swoosh hackney fix as a concrete scaffold step** — `config/dev.exs` and `config/test.exs` patched at Elixir scaffold time; previously convention-only
- **Tidewave added to Elixir scaffold** — `{:tidewave, "~> 0.1", only: :dev}` and router setup added as scaffold steps
- **Process safety warnings** — agent-managed builds show a per-stack warning at session start about same-name process collision risk (`mix phx.server`, `vite`, `tsx`)
- **Command verification before all process kills** — every kill operation now checks `ps -p [pid] -o args=` against the stored command fragment; PIDs recycled to unrelated processes are marked `"recycled"` and skipped rather than killed
- **Subagent PID lifecycle tracking** — `state.processes.subagentPids` tracks every background process started by a subagent with full start/stop metadata; swept at session start, phase completion, and build completion
- **`--resume` flag instructions** — completion message now tells users to copy the resume command before restarting Claude Code so they can continue the conversation with full context

### Changed
- Projects now scaffold into the current directory (using `.`) instead of creating a subdirectory — matches expected workflow of `mkdir my-app && cd my-app && claude`
- Playwright question updated to reflect automatic MCP configuration; "requires manual setup" caveat removed
- `lsof -ti:[port] | xargs kill` pattern removed entirely from agent-managed server startup; replaced with PID-based kill with command verification
- `typescript-conventions.md` fully fleshed out — `verbatimModuleSyntax`/`import type` rule (blank-page prevention), DB-in-callbacks prohibition, `npx tsc --noEmit` quality gate, idempotent seed pattern, API URL contract rule, port handling, Tidewave setup, Playwright smoke test guidance
- `elixir-conventions.md` expanded — Swoosh config rule, `flash_group` Layouts import rule, compiler warnings as failures, `signed_in_path` test update rule, Tidewave usage rule
- Convention files reorganised into `commands/mvp/conventions/` folder; filenames simplified to `elixir.md` and `typescript.md`

## [0.2.0] - 2026-03-08

### Added
- Playwright E2E testing support — opt-in during `/mvp start`, enabled per-screen in Phase 5 (core feature) if chosen
- Mandatory Phase 3: Test Scaffolding — unit tests for all data/context functions must pass before proceeding
- Mandatory Phase 4: Design Brief — generated by main agent and saved to `.mvp/research/design-brief.md` before any UI agents run
- Stack conventions system — `commands/mvp/conventions/` directory with per-stack mandatory rules injected into every agent prompt
  - `conventions/elixir.md` — Phoenix 1.8 standing rules, patterns, and quick reference (DaisyUI, LiveView, context, factory, migrations)
  - `conventions/typescript.md` — TypeScript/React 19 standing rules (placeholder, to be expanded with real build learnings)
- Elixir scaffold hardening in `/mvp start`: OTP 25+ check, `--no-install` flag, Faker dependency, asset binary pre-install, boilerplate file cleanup, `root.html.heex` flash group patch, `runtime.exs` port wrapping, port conflict detection
- Low-risk task flag — tasks like README writes and CSS appends skip quality review
- Worktree isolation is now the default for subagents touching more than 2 files

### Changed
- Build process expanded from 5 phases to 7 phases to accommodate test scaffolding and design brief gates
- Integration phase (Phase 7) now requires full test suite to pass with 0 failures before final commit
- `brainstorm.md` filename is no longer prompted — always defaults to `brainstorm.md`

## [0.1.0] - 2026-02-24

### Added
- Initial release of experimental plugin
- `/mvp start` command for brainstorming and project scaffolding
- `/mvp build` command for autonomous building with parallel AI agents
- `/mvp status` command for progress dashboard
- `/mvp summary` command for HTML analytics page generation
- JavaScript stack support (Vite + TypeScript + React 19 + TailwindCSS 4 + SQLite)
- Elixir stack support (Phoenix Framework + LiveView + SQLite)
- Persistent state management via `.mvp/` directory
- Lock-based agent concurrency control
- Quality review agent pattern for completed tasks
- Auto git commits at task completion checkpoints
