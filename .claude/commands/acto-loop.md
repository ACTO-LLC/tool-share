# ACTO Loop - Autonomous Issue Resolution

You are executing an autonomous development loop. Work iteratively until the task is complete or you hit an escape condition.

## Input Arguments
$ARGUMENTS will contain:
- `--issue <number>` - GitHub issue number to resolve
- `--prompt "<text>"` - Or a direct prompt if no issue
- `--stuck-timeout <minutes>` - Max time on same error (from config or default: 5)
- `--max-attempts <n>` - Max attempts at same error (from config or default: 3)
- `--max-iterations <n>` - Hard cap on iterations (from config or default: 20)
- `--build-cmd "<command>"` - Custom build command (overrides config)
- `--test-cmd "<command>"` - Custom test command (overrides config)

## Configuration

ACTO skills use a layered configuration system. Load settings in this priority order:

1. **Command-line arguments** (highest priority)
2. **Project config:** `.claude/acto-config.json`
3. **Auto-detection** from project files
4. **Built-in defaults** (lowest priority)

### Load Configuration

```bash
# Check for project config
CONFIG_FILE=".claude/acto-config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "Loading config from $CONFIG_FILE"
  # Parse with jq or native JSON parsing
fi
```

### Configuration Schema

See `.claude/acto-config.schema.json` for full schema. Key settings:

| Setting | Config Path | Default |
|---------|-------------|---------|
| Build command | `build.command` | auto-detect |
| Build directory | `build.workingDirectory` | `.` |
| Test command | `test.command` | auto-detect |
| Test directory | `test.workingDirectory` | `.` |
| Test env vars | `test.env` | `{}` |
| Max iterations | `loop.maxIterations` | `20` |
| Max attempts | `loop.maxAttempts` | `3` |
| Stuck timeout | `loop.stuckTimeoutMinutes` | `5` |
| Review iterations | `loop.maxReviewIterations` | `3` |
| Status file | `status.filePath` | `.claude/acto-status.json` |
| Copilot review | `github.copilotReview` | `true` |

## Project Detection (Fallback)

If config doesn't specify build/test commands, auto-detect:

```bash
# Check for CLAUDE.md build/test instructions first
grep -A5 "## Build" CLAUDE.md 2>/dev/null
grep -A5 "## Test" CLAUDE.md 2>/dev/null

# Fallback detection:
# - package.json with "build" script → npm run build
# - Cargo.toml → cargo build
# - go.mod → go build ./...
# - pyproject.toml → python -m build
```

Store resolved commands for use throughout the loop.

## Your Mission

Execute an iterative development loop to resolve the issue or complete the task.

### Phase 1: Setup
1. Parse arguments from: $ARGUMENTS
2. **Detect or use provided build/test commands** (see Project Detection above)
3. If `--issue` provided:
   - Fetch issue details: `gh issue view <number> --json title,body,labels`
   - Determine if it's a bug (`fix/`) or feature (`feat/`)
   - Check if worktree exists, if not suggest creating one
4. Initialize tracking state:
   - Current iteration: 1
   - Start time: now
   - Error history: empty
   - Approaches tried: empty
5. **Write initial status to shared file:**
   ```bash
   # Ensure directory exists
   mkdir -p .claude

   # Write initial status (use jq if available, otherwise echo JSON)
   cat > .claude/acto-status.json << 'EOF'
   {
     "<issue>": {
       "issue": <issue>,
       "title": "<title>",
       "worktree": "<cwd>",
       "state": "running",
       "phase": "setup",
       "iteration": 1,
       "maxIterations": <max>,
       "startTime": "<ISO8601>",
       "lastUpdate": "<ISO8601>",
       "lastError": null,
       "approachesTried": [],
       "prUrl": null
     }
   }
   EOF
   ```

### Phase 2: Iteration Loop

For each iteration:

#### Step 1: Assess
- What is the current state?
- What errors exist (build, tests)?
- Have we seen this error before?

#### Step 2: Check Escape Conditions
**EXIT if ANY are true:**
- Total iterations >= max-iterations
- Same error signature seen >= max-attempts times
- Time spent on same error >= stuck-timeout

**On escape:**
- **Update status file:**
  ```bash
  # Update state to "escaped", add escapeReason
  ```
- Output summary of what was tried
- Output: `<acto-escape reason="...">Approaches tried: ...</acto-escape>`
- Do NOT continue

#### Step 3: Act
- If new error or first attempt: investigate and fix
- If repeat error: try a DIFFERENT approach than before
- Document what approach you're trying

#### Step 4: Verify
- Run the detected/configured **build command**
- Run the detected/configured **test command** with relevant pattern
- Check results

**Update status file after each iteration:**
```bash
# Update iteration count, lastUpdate, lastError, approaches
# Use a helper function or inline JSON update
```

#### Step 5: Evaluate
- **All pass?** → Go to Phase 3 (Complete)
- **New error?** → Reset error timer, continue to next iteration
- **Same error?** → Increment attempt counter, continue to next iteration

### Phase 3: Create PR

When all acceptance criteria pass:
1. Commit changes with descriptive message referencing issue
2. Push branch
3. Create PR with summary
4. **Update status file:**
   ```bash
   # Update state to "pr-created", add prUrl
   ```
5. Output: `<acto-pr-created>PR #N created: <url></acto-pr-created>`
6. Continue to Phase 4

### Phase 4: PR Review & Polish

After PR is created:

**Review iteration limit:** Max 3 review-fix cycles to prevent infinite loops.

#### Step 1: Request Copilot Review
- Add comment to PR: `@Copilot please review this pull request`
- Poll for response (max 2 minutes, check every 30 seconds):
  ```bash
  gh pr view <number> --json comments --jq '.comments[-1].body'
  ```
- Parse any suggestions from Copilot's review

#### Step 2: Implement Suggestions
For each Copilot suggestion:
- Evaluate if it's valid and improves the code
- Implement the change
- Track what was implemented

#### Step 3: Independent Review Check
- Verify code follows patterns in CLAUDE.md
- Check for common issues (null handling, type safety, etc.)
- Implement any additional improvements found

#### Step 4: Final Verification
- Re-run the detected/configured **build command**
- Re-run the detected/configured **test command**
- **Review iteration tracking:**
  - If failures: increment review iteration counter
  - If review iterations >= 3: escape with reason "review-fix-loop"
  - Otherwise: loop back to fix

#### Step 5: Complete
- Push final changes to PR
- **Update status file:**
  ```bash
  # Update state to "complete", set finalTime
  ```
- Output: `<acto-complete>PR #N ready for merge: <url></acto-complete>`

## Error Signature Detection

Consider errors "the same" if they have:
- Same error code (TS2322, etc.)
- Same file and approximate line number
- Same general message pattern

## Approach Tracking

Keep mental note of approaches tried to avoid repetition:
- "Tried changing .optional() to .nullish()"
- "Tried updating import path"
- "Tried regenerating types"

When stuck on same error, explicitly try something DIFFERENT.

## Output Format

During execution, output progress markers:
```
[Iteration N]
- Assessing: <brief state>
- Action: <what you're doing>
- Result: <build/test outcome>
```

## Completion Criteria

ALL must pass before `<acto-complete>`:
- [ ] Build command succeeds (no compile/type errors)
- [ ] Relevant tests pass
- [ ] PR created and pushed
- [ ] Copilot review requested and suggestions implemented (if `github.copilotReview` is true)
- [ ] Final test pass after review changes

## Important Rules

1. **Don't fake completion** - Only output `<acto-complete>` when genuinely done
2. **Don't infinite loop** - Respect escape conditions strictly
3. **Try different approaches** - Don't repeat the same fix twice
4. **Check CLAUDE.md** - Look for known patterns before giving up
5. **Document learning** - If you discover something novel, suggest adding to CLAUDE.md
6. **Always do Phase 4** - PR review is not optional; it catches issues

## References

- `docs/pr-review-template.md` - PR review process template
- `CLAUDE.md` - Project patterns and known issues

## Example Execution

```
[Setup]
- Detected build command: npm run build (from package.json)
- Detected test command: npx playwright test (from CLAUDE.md)
- Issue #142: Fix convert button not working
- Writing initial status to .claude/acto-status.json

[Iteration 1]
- Assessing: Build failing with TS2322 in EstimateForm.tsx
- Action: Investigating type mismatch, checking Zod schema
- Result: Build ❌ - same error
- Status updated: iteration=1, lastError=TS2322

[Iteration 2]
- Assessing: Same TS2322, attempt 2/3
- Action: Trying different approach - checking if API returns null vs undefined
- Found: API returns null, schema uses .optional() which only allows undefined
- Action: Changing to .nullish()
- Result: Build ✅, Tests ❌ - 1 failing
- Status updated: iteration=2, lastError=test-failure

[Iteration 3]
- Assessing: Test failing - modal not appearing
- Action: Checking onClick handler and modal state
- Result: Build ✅, Tests ✅
- Status updated: iteration=3, state=pr-pending

<acto-pr-created>PR #155 created: https://github.com/ACTO-LLC/modern-accounting/pull/155</acto-pr-created>
- Status updated: state=pr-created, prUrl=...

[Phase 4: PR Review] (review iteration 1/3)
- Requesting Copilot review...
- Polling for response (attempt 1/4)...
- Copilot suggests: Add error handling for edge case
- Implementing suggestion...
- Independent review: Code follows CLAUDE.md patterns ✅
- Final tests: Build ✅, Tests ✅
- Status updated: state=complete

<acto-complete>PR #155 ready for merge: https://github.com/ACTO-LLC/modern-accounting/pull/155</acto-complete>
```

## Start Now

Begin Phase 1 with arguments: $ARGUMENTS
