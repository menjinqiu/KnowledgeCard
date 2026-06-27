# KnowledgeCard Manual Sync Workflow

This document defines the safe manual synchronization workflow for KnowledgeCard.

KnowledgeCard is a local-first offline web app. Current synchronization is file-based. It does not use a backend account, cloud database, or automatic background sync.

## 1. Sync Model

Current supported sync model:

```text
Device A exports a sync package
→ copy the JSON file through Nutstore / iCloud Drive / USB / LAN / other file transfer
→ Device B imports and previews the sync package
→ confirm safety checkbox
→ merge by ID + updatedAt
```

The sync package is still a valid KnowledgeCard v1 JSON backup. It adds optional `syncMeta` for source-device information.

## 2. What the Sync Package Contains

A sync package contains:

```text
cards
collections
directories
syncMeta
```

`syncMeta` contains:

```text
packageType: manual-sync
deviceId
deviceName
generatedAt
```

## 3. Merge Rule

KnowledgeCard merges by record ID and `updatedAt`.

```text
Imported record does not exist locally
→ add it

Imported updatedAt is newer than local updatedAt
→ update local record

Imported updatedAt is older than local updatedAt
→ skip, because local is newer

Imported updatedAt equals local updatedAt
→ skip, because both sides appear to be the same version
```

This applies to:

```text
cards
collections
directories
```

## 4. Standard Two-Device Workflow

Use this when syncing between two browsers or computers.

### Step 1: Export from the device you just used

On the source device:

```text
#/data → 导出同步包
```

Expected filename:

```text
knowledgecard-sync-package-YYYYMMDD-HHMMSS.json
```

### Step 2: Copy the file to the other device

Use any file-transfer channel:

```text
Nutstore
Cloud drive
USB
AirDrop / LAN sharing
Manual copy
```

### Step 3: Preview on the target device

On the target device:

```text
#/data → 选择 JSON 文件
```

Check:

```text
source device
export time
cards added / updated / skipped
collections added / updated / skipped
directories added / updated / skipped
skip reasons
```

### Step 4: Confirm and import

Only after preview looks right:

```text
check safety confirmation
→ 已预览，确认合并导入
```

### Step 5: Export back if both devices were edited

If both devices had changes since the last sync, repeat in the opposite direction:

```text
Device B exports sync package
→ Device A imports and previews
→ confirm and merge
```

For active two-device use, sync in both directions after important editing sessions.

## 5. Safe Daily Routine

Recommended routine:

```text
Before switching devices:
1. Finish editing.
2. Export sync package.
3. Copy the package to the next device.

After opening the next device:
1. Import preview first.
2. Check source device and skip reasons.
3. Confirm merge.
4. Continue editing.
```

If you edited both devices independently, do not assume one package is enough. Sync both directions.

## 6. When to Export Full Backup Instead

Use full backup when:

```text
Before large imports
Before batch operations
Before major directory restructuring
Before browser reset
Before deleting many cards
Before testing risky JSON
```

Use sync package when:

```text
Moving normal work from one device to another
Merging routine changes between devices
Sharing the latest local state with your other browser profile
```

## 7. Directory Safety

Sync package import validates directory structure before writing.

The import is blocked if final directories would contain:

```text
parentId pointing to itself
parentId pointing to a missing directory
parent-child cycle
existing cycle in parent traversal
```

Bad directory JSON must be fixed before import. The app does not currently provide a repair UI.

## 8. Skip Reason Interpretation

During import preview, skipped records can mean:

```text
Local newer
→ the target device already has a newer version; import is safely skipped

Same timestamp
→ both sides appear to be the same version; import is skipped
```

A high same-timestamp skip count is normal when importing a package that mostly matches local data.

A high local-newer skip count means the target device has newer work. In that case, consider exporting a sync package from the target device back to the source device.

## 9. Current Limitations

Current sync does not support:

```text
automatic background sync
cloud account sync
folder watch
file handle binding
same-record same-timestamp content diff
per-record conflict resolution UI
```

These can be considered later only after manual sync is proven stable.

## 10. Fixed QA Test Packages

Fixed sync QA samples are stored at:

```text
docs/test-data/sync/
```

Start with:

```text
docs/test-data/sync/README.md
```

Available test packages:

```text
00-baseline-local-data.json
01-normal-sync-package.json
02-local-newer-skip-package.json
03-same-timestamp-skip-package.json
04-bad-directory-self-parent.json
05-bad-directory-missing-parent.json
06-bad-directory-cycle.json
```

Use a separate test browser profile when possible. These packages are intended to create test cards, test collections, and test directories.

## 11. Minimum QA Checklist

Before trusting sync for real use, verify:

```text
- Export sync package from Device A.
- Import preview on Device B shows source device information.
- New cards are added.
- Newer records are updated.
- Older records are skipped as local-newer.
- Same records are skipped as same-timestamp.
- Directory cycles are rejected.
- Missing parent directories are rejected.
- After import, Knowledge Spaces still load.
- After import, collections still open.
- After import, print center still works.
```
