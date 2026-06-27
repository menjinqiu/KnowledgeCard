# KnowledgeCard Auto Sync Design

This document designs the next-generation synchronization system for KnowledgeCard.

Current implementation status:

```text
Manual sync package: implemented
Automatic file-bound sync: not implemented
Background sync: not implemented
Diff conflict resolution: not implemented
```

This document is the design baseline before implementation.

## 1. Product Goal

Build a safe local-first synchronization layer for KnowledgeCard that supports:

```text
persistent local data
binding a sync JSON file stored in a cloud-drive folder such as Nutstore
automatic read/write sync when the page is open
manual one-click two-way sync
clear conflict detection
human-reviewed diff resolution
no silent destructive overwrite
```

Non-goals for this phase:

```text
no remote server
no user account
no WebDAV integration yet
no direct Nutstore API integration yet
no background sync after browser/tab is fully closed
```

## 2. Core Constraint

A browser page cannot safely and silently access arbitrary local files forever without user permission.

The design must therefore use a user-granted file handle when the browser supports it, and must degrade to manual import/export when not supported.

The user-visible mental model:

```text
IndexedDB is the primary local database.
The bound sync file is the transport / backup / exchange file.
The app never treats the sync file as the only source of truth.
```

## 3. Persistence and Data Loss Prevention

The app must not require re-import after every service restart or page reload.

Rules:

```text
1. IndexedDB remains the primary persistent local store.
2. On app startup, load from IndexedDB first.
3. Request persistent browser storage through navigator.storage.persist() when available.
4. Keep sync binding metadata in IndexedDB, not only localStorage.
5. Never clear IndexedDB during sync.
6. Before risky sync writes, create a local recovery snapshot.
7. Expose storage status in the UI.
```

Important distinction:

```text
Restarting Vite dev server should not erase IndexedDB.
Reloading page should not erase IndexedDB.
Browser profile reset, manual site-data clearing, browser storage eviction, or origin change can erase IndexedDB.
```

Therefore the app should:

```text
- keep IndexedDB data;
- ask for persistent storage;
- allow full backup export;
- allow binding a sync file as an external safety copy.
```

## 4. Sync File Format

The sync file should evolve from current KnowledgeCard v1 JSON into a sync-aware package.

Keep compatibility:

```text
app: KnowledgeCard
version: 1
cards
collections
directories
```

Add sync metadata:

```ts
type SyncMeta = {
  packageType: 'bound-sync-file';
  syncFileId: string;
  schemaVersion: 1;
  deviceId: string;
  deviceName: string;
  generatedAt: string;
  lastWriterDeviceId: string;
  lastWriterDeviceName: string;
  lastWriterAt: string;
  revision: number;
  contentHash: string;
};
```

The content hash should be computed from canonicalized `cards`, `collections`, `directories`, and sync metadata excluding `contentHash` itself.

## 5. Local Sync State Model

Add a new IndexedDB table later, for example:

```ts
type SyncBindingState = {
  id: 'default';
  mode: 'manual' | 'file-bound';
  deviceId: string;
  deviceName: string;
  fileName?: string;
  fileHandle?: FileSystemFileHandle;
  lastLocalSnapshotHash?: string;
  lastRemoteSnapshotHash?: string;
  lastSuccessfulSyncAt?: string;
  lastReadRemoteAt?: string;
  lastWriteRemoteAt?: string;
  lastKnownRemoteRevision?: number;
  autoSyncEnabled: boolean;
  pollIntervalMs: number;
  conflictPolicy: 'review-required';
};
```

File handles can be stored in IndexedDB where supported, but permission may need to be re-requested after browser restart.

## 6. Device Identity

Keep a stable device identity:

```text
deviceId: random UUID, generated once
deviceName: user editable, default from platform/browser
```

Store it in IndexedDB and mirror to localStorage for convenience.

The UI should let the user rename the device:

```text
MacBook
Windows Desktop
Chrome Test Profile
```

## 7. Sync Modes

### Mode A: Manual Sync Package

Already implemented.

Use when:

```text
browser does not support file binding
user does not want automatic sync
one-off migration or backup
```

### Mode B: Bound Sync File

User selects or creates a file:

```text
KnowledgeCard Sync Settings
→ Bind sync file
→ choose `knowledgecard-sync.json` inside Nutstore/iCloud/Dropbox/local folder
```

After binding:

```text
read remote file
compare with local DB
preview merge
write merged result back to file only after safe state
```

### Mode C: Automatic While Page Is Open

When the app page is open:

```text
- periodically check bound file metadata/hash;
- if remote changed, read and preview/auto-merge safe changes;
- after local edits, debounce and write local snapshot to bound file;
- if conflict is detected, pause auto-write and require review.
```

This is not true background sync after the browser tab is closed.

## 8. Polling / Listening Strategy

Preferred implementation order:

```text
Phase 1: polling-based change detection
Phase 2: FileSystemObserver if stable and available
```

Polling approach:

```text
Every 10-30 seconds while page is visible:
1. Check file permission.
2. Read file lastModified / text.
3. Compute remote hash.
4. Compare with lastKnownRemoteHash.
5. If changed, run sync plan.
```

Do not rely solely on file-system observer because browser support and permission behavior may vary.

## 9. One-Click Two-Way Sync Algorithm

One-click sync should do this:

```text
1. Ensure no current write is running.
2. Read local snapshot from IndexedDB.
3. Read remote snapshot from bound sync file.
4. Validate remote format and directory safety.
5. Compare local, remote, and last successful base snapshot.
6. Generate sync plan.
7. If no conflicts:
   - merge local + remote deterministically;
   - write merged snapshot to IndexedDB;
   - write merged snapshot to bound file;
   - update sync state.
8. If conflicts:
   - do not write remote file;
   - show conflict review UI;
   - user resolves conflicts;
   - then write resolved snapshot to both local and remote.
```

## 10. Three-Way Merge Requirement

Simple `updatedAt` comparison is not enough for full automatic sync.

Automatic sync needs three snapshots:

```text
base: last successful synchronized snapshot
local: current IndexedDB snapshot
remote: current bound file snapshot
```

For each record ID:

```text
base missing, local exists, remote missing → local add
base missing, local missing, remote exists → remote add
base exists, local missing, remote unchanged → local delete
base exists, remote missing, local unchanged → remote delete
local changed, remote unchanged → take local
remote changed, local unchanged → take remote
local changed, remote changed same content → take either
local changed, remote changed different content → conflict
```

Without a base snapshot, the system should fall back to safer `updatedAt` merge and require review for suspicious cases.

## 11. Deletion Semantics

Do not physically delete records immediately in automatic sync.

Use tombstones:

```ts
type SyncTombstone = {
  entityType: 'card' | 'collection' | 'directory';
  id: string;
  deletedAt: string;
  deletedByDeviceId: string;
};
```

Reason:

```text
If Device A deletes a card, Device B must learn it was deleted.
If the record simply disappears from the file, Device B cannot know whether it was deleted or just absent from an old partial export.
```

Existing `archived` is not enough for sync deletion. Deletion sync requires tombstones.

Phase 1 may avoid syncing destructive delete automatically:

```text
Deletes become review-required conflicts.
```

## 12. Conflict Types

Conflict UI should detect at least:

```text
same card edited on both devices
same collection membership edited on both devices
same directory moved/renamed on both devices
card assigned to a directory that remote deleted/moved
one side deleted, other side edited
same timestamp but different content hash
invalid remote directory structure
```

## 13. Conflict Resolution UI

Provide a `Sync Conflicts` screen or panel.

For each conflict:

```text
entity type
entity title
local updatedAt / device
remote updatedAt / device
changed fields
local value
remote value
resolution buttons
```

Resolution options:

```text
Keep local
Use remote
Merge manually
Skip for now
```

For cards, manual merge should show field-level diff for:

```text
title
summary
content
copyText
tags
primaryDirectoryId
directorySortOrder
favorite
printable
archived
```

For collections:

```text
title
description
cardIds order
printable
```

For directories:

```text
title
parentId
description
sortOrder
```

## 14. Safety Rules

Hard rules:

```text
1. Never auto-overwrite both local and remote if conflicts exist.
2. Never write remote file if directory safety validation fails.
3. Never write remote file if local snapshot cannot be fully read.
4. Never apply remote snapshot if backup validation fails.
5. Always write to a temporary object/string first, then file stream.
6. Keep recovery snapshot before applying merge.
7. Keep last successful sync state.
8. Show sync status visibly.
```

## 15. Recovery Snapshots

Before any one-click or automatic merge, create a recovery snapshot in IndexedDB:

```ts
type SyncRecoverySnapshot = {
  id: string;
  createdAt: string;
  reason: 'before-auto-sync' | 'before-one-click-sync' | 'before-conflict-resolution';
  cards: KnowledgeCard[];
  collections: CardCollection[];
  directories: DirectoryNode[];
};
```

Retention policy:

```text
Keep last 10 snapshots or last 7 days, whichever is smaller.
Allow manual restore from Settings.
```

## 16. Data Not Lost on Restart

Implementation requirements:

```text
- All cards/collections/directories stay in IndexedDB.
- On startup, do not import from sync file automatically before local DB is loaded.
- Sync file binding state should be loaded after DB initialization.
- If file handle permission is missing after restart, show `Reconnect sync file`.
- Do not show empty library just because sync file is unavailable.
- If IndexedDB is empty but sync binding exists, ask user whether to restore from sync file.
```

Critical UI copy:

```text
Local database is primary. Sync file unavailable does not mean your local data is gone.
```

## 17. Multi-Tab Protection

If the same app is open in two tabs, both tabs writing the bound file can corrupt sync logic.

Use:

```text
BroadcastChannel for tab coordination
single writer lock stored in IndexedDB
short lock TTL
visible warning when another tab owns sync
```

Rules:

```text
Only one tab can perform automatic write sync.
Other tabs can read status but cannot write.
Manual sync should ask to take over lock.
```

## 18. UI Plan

Add a Sync Settings page or section under Data Management.

Sections:

```text
Sync status
Device identity
Persistent storage status
Bind / reconnect sync file
Auto-sync toggle
One-click sync button
Last sync report
Conflict queue
Recovery snapshots
Danger zone
```

Status states:

```text
Not configured
Bound, permission granted
Bound, permission needed
Reading remote
Writing remote
Synced
Remote changed
Local changed
Conflict requires review
Sync paused
Last sync failed
```

## 19. Implementation Phases

### Phase S1: Persistence Hardening

```text
- Request persistent storage.
- Add storage status UI.
- Add recovery snapshots table.
- Add device identity table.
```

### Phase S2: Bound Sync File MVP

```text
- File picker bind / create sync file.
- Store file handle when supported.
- Manual read remote.
- Manual write local snapshot to bound file.
- Reconnect flow after permission loss.
```

### Phase S3: One-Click Sync

```text
- Read local + remote.
- Validate remote.
- Generate sync plan.
- Apply non-conflicting merge.
- Write merged snapshot to DB and file.
- Recovery snapshot before write.
```

### Phase S4: Conflict Review

```text
- Detect field-level conflicts.
- Show local vs remote diff.
- Keep local / use remote / merge manually.
- Apply resolved result to both DB and file.
```

### Phase S5: Auto Sync While Open

```text
- Debounced local write after edits.
- Poll remote changes while visible.
- Pause on conflicts.
- Multi-tab write lock.
- Clear visible sync status.
```

### Phase S6: Optional Observer Optimization

```text
- Add FileSystemObserver only if available and stable.
- Keep polling fallback.
```

## 20. Recommendation

Do not implement automatic sync directly.

Correct next step:

```text
Implement Phase S1: Persistence Hardening.
```

Reason:

```text
Before syncing anything automatically, the local database must be protected against browser storage eviction, user confusion, and failed sync recovery.
```

After S1 is stable, implement S2 bound sync file MVP.
