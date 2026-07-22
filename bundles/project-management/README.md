# Project Management Plugin

A structured project management system for coding agents — Claude Code and other Agent Skills harnesses such as Pi — that provides organized workflows for research, requirements documentation (PRDs), and implementation planning.

## Features

- **Organized Directory Structure**: Standardized `_project/` folder with subdirectories for plans, PRDs, research, and documentation
- **Research Workflow**: Standard and Deep research paths with claim verification, producing canonical markdown plus a portable offline HTML microsite per report
- **PRD Creation**: Comprehensive Product Requirements Documents with all critical sections
- **Implementation Planning**: Detailed, phase-based plans with sequential numbering and tracking
- **Iterative Plan Refinement**: Refine existing plans with extended thinking while preserving structure and number
- **Plan Lifecycle**: Move plans through draft → in-progress → completed stages
- **One-Command Shipping**: `/dr-ship` verifies a finished plan, backfills the retro, archives it, commits, pushes, and opens a PR populated from the plan summary
- **Language Agnostic**: Works with any programming language or framework
- **Git-Friendly**: All files are markdown for easy version control

## Installation

See the [repository README](../../README.md) for per-harness installation instructions (Claude Code marketplace add, Pi git install).

## Quick Start

1. **Initialize your project** with the standard directory structure:
   ```bash
   /dr-init
   ```

2. **Conduct research** on a topic (10-15 line prompts recommended):
   ```bash
   /dr-research I need to research authentication best practices for Node.js applications.
   Focus on JWT vs session-based auth, password hashing algorithms, rate limiting,
   and protection against common attacks like CSRF, XSS, and session fixation.
   Include comparison of popular libraries and their security track records.
   Target audience: production web applications handling sensitive user data.
   ```

3. **Create a PRD** for your feature:
   ```bash
   /dr-prd User authentication system supporting email/password login and OAuth providers.
   Need password reset, email verification, session management, and MFA support.
   Must handle 10,000+ concurrent users with sub-100ms response times.
   Security is critical - must meet OWASP Top 10 requirements.
   Integration with existing Express.js backend and React frontend.
   ```

4. **Create an implementation plan** (optionally reference the PRD):
   ```bash
   /dr-plan Implement the authentication system as specified in the PRD.
   @_project/prd/user-authentication-system.md
   Start with core email/password flow, then add OAuth in phase 2.
   Backend is Express.js with PostgreSQL. We have 3 weeks for initial release.
   ```

5. **Refine the plan** if needed (optional but recommended):
   ```bash
   /dr-plan @_project/plans/draft/001-authentication-system.md Add more detail to Phase 3 about password hashing and add security best practices section
   ```

6. **Move plan to in-progress** when ready to implement:
   ```bash
   mv _project/plans/draft/001-authentication-system.md _project/plans/in_progress/
   ```
   Or simply ask Claude to move it - Claude will handle the move automatically when appropriate.

## Commands

### `/dr-init`

Initializes or updates project with the standard directory structure, a canonical AGENTS.md, and a CLAUDE.md pointer. As of v1.6.0, this is a **Skill 2.0** (`skills/dr-init/`) rather than a command — invocation is unchanged, internals are significantly upgraded.

**Usage:**
```bash
/dr-init
```

**What it does:**
- Creates `_project/` directory with subdirectories:
  - `docs/` - Technical documentation
  - `plans/draft/` - Plans being reviewed
  - `plans/in_progress/` - Plans actively being implemented
  - `plans/completed/` - Completed plans
  - `prd/` - Product Requirements Documents
  - `resources/` - User-provided reference materials
  - `research/` - Research documentation (markdown + portable HTML microsites)
- Creates `.gitkeep` files in all leaf directories for git tracking
- Generates **AGENTS.md** (the canonical agent-guidance file carrying the versioned plugin sections) and **CLAUDE.md** as a thin pointer to it — the same content serves Claude Code and any harness that reads AGENTS.md
- **Scope** — only manages plugin-specific sections (plan workflow, available commands, task completion protocol). For codebase-specific documentation (architecture, build/test/lint commands, coding conventions), run Claude Code's built-in `/init` alongside `/dr-init`
- **Three detection states**:
  - *Fresh* — no `AGENTS.md` and no `CLAUDE.md`: scaffolds everything from scratch
  - *Already initialized* — plugin marker present: verifies structure, compares section versions, offers a diff-preview of any outdated or missing sections before updating. A marker in CLAUDE.md with no AGENTS.md identifies a pre-3.0.0 project — /dr-init offers the conversion to AGENTS.md + pointer, and the `_claude/` → `_project/` directory rename
  - *Has guidance files, no plugin structure* — shows a full preview of what will be appended and asks before writing
- **Diff preview** before any update to existing files
- **Git safety preflight** — warns if `AGENTS.md`/`CLAUDE.md` has uncommitted changes before modifying it. The skill never runs state-modifying git commands except the user-approved `git mv _claude _project` migration; commits are your responsibility
- **Cross-platform** — uses native Claude Code tools (`Read`/`Write`/`Edit`/`Glob`) for all filesystem operations; works identically on Windows, macOS, and Linux
- **Idempotent** - safe to run multiple times

### `/dr-research`

Conducts structured research and produces canonical markdown plus a **portable HTML microsite** view. As of v2.0.0 there are two research paths — **Standard** (fast, default) and **Deep** (adds discovery and claim verification) — sharing the same mandatory output discipline. As of v3.2.0 the microsite uses **shared versioned corpus assets** (one `_project/research/assets/v1/` serving every report), maintains a **corpus index** landing page, opens diagrams in a **pan-zoom overlay**, and adds a filesystem-only **repair mode**.

**Usage:**
```bash
/dr-research [detailed research prompt]
```

**Interactive mode** (if no arguments provided):
```bash
/dr-research
```
Claude will ask for research details.

**Deep path** (say so in the prompt, or accept the suggestion when the ask is decision-critical):
```bash
/dr-research deep research: should we migrate our auth to [provider]? ...
```

**Deep-dive follow-up** (reference an existing research directory):
```bash
/dr-research go deeper on webhook reliability _project/research/stripe-integration-2026-01-15/
```

**Repair mode** (filesystem-only, no web access — verifies/restores the shared assets and brings the corpus index to completeness):
```bash
/dr-research repair
```

**Example:**
```bash
/dr-research Research microservices architecture patterns for e-commerce platforms.
Need to understand service decomposition strategies, inter-service communication
(REST vs gRPC vs message queues), data consistency patterns (saga, 2PC),
service discovery, API gateway patterns, and deployment orchestration.
Focus on handling 100k+ daily transactions with high reliability.
Include case studies from major platforms and common pitfalls to avoid.
```

**How it works:**

1. **Path choice + plan approval** — Standard runs from your prompt; Deep starts with a short discovery exchange (what decision this feeds, priorities, out-of-scope, what you already believe) and presents priority-ordered questions with disqualifiers first. Either way you approve a structured plan before any research runs.

2. **Research execution** — Claude runs the approved plan using parallel web searches where appropriate, citing as it goes. On the Deep path it identifies the 3–6 load-bearing claims and verifies each one (primary source → independent second source → adversarial search → recency check). It works to completion without interrupting you except in rare cases (the research premise is wrong, or a discovery fundamentally changes direction).

3. **Synthesis** — Mandatory discipline on both paths: the index opens with a direct answer block (verdict + confidence + exceptions); decision-bearing facts are cited where asserted; unmeasured numbers are tagged `(estimated, not measured)`; Gaps & Limitations and Open Questions (including at least one premise-level question) are required. Deep adds a claim ledger table with per-claim verdicts. Diagrams must earn their place (no TOC mindmaps, no speculative Gantt charts).

4. **HTML generation** — Every `.md` gets a `.html` sibling. All reports share one versioned assets folder (`_project/research/assets/v1/` — created on the corpus's first run, frozen once published; future template overhauls mint `v2` while old reports keep rendering against `v1`), and the corpus index (`_project/research/index.md` + `.html`) gains or updates this report's entry on every run. The microsite works offline over `file://`, with five color palettes, light/dark mode, width modes, an in-page TOC on long pages, and a pan-zoom overlay for diagrams (wheel-zoom, drag-pan, + / − / reset controls). Markdown stays canonical — `/dr-prd` and `/dr-plan` keep consuming the `.md` files.

5. **Summary** — A concise completion message with the answer, key findings, a "What surprised me" insight, suggested deep-dive topics (when warranted), and contextual follow-up actions.

**Output structure:**

- `index.md` / `index.html` — Answer block, key takeaways, file navigation
- `findings.md` / `findings.html` — Core analysis with point-of-claim citations, claim ledger (Deep), gaps, open questions
- `resources.md` / `resources.html` — Bibliography of all sources consulted
- `recommendations.md` / `recommendations.html` — Decision research only: recommendation, risk table, decision gates
- `_project/research/assets/v1/` — Shared corpus assets (styles, scripts, fonts — versioned and frozen, reused by every report; reports generated before 3.2.0 keep their own untouched `assets/` copy)
- `_project/research/index.md` / `index.html` — Corpus index: every report, newest first (linked title, date, one-line answer)
- Topic files only when they carry a standalone artifact (scored matrix, schema, runnable guide) or you ask for one

**Deep-dive follow-ups** produce a `deep-dives/[slug]-[date]/` subfolder within the original research, with back-links to the parent, a "Deep Dives" section added to the parent's `index.md`, and supersession patches when the deep dive overturns a parent conclusion.

### `/dr-prd`

Creates or refines a Product Requirements Document with a structured discovery phase, adaptive sections per feature type, and safe refinement with backup, diff preview, and linked-plan detection. As of v1.7.0, this is a **Skill 2.0** (`skills/dr-prd/`) rather than a command — invocation is unchanged, internals are substantively upgraded.

**Usage (CREATE mode):**
```bash
/dr-prd [feature description]
```

**Interactive mode:**
```bash
/dr-prd
```

**Usage (REFINE mode):**
```bash
/dr-prd @_project/prd/[file].md [refinement request] [--no-confirm]
```

**Example (traditional feature):**
```bash
/dr-prd Real-time notification system for our social media app.
Support push notifications, in-app notifications, and email digests.
Must handle notification preferences, delivery tracking, and read receipts.
Target 1M+ users with <500ms delivery latency.
```

**Example (AI feature):**
```bash
/dr-prd AI-powered reply drafter for our customer support inbox.
Drafts a reply from the customer message, our KB, and similar tickets.
Agents edit before sending — never auto-send. Factual accuracy against
the KB, warm + concise tone, and no hallucinated features are the must-haves.
```

**How it works:**

1. **Clarifying phase** — hybrid fixed core (problem, users, success metrics, feature type) plus adaptive follow-ups. Compresses automatically when your description is already rich. Designed to prevent generic, hallucinated, or shallow PRDs. If your answers stay thin on the core questions, the skill surfaces a non-blocking nudge (run `/dr-research`, brainstorm, share `@path` references, or proceed and flag assumptions).

2. **Feature-type detection** — infers one of `user-facing`, `internal-tool`, `infra`, `ai-feature`, or `spike`, confirms with you, then adapts the template. AI features get additional sections: Model & Constraints, Prompt Spec, Eval Rubric (replacing Acceptance Criteria), Performance Budgets, and Guardrails.

3. **Drafting** — populates the base template with a Problem → Hypothesis → Success Metrics framing, testable Acceptance Criteria that `/dr-plan` consumes directly, and Open Questions in `owner: X, needs by: Y` format. Only incorporates research or context you reference explicitly via `@path` — the skill never proactively searches `_project/research/`.

4. **REFINE mode** — automatic backup, diff preview, explicit confirmation (Apply / Show Diff / Cancel), status-aware warnings (Draft / Under Review / Approved / Superseded), and bidirectional linked-plan detection. PRDs written under the old template are refined without structural change unless you explicitly request migration (e.g., "migrate this to the new template").

**Output location:** `_project/prd/[feature-slug].md`

**Base template sections:**
- Metadata (status, version, dates, author, feature type)
- Problem Statement
- Hypothesis (with a testable signal)
- Success Metrics
- User Stories
- Functional Requirements (Core + optional Enhancements)
- Acceptance Criteria (testable bullets for `/dr-plan`) — replaced by Eval Rubric for AI features
- Technical Considerations
- Dependencies
- Release Strategy (one-liner; detailed delivery planning lives in `/dr-plan`)
- Risks and Mitigation
- Open Questions (with owner and due-by)
- References
- Refinement History

**AI-feature overlay (when detected):**
- Model and Constraints (primary + fallback model, context window, streaming, output shape)
- Prompt Spec (system prompt draft, input/output schemas, optional few-shot)
- Eval Rubric (dimensions with measurable targets and measurement methods, plus a regression threshold)
- Performance Budgets (p50/p95/p99 latency, cost-per-query, token caps, breach policy)
- Guardrails (must-refuse categories, refusal style, jailbreak resistance, PII, content moderation)

### `/dr-plan`

Creates or refines detailed implementation plans with per-phase acceptance criteria, verification gates, adaptive templates, and autonomous completion. Supports four modes: CREATE / REFINE / SUMMARY / QUESTION RESOLUTION. As of v1.8.0, this is a **Skill 2.0** (`skills/dr-plan/`) rather than a command — invocation is unchanged, internals are substantively upgraded.

**CREATE Mode - Usage:**
```bash
/dr-plan [detailed implementation context - 10-15 lines]
```

**With PRD reference:**
```bash
/dr-plan [context] @_project/prd/feature-name.md
```

**Create directly in in-progress:**
```bash
/dr-plan [context] --in-progress
```

**Interactive mode:**
```bash
/dr-plan
```

**REFINE Mode - Usage:**
```bash
/dr-plan @plan-file [refinement request]
```

**With flag to skip confirmation:**
```bash
/dr-plan @plan-file [refinement request] --no-confirm
```

**SUMMARY Mode - Generate PR Summary:**
```bash
/dr-plan @plan-file summary
```

**SUMMARY Mode - Generate and push to GitHub PR:**
```bash
/dr-plan @plan-file summary https://github.com/owner/repo/pull/123
```

**QUESTION RESOLUTION Mode - Answer Plan Questions:**
```bash
/dr-plan @plan-file answer questions
```

**CREATE Example:**
```bash
/dr-plan Implement real-time notification system as specified in PRD.
@_project/prd/notification-system.md
Start with core WebSocket infrastructure and basic push notifications.
Backend is Node.js with Redis for pub/sub. Frontend uses React with Socket.io.
Phase 1: WebSocket server and connection management (1 week)
Phase 2: Push notification integration for iOS/Android (1 week)
Phase 3: Email digests and admin dashboard (1 week)
Must support 10k concurrent WebSocket connections initially.
```

**REFINE Examples:**
```bash
# Add OAuth support to existing auth plan
/dr-plan @_project/plans/draft/001-authentication-system.md Add OAuth 2.0 support with Google and GitHub providers

# Add more detail to specific phase
/dr-plan @_project/plans/draft/001-auth.md Add detailed code examples and security best practices to Phase 3

# Minor adjustment to in-progress plan
/dr-plan @_project/plans/in_progress/003-database-migration.md Add Redis dependency to requirements section

# Skip confirmation for quick updates
/dr-plan @_project/plans/draft/002-api.md Fix typo in Phase 2 tasks --no-confirm
```

**SUMMARY Examples:**
```bash
# Generate PR summary for copying manually
/dr-plan @_project/plans/in_progress/003-database-migration.md summary

# Generate and push summary directly to a GitHub PR
/dr-plan @_project/plans/in_progress/003-database-migration.md summary https://github.com/myorg/myrepo/pull/42
```
When a PR URL is provided:
- Validates the PR is open (blocks update on merged/closed PRs)
- Prompts for confirmation if the PR already has a description
- Sets the PR title to the commit message title and the description to the generated summary
- Displays the full commit message (title + bullets) for your merge/squash commit

**QUESTION RESOLUTION Examples:**
```bash
# Resolve open questions in a draft plan
/dr-plan @_project/plans/draft/001-authentication-system.md answer questions

# Can also use "resolve questions"
/dr-plan @_project/plans/draft/002-api.md resolve questions
```

**CREATE Mode - What it does:**
- Automatically assigns sequential plan number (001, 002, 003, etc.) by scanning ALL plan folders.
- If PRD referenced via `@_project/prd/[file].md`, the expanded PRD drives the plan's shape.
- **Detects plan type with silent default** — `standard-feature` applied silently; four overlays (`ai-feature`, `migration/infra/refactor`, `bug-fix`, `spike`) only announce-and-confirm when detection signals are present (keywords, repo signals, or PRD feature type).
- **Populates Definition of Done** from project config files (`AGENTS.md`, `CLAUDE.md`, `package.json`, `Cargo.toml`, etc.) — the test/lint/typecheck commands every phase must satisfy.
- **Structures every phase with four blocks:** Tasks / Verification (commands with expected output) / Acceptance Criteria (testable outcomes) / Phase Exit Gate (DoD check + optional verifier + agent self-review).
- **Annotates Phase Exit Gates adaptively** — each phase carries a `<!-- verifier-recommendation: yes|no -->` comment based on risk/complexity. Spawn-verifier tasks render only when the recommendation is yes (or when Verification Policy is set to `Always`).
- **Emits autonomous completion instructions** — every plan has `## Completion` and `## Retro` sections at the bottom. After the final Phase Exit Gate passes, the executing agent writes the retro and moves the file from `in_progress/` to `completed/` without prompting.
- Creates the plan at `_project/plans/draft/XXX-plan-name.md` (or `in_progress/` with `--in-progress`).

**REFINE Mode - What it does:**
- **Reads existing plan**: Analyzes current structure, phases, and content
- **Uses extended thinking**: Deeply analyzes both the existing plan and your refinement request
- **Generates refined plan**: Applies requested changes intelligently while preserving what works
- **Shows diff summary**: Lists additions, modifications, and deletions
- **Requires confirmation**: Shows changes and asks Apply/Show Diff/Cancel (unless --no-confirm)
- **Status-aware behavior**:
  - **Draft plans**: All changes allowed
  - **In-progress plans**: Warns about major changes, suggests moving back to draft for restructuring
  - **Completed plans**: Refuses to modify (historical records)
- **Preserves metadata**: Keeps plan number, slug, and core structure
- **Adds refinement note**: Documents when and why plan was refined

**SUMMARY Mode - What it does:**
- **Generates PR summary**: Creates a GitHub-ready Pull Request description from the plan
- **Creative formatting**: Uses tables, emojis, mermaid diagrams, and collapsible sections as appropriate
- **Direct GitHub update**: Optionally pass a PR URL to push the summary directly to the PR via `gh pr edit`
- **PR validation**: Checks the PR is open before updating; prompts before overwriting existing descriptions
- **Copyable output**: Without a PR URL, wraps output in a code fence so you can copy the raw markdown
- **Comprehensive content**: Includes summary, changes, test plan, and notes for reviewers

**QUESTION RESOLUTION Mode - What it does:**
- **Interactive Q&A**: Guides you through resolving uncertain assumptions and open questions
- **Prioritizes blocking questions**: Resolves questions marked `[AWAITING]` first
- **Updates plan file**: Marks resolved questions with `[DECIDED: date]` and documents decisions
- **Tracks progress**: Shows summary of resolved vs. remaining items

**Plan Numbering:**
- Plans are numbered sequentially: 001, 002, 003, ..., 999, 1000, ...
- Numbers are preserved when moving between folders
- Finds highest number across ALL folders (handles case where all plans are in completed/)

### Tuning the plan verifier

`/dr-plan` ships with a dedicated verifier agent at `agents/plan-verifier.md`. It runs at Phase Exit Gates (always under `Verification Policy: Always`, or per-phase under the default `Adaptive`) to independently evaluate whether a phase actually completed — it reads the code, runs the Verification commands, and reports PASS / FAIL / UNVERIFIED per task and Acceptance Criterion. It never modifies code or plans; tool access is restricted to `Read / Grep / Glob / Bash` at the tool level, not just the prompt level.

The agent is a deliberate iteration surface. Common tuning dimensions: skepticism level (how readily `UNVERIFIED` is chosen over `PASS`), evidence thresholds (what counts as direct evidence vs. inference), and the scope boundary (keeping it out of architecture advice). Contributions welcome via PR.

### `/dr-ship`

Ships a finished plan end-to-end: verifies completion, closes the plan out, commits, pushes, and opens a GitHub PR populated from the plan summary. Explicit invocation only — it never auto-triggers, because it pushes and publishes.

**Usage:**
```bash
# Auto-detect the plan in _project/plans/in_progress/
/dr-ship

# Explicit plan file
/dr-ship @_project/plans/in_progress/003-database-migration.md

# Add independent verification by the plan-verifier agent before closing out
/dr-ship --verify
```

**What it does:**

1. **Read-only preflight** — audits every Tasks / Verification / Phase Exit Gate / Success Criteria checkbox and unresolved `[AWAITING]` questions (done plans only: there is no WIP mode), and gathers all git state (branch, changes, remote, upstream, `gh`, existing PR). With `--verify`, the plan-verifier agent independently checks the final phase too. Nothing is edited or committed yet. If you're on `main`/`master` it stops and offers to create a branch first.
2. **Ship Report** — a deterministic, fixed-shape status panel: READINESS (checkbox counts, open questions, retro state) and SHIP PLAN (branch, staged files, push target, PR action). Same shape every run, so you can scan it in seconds.
3. **One short gate question** — just "Ship it / Adjust / Abort". With blocking items it becomes **Ship anyway** (the escape hatch: bulk-waives them with a dated `[WAIVED ...: shipped via /dr-ship escape hatch]` tag; checkboxes honestly stay unchecked) / **Finish first** / **Adjust** (individually-reasoned waivers, staging tweaks) / **Abort**. Aborting leaves the repo exactly as it was found.
4. **Closes out and ships** — after approval, with no further prompts: backfills the Retro from the plan's accumulated notes (auto-drafted, no extra question), sets `Status: completed`, moves the file to `completed/` so the archived plan rides in the same commit, then commits, pushes, and opens the PR. The PR body is generated with the same format rules as `/dr-plan summary` (single source of truth); if an open PR already exists for the branch, it's updated instead.
5. **Displays the squash-merge commit message** — always, at the end. Copy it into GitHub's merge box after reviewing the PR.

**Graceful degradation:** no GitHub remote, missing/unauthenticated `gh`, or a closed PR never fail the ritual — commit and push still run, and the PR body is displayed for manual paste (with a one-click GitHub compare URL when applicable).

**Cross-platform:** all git/gh operations use file-based message passing (`git commit -F`, `--body-file`) and POSIX-consistent commands — identical behavior on Windows, macOS, and Linux.

## Moving Plans Between Stages

Plans can be moved between `draft/`, `in_progress/`, and `completed/` folders using:

1. **Manual `mv` command:**
   ```bash
   mv _project/plans/draft/001-plan-name.md _project/plans/in_progress/
   mv _project/plans/in_progress/001-plan-name.md _project/plans/completed/
   ```

2. **Ask Claude:** Simply tell Claude to move a plan and it will handle it automatically (e.g., "move plan 001 to in-progress").

## Directory Structure

After running `/dr-init`, your project will have:

```
your-project/
├── _project/
│   ├── docs/              # Technical documentation
│   │   └── .gitkeep
│   ├── plans/
│   │   ├── draft/         # Plans being reviewed (DO NOT IMPLEMENT)
│   │   │   └── .gitkeep
│   │   ├── in_progress/   # Plans being implemented (ONLY THESE)
│   │   │   └── .gitkeep
│   │   └── completed/     # Finished plans (archive)
│   │       └── .gitkeep
│   ├── prd/               # Product Requirements Documents
│   │   └── .gitkeep
│   ├── resources/         # User-provided materials
│   │   └── .gitkeep
│   └── research/          # Research documentation
│       └── .gitkeep
├── AGENTS.md              # Canonical agent guidance (plugin-managed sections)
└── CLAUDE.md              # Thin pointer to AGENTS.md for Claude Code
```

## Workflow

### Typical Development Flow

1. **Research Phase**
   ```bash
   /dr-research [detailed research prompt about technology/approach]
   ```
   - Creates research documentation
   - Helps make informed decisions
   - Documents alternatives considered

2. **Requirements Phase**
   ```bash
   /dr-prd [detailed feature description]
   ```
   - Creates comprehensive PRD
   - Defines scope and requirements
   - Identifies success metrics

3. **Planning Phase**
   ```bash
   /dr-plan [implementation context] @_project/prd/feature.md
   ```
   - Creates plan in `draft/` folder
   - Automatically numbered (001, 002, etc.)
   - Review and refine the plan

4. **Refinement Phase** (optional but recommended)
   ```bash
   /dr-plan @_project/plans/draft/[plan-file].md [refinement request]
   ```
   - Add missing details or requirements
   - Enhance specific phases
   - Adjust time estimates
   - Add security considerations
   - Can be repeated multiple times

5. **Implementation Phase**
   ```bash
   mv _project/plans/draft/[plan-file].md _project/plans/in_progress/
   ```
   Or ask Claude to move the plan for you.
   - Moves plan to `in_progress/`
   - Now ready to implement
   - **IMPORTANT**: Only implement plans in `in_progress/`!

6. **Minor Adjustments During Implementation** (as needed)
   ```bash
   /dr-plan @_project/plans/in_progress/[plan-file].md [minor changes]
   ```
   - Small adjustments only (dependencies, clarifications)
   - Major changes should move plan back to draft first

7. **PR Summary** (before or after completion)
   ```bash
   # Display for manual copy
   /dr-plan @_project/plans/in_progress/[plan-file].md summary

   # Or push directly to a GitHub PR
   /dr-plan @_project/plans/in_progress/[plan-file].md summary https://github.com/owner/repo/pull/123
   ```
   - Generates GitHub-ready PR description
   - With a PR URL: updates the PR title and description directly
   - Without a PR URL: output is copyable markdown

8. **Ship Phase**
   ```bash
   /dr-ship
   ```
   - Verifies every checkbox in the plan is complete (waive what's genuinely not needed)
   - Backfills the retro and archives the plan to `completed/`
   - Commits, pushes, and opens a PR populated from the plan summary
   - Hands back the squash-merge commit message for GitHub's merge box

   Manual alternative: `mv _project/plans/in_progress/[plan-file].md _project/plans/completed/` and handle git yourself.

## Important Rules

### Plan Execution Rules

⚠️ **CRITICAL**:
- **NEVER** implement tasks from plans in `draft/` folder
- **ONLY** work on plans in `in_progress/` folder
- Draft plans are for review and refinement only
- If you need to work on a draft plan, move it to `in_progress/` first

### Prompt Best Practices

All commands support detailed multi-line prompts for best results:

✅ **GOOD** - Detailed, 10-15 line prompts:
```bash
/dr-research GraphQL federation architecture for microservices.
Need to understand schema composition, service boundaries, entity resolution,
query planning optimization, and error handling patterns.
Focus on Apollo Federation 2.5+ features and best practices.
Consider performance implications for 100+ requests/second.
Include tooling recommendations for development and production.
```

❌ **NOT IDEAL** - Single line without context:
```bash
/dr-research GraphQL federation
```

The more context you provide, the better Claude can analyze and produce comprehensive, thoughtful output using extended thinking.

## Examples

### Example 1: New Feature Development

```bash
# Research the technology
/dr-research WebSocket scaling patterns for Node.js applications handling
10k+ concurrent connections. Need to understand cluster mode, Redis pub/sub,
sticky sessions, connection management, heartbeat strategies, and
horizontal scaling approaches. Include AWS and Docker deployment patterns.

# Create requirements document
/dr-prd Real-time chat feature for customer support platform.
Support 1-on-1 conversations and group chats up to 50 participants.
Need typing indicators, read receipts, file attachments up to 10MB,
message history with search, and offline message queuing.
Must integrate with existing user auth and notification systems.

# Create implementation plan referencing the PRD
/dr-plan Implement real-time chat as specified in PRD.
@_project/prd/realtime-chat-feature.md
Use Socket.io with Redis adapter for multi-server support.
Existing stack: Express.js backend, React frontend, PostgreSQL database.
Have 4 weeks for initial release with basic features.

# Review and refine if needed
/dr-plan @_project/plans/draft/001-realtime-chat.md Add detailed error handling strategy and enhance security phase

# Start implementation (move to in_progress)
mv _project/plans/draft/001-realtime-chat.md _project/plans/in_progress/

# When done: verify, close out, commit, push, open the PR
/dr-ship
```

### Example 2: Technical Spike / Investigation

```bash
# Research without PRD or plan
/dr-research Database migration from PostgreSQL to MongoDB for our analytics service.
Need to understand data modeling differences, query pattern translation,
performance characteristics for time-series data, backup and restore procedures,
migration tooling options, and potential gotchas. We handle 100GB of analytics
data with 1M+ events per day. Focus on minimal downtime migration strategies.

# Review research, then create plan if moving forward
/dr-plan Migrate analytics service database from PostgreSQL to MongoDB based on
research findings. Start with data model redesign, then migrate historical data,
then switch over production traffic with blue-green deployment strategy.
```

## Tips

1. **Use Extended Thinking**: Commands automatically use extended thinking when you provide detailed prompts
2. **Reference Files**: Use `@path/to/file` syntax to reference PRDs or other files in your prompts
3. **Plan Numbering**: Plans auto-number sequentially - no need to manage numbers manually
4. **Moving Plans**: Use `mv` command or ask Claude to move plans between draft/in_progress/completed folders
5. **Git Tracking**: All documentation is markdown - commit plans and PRDs to version control
6. **Idempotent Init**: Safe to run `/dr-init` multiple times - it won't duplicate files
7. **PR Summaries**: Use `/dr-plan @plan.md summary` to generate PR descriptions, or add a PR URL to push directly to GitHub
8. **Resolve Questions Early**: Use `/dr-plan @plan.md answer questions` to resolve blocking questions before implementation
9. **Ship in One Command**: When a plan is finished, `/dr-ship` handles verification, retro, archiving, commit, push, and the PR in one pass

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes with a real project
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## Troubleshooting

### Skills not appearing after installation

**Problem**: After installation, the `dr-*` skills don't show up.

**Solutions**:
1. Verify the plugin is installed and enabled: run `claude plugin list` (CLI) or open `/plugins` (in-session UI)
2. Refresh the marketplace catalog: `claude plugin marketplace update ai-tools`
3. Restart the Claude Code session — plugins load at session start

### `/dr-init` says "already initialized" but structure is incomplete

**Problem**: Running init reports success but some folders are missing.

**Solution**: This is expected - init only reports what it created. Check the actual directories:
```bash
ls -la _project/plans/
```
If folders are truly missing, the command should have created them. Try running `/dr-init` again.

### Plan numbering skipped a number

**Problem**: Expected plan 003 but got 004.

**Explanation**: Plan numbers are determined by scanning all three folders (draft, in_progress, completed). If a plan 003 exists anywhere, even in completed/, the next plan will be 004. This is intentional to maintain chronological ordering.

### Can't find a plan file to move

**Problem**: Not sure where a plan file is located.

**Solutions**:
1. List all plans: `ls _project/plans/*/`
2. Search by name: `ls _project/plans/*/*.md | grep -i "auth"`
3. Ask Claude to find and move the plan for you

### PRD or Plan refinement not working

**Problem**: Refine mode doesn't detect my file.

**Solutions**:
1. Ensure path starts with `@`: `/dr-prd @_project/prd/my-feature.md [changes]`
2. For plans, path must include `_project/plans/`: `/dr-plan @_project/plans/draft/001-plan.md [changes]`
3. File must exist before refinement

### Extended thinking not being used

**Problem**: Output seems shallow or template-like.

**Solutions**:
1. Provide more detailed prompts (10-15 lines recommended)
2. Include specific context about your project, constraints, and requirements
3. Ask specific questions rather than generic requests

### Git not tracking empty directories

**Problem**: After cloning, `_project/` structure is incomplete.

**Explanation**: This is a git limitation. The `.gitkeep` files ensure directories are tracked. If missing:
```bash
/dr-init
```
This will recreate any missing directories and `.gitkeep` files.

### AGENTS.md or CLAUDE.md was modified unexpectedly

**Problem**: AGENTS.md or CLAUDE.md contents changed after running commands.

**Clarification**: `/dr-init` is the only part of this plugin that ever writes to `AGENTS.md` or `CLAUDE.md`, and it always shows a preview and asks for confirmation before writing. It modifies them in four cases, all user-approved:
1. **Fresh scaffold** — creates AGENTS.md from the plugin template and CLAUDE.md as its pointer when neither exists
2. **Section update** — rewrites plugin-managed sections in AGENTS.md when their version markers are outdated (diff shown first)
3. **Append** — adds plugin-managed sections to an existing AGENTS.md (plus the pointer note to CLAUDE.md) when no plugin structure exists yet (full preview shown first)
4. **Legacy conversion** — moves the plugin sections out of a pre-3.0.0 CLAUDE.md into AGENTS.md, leaving a pointer behind (diff shown first)

If either file changed without you running `/dr-init`, check `git log -- AGENTS.md CLAUDE.md` — a different tool, editor, or user likely made the change.

## Support

For issues, questions, or suggestions:
- File an issue on the repository
- Check existing documentation in this README
- Review the AGENTS.md file created by `/dr-init`

---

**Built for Claude Code, portable to Agent Skills harnesses** - Structured project management for modern software development
