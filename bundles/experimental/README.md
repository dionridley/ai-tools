# Experimental Plugin

Work in Progress Tools — experimental capabilities under active development and testing.

## Skills

| Skill | Description |
|-------|-------------|
| `/mvp start` | Brainstorm an app idea, choose a tech stack, and scaffold the project |
| `/mvp build` | Build the prototype autonomously (resumes from saved state if prior progress exists) |
| `/mvp status` | View current progress dashboard |
| `/mvp summary` | Generate an HTML analytics page of the build process |

> `/mvp` uses `disable-model-invocation: true` — it is only triggered by explicit `/mvp` invocation, never auto-matched to tasks.

## Supported Tech Stacks

### JavaScript Stack
- **Bundler:** Vite (latest)
- **Language:** TypeScript
- **UI Framework:** React 19.x
- **CSS:** TailwindCSS 4.x
- **Database:** SQLite (via better-sqlite3 / Drizzle ORM)

### Elixir Stack
- **Framework:** Phoenix Framework (latest)
- **UI:** LiveView
- **CSS:** TailwindCSS 4.x + DaisyUI 5.x (ships by default in Phoenix 1.8)
- **Database:** SQLite (via Ecto SQLite3 adapter)

## Prerequisites

### JavaScript Stack
- Node.js >= 18
- npm / npx

### Elixir Stack
- Elixir >= 1.15
- OTP >= 25 (required for asset downloads)
- Mix + Hex (`mix local.hex`)

### Getting Started

Create and enter your project folder before running `/mvp start` — the scaffold runs in the current directory:

```bash
mkdir my-app && cd my-app && claude
```

## How It Works

1. **`/mvp start`** — Interactive setup that captures your app idea, bounds scope to 3-5 screens and 1 core user flow, asks about Playwright E2E testing and dev server management preference, checks prerequisites, scaffolds the project into the current directory, and writes `.mcp.json` and `.claude/settings.local.json` so Claude Code has the right tools and permissions pre-approved. After setup, restart Claude Code with the provided `--resume` command to load the MCP servers.

2. **`/mvp build`** — Builds the prototype autonomously across 8 phases. Loads stack conventions at session start, identifies the next batch of tasks, dispatches parallel agents, runs quality reviews, and auto-commits to git at each checkpoint. Pauses at phase boundaries for user review. Picks up from saved state if prior progress exists.

3. **`/mvp status`** — Displays a terminal-friendly dashboard showing phase progress, task counts, agent statistics, and elapsed time.

4. **`/mvp summary`** — Generates a self-contained HTML page with charts and analytics about the entire build process.

## Build Phases

| Phase | Name | Description |
|-------|------|-------------|
| 1 | Scaffold | Project init, dependencies, routing skeleton, dev server verification |
| 2 | Data Layer | Schemas, migrations, seed data |
| 3 | Test Scaffolding | Unit tests for all data/context functions — gate: 0 failures |
| 4 | Design Brief | Main agent generates design brief; all UI agents use it |
| 5 | Core Feature | Primary user flow built screen by screen; per-screen Playwright tests |
| 6 | UI Polish | Remaining screens, navigation, responsive checks; per-screen Playwright tests |
| 7 | Browser Testing | Full happy path walkthrough — blank slate first, then seeded data — gate: 0 failures |
| 8 | Integration | Full test suite, README, final cleanup — gate: 0 failures |

## Project Artifacts

All state is persisted in a `.mvp/` directory in your project root:

```
.mvp/
├── brainstorm.md    # Source-of-truth document with vision, scope, and task tracking
├── state.json       # Machine-readable state for build orchestration and analytics
├── agent-logs/      # Individual agent run reports
├── research/        # Research artifacts gathered during brainstorming
└── resources/       # Downloaded assets (images, etc.)
```

## Dev Server Management

Chosen during `/mvp start` and respected throughout the build:

- **User-managed (recommended)** — you run `npm run dev` (or `mix phx.server`) in a separate terminal; Claude tells you when to restart (after config changes, new dependencies, migrations)
- **Agent-managed** — Claude starts and stops the server automatically for a fully autonomous build; for the JavaScript stack, both Vite and Express are managed as a single `concurrently` process

## Auto-Configured Project Settings

`/mvp start` writes two files into your project before the first build session:

- **`.mcp.json`** — configures Tidewave (app introspection) and Playwright (browser testing) MCP servers
- **`.claude/settings.local.json`** — pre-approves all tool permissions needed for the build so you aren't prompted repeatedly

Restart Claude Code after `/mvp start` completes (use the `--resume` flag shown at the end) to load these settings.

## Agent Orchestration

The build orchestrator uses a main agent that coordinates subagents:

- **Main agent** handles infrastructure: dependency installs, server management, database migrations, git operations
- **Subagents** handle feature work: up to 2-3 running in parallel for independent tasks
- **Quality review agents** verify each completed task before it's committed; low-risk tasks (README, CSS appends) skip this step
- **Lock-based concurrency** prevents conflicts on shared resources (migrations, design, dependencies)
- **Single-owner file rule** — `src/lib/api.ts`, `server/lib/routes.ts`, and `server/lib/types.ts` are assigned to at most one agent per batch to prevent write conflicts
- **Worktree isolation** (`isolation: "worktree"`) is the default for agents touching more than 2 files; worktrees are merged back before quality review runs
- **PID lifecycle tracking** — all background processes started by subagents are tracked, verified by command name, and swept clean at phase boundaries and session start

## Skill Structure

```
skills/mvp/
├── SKILL.md                        # Router + shared conventions
├── references/
│   ├── start.md                    # START mode instructions
│   ├── build.md                    # BUILD mode instructions
│   ├── status.md                   # STATUS mode instructions
│   ├── summary.md                  # SUMMARY mode instructions
│   ├── conventions/
│   │   ├── elixir.md               # Elixir/Phoenix mandatory rules
│   │   ├── elixir-patterns.md      # LiveView, Context, DaisyUI patterns (core/polish phases only)
│   │   └── typescript.md           # TypeScript/React mandatory rules
│   └── settings/
│       ├── elixir.json             # Tool permissions for Elixir stack
│       └── typescript.json         # Tool permissions for JS stack
└── templates/
    ├── brainstorm-template.md      # Template for .mvp/brainstorm.md
    └── summary-template.html       # Template for analytics page
```

Stack-specific conventions in `references/conventions/` are injected into every agent prompt during build. The `elixir-patterns.md` file (LiveView, Context, test, factory, and DaisyUI patterns) is loaded only for screen-building agents in the `core` and `polish` phases.
