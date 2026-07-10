# TypeScript/React Conventions Reference

This file is read by the `/mvp build` orchestrator at the start of each build session when the stack is JavaScript (Vite + TypeScript + React 19 + TailwindCSS 4). The contents are injected into every agent prompt under a `## TypeScript/React Conventions — MANDATORY` section.

---

## Mandatory Rules for Every Agent

Include this block verbatim in all TypeScript/React agent prompts:

```
## TypeScript/React Conventions — MANDATORY

**TypeScript:**
- NEVER use `any` type — use `unknown` and narrow, or define a proper type/interface
- ALWAYS read an existing file with the Read tool before modifying it
- Only use Write directly for files that do not yet exist

**Paths and working directory:**
- NEVER use absolute paths — no `/Users/...`, no `~/...`
- ALWAYS use relative paths: `src/pages/Home.tsx`, `server/db/schema.ts`
- You are already in the project root — do NOT `cd` to absolute paths
- If a command must run in a subdirectory, use `cd subdir && command` with a relative path only

**`verbatimModuleSyntax` and `import type`:**
- `tsconfig.json` uses `"verbatimModuleSyntax": true` — type-only exports are stripped at bundle time
- ALWAYS import types and interfaces with `import type { ... }` — NEVER mix types into value imports
- WRONG: `import { api, FormDetail, FormPage } from '../lib/api'`
- CORRECT:
  ```ts
  import { api } from '../lib/api'
  import type { FormDetail, FormPage } from '../lib/api'
  ```
- This applies to third-party libraries too — if a lib exports `export type Foo`, use `import type { Foo }`
- Violating this causes a blank page at runtime with no obvious error (only visible in browser console)

**Components:**
- Use functional components only — no class components
- Keep component files focused: one primary export per file
- Co-locate types with the component that owns them

**Navigation:**
- Use React Router `<Link to="...">` and `useNavigate()` — never `window.location`
- Use slug-based URLs for all user-facing routes — UUID-based routes are for internal/admin use only

**Forms:**
- Use React 19 Form Actions and `useActionState` for form handling — not manual `useState` + handlers
- See the react-19 engineering skill for full API reference

**Styling:**
- Use TailwindCSS 4 utility classes — no inline styles unless dynamically computed
- `@import "tailwindcss"` is the entry point in `src/index.css` — no config file needed in v4

**Database (Drizzle ORM + better-sqlite3):**
- Define schemas in `src/db/schema.ts`
- Use `drizzle-kit push` to apply schema changes during development (no migration files needed)
- Keep all DB access in `src/lib/db/` — never query directly from components
- NEVER call database functions inside `.filter()`, `.map()`, or `.reduce()` callbacks — all DB calls must be at the top level of async functions

**Seed data:**
- Make all seed scripts idempotent — check for existence before inserting:
  ```ts
  const existing = db.select().from(schema.forms).where(eq(schema.forms.slug, 'my-form')).get()
  if (!existing) { await db.insert(schema.forms).values(...) }
  ```
- Always seed complete child rows (e.g., seed `answers` when you seed `responses`) so related screens feel real during demos

**API URL contracts:**
- All API routes (method, path, purpose) must be defined in the brainstorm doc before any agent starts
- The server agent and the API client agent MUST use the same paths — no improvising
- Consider a `src/lib/routes.ts` constants file imported by both Express routes and the fetch client

**Tidewave (app introspection):**
- Tidewave MCP is available — use it to inspect the running application state
- Use `mcp__tidewave__*` tools to verify DB contents, check API responses, and confirm server behavior
- Do NOT read source files when Tidewave can answer the question directly

**Shared types (`server/lib/types.ts`):**
- Types shared between server API responses AND client state MUST be defined in `server/lib/types.ts` — never duplicated across files
- Server route imports: `import type { ... } from '../lib/types'`
- Client imports: `import type { ... } from '../../server/lib/types'`
- Defining the same shape in two places is a bug waiting to happen — a field rename or type change in one breaks the other silently

**API response shape — mutations must return the full resource:**
- `PATCH`, `PUT`, and `POST` endpoints MUST return the same shape as the corresponding `GET` for that resource — the full nested object, not just the raw DB row or `{ id }`
- Clients must be able to call `setState(await api.things.update(...))` without any reshaping
- Returning a raw DB row from a mutation causes crashes when the client attempts to use nested fields that the DB row doesn't contain

**Express route ordering:**
- Parameterized routes (`:id`, `:slug`) MUST be declared AFTER any literal path segments at the same level
- WRONG: `router.get('/:id', ...)` declared before `router.get('/stats', ...)`
- CORRECT: `router.get('/stats', ...)` then `router.get('/:id', ...)`
- Violating this causes literal paths to be captured as parameter values — easy to miss in tests that only use numeric IDs

**React event handler anti-patterns:**
- NEVER use `onChange + setTimeout(() => onSubmit())` to trigger a submission after a state update — this captures stale state and causes race conditions
- WRONG: `onChange={e => { setValue(e.target.value); setTimeout(() => handleSubmit(), 0) }}`
- CORRECT: pass the current value directly as an argument: `onChange={e => { const v = e.target.value; setValue(v); handleSubmit(v) }}`
- If a handler needs the latest value after a state update, pass it as a parameter — never read state on the next tick
```

---

## Stack Reference

### Project Structure
```
src/
  components/     # Shared UI components
  pages/          # Route-level page components
  lib/
    api.ts        # Typed fetch client — all types must use `export type`
  index.css       # TailwindCSS 4 entry point (@import "tailwindcss")
  main.tsx        # React entry point
  App.tsx         # Router setup
server/
  index.ts        # Express server
  db/
    schema.ts     # Drizzle schema definitions
    client.ts     # Drizzle db client
    seed.ts       # Idempotent seed script (must be idempotent)
    migrations/   # Generated by drizzle-kit
  lib/
    types.ts      # Shared types (server responses ↔ client state)
    routes.ts     # Express route path constants
```

### Tidewave Setup

Tidewave runs as a Vite plugin for dev-time app introspection. It is installed during scaffold as `tidewave` and added to `vite.config.ts`:

```ts
import tidewave from 'tidewave/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tidewave(),   // dev-only introspection MCP server — no-op in production
  ],
})
```

Tidewave runs as a standalone stdio MCP server (`npx tidewave mcp`) — it does not need Express middleware.

### `api.ts` Pattern — `export type` Required

Every type exported from `api.ts` must use `export type` so consumers know to use `import type`:

```ts
// src/lib/api.ts
export type FormDetail = {
  id: string
  slug: string
  title: string
}

export type FormPage = {
  id: string
  questions: Question[]
}

// Value export — imported normally
export const api = {
  forms: {
    list: () => fetch('/api/forms').then(r => r.json()),
    get: (slug: string) => fetch(`/api/forms/${slug}`).then(r => r.json()),
  }
}
```

Consumers:
```ts
import { api } from '../lib/api'
import type { FormDetail, FormPage } from '../lib/api'
```

### Port Reference

MVP uses non-default ports to avoid conflicts with other running applications:
- **Express API:** port `3500` (default is 3001 — too common)
- **Vite frontend:** port `3600` (default is 5173 — too common)

Always read ports from `state.json` — do NOT hardcode port numbers in application code. The server template uses `process.env.PORT || 3500` so the port can be overridden via environment variable.

At build session start, the main agent checks that these ports are free and reads stored PIDs to clean up any stale processes from previous sessions. Never kill processes by port (`lsof -ti:[port] | xargs kill`) — this kills by port regardless of ownership and can affect other applications.

### Quality Gate: TypeScript Check After Each Agent Phase

After every agent completes, run:
```bash
npx tsc --noEmit
```

Fix all type errors before the next phase begins. This catches `import type` violations, missing types, and dead code before they become runtime blank-page bugs.

### Vitest Test Patterns
```typescript
// src/lib/db/things.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createThing, listThings } from './things'

describe('things', () => {
  it('creates a thing with valid data', () => {
    const result = createThing({ name: 'Test' })
    expect(result.name).toBe('Test')
  })
})
```

### Playwright Smoke Test — First Steps

When Playwright is available, always run these steps first in Phase 7:
1. Navigate to the home route
2. Immediately check `browser_console_messages` — a blank page always has console errors that point to the root cause
3. Walk through the primary user flow once end-to-end
4. Take a final screenshot as a build artifact

---

<!-- Add new patterns here as real builds surface common issues. -->
