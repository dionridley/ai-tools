# /mvp summary — Generate HTML Analytics Page

This file is loaded by the `/mvp` skill router when the user runs `/mvp summary`.

## Instructions for Claude

You are executing the SUMMARY mode of the `/mvp` skill. Your job is to generate a self-contained HTML analytics page from the project's state data.

---

## Phase 1: Load Data

1. **Read `.mvp/state.json`:**
   - If missing: Show error and STOP:
     ```
     No MVP project found in this directory.
     Run /mvp start to begin a new project.
     ```
   - If no tasks are completed: Show warning:
     ```
     No completed tasks yet. Run /mvp build to start building, then generate the summary.
     ```
     STOP.

2. **Read the brainstorm file** at `.mvp/[state.project.brainstormFile]` for project vision and notes.

3. **Read the HTML template** at `${CLAUDE_SKILL_DIR}/templates/summary-template.html`

---

## Phase 2: Compute Analytics Data

From `state.json`, compute all metrics for the HTML page:

### Project Overview
- Project name, description, stack
- Created date, completion date (if complete)
- Total elapsed time across all sessions
- Current status

### Phase Breakdown
For each phase:
- Name, status
- Task count (completed / total)
- Estimated time vs actual time
- Percentage complete

### Task Metrics
- Total tasks, completed, failed, skipped
- Completion rate as percentage
- Average time per task (actual minutes / completed tasks)

### Agent Statistics
- Total agents dispatched
- Success rate (successful / total)
- Average tasks requiring retry
- Most common failure reasons (from quality review notes)

### Quality Review Metrics
- Total reviews
- Pass rate (passed / total)
- Failure rate
- Retry counts

### Session Timeline
For each session in `analytics.sessionLog`:
- Session ID, mode (start/build)
- Start time, end time, duration
- Tasks completed during session

---

## Phase 3: Generate HTML

Take the template from `${CLAUDE_SKILL_DIR}/templates/summary-template.html` and replace all placeholder markers with computed data.

**CRITICAL**: The HTML must be completely self-contained:
- All CSS must be inline (in `<style>` tags)
- All JavaScript must be inline (in `<script>` tags)
- No external CDN links, fonts, or resources
- Must render correctly when opened as a local file in any browser

### Data Embedding

Embed the computed data as inline JSON in a `<script>` tag:
```html
<script>
const MVP_DATA = {
  project: { ... },
  phases: [ ... ],
  analytics: { ... },
  sessions: [ ... ]
};
</script>
```

The page's JavaScript reads `MVP_DATA` and renders the visualizations.

### Required Visualizations

1. **Overall Progress Ring** — Large circular progress indicator showing completion percentage

2. **Phase Progress Bars** — Horizontal bars for each phase:
   - Green = completed tasks
   - Blue = in-progress tasks
   - Gray = pending tasks
   - Red = failed tasks

3. **Time Tracking Chart** — For each phase:
   - Estimated time (lighter bar)
   - Actual time (darker bar overlaid)
   - Shows over/under estimation

4. **Agent Statistics Cards** — Summary cards showing:
   - Total agents dispatched
   - Success rate
   - Quality review pass rate
   - Total git commits

5. **Session Timeline** — Chronological list of sessions with:
   - Duration bars
   - Tasks completed per session
   - Mode (start/build)

6. **Task Detail Table** — Expandable table with every task:
   - Task name, phase, status
   - Start time, end time, duration
   - Agent ID (if delegated)
   - Quality review verdict
   - Files changed

### Design Requirements

- **Color scheme:** Dark theme with accent colors
  - Background: `#0f172a` (slate-900)
  - Cards: `#1e293b` (slate-800)
  - Text: `#e2e8f0` (slate-200)
  - Accent green: `#22c55e` (for success/completed)
  - Accent blue: `#3b82f6` (for in-progress)
  - Accent red: `#ef4444` (for failed)
  - Accent amber: `#f59e0b` (for warnings)

- **Layout:** Responsive grid, looks good from 768px to 1440px wide
- **Typography:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`)
- **Animations:** Subtle CSS animations for progress bars filling on page load

---

## Phase 4: Write the HTML File

Write the generated HTML to `.mvp/summary.html`.

Additionally, if the project has a suitable location for a web route:

**For JS stack:** Consider creating a `/summary` route in the React app that reads the same data. However, for v1, the standalone HTML file is sufficient.

**For Elixir stack:** Similarly, a standalone HTML file is sufficient for v1.

---

## Phase 5: Show Result

Resolve the **full absolute path** to the generated file so the user can copy-paste it directly into a browser address bar. Use `realpath .mvp/summary.html` (or `pwd` + relative path on Windows) to get it.

Display:
```
Analytics page generated!

  File: [full absolute path to .mvp/summary.html]
  Size: [file size]

  Paste this path in your browser to view:
    [full absolute path to .mvp/summary.html]

  Contents:
    - Project overview with completion status
    - Phase-by-phase progress visualization
    - Time tracking (estimated vs actual)
    - Agent dispatch and quality review statistics
    - Session timeline
    - Full task detail table
```

---

## Execute Now

Begin with Phase 1 (Load Data), compute analytics, generate HTML, and write the file.
