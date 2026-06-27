# KnowledgeCard Sync QA Test Packages

These files are fixed QA samples for testing the manual sync package import flow.

Use them in a test browser profile or test IndexedDB. Do not use them in your main KnowledgeCard data unless you are comfortable adding test cards and test directories.

## Files

```text
00-baseline-local-data.json
01-normal-sync-package.json
02-local-newer-skip-package.json
03-same-timestamp-skip-package.json
04-bad-directory-self-parent.json
05-bad-directory-missing-parent.json
06-bad-directory-cycle.json
```

## Recommended Test Setup

For predictable results, use a clean browser profile or clear test IndexedDB before each scenario.

Minimum workflow:

```text
1. Open #/data.
2. Import 00-baseline-local-data.json.
3. Then import one scenario package.
4. Check preview counts and safety behavior.
```

If you run multiple scenario packages in the same profile, results may differ because previous scenarios modify local `updatedAt` values.

## Scenario 00: Baseline

File:

```text
00-baseline-local-data.json
```

Expected:

```text
Cards added: 1
Collections added: 1
Directories added: 2
```

This creates the local reference records used by the other scenarios.

## Scenario 01: Normal Sync

Prerequisite:

```text
Import 00-baseline-local-data.json first.
```

File:

```text
01-normal-sync-package.json
```

Expected preview:

```text
Cards added: 1
Cards updated: 1
Collections updated: 1
Directories added: 1
Directories updated: 1
Some same-timestamp skips may appear for unchanged baseline records.
```

Purpose:

```text
Verify normal add/update behavior.
```

## Scenario 02: Local Newer Skip

Prerequisite:

```text
Use a fresh test profile.
Import 00-baseline-local-data.json first.
```

File:

```text
02-local-newer-skip-package.json
```

Expected preview:

```text
Card skipped: local newer
Collection skipped: local newer
Directory skipped: local newer
```

Purpose:

```text
Verify that older imported records do not overwrite newer local records.
```

## Scenario 03: Same Timestamp Skip

Prerequisite:

```text
Use a fresh test profile.
Import 00-baseline-local-data.json first.
```

File:

```text
03-same-timestamp-skip-package.json
```

Expected preview:

```text
Card skipped: same timestamp
Collection skipped: same timestamp
Directories skipped: same timestamp
```

Purpose:

```text
Verify that equal timestamps are treated as already synchronized.
```

## Scenario 04: Bad Directory Self Parent

File:

```text
04-bad-directory-self-parent.json
```

Expected:

```text
Import preview is blocked.
Error mentions unsafe directory structure.
```

Purpose:

```text
Verify parentId cannot point to itself.
```

## Scenario 05: Bad Directory Missing Parent

File:

```text
05-bad-directory-missing-parent.json
```

Expected:

```text
Import preview is blocked.
Error mentions missing parent directory.
```

Purpose:

```text
Verify parentId cannot point to a missing directory in the final merged tree.
```

## Scenario 06: Bad Directory Cycle

File:

```text
06-bad-directory-cycle.json
```

Expected:

```text
Import preview is blocked.
Error mentions directory cycle.
```

Purpose:

```text
Verify parent-child cycles are rejected before writing data.
```

## Clean-up

After testing in a real profile, remove test cards/directories manually or restore from a full backup.

Recommended safer path:

```text
Use a separate browser profile for sync QA.
```
