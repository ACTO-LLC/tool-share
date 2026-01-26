# ACTO Batch - Concurrent Issue Resolution

You are an orchestrator that selects and processes multiple GitHub issues concurrently using `/acto-loop`.

## Input Arguments
$ARGUMENTS may contain:
- `--count <n>` - Number of issues to work on (from config or default: 3, max: 5)
- `--labels <label1,label2>` - Filter by labels (e.g., "bug,good-first-issue")
- `--exclude-labels <label>` - Exclude issues with these labels (from config or default: "blocked,wontfix")
- `--dry-run` - Show selected issues without executing

## Configuration

Load settings from `.claude/acto-config.json` if present:

```bash
CONFIG_FILE=".claude/acto-config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "Loading config from $CONFIG_FILE"
fi
```

### Relevant Config Settings

| Setting | Config Path | Default |
|---------|-------------|---------|
| Max concurrent | `batch.maxConcurrent` | `3` |
| Exclude labels | `batch.excludeLabels` | `["blocked", "wontfix", "on-hold"]` |
| Prefer labels | `batch.preferLabels` | `["good-first-issue", "quick-fix"]` |
| Worktree parent | `worktree.parentDirectory` | `..` |
| Worktree pattern | `worktree.namingPattern` | `{repo}-{issue}` |
| Base branch | `worktree.baseBranch` | `main` |
| Status file | `status.filePath` | `.claude/acto-status.json` |

Command-line arguments override config file values.

## Your Mission

Select low-conflict issues and process them concurrently.

### Phase 1: Fetch Open Issues

```bash
gh issue list --state open --json number,title,labels,body --limit 20
```

Filter out:
- Issues with "blocked" or "wontfix" labels
- Issues already assigned to someone
- Issues with open PRs (check with `gh pr list --search "issue:N"`)

### Phase 2: Analyze for Conflicts

For each candidate issue, determine which areas of the codebase it likely touches:

| Area | Patterns to Look For |
|------|---------------------|
| **Frontend Components** | mentions specific pages, components, UI |
| **API/Backend** | mentions endpoints, DAB, database |
| **Database** | mentions migrations, schema, tables |
| **Tests** | mentions Playwright, testing, e2e |
| **Config/Build** | mentions webpack, vite, config |
| **Docs** | mentions documentation, README |

**Conflict Rules:**
- Two issues touching the SAME component = HIGH conflict
- Two issues in same area (e.g., both frontend) = MEDIUM conflict
- Two issues in different areas = LOW conflict
- Issues touching shared files (App.tsx, routes, etc.) = HIGH conflict

### Phase 3: Select Issues

Score and select issues:

1. **Prioritize by conflict potential:**
   - Prefer issues in DIFFERENT areas
   - Avoid selecting two issues that modify the same files

2. **Prioritize by complexity:**
   - Prefer issues labeled "good-first-issue" or similar
   - Avoid issues with extensive discussion (may be complex)

3. **Select N issues** (from --count) that minimize conflict probability

Output selection:
```
Selected Issues for Batch Processing:
=====================================
#142 - [Frontend/Estimates] Fix convert button
#117 - [Tests] Add payroll E2E tests
#139 - [Frontend/Dashboard] Fix layout issue

Conflict Analysis:
- #142 vs #117: LOW (different areas)
- #142 vs #139: LOW (different components)
- #117 vs #139: LOW (different areas)

Proceed? [Y/n]
```

### Phase 4: Setup Worktrees

For each selected issue, create a worktree if it doesn't exist:

```bash
# Get values from config or use defaults
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
PARENT_DIR="${config.worktree.parentDirectory:-..}"  # From config or default
NAMING_PATTERN="${config.worktree.namingPattern:-{repo}-{issue}}"
BASE_BRANCH="${config.worktree.baseBranch:-main}"

# Resolve naming pattern
WORKTREE_NAME=$(echo "$NAMING_PATTERN" | sed "s/{repo}/$REPO_NAME/g" | sed "s/{issue}/$ISSUE/g")

# Check existing worktrees
git worktree list

# Create new worktrees as needed
git worktree add "${PARENT_DIR}/${WORKTREE_NAME}" -b {fix|feat}/{issue}-{slug} "$BASE_BRANCH"
```

**Worktree naming convention:** Configurable via `worktree.namingPattern`
- Default: `{repo}-{issue}` → `tool-share-142`, `modern-accounting-117`
- Custom: `{repo}/issues/{issue}` → `modern-accounting/issues/142`

### Phase 5: Launch Concurrent Subagents

**Use the Task tool to spawn background subagents** for each issue. This enables true parallel execution without requiring separate terminals.

For each selected issue, launch a subagent using the Task tool with these parameters:
- `subagent_type`: "general-purpose"
- `run_in_background`: true
- `description`: Brief description (e.g., "Fix issue #142")
- `prompt`: Detailed instructions for the issue

**Launch all subagents in a single message** with multiple Task tool calls to maximize parallelism.

#### Subagent Prompt Template

For each issue, use this prompt structure:

```
You are working on GitHub issue #<NUMBER> for the <REPO> project.
Work in the worktree at <WORKTREE_PATH>.

**Issue #<NUMBER>: <TITLE>**

<ISSUE_BODY_SUMMARY>

Your task:
1. cd to <WORKTREE_PATH>
2. Read the full issue: `gh issue view <NUMBER> --json title,body,labels`
3. Read CLAUDE.md for project conventions
4. Explore the relevant codebase area
5. Implement the required changes
6. Run build command: <BUILD_CMD>
7. Run tests: <TEST_CMD>
8. Commit changes with message referencing #<NUMBER>
9. Push branch and create PR with `gh pr create`
10. Request Copilot review: `gh pr comment <PR_NUMBER> --body "@copilot please review"`
11. Wait for Copilot response, implement any valid suggestions
12. Re-run build and tests after review changes

Config from .claude/acto-config.json:
- Build: <build.command> in <build.workingDirectory>
- Test: <test.command> with env <test.env>
- Branch: <BRANCH_NAME>
- Copilot Review: enabled (github.copilotReview: true)

Work autonomously. Create the PR, request Copilot review, and implement suggestions. Report blockers you cannot resolve.
```

#### Example Task Tool Calls

```
<Task tool call 1>
  description: "Fix issue #142 convert button"
  subagent_type: "general-purpose"
  run_in_background: true
  prompt: "<filled template for issue 142>"

<Task tool call 2>
  description: "Build issue #117 E2E tests"
  subagent_type: "general-purpose"
  run_in_background: true
  prompt: "<filled template for issue 117>"

<Task tool call 3>
  description: "Build issue #145 P&L report"
  subagent_type: "general-purpose"
  run_in_background: true
  prompt: "<filled template for issue 145>"
```

**Important:** Send ALL Task tool calls in a single message to launch them concurrently.

#### After Launching

Output confirmation:
```
Launched 3 subagents:
- Issue #142: Fix convert button (agent running)
- Issue #117: E2E tests (agent running)
- Issue #145: P&L report (agent running)

Monitor progress with: /acto-status
Agents will create PRs automatically when complete.
```

### Phase 6: Initialize Status & Summary

After launching subagents:

1. **Initialize status file entries** for all selected issues:
   ```bash
   mkdir -p .claude
   # Create/update .claude/acto-status.json with entries for each issue
   # State: "running" (subagents are now active)
   ```

2. Output summary:
   ```
   <acto-batch-started>
   Issues: #142, #117, #139
   Worktrees: ${REPO_NAME}-142, ${REPO_NAME}-117, ${REPO_NAME}-139
   Subagents: 3 launched and running
   Status file: .claude/acto-status.json initialized
   </acto-batch-started>
   ```

3. **Monitor for completion:** The subagents run in the background. You will be notified as each completes. Use `/acto-status` to check progress.

## Conflict Detection Heuristics

### High-Risk Shared Files
These files are modified by many features - avoid concurrent edits:
- `App.tsx`, `main.tsx` - App entry points
- `routes.tsx` or router config
- `package.json`, `tsconfig.json`
- `CLAUDE.md`
- Database migration files
- Shared components (`Layout.tsx`, `Sidebar.tsx`, etc.)

### Area Detection Keywords

| Area | Keywords in Issue |
|------|-------------------|
| Frontend | page, component, button, form, modal, UI, display, render |
| API | endpoint, API, route, handler, request, response |
| Database | table, column, migration, schema, SQL, DAB |
| Auth | login, authentication, permission, role, Azure AD |
| Tests | test, playwright, e2e, spec, coverage |
| Payroll | employee, payrun, payroll, salary, tax |
| Invoices | invoice, estimate, billing, customer |
| Reports | report, dashboard, chart, analytics |

## Example Execution

```
> /acto-batch --count 3

Detecting repo: modern-accounting (in C:/source)

Fetching open issues...
Found 12 open issues

Analyzing conflict potential...

Selected Issues for Batch Processing:
=====================================
#142 - [Estimates] Fix convert button not working
       Area: Frontend/Estimates

#117 - [Tests] Add E2E tests for payroll module
       Area: Tests/Payroll

#145 - [Reports] Add profit/loss report
       Area: Frontend/Reports

Conflict Analysis:
- #142 vs #117: LOW ✅ (Estimates vs Tests)
- #142 vs #145: LOW ✅ (Estimates vs Reports)
- #117 vs #145: LOW ✅ (Tests vs Reports)

Creating worktrees...
✓ modern-accounting-142 (exists)
✓ modern-accounting-117 (exists)
✓ modern-accounting-145 (created)

Launching subagents...
✓ Issue #142 subagent launched (background)
✓ Issue #117 subagent launched (background)
✓ Issue #145 subagent launched (background)

Initializing status file...
✓ .claude/acto-status.json updated with 3 running entries

<acto-batch-started>
Issues: #142, #117, #145
Worktrees: modern-accounting-142, modern-accounting-117, modern-accounting-145
Subagents: 3 launched and running
Status file: .claude/acto-status.json initialized
</acto-batch-started>

All 3 subagents are now working concurrently.
Monitor progress with: /acto-status
You will be notified as each completes.
```

## Dry Run Mode

With `--dry-run`, show analysis but don't create worktrees:

```
> /acto-batch --count 3 --dry-run

[DRY RUN - No changes will be made]

Would select:
- #142 - Fix convert button (Frontend/Estimates)
- #117 - Add payroll tests (Tests)
- #145 - Add P&L report (Frontend/Reports)

Would create worktrees:
- modern-accounting-145 (new)
```

## Start Now

Begin Phase 1 with arguments: $ARGUMENTS
