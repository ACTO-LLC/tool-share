# ACTO Status - Check Loop Progress

Display the current status of any active ACTO loops or recent results across all sessions.

## Usage
`/acto-status [--all] [--issue <number>]`

## Arguments
- `--all` - Show status from all worktrees (default behavior)
- `--issue <number>` - Show status for a specific issue only

## Configuration

Load settings from `.claude/acto-config.json` if present:

| Setting | Config Path | Default |
|---------|-------------|---------|
| Status file path | `status.filePath` | `.claude/acto-status.json` |
| Stale threshold | `status.staleThresholdMinutes` | `10` |

## Status File Location

ACTO loops write their status to a shared file that persists across sessions:
- **Location:** From `status.filePath` config, or `.claude/acto-status.json` (default)
- **Format:** JSON with entries keyed by issue number

## Actions

1. **Read shared status file:**
   ```bash
   # Check global status
   cat ~/.acto/status.json 2>/dev/null || echo "{}"

   # Check repo-local status
   cat .claude/acto-status.json 2>/dev/null || echo "{}"
   ```

2. **For each active loop, display:**
   - Issue number and title
   - Worktree path
   - Current phase and iteration
   - Last update timestamp
   - Current state (running/complete/escaped)
   - Recent errors and approaches tried

3. **Detect stale entries:**
   - If `lastUpdate` is older than `status.staleThresholdMinutes` (default: 10) and state is "running", mark as "stale/unknown"

4. **Also check conversation** for `<acto-complete>` or `<acto-escape>` markers in current session

## Status File Schema

```json
{
  "142": {
    "issue": 142,
    "title": "Fix convert button",
    "worktree": "C:/source/modern-accounting-142",
    "state": "running",
    "phase": "iteration",
    "iteration": 3,
    "maxIterations": 20,
    "startTime": "2024-01-15T10:30:00Z",
    "lastUpdate": "2024-01-15T10:35:00Z",
    "lastError": {
      "signature": "TS2322",
      "message": "Type 'null' is not assignable...",
      "attempts": 2
    },
    "approachesTried": [
      "Changed onClick handler",
      "Checking Zod schema types"
    ],
    "prUrl": null
  }
}
```

## Output Format

```
ACTO Status Dashboard
=====================

Issue #142 - Fix convert button
  Worktree: C:/source/modern-accounting-142
  State:    🔄 Running (Phase: iteration)
  Progress: Iteration 3/20
  Time:     5m 30s elapsed
  Last Error: TS2322 (attempt 2/3)
  Approaches:
    1. Changed onClick handler
    2. Checking Zod schema types

Issue #117 - Add payroll E2E tests
  Worktree: C:/source/modern-accounting-117
  State:    ✅ Complete
  PR:       https://github.com/org/repo/pull/156
  Time:     12m 45s total

Issue #145 - Add P&L report
  Worktree: C:/source/modern-accounting-145
  State:    ⚠️ Escaped (stuck on same error)
  Progress: Iteration 8/20
  Reason:   Same TS2345 error after 3 attempts

─────────────────────────────────
Summary: 1 running, 1 complete, 1 escaped
```

## Cleanup

Old status entries (>24h) can be cleaned up:
```bash
# This is done automatically by acto-loop on startup
```

## Integration

This status file is written to by:
- `/acto-loop` - Updates on each iteration
- `/acto-batch` - Initializes entries when launching

And read by:
- `/acto-status` - This command
- `/acto-merge` - To find completed PRs
