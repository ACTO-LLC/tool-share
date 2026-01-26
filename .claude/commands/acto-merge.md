# ACTO Merge - Merge Completed PRs

Merge all completed PRs from an ACTO batch run after verifying they're ready.

## Usage
`/acto-merge [--dry-run] [--issue <number>] [--auto-delete-branch]`

## Arguments
- `--dry-run` - Show what would be merged without actually merging
- `--issue <number>` - Merge only a specific issue's PR
- `--auto-delete-branch` - Delete branch after merge (from config or default: true)
- `--cleanup-worktrees` - Remove worktrees after successful merge

## Configuration

Load settings from `.claude/acto-config.json` if present:

| Setting | Config Path | Default |
|---------|-------------|---------|
| Merge method | `github.autoMergeMethod` | `squash` |
| Delete branch | `github.deleteBranchOnMerge` | `true` |
| Status file | `status.filePath` | `.claude/acto-status.json` |
| Worktree parent | `worktree.parentDirectory` | `..` |
| Worktree pattern | `worktree.namingPattern` | `{repo}-{issue}` |
| Base branch | `worktree.baseBranch` | `main` |

Command-line arguments override config file values.

## Your Mission

Find all completed ACTO PRs and merge them safely.

### Phase 1: Gather Completed PRs

1. **Read status file:**
   ```bash
   cat .claude/acto-status.json 2>/dev/null || echo "{}"
   ```

2. **Filter for completed entries:**
   - State must be "complete"
   - Must have a `prUrl`

3. **If `--issue` specified:** Only process that specific issue

### Phase 2: Verify Each PR

For each completed PR:

1. **Check PR status:**
   ```bash
   gh pr view <number> --json state,mergeable,mergeStateStatus,statusCheckRollup
   ```

2. **Verify merge requirements:**
   - [ ] PR state is "OPEN"
   - [ ] Mergeable is true
   - [ ] No merge conflicts
   - [ ] CI checks pass (statusCheckRollup)
   - [ ] Required reviews approved (if configured)

3. **Check for conflicts with other PRs in batch:**
   ```bash
   # Get changed files for each PR
   gh pr view <number> --json files --jq '.files[].path'
   ```
   - If two PRs modify the same file, warn and suggest merge order

### Phase 3: Determine Merge Order

If multiple PRs are ready:

1. **Build dependency graph** based on file overlap
2. **Suggest order** that minimizes conflicts:
   - PRs with no file overlap: can merge in any order
   - PRs with overlap: merge smaller change first, rebase larger

Output:
```
Merge Order Analysis:
====================
1. PR #156 (Issue #117) - No conflicts, merge first
2. PR #155 (Issue #142) - No conflicts with #156
3. PR #157 (Issue #145) - Overlaps with #155, merge after rebasing

Recommended: Merge #156, #155, then rebase #157
```

### Phase 4: Execute Merges

For each PR in order (unless `--dry-run`):

1. **Merge the PR:**
   ```bash
   # Use merge method from config (squash, merge, or rebase)
   MERGE_METHOD="${config.github.autoMergeMethod:-squash}"
   DELETE_BRANCH="${config.github.deleteBranchOnMerge:-true}"

   gh pr merge <number> --${MERGE_METHOD} $([ "$DELETE_BRANCH" = "true" ] && echo "--delete-branch")
   ```
   - Merge method from `github.autoMergeMethod` config (default: squash)
   - Delete branch if `github.deleteBranchOnMerge` is true (default)

2. **Update status file:**
   ```bash
   # Update state to "merged"
   ```

3. **If next PR has conflicts:** Offer to rebase
   ```bash
   # In the worktree for the conflicting PR:
   git fetch origin main
   git rebase origin/main
   # Resolve conflicts if simple, otherwise warn user
   git push --force-with-lease
   ```

### Phase 5: Cleanup (if --cleanup-worktrees)

After all merges complete:

```bash
# Get worktree path from config
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
PARENT_DIR="${config.worktree.parentDirectory:-..}"
NAMING_PATTERN="${config.worktree.namingPattern:-{repo}-{issue}}"

# For each merged issue, resolve worktree path and remove
WORKTREE_PATH=$(echo "${PARENT_DIR}/${NAMING_PATTERN}" | sed "s/{repo}/$REPO_NAME/g" | sed "s/{issue}/$ISSUE/g")
git worktree remove "$WORKTREE_PATH" --force
```

### Phase 6: Summary

```
ACTO Merge Summary
==================
✅ PR #156 (Issue #117) - Merged
✅ PR #155 (Issue #142) - Merged
✅ PR #157 (Issue #145) - Merged after rebase

Branches deleted: fix/117-payroll-tests, fix/142-convert-button, feat/145-pnl-report
Worktrees cleaned: 3 removed

<acto-merge-complete>
Merged: 3 PRs
Issues closed: #117, #142, #145
</acto-merge-complete>
```

## Dry Run Output

With `--dry-run`:

```
ACTO Merge - Dry Run
====================
Would merge the following PRs:

PR #156 (Issue #117)
  Status: ✅ Ready to merge
  Checks: All passing
  Conflicts: None

PR #155 (Issue #142)
  Status: ✅ Ready to merge
  Checks: All passing
  Conflicts: None

PR #157 (Issue #145)
  Status: ⚠️ Needs rebase
  Checks: All passing
  Conflicts: Overlaps with PR #155 (src/components/Reports.tsx)

Recommended merge order: #156 → #155 → #157 (after rebase)

No changes made (dry run).
```

## Error Handling

### PR Not Ready
```
⚠️ PR #155 cannot be merged:
   - CI checks failing: build-and-test
   - Run: gh pr checks 155
```

### Merge Conflicts
```
⚠️ PR #157 has merge conflicts with main:
   - src/components/Reports.tsx

   To resolve:
   1. cd ../repo-name-145
   2. git fetch origin main
   3. git rebase origin/main
   4. Resolve conflicts
   5. git push --force-with-lease
   6. Re-run /acto-merge --issue 145
```

### Concurrent Modification
```
⚠️ PR #155 was modified since status file was updated
   - Status file: commit abc123
   - Current PR: commit def456

   Re-run /acto-status to refresh, then retry merge.
```

## Safety Checks

1. **Never force merge** - If mergeable is false, stop and report
2. **Respect branch protection** - Let GitHub enforce rules
3. **Verify CI status** - Don't merge with failing checks
4. **Confirm file overlaps** - Warn before merging overlapping PRs
5. **Update main locally** after merges:
   ```bash
   git checkout main
   git pull origin main
   ```

## Integration with Status File

Updates `.claude/acto-status.json`:
- On merge: `state: "merged"`, add `mergedAt` timestamp
- On conflict: `state: "conflict"`, add `conflictDetails`
- On failure: `state: "merge-failed"`, add `failureReason`

## Start Now

Begin Phase 1 with arguments: $ARGUMENTS
