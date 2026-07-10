---
name: mvp
description: Autonomous MVP builder — brainstorm, scaffold, build, and track web app prototypes
argument-hint: <start|build|status|summary>
disable-model-invocation: true
effort: high
allowed-tools: Read Write Edit Grep Glob Bash(*) Agent AskUserQuestion WebSearch WebFetch TaskCreate TaskUpdate TaskGet TaskList
---

# MVP Builder

Autonomous skill that brainstorms an app idea with the user, scaffolds the project, and builds a working prototype using parallel AI agents.

```
Effort mode: high (set by /mvp for best results)
Override with /effort medium if preferred.
```

## Mode Routing

Detect the mode from the user's arguments and delegate to the appropriate reference file.

**Arguments:** $ARGUMENTS

**Route to the correct mode:**

1. If arguments are empty, whitespace-only, or start with "start":
   - Read `${CLAUDE_SKILL_DIR}/references/start.md` and follow those instructions

2. If arguments start with "build":
   - Read `${CLAUDE_SKILL_DIR}/references/build.md` and follow those instructions

3. If arguments start with "status":
   - Read `${CLAUDE_SKILL_DIR}/references/status.md` and follow those instructions

4. If arguments start with "summary":
   - Read `${CLAUDE_SKILL_DIR}/references/summary.md` and follow those instructions

5. If no recognized mode, show usage help:
   ```
   MVP Builder — Autonomous web app prototype builder

   Usage:
     /mvp start     Brainstorm an idea, choose tech stack, scaffold project
     /mvp build     Build the prototype (resumes from saved state)
     /mvp status    View current progress dashboard
     /mvp summary   Generate HTML analytics page

   Get started:
     /mvp start
   ```

---

## Shared Conventions

All modes inherit these conventions. Mode-specific reference files build on top of them.

### State Directory

All MVP state is persisted in `.mvp/` in the current working directory:

| File/Folder | Purpose |
|-------------|---------|
| `.mvp/brainstorm.md` | Source-of-truth: vision, scope, task tracking, agent log |
| `.mvp/state.json` | Machine-readable state for orchestration and analytics |
| `.mvp/agent-logs/` | Individual agent run reports (one per agent) |
| `.mvp/research/` | Research artifacts gathered during brainstorming |
| `.mvp/resources/` | Downloaded assets (images, icons, etc.) |

### Supported Tech Stacks

**JavaScript Stack:**
- Vite (latest) + TypeScript
- React 19.x
- TailwindCSS 4.x
- SQLite via better-sqlite3 / Drizzle ORM

**Elixir Stack:**
- Phoenix Framework (latest)
- LiveView for page rendering
- SQLite via Ecto SQLite3 adapter

### Timestamps

All timestamps use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS` (local time). Use the current date from the conversation context — NEVER hardcode dates.

### Git Conventions

- Commit messages use prefix: `mvp: [description]`
- Auto-commit after each quality-reviewed task completion
- Phase completion gets a summary commit
- Final completion gets a wrap-up commit

### Agent Communication Format

Subagents MUST return results as structured JSON:

```json
{
  "agentId": 1,
  "status": "success|partial|failed",
  "taskCompleted": "description of what was done",
  "filesModified": ["path/to/file1"],
  "filesCreated": ["path/to/new-file"],
  "dependenciesNeeded": ["package-name"],
  "processesStarted": [{"pid": 12345, "command": "npm run dev"}],
  "issues": ["any problems encountered"],
  "notes": "additional context"
}
```

### Lock System

`state.json` tracks resource locks to prevent agent conflicts:

| Lock | Protects |
|------|----------|
| `migrations` | Database schema changes — one agent at a time |
| `design` | Global CSS, theme, design system files |
| `dependencies` | package.json / mix.exs modifications (main agent only) |

### Main Agent Responsibilities

The main agent (not subagents) ALWAYS handles:
- Installing/removing dependencies
- Starting/stopping dev servers
- Running database migrations
- Git add, commit, push operations
- Modifying `.mvp/state.json` and `.mvp/brainstorm.md`
- Managing process PIDs
- Acquiring/releasing locks

### Task Progress Tracking

Use TaskCreate and TaskUpdate to provide real-time visual progress in the Claude Code UI. This complements the `.mvp/state.json` system which persists across sessions.

- Create tasks at the start of each build phase
- Update task status as work progresses (in_progress, completed)
- Both systems must stay in sync — update state.json AND task status together

---

## Execute Now

Route to the correct mode based on the arguments above.
