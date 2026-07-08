# /mvp status — Progress Dashboard

This file is loaded by the `/mvp` skill router when the user runs `/mvp status`.

## Instructions for Claude

You are executing the STATUS mode of the `/mvp` skill. This is a **read-only** operation — do NOT modify any files.

---

## Phase 1: Load State

1. **Read `.mvp/state.json`:**
   - If missing: Show error and STOP:
     ```
     No MVP project found in this directory.
     Run /mvp start to begin a new project.
     ```

2. **Read the brainstorm file** at `.mvp/[state.project.brainstormFile]`

---

## Phase 2: Compute Metrics

From `state.json`, calculate:

1. **Overall progress:**
   - `completedTasks / totalTasks` as percentage
   - Number of tasks per status: completed, in_progress, pending, failed

2. **Per-phase progress:**
   - For each phase: count completed vs total tasks
   - Calculate actual time for completed phases
   - Show estimated time for pending phases

3. **Agent statistics:**
   - Total agents spawned
   - Success / failure ratio
   - Average tasks per session

4. **Quality review statistics:**
   - Total reviews
   - Pass / fail ratio
   - Number of retries

5. **Session statistics:**
   - Total sessions from `analytics.sessionLog`
   - Total elapsed time (sum of session durations)
   - Tasks completed per session

---

## Phase 3: Display Dashboard

Generate a terminal-friendly dashboard. Use simple ASCII art for progress bars.

**Progress bar helper:**
- 0-10% = `░░░░░░░░░░`
- 10-20% = `█░░░░░░░░░`
- ...
- 90-100% = `█████████░`
- 100% = `██████████`

**Dashboard format:**

```
MVP Status: [project.name]
Stack: [stack display name]
Status: [status]

Overall: [progress bar] [percentage]% ([completed]/[total] tasks)

Phases:
  [status icon] [Phase Name]          [completed]/[total] tasks   [time]
  [status icon] [Phase Name]          [completed]/[total] tasks   [time]
  ...

  Status icons: [x] = complete, [>] = in progress, [ ] = pending, [!] = error

Analytics:
  Sessions:         [N] total, [total time] elapsed
  Agents spawned:   [N] ([successful] success, [failed] failed)
  Quality reviews:  [passed] passed, [failed] failed
  Git commits:      [N]

[If status == "building":]
Next task: [current phase] > [next pending task name]
Continue:  /mvp build

[If status == "complete":]
App is ready! Run it:
  cd [projectDir]
  [start command]
  Open http://localhost:[port]

Generate analytics: /mvp summary

[If status == "error":]
Error in Phase [N]: [resumePoint.notes]
Fix the issue and run: /mvp build
```

---

## Execute Now

Begin with Phase 1 (Load State), compute metrics, and display the dashboard.
