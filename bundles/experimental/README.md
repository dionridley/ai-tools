# Experimental Plugin

Work in Progress Tools — experimental capabilities under active development and testing.

## Installation

See the [repository README](../../README.md) for per-harness installation instructions (Claude Code marketplace add, Pi git install).

## Skills

| Skill | Invocation | Description |
|-------|-----------|-------------|
| `mvp` | explicit only | Brainstorm, scaffold, and autonomously build a web app prototype |
| `pencil` | auto-discovered | Work with Pencil / pen.dev `.pen` design files through the Pencil MCP tools |

---

# Pencil

Read and edit Pencil (pen.dev) `.pen` design files, and capture the design target when a
plan or PRD implying design work is being written.

## Two things to know before you use it

**1. The target file must be OPEN in the Pencil desktop app.** This is not a convention —
it is the behaviour the whole skill is built around. Point the tools at a `.pen` file the
app has not opened and Pencil **silently returns whichever design is active instead**, with
no error and no warning. An agent told to edit `checkout.pen` would read and write
`homepage.pen`, and the transcript would read as complete success.

The skill refuses to write until it has proven, by comparing live probes, that it actually
reached the document you named. If it can't, it stops and asks you to open the file. That
check is the point of the skill.

**2. Edits are UNSAVED.** Everything the MCP tools do happens in the app's memory. The
`.pen` file on disk stays byte-identical until *you* save in Pencil. Nothing watching files
will see the changes. The skill will never tell you a file was "written" — it will say
*"applied to the open document `<name>` — unsaved"*.

*(Measured: no timer autosave over a 12-minute window with the app running and untouched.
Focus-change and quit behaviour were not tested, so save deliberately.)*

## Asking with pictures

When a design decision has real alternatives, the skill draws them onto the canvas as
labelled variants inside a temporary `[decision]` frame, checks its own work with a
screenshot, then tells you the frame name **and its canvas position** so you can find it:

```
Drawn into onboarding.pen — unsaved.
  Frame:    [decision] Nav placement
  Position: x 2400, y 1180 — directly below "02 · Signup", ~200px gap
  Options:  A · Sidebar   (left)
            B · Top bar   (right)
```

You pick; it applies the winner and deletes the frame. Minor changes — a colour token, a
copy tweak — are never drawn. Component- and design-level choices are.

## Requirements

- The Pencil MCP server, with the desktop app running and the target file open
- Without it, the skill reports that it is unavailable rather than falling back to editing
  `.pen` files directly, which corrupts structure the editor owns

## Auto-discovery

Unlike `mvp`, `pencil` is surfaced by its description rather than requiring explicit
invocation. That is deliberate: it needs to notice when a *plan or PRD* involves design work,
so it can capture the target `.pen` path while you are still present to name it — by the
time a plan runs unattended, there is nobody to ask.

It is scoped to visual, on-canvas design work. It does not fire on database design, API
design, system design, or design patterns.

---

# MVP Builder

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

## License

MIT
