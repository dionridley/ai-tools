# Elixir/Phoenix Conventions Reference

This file is read by the `/mvp build` orchestrator at the start of each build session when the stack is Elixir. The contents are injected into every agent prompt under a `## Elixir/Phoenix Conventions — MANDATORY` section.

---

## Mandatory Rules for Every Agent

Include this block verbatim in all Elixir agent prompts:

```
## Elixir/Phoenix Conventions — MANDATORY

**Date formatting:**
- NEVER use `Calendar.strftime(date, "%-d")` — the `%-d` directive breaks on macOS/BSD
- ALWAYS use `date.day` directly: `"#{Calendar.strftime(date, "%B")} #{date.day}, #{date.year}"`

**Form errors:**
- NEVER call `Phoenix.HTML.Form.translate_error/1` — it is private/undefined in Phoenix 1.8
- Use `elem(error, 0)` for direct access, or the `<.error>` core component

**LiveView mounts:**
- ALWAYS assign `:page_title` in every `mount/3` or `handle_params/3`:
  `|> assign(:page_title, "Page Name")`

**Association preloading:**
- ALWAYS preload the full association chain required by the view
- Wrong: `Repo.preload([:tags])` when view renders `tag.category.color`
- Correct: `Repo.preload([tags: :category])`
- Read the render template before writing context functions to determine required depth

**Flash messages:**
- Flash is handled by `root.html.heex` — do NOT add `<.flash_group>` inside individual LiveView renders
- `put_flash/3` calls will display automatically via the root layout
- In Phoenix 1.8.x, `flash_group` lives in `MyAppWeb.Layouts`, NOT in `CoreComponents` — it is not auto-imported into LiveViews
- If you need to render flash manually: `alias MyAppWeb.Layouts` and call `<Layouts.flash_group flash={@flash} />`

**Navigation:**
- Use `~p"/path/#{id}"` verified route sigil for ALL internal paths — never hardcoded strings
- `push_navigate(socket, to: ~p"/path")` for cross-LiveView navigation
- `push_patch(socket, to: ~p"/path?#{params}")` for same-LiveView param changes (modals, filters)

**Forms and submission:**
- Add `phx-disable-with="Saving..."` on all submit buttons for loading state feedback

**Reading before writing:**
- ALWAYS read an existing file with the Read tool before modifying it
- Only use Write directly for files that do not yet exist

**Paths and working directory:**
- NEVER use absolute paths — no `/Users/...`, no `~/...`
- ALWAYS use relative paths: `lib/my_app/things.ex`, `priv/repo/migrations/...`
- You are already in the project root — do NOT `cd` to absolute paths
- If a command must run in a subdirectory, use `cd subdir && command` with a relative path only

**Seed data:**
- Faker is available: `Faker.Person.name()`, `Faker.Internet.email()`, `Faker.Lorem.paragraph(2..3)`
- Make seeds idempotent: delete-then-insert so re-running doesn't error

**Swoosh email config:**
- ALWAYS add the following to `config/dev.exs` and `config/test.exs` at scaffold time to avoid hackney errors:
  - `dev.exs`: `config :swoosh, :api_client, false`
  - `test.exs`: `config :swoosh, :api_client, false` and `config :my_app, MyApp.Mailer, adapter: Swoosh.Adapters.Test`
- Omitting this causes `mix phx.server` and `mix test` to fail if hackney is not installed

**Compiler warnings:**
- ALWAYS run `mix compile` after writing or modifying a module and check for warnings, not just errors
- Do NOT add `@doc` before multiple clauses of the same function — only the first clause should have `@doc`
- Quality review must treat compiler warnings as failures

**Changing `signed_in_path`:**
- When changing the post-login redirect (e.g., from `~p"/"` to `~p"/dashboard"`), do a targeted search for redirect assertions in tests
- Categorize: tests that follow `signed_in_path` (update) vs. tests that assert hardcoded paths like logout's `~p"/"` (leave alone)
- Do this as a single targeted pass — never a global find-replace

**Tidewave (app introspection):**
- Tidewave MCP is installed as a dev dependency — use it to query live app state instead of reading source files
- Use `mcp__tidewave__*` tools to: check what records exist in the database, verify seeds ran correctly, call context functions, and inspect LiveView assigns
- Do NOT run raw SQL or read source files when Tidewave can answer the question directly
```

---

## Phoenix 1.8 Environment Reference

### Tidewave Setup

Add to `mix.exs` during scaffold (dev-only):
```elixir
{:tidewave, "~> 0.1", only: :dev}
```

Add to `lib/[slug]_web/router.ex` inside the `dev_routes` block:
```elixir
if Application.compile_env(:my_app, :dev_routes) do
  scope "/tidewave" do
    pipe_through :browser
    forward "/", Tidewave
  end
end
```

### What Ships by Default in Phoenix 1.8
- **DaisyUI 5.x** — `assets/vendor/daisyui.js`, use component classes: `btn`, `card`, `badge`, `modal`, `alert`, `input`, `select`, etc.
- **Heroicons** — `assets/vendor/heroicons.js`, use `<.icon name="hero-..." />` component
- **TailwindCSS 4.x** — configured via `assets/css/app.css` with `@plugin "../vendor/daisyui"` and `@plugin "../vendor/heroicons"`
- **LiveView** — already wired up, use `use MyAppWeb, :live_view`
- **`data-theme` attribute** — DaisyUI theming via HTML attribute on `<html>` tag

### Key File Locations
```
lib/[slug]/                       # Business logic — contexts, schemas
lib/[slug]_web/live/              # LiveView pages
lib/[slug]_web/components/        # Shared components (core_components.ex, layouts.ex)
lib/[slug]_web/router.ex          # Routes
priv/repo/migrations/             # Ecto migrations (timestamp-prefixed filenames)
priv/repo/seeds.exs               # Seed data
assets/css/app.css                # Tailwind + DaisyUI CSS entry point
assets/js/app.js                  # JS entry point
config/dev.exs                    # Dev config (port lives here)
config/runtime.exs                # Runtime config (prod port override — MUST be wrapped)
test/[slug]/                      # Context/unit tests
test/[slug]_web/live/             # LiveView interaction tests
test/support/factory.ex           # Test data factory helpers
```

### Writing Migration Files Directly
Skip `mix ecto.gen.migration` (produces empty files requiring a read-edit cycle). Write migration files directly using the `Write` tool.

Generate timestamp:
```bash
date -u +"%Y%m%d%H%M%S"
```

Filename: `priv/repo/migrations/[timestamp]_create_[table].exs`

```elixir
defmodule MyApp.Repo.Migrations.CreateThings do
  use Ecto.Migration

  def change do
    create table(:things) do
      add :name, :string, null: false
      add :description, :text
      add :status, :string, default: "active"

      timestamps()
    end

    create index(:things, [:status])
  end
end
```

### Code Patterns Reference

For screen-building agents in `core` and `polish` phases, also load `${CLAUDE_SKILL_DIR}/references/conventions/elixir-patterns.md` which contains:
- Standard LiveView pattern
- Standard Context pattern
- ExUnit and LiveView test patterns
- Factory pattern
- DaisyUI Component Quick Reference
