# /mvp start — Brainstorm & Scaffold

This file is loaded by the `/mvp` skill router when the user runs `/mvp start` or `/mvp` with no arguments.

## Instructions for Claude

You are executing the START mode of the `/mvp` skill. Your job is to:
1. Brainstorm an app idea with the user and lock in scope
2. Ask about Playwright E2E testing preference and server management preference
3. Check prerequisites for the chosen stack
4. Write tool permissions to `.claude/settings.local.json` and pause for a Claude Code restart
5. After restart: scaffold the project with all fixes and patches applied
6. Write `.mcp.json` and finalize `.mvp/` state directory

**Two-session flow:** Setup runs across two Claude Code sessions separated by a required restart. Phase 4 writes permissions and saves brainstorm state, then stops. After restart with `--resume`, `/mvp start` detects the saved state and jumps directly to Phase 5 (scaffold) without re-asking questions.

---

## Phase 1: Check for Existing State

Before anything else, check if `.mvp/state.json` already exists in the current directory.

1. **Try to read `.mvp/state.json`:**
   - If it EXISTS and `status == "awaiting_brainstorm"`:
     - Stack was chosen and permissions were written, but brainstorming was not completed.
     - Show: "Permissions loaded. Resuming setup — continuing with app idea questions."
     - Read `stack` from `state.project.stack`
     - **Jump directly to Phase 2, Step 2** — skip the stack question, go straight to the app idea.

   - If it EXISTS and `status == "awaiting_scaffold"`:
     - Settings were written before a required restart. Scaffold hasn't run yet.
     - Show: "Permissions loaded. Resuming setup for [name] — continuing to scaffold."
     - Read all stored brainstorm values from state.json (stack, port, playwrightEnabled, serverManagement, etc.)
     - **Jump directly to Phase 5** — skip brainstorming and prerequisites entirely.

   - If it EXISTS and status is anything else (building, complete, error):
     - Read it to get the project name and status
     - Use AskUserQuestion:
       - **Question:**
         ```
         An MVP project already exists in this directory:
           Project: [name]
           Status:  [status]
           Stack:   [stack]

         What would you like to do?
         ```
       - **Options:** "Continue building — run /mvp build" / "Start fresh (overwrites .mvp/)" / "Cancel"
     - If "Continue building": show the command and STOP
     - If "Cancel": STOP
     - If "Start fresh": delete the existing `.mvp/` directory and continue

   - If it DOES NOT exist: continue to Phase 2

---

## Phase 2: Brainstorming

You are a ruthless scope reducer. Your job is to get the user to a buildable prototype in under 2 hours of agent work. Every feature the user mentions, ask yourself: "Can the app demonstrate its core value without this?" If yes, cut it. Be diplomatic but firm. Propose the minimum viable version and let the user add back only what they insist on.

### Step 1: Tech Stack

Use AskUserQuestion:
- **Question:** "Which tech stack would you like to use?"
- **Header:** "Tech Stack"
- **Options:**
  1. "JavaScript (Vite + TypeScript + React 19 + TailwindCSS 4)" — Description: "Modern JS stack with fast HMR, type safety, and utility-first CSS. SQLite via Drizzle ORM."
  2. "Elixir (Phoenix + LiveView)" — Description: "Full-stack Elixir with real-time server-rendered UI. SQLite via Ecto."
- **multiSelect:** false

Store the chosen stack. Then immediately write permissions and restart — loading them now means all prerequisite checks and scaffold commands will run without per-command approval prompts.

**Write settings, save state, and pause for restart:**

1. Read the appropriate baseline permissions file:
   - **JS:** Read `${CLAUDE_SKILL_DIR}/references/settings/typescript.json`
   - **Elixir:** Read `${CLAUDE_SKILL_DIR}/references/settings/elixir.json`

2. Create the `.mvp/` directory structure and initialize git:
   ```bash
   mkdir -p .mvp/agent-logs .mvp/research .mvp/resources
   git rev-parse --git-dir 2>/dev/null || git init
   ```

3. Write `.claude/settings.local.json` with the contents read above.

4. Write a minimal `.mvp/state.json` to persist the stack choice across the restart:
   ```json
   {
     "version": "1.1.0",
     "project": {
       "stack": "[chosen stack: js|elixir]"
     },
     "status": "awaiting_brainstorm"
   }
   ```

5. Show restart message and **STOP**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Restart required to load tool permissions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Tool permissions for the [JS/Elixir] stack have
     been written to .claude/settings.local.json.

     Loading them before the prerequisite checks and
     scaffold means you won't be prompted to approve
     each command individually.

     Before you exit:
       Copy the --resume command shown below.

     To continue:
       1. Copy the resume command (shown on exit)
       2. claude --resume <session-id>
       3. Run /mvp start

     Claude will detect the saved state and jump
     straight to the remaining setup questions.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

**STOP here.** Do not proceed to Step 2 until the user has restarted and re-run `/mvp start`.

### Step 2: App Idea

Use AskUserQuestion:
- **Question:** "Describe your app idea. What should it do? Who is it for? What problem does it solve?"
- **Header:** "App Idea"
- **Options:**
  1. "I'll describe it" — Description: "I'll type out my idea in the next message"
  2. "Help me brainstorm" — Description: "I have a vague idea and need help refining it"
- **multiSelect:** false

If "I'll describe it": wait for the user's description.
If "Help me brainstorm": ask follow-up questions to draw out a concrete idea.

**If the user provides a URL** (e.g. a shared research document):
1. Attempt to fetch it
2. If the content is not readable (JavaScript-heavy app shell, no real text): tell the user immediately — "I can't read the content at that link directly. Could you paste the key points here?" — do not silently proceed without the research.

### Step 3: Scope Analysis and Confirmation

After receiving the app description, use extended thinking:
- What is the single most important user flow?
- What are the minimum screens needed to demonstrate that flow?
- What data models are required for just the core flow?
- What can be deferred without losing core value?

Present a bounded scope using AskUserQuestion:
- **Question:**
  ```
  Here's what I propose for your MVP:

  Core Flow: [1-sentence description]

  Screens ([N]):
  1. [Screen name] — [what it does]
  2. [Screen name] — [what it does]
  3. [Screen name] — [what it does]

  Key Features:
  - [Feature 1]
  - [Feature 2]

  Deferred to later:
  - [Feature X] — not needed to demonstrate core value
  - [Feature Y] — adds complexity without MVP benefit

  Does this scope look right?
  ```
- **Header:** "Scope"
- **Options:** "Looks good, proceed" / "I want to adjust"
- **multiSelect:** false

If "I want to adjust": ask what they'd like to change, re-analyze, re-present. Loop at most 3 times.

**Scope limits (enforce these — non-negotiable):**
- Maximum 5 screens
- 1 core user flow
- No authentication unless it IS the core feature
- No payment integration
- No third-party API integrations — use mock/seed data instead
- No admin panel
- No settings page

### Step 4: Playwright E2E Testing

Use AskUserQuestion:
- **Question:**
  ```
  Would you like to use Playwright MCP for browser-based end-to-end testing
  during the build?

  After each screen is built, a browser agent will open the real UI in a browser
  and click through it — catching blank pages, broken form submissions, missing
  event handlers, and wrong state transitions that code review alone misses.

  Playwright MCP and browser binaries will be installed and configured
  automatically as part of this setup.
  ```
- **Header:** "E2E Browser Testing (Recommended)"
- **Options:**
  1. "Yes, use Playwright MCP (Recommended)" — Description: "A browser agent tests each screen after it's built. Chromium and MCP server configured automatically."
  2. "No, skip browser testing" — Description: "Build only — no automated browser tests. You can test manually when the build completes."
- **multiSelect:** false

Store the choice as `playwrightEnabled: true/false`.

### Step 5: Dev Server Management

Use AskUserQuestion:
- **Question:**
  ```
  How would you like the dev server to be managed during the build?

  Agent-managed: Claude starts and stops the server automatically. Fully
  autonomous — but a failed agent can leave a process holding the port open,
  requiring manual cleanup.

  User-managed: You start the server yourself in a separate terminal. Claude
  will tell you when to restart (e.g. after config changes or new dependencies).
  More reliable — you always have visibility into server state.
  ```
- **Header:** "Dev Server Management"
- **Options:**
  1. "User-managed (Recommended)" — Description: "You run the server in a separate terminal. Claude tells you when to restart."
  2. "Agent-managed (Fully autonomous)" — Description: "Claude starts and stops the server automatically."
- **multiSelect:** false

Store the choice as `serverManagement: "user" | "agent"`.

---

## Phase 3: Prerequisite Checks

Check that the required tools are installed. **STOP** if critical prerequisites are missing.

### For JavaScript Stack:

Run in sequence:
```bash
node --version
npm --version
npx --version
```

Show checklist:
```
Prerequisite Check — JavaScript Stack:

  [x] node (v20.11.0) — requires >= 18
  [x] npm (v10.2.4)
  [x] npx (v10.2.4)

All prerequisites met!
```

**STOP** if `node` or `npm` is missing:
```
Missing prerequisites! Install before continuing:
  Node.js / npm: https://nodejs.org  or  nvm: https://github.com/nvm-sh/nvm
```

**4. Check port availability:**
```bash
lsof -i :3500 | grep LISTEN
lsof -i :3600 | grep LISTEN
```

If either port is occupied, **STOP**:
```
Port [3500|3600] is in use by: [process name / PID]

MVP uses port 3500 (Express API) and 3600 (Vite frontend) to avoid
conflicts with standard framework defaults (3001 and 5173).

To view what's using the port:   lsof -i :[port]
To stop it:                      kill [pid]

Resolve this conflict, then re-run /mvp start.
```

Update the checklist:
```
Prerequisite Check — JavaScript Stack:

  [x] node (v20.11.0) — requires >= 18
  [x] npm (v10.2.4)
  [x] npx (v10.2.4)
  [x] port 3500 (Express) available
  [x] port 3600 (Vite) available

All prerequisites met!
```

### For Elixir Stack:

Run in sequence:

**1. Check Elixir and OTP:**
```bash
elixir --version
```
Parse the output to extract both the Elixir version AND the OTP version (look for "OTP" or "Erlang" in the output).

Also run the explicit OTP check:
```bash
erl -eval 'erlang:display(erlang:system_info(otp_release)), halt().' -noshell
```

**STOP** if Elixir is missing. Show:
```
Elixir not found. Install before continuing:
  https://elixir-lang.org/install.html
  Or with asdf: asdf install elixir latest
```

**STOP** if OTP < 25:
```
OTP [version] detected — OTP 25 or higher is required.

The esbuild and tailwind hex packages require OTP 25+ for SSL certificate
support. Without it, asset downloads will fail and the dev server will start
but CSS/JS compilation will silently break.

If you use asdf:
  asdf list erlang                    # see what's installed
  asdf install erlang 27.2            # install OTP 27 (recommended)
```

Then check if asdf is available and can resolve this automatically:
```bash
which asdf 2>/dev/null && asdf list erlang 2>/dev/null
```

If asdf is present and a suitable version (>= OTP 25) is available:
- Tell the user: "asdf is available. I'll create a `.tool-versions` file to pin OTP 27 for this project."
- Create `.tool-versions` in the current directory:
  ```
  erlang 27.2
  elixir 1.18.1-otp-27
  ```
  (Use the highest OTP 27+ version shown by `asdf list erlang`, and matching elixir)
- Then re-verify with the new versions before proceeding

**2. Check mix and hex:**
```bash
mix --version
mix hex.info 2>&1 || echo "HEX_NOT_INSTALLED"
```

If hex is missing, auto-install: `mix local.hex --force`

**3. Check port availability:**
```bash
lsof -i :4500 | grep LISTEN
```

If port 4500 is occupied, **STOP**:
```
Port 4500 is in use by: [process name / PID]

MVP uses port 4500 for Phoenix to avoid conflicts with the standard
Phoenix default (4000) used by other local Phoenix applications.

To view what's using the port:   lsof -i :4500
To stop it:                      kill [pid]

Resolve this conflict, then re-run /mvp start.
```

Store `port: 4500` in state.

Show the full checklist:
```
Prerequisite Check — Elixir Stack:

  [x] elixir (1.18.1) — OTP 27 (>= OTP 25 required)
  [x] mix (1.18.1)
  [x] hex (2.0.0)
  [x] port 4500 available

All prerequisites met!
```

---

## Phase 4: Save Brainstorm State

Settings and git are already initialized from the first restart (Phase 2 Step 1). This phase saves the completed brainstorm data to state.json before scaffold begins. No restart is needed.

### Write partial `state.json`

Update `.mvp/state.json` with `status: "awaiting_scaffold"` and all brainstorm data collected in Phase 2:

```json
{
  "version": "1.1.0",
  "project": {
    "name": "[App Name]",
    "slug": "[slug]",
    "description": "[One-line description]",
    "stack": "js|elixir",
    "port": [chosen-port],
    "expressPort": [expressPort],
    "brainstormFile": "brainstorm.md",
    "projectDir": ".",
    "playwrightEnabled": true|false,
    "serverManagement": "user|agent",
    "createdAt": "[ISO timestamp]",
    "updatedAt": "[ISO timestamp]"
  },
  "status": "awaiting_scaffold",
  "brainstormData": {
    "vision": "[vision description]",
    "screens": [...],
    "coreFlow": "[core flow description]",
    "inScope": [...],
    "outOfScope": [...]
  }
}
```

Continue immediately to Phase 5 — no restart required. Permissions are already loaded from the Phase 2 restart.

---

## Phase 5: Scaffold the Project

### Determine Project Slug

The user has already created and `cd`'d into the project folder before running `/mvp start`. Read the current directory name as the slug:

```bash
basename $(pwd)
```

Use this value as `[slug]` throughout. All scaffold commands run in the current directory — no subdirectory is created.

For Elixir, also derive the underscored module name from the slug (e.g., `my-app` → `my_app`, `MyApp`). Phoenix does this automatically when you pass `.` as the project path.

### For JavaScript Stack:

Run sequentially:

```bash
# Scaffold into a named subdirectory (avoids the "directory not empty" TTY prompt
# that blocks automation when .mvp/ already exists in the current directory)
npm create vite@latest [slug] -- --template react-ts

# Move all scaffold files up to the current directory and remove the subdirectory
cp -r [slug]/. . && rm -rf [slug]

# Install dependencies
npm install

# Install React Router, SQLite, and server dependencies
npm install react-router-dom better-sqlite3 drizzle-orm express cors
npm install -D @types/better-sqlite3 @types/express @types/cors drizzle-kit tsx concurrently

# Install Tailwind for Vite
npm install -D tailwindcss @tailwindcss/vite

# Install Tidewave for dev-time app introspection (package name is just "tidewave")
npm install --save-dev tidewave
```

Set up TailwindCSS 4 and Tidewave Vite plugin:
1. **Overwrite `src/index.css` entirely** — the Vite scaffold ships `body { display: flex; place-items: center }` and dark-mode CSS custom properties that break any full-page layout. Replace the whole file with just the Tailwind import:
   ```css
   @import "tailwindcss";
   ```
2. **Overwrite `vite.config.ts` entirely** with the following (do NOT read-and-edit — the scaffolded file imports from `'vite'` which breaks the Vitest `test` block; `'vitest/config'` must be the import source):
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'
   import tidewave from 'tidewave/vite-plugin'

   export default defineConfig({
     plugins: [
       react(),
       tailwindcss(),
       tidewave(),   // dev-only introspection MCP server — no-op in production
     ],
     test: {
       environment: 'jsdom',
       include: ['src/**/*.{test,spec}.{ts,tsx}'],
     },
   })
   ```
   **Why `vitest/config` not `vite`:** Adding a `test` block to a config that imports from `'vite'` causes a TypeScript error (`'test' does not exist in type 'UserConfigExport'`) that only surfaces during `tsc -b` / production build — not during `npm run dev`. Importing from `'vitest/config'` provides the extended type that includes the `test` key.

   **Why `tidewave/vite-plugin` not `tidewave/vite`:** The correct subpath export for the Tidewave Vite plugin is `tidewave/vite-plugin`. Using `tidewave/vite` causes `Missing "./vite" specifier` at build time.

Install Vitest for testing:
```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

**Replace the default Vite `"dev"` script and add the following scripts to `package.json`** (the scaffolded `"dev": "vite"` must be replaced — it only starts Vite, not Express):
```json
"dev": "concurrently \"npm run client\" \"npm run server\"",
"client": "vite --port 3600",
"server": "tsx watch server/index.ts",
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit",
"build": "tsc -b && vite build",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```
`npm run dev` starts both servers via concurrently and is the only command needed in development. Killing the concurrently process (Ctrl+C or `kill [pid]`) terminates the entire process tree — both Vite and Express go down together.

**Create the server directory structure:**

Write `server/index.ts`:
```typescript
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT) || 3500

app.use(cors({ origin: 'http://localhost:3600' }))
app.use(express.json())

// TODO: mount route files here
// import { formsRouter } from './routes/forms'
// app.use('/api/forms', formsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export { app }
```
Note: Tidewave runs as a standalone stdio MCP server (`npx tidewave mcp`) — it does not need Express middleware.

Write `server/db/schema.ts` (placeholder — build agents fill in the real schema):
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Schema will be defined in Phase 2 (Data Layer)
// Example:
// export const things = sqliteTable('things', {
//   id: text('id').primaryKey(),
//   name: text('name').notNull(),
//   createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
// })
```

Write `server/db/client.ts`:
```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('local.db')
export const db = drizzle(sqlite, { schema })
```

Write `server/db/seed.ts` (placeholder — build agents fill in real data):
```typescript
import { db } from './client'

async function seed() {
  console.log('Seeding database...')
  // Seed data will be added in Phase 2 (Data Layer)
  // All inserts must be idempotent — check for existence before inserting
  console.log('Done.')
}

seed().catch(console.error)
```

Write `server/lib/routes.ts` (API route constants — both server and client import from here):
```typescript
// Single source of truth for all API route paths.
// Import this in Express route files AND in src/lib/api.ts to prevent URL mismatches.
export const ROUTES = {
  // Example:
  // forms: {
  //   list:   '/api/forms',
  //   get:    (slug: string) => `/api/forms/${slug}`,
  //   create: '/api/forms',
  // }
} as const
```

Write `drizzle.config.ts` in the project root (required for `drizzle-kit` commands — migrations silently fail without it):
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './local.db',
  },
})
```

Write `server/lib/types.ts` (shared types between server API responses and client state — define once, import from both sides):
```typescript
// Shared types used by both server API responses and the client API layer.
// Any type that appears in BOTH a server response AND client state belongs here.
//
// Server imports:  import type { ... } from '../lib/types'
// Client imports:  import type { ... } from '../../server/lib/types'
//
// Rule: PATCH/PUT endpoints must return the same type as the corresponding GET
// (the full nested object, not the raw DB row). Clients must be able to call
// setState(await api.things.update(...)) without any reshaping.

// Types will be populated here during Phase 2 (Data Layer)
// Example:
// export type ThingSummary = {
//   id: string
//   title: string
//   createdAt: number
// }
```

Store `expressPort: 3500` in state — this port was verified available in Phase 3.

**If Playwright is enabled, check installation and install only what is missing:**

```bash
# Detect the Playwright CLI without using `npx` — npx shows an interactive install
# prompt when playwright is not in local node_modules, which fails non-interactively
# and causes a false negative (always triggers reinstall).
if command -v playwright > /dev/null 2>&1; then
  PW_BIN="playwright"
elif [ -f "./node_modules/.bin/playwright" ]; then
  PW_BIN="./node_modules/.bin/playwright"
else
  PW_BIN=""
fi

if [ -n "$PW_BIN" ]; then
  PLAYWRIGHT_VERSION=$($PW_BIN --version 2>/dev/null)
  echo "[x] Playwright CLI ($PLAYWRIGHT_VERSION)"
else
  echo "[ ] Playwright CLI not found on PATH"
fi

# Check Chromium via the OS cache directory — more reliable than `show-browser-path`
# because it does not require the CLI and handles version-folder changes gracefully.
case "$(uname -s)" in
  Darwin)               PW_CACHE="$HOME/Library/Caches/ms-playwright" ;;
  MINGW*|MSYS*|CYGWIN*) PW_CACHE="${LOCALAPPDATA:-$HOME/AppData/Local}/ms-playwright" ;;
  *)                    PW_CACHE="$HOME/.cache/ms-playwright" ;;
esac

if ls "$PW_CACHE/chromium-"* > /dev/null 2>&1; then
  echo "[x] Chromium browser binary — already installed"
else
  echo "[ ] Chromium binary not found — installing..."
  npx playwright install chromium
fi
```

Show the result in the prerequisite checklist:
```
  [x] Playwright (1.x.x) — already installed
  [x] Chromium — already installed
```
or:
```
  [ ] Playwright CLI not on PATH
  [ ] Chromium — installed now
```

Verify the dev servers start (both Vite and Express via concurrently):
```bash
npm run dev &
DEV_PID=$!
sleep 6
/usr/bin/curl -s -o /dev/null -w "%{http_code}" http://localhost:3600
kill $DEV_PID 2>/dev/null
```

If curl returns 200 from port 3600, scaffolding succeeded. (Express on 3500 is a stub at this point — only Vite is checked.)

### For Elixir Stack:

Run sequentially:

**1. Install Phoenix generator:**
```bash
mix archive.install hex phx_new --force
```

**2. Scaffold into a named subdirectory, then move files up:**
```bash
mix phx.new [slug] --live --no-mailer --no-dashboard --database sqlite3 --no-install
cp -r [slug]/. . && rm -rf [slug]
```

Using a named subdirectory avoids the "directory already exists" interactive prompt that blocks automation when `.mvp/` is already present. The `--no-install` flag prevents the `[Yn]` dependency prompt. After the copy, all scaffold files are in the current directory exactly as if `mix phx.new .` had worked.

**3. Move `.tool-versions` back to project root if needed:**
The `.tool-versions` file was created in the current directory during Phase 3. After the copy-up it should still be in the right place — verify it exists at `.tool-versions` (not inside a subdirectory).

**4. Install dependencies:**
```bash
mix deps.get
```

**5. Add Faker for realistic seed data:**
Read `mix.exs` and add to the `deps` section under `only: [:dev, :test]`:
```elixir
{:faker, "~> 0.18", only: [:dev, :test]}
```

Also add Tidewave as a dev dependency:
```elixir
{:tidewave, "~> 0.1", only: :dev}
```

Then run `mix deps.get` again to fetch both.

**6. Pre-install asset binaries:**
```bash
mix assets.setup
mix tailwind.install --if-missing
mix esbuild.install --if-missing
```

**7. Create database:**
```bash
mix ecto.create
```

**8. Add Tidewave route to `lib/[app]_web/router.ex`:**
Read the file and add inside the `dev_routes` block:
```elixir
if Application.compile_env(:[app], :dev_routes) do
  scope "/tidewave" do
    pipe_through :browser
    forward "/", Tidewave
  end
end
```

**9. Fix `config/runtime.exs` port override:**
Read `config/runtime.exs`. Find the line that sets the HTTP port (usually looks like):
```elixir
config :[app], [AppWeb].Endpoint,
  http: [port: String.to_integer(System.get_env("PORT", "4000"))]
```
Wrap it in a production-only guard so it doesn't override `dev.exs` at runtime:
```elixir
if config_env() == :prod do
  config :[app], [AppWeb].Endpoint,
    http: [port: String.to_integer(System.get_env("PORT", "4000"))]
end
```

**10. Set port in `config/dev.exs`:**
Read `config/dev.exs` and update the endpoint config to use port 4500:
```elixir
http: [ip: {127, 0, 0, 1}, port: 4500],
```

**11. Apply scaffold patches to `lib/[app]_web/components/layouts/root.html.heex`:**
Read the file. Apply these changes:
- Add `<.flash_group flash={@flash} />` inside `<body>` before `{@inner_content}`
- Update `<.live_title>` suffix from "Phoenix Framework" to the project name

**12. Remove Phoenix boilerplate:**
```bash
rm -f lib/[app]_web/controllers/page_controller.ex
rm -f lib/[app]_web/controllers/page_html.ex
rm -rf lib/[app]_web/controllers/page_html/
rm -f test/[app]_web/controllers/page_controller_test.exs
```

**13. Patch Swoosh email config to prevent hackney errors:**

Read `config/dev.exs` and add at the bottom:
```elixir
config :swoosh, :api_client, false
```

Read `config/test.exs` and add at the bottom:
```elixir
config :swoosh, :api_client, false
config :[app], [App].Mailer, adapter: Swoosh.Adapters.Test
```

**14. If Playwright is enabled, install browser binaries (check first):**
```bash
# Use command -v instead of npx to avoid the interactive install prompt
if command -v playwright > /dev/null 2>&1; then
  PW_BIN="playwright"
elif [ -f "./node_modules/.bin/playwright" ]; then
  PW_BIN="./node_modules/.bin/playwright"
else
  PW_BIN=""
fi

if [ -n "$PW_BIN" ]; then
  echo "[x] Playwright CLI ($($PW_BIN --version 2>/dev/null))"
else
  echo "[ ] Playwright CLI not found on PATH"
fi

case "$(uname -s)" in
  Darwin)               PW_CACHE="$HOME/Library/Caches/ms-playwright" ;;
  MINGW*|MSYS*|CYGWIN*) PW_CACHE="${LOCALAPPDATA:-$HOME/AppData/Local}/ms-playwright" ;;
  *)                    PW_CACHE="$HOME/.cache/ms-playwright" ;;
esac

if ls "$PW_CACHE/chromium-"* > /dev/null 2>&1; then
  echo "[x] Chromium browser binary — already installed"
else
  echo "[ ] Chromium binary not found — installing..."
  npx playwright install chromium
fi
```

**15. Verify compilation:**
```bash
mix compile
```
If compile fails, fix the errors before proceeding.

**16. Verify dev server starts and assets compile:**
```bash
PORT=4500 mix phx.server &
SERVER_PID=$!
sleep 6
/usr/bin/curl -s -o /dev/null -w "%{http_code}" http://localhost:4500
kill $SERVER_PID 2>/dev/null
```

---

## Phase 5b: Write `.mcp.json`

Settings were already written in Phase 4. This phase writes only the MCP server configuration, which depends on the port determined during scaffold.

Write `.mcp.json` in the current directory.

**Platform detection**: Before writing, check the OS. On Windows, `npx` is a `.cmd` script and must be invoked through `cmd`:
- **Windows**: `"command": "cmd"` with `"args": ["/c", "npx", ...]`
- **macOS/Linux**: `"command": "npx"` with `"args": [...]`

Use this bash check to set the shape:
```bash
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]] || command -v cmd.exe &>/dev/null; then
  # Windows — wrap npx with cmd /c
  NPX_CMD="cmd"
  NPX_PREFIX='"/c", "npx",'
else
  NPX_CMD="npx"
  NPX_PREFIX=""
fi
```

**For Elixir stack** (Tidewave served by Phoenix over SSE):

macOS/Linux:
```json
{
  "mcpServers": {
    "tidewave": {
      "type": "sse",
      "url": "http://localhost:[chosen-port]/tidewave"
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--caps=vision"]
    }
  }
}
```

Windows:
```json
{
  "mcpServers": {
    "tidewave": {
      "type": "sse",
      "url": "http://localhost:[chosen-port]/tidewave"
    },
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "@playwright/mcp@latest", "--isolated", "--caps=vision"]
    }
  }
}
```

**For JavaScript stack** (Tidewave runs as a standalone stdio process via the Vite plugin):

macOS/Linux:
```json
{
  "mcpServers": {
    "tidewave": {
      "command": "npx",
      "args": ["tidewave", "mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--caps=vision"]
    }
  }
}
```

Windows:
```json
{
  "mcpServers": {
    "tidewave": {
      "command": "cmd",
      "args": ["/c", "npx", "tidewave", "mcp"]
    },
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "@playwright/mcp@latest", "--isolated", "--caps=vision"]
    }
  }
}
```

> Tidewave for Elixir is served by the running Phoenix app — it won't respond until `mix phx.server` is running.
> Tidewave for JavaScript runs as a standalone stdio process in the project directory — available as soon as Claude Code restarts.

---

## Phase 6: Initial Commit

Git was initialized in Phase 4. Commit the full scaffold now:
```bash
git add -A && git commit -m "mvp: initialize [project-name] with [stack]"
```

---

## Phase 7: Write Brainstorm Document

1. Read the template: `${CLAUDE_SKILL_DIR}/templates/brainstorm-template.md`
2. Replace ALL `{{PLACEHOLDER}}` values with actual data from the brainstorm conversation
3. Write to `.mvp/brainstorm.md`

**CRITICAL**: Fill in every placeholder. Do NOT leave any `{{PLACEHOLDER}}` markers in the final document.

Specific fields:
- `{{PLAYWRIGHT_ENABLED}}`: "Yes (Playwright MCP)" or "No"
- `{{PLAYWRIGHT_RATIONALE}}`: brief reason for the choice
- `{{PLAYWRIGHT_GATE}}` in Phase 5: if enabled, add ` Browser tests pass for all screens.` Otherwise leave blank.
- Count all checkbox items across all phases for `{{TOTAL_TASKS}}`
- Phase 5 `{{CORE_FEATURE_TASKS}}`: make tasks specific to the user's app — not generic stubs

---

## Phase 8: Write state.json

Create `.mvp/state.json`:

```json
{
  "version": "1.1.0",
  "project": {
    "name": "[App Name]",
    "slug": "[slug]",
    "description": "[One-line description]",
    "stack": "js|elixir",
    "port": 4500,
    "brainstormFile": "brainstorm.md",
    "projectDir": ".",
    "playwrightEnabled": true|false,
    "serverManagement": "user|agent",
    "expressPort": 3500,
    "createdAt": "[ISO timestamp]",
    "updatedAt": "[ISO timestamp]"
  },
  "status": "building",
  "currentPhase": 1,
  "resumePoint": {
    "phaseId": "scaffold",
    "taskId": null,
    "nextAction": "Begin Phase 1 scaffold tasks",
    "lastCompletedTask": null,
    "recentFilesChanged": [],
    "openIssues": [],
    "notes": "Ready to begin Phase 1 tasks",
    "lastCompletedAt": null
  },
  "phases": [
    {
      "id": "scaffold",
      "name": "Project Scaffold & Foundation",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 15,
      "tasks": []
    },
    {
      "id": "data",
      "name": "Data Layer & Schema",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 20,
      "tasks": []
    },
    {
      "id": "tests",
      "name": "Test Scaffolding",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 20,
      "tasks": []
    },
    {
      "id": "design",
      "name": "Design Brief",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 10,
      "tasks": []
    },
    {
      "id": "core",
      "name": "Core Feature Implementation",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 45,
      "tasks": []
    },
    {
      "id": "polish",
      "name": "UI Polish & Remaining Screens",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 30,
      "tasks": []
    },
    {
      "id": "browser-test",
      "name": "Happy Path Browser Testing",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 20,
      "tasks": []
    },
    {
      "id": "integration",
      "name": "Integration & Smoke Test",
      "status": "pending",
      "startedAt": null,
      "completedAt": null,
      "estimatedMinutes": 25,
      "tasks": []
    }
  ],
  "analytics": {
    "totalTasks": [count],
    "completedTasks": 0,
    "failedTasks": 0,
    "agentSpawns": { "total": 0, "successful": 0, "failed": 0 },
    "qualityReviews": { "total": 0, "passed": 0, "failed": 0, "skipped": 0 },
    "browserTests": { "total": 0, "passed": 0, "failed": 0 },
    "gitCommits": 1,
    "sessionLog": [
      {
        "sessionId": "start-1",
        "mode": "start",
        "startedAt": "[ISO timestamp]",
        "endedAt": "[ISO timestamp]",
        "tasksCompleted": 0
      }
    ]
  },
  "processes": {
    "devServer": { "pid": null, "port": [chosen-port] },
    "expressServer": { "pid": null, "port": [expressPort] },
    "subagentPids": []
  },
  "locks": {
    "migrations": false,
    "design": false,
    "dependencies": false
  }
}
```

**CRITICAL**: Populate each phase's `tasks` array by reading the brainstorm document's Implementation Phases section. Each checkbox item becomes:
```json
{
  "id": "scaffold-1",
  "name": "Task description from checkbox",
  "status": "pending",
  "mainAgentOnly": false,
  "lowRisk": false,
  "startedAt": null,
  "completedAt": null,
  "agentSpawn": null,
  "qualityReview": null,
  "browserTest": null,
  "filesChanged": []
}
```

Set `mainAgentOnly: true` for tasks involving dependency installs, migrations, server management.
Set `lowRisk: true` for tasks like README writing, CSS appends, file deletions — these skip the quality review agent.

---

## Phase 9: Show Completion Summary

```
MVP project initialized!

  Project: [App Name]
  Stack:   [Stack Name]
  Port:    [port]
  Dir:     . (current directory)

  Brainstorm:  .mvp/brainstorm.md
  State:       .mvp/state.json

  Phases: 8  |  Total tasks: [N]

  What was created:
    [x] .mvp/ directory with brainstorm doc and state file
    [x] [Stack] project scaffolded in current directory
    [x] Dev server verified working (port [port])
    [x] Git repo initialized with initial commit
    [x] .claude/settings.local.json — tool permissions pre-approved
    [x] .mcp.json — Tidewave + Playwright MCP servers configured

  E2E Testing:    [Playwright MCP (Chromium installed) / disabled]
  Server:         [User-managed / Agent-managed]
```

Then show this restart notice as a clearly separated block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Action required before building
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MCP servers (Tidewave + Playwright) and tool permissions
  are configured but will not take effect until Claude Code
  is restarted in the project directory.

  Before you exit:
    Copy the --resume command shown below so you can
    continue this conversation after restarting.

  To restart:
    1. Copy the resume command (shown by Claude Code on exit)
    2. claude --resume <session-id>
       (run this from the same project directory)

  Once restarted, run:
    /mvp build

  Tidewave note: The Tidewave MCP server is served by your
  app at http://localhost:[port]/tidewave. It will become
  available once the dev server starts during /mvp build.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Execute Now

Begin with Phase 1 (check for existing state), then proceed through each phase sequentially.
