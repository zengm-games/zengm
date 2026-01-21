# Cloud Sync Implementation Status - Audit

**Last Updated:** January 2026
**Status:** Partially Implemented - NOT ready for multi-user use

## Overview

This document tracks what's implemented vs what's missing for the cloud sync multiplayer feature.

---

## What's Working

### 1. Firebase Authentication
- **Location:** `src/ui/util/firebase.ts`
- Google sign-in
- Email/password sign-in and registration
- Auth state management

### 2. Upload League to Cloud
- **Location:** `src/ui/util/cloudSync.ts` → `uploadLeagueData()`
- Bulk upload all IndexedDB stores to Firestore
- Uses JSON serialization to avoid Firestore limitations (nested arrays, undefined values)
- Progress tracking
- Batch writes (50 records per batch)

### 3. Download League from Cloud
- **Location:** `src/ui/util/cloudSync.ts` → `downloadLeagueData()`
- Downloads all stores from Firestore
- Parses JSON back to original format
- Creates local league via `createLeagueFromCloud()` in worker

### 4. Real-time Listeners (Receiving Changes)
- **Location:** `src/ui/util/cloudSync.ts` → `startRealtimeSync()`
- Sets up Firestore `onSnapshot` listeners for all stores
- When remote changes detected, calls `handleRemoteChanges()`
- Applies changes to local IndexedDB via `applyCloudChanges()` worker function

### 5. Cloud League Management UI
- **Location:** `src/ui/views/CloudSync.tsx`
- View cloud leagues
- Upload current league
- Open/download cloud league
- Delete cloud league
- Sync status badge

### 6. Data Structures
- **Location:** `src/common/cloudTypes.ts`
- `CloudLeague` - league metadata with members array
- `CloudMember` - userId, teamId, role (commissioner/member)

---

## What's MISSING (Critical)

### 1. Pushing Local Changes to Cloud
**Status:** NOT IMPLEMENTED
**Priority:** CRITICAL
**Difficulty:** Medium-High

The `syncLocalChanges()` function exists but is NEVER CALLED.

**Problem:** When a user makes a trade, sims a game, signs a free agent, etc., the changes are written to local IndexedDB but NOT synced to Firestore. Other users will never see these changes.

**Solution Required:**
- Hook into the worker's Cache system to detect writes
- After each transaction/flush, identify changed records
- Call `syncLocalChanges()` from UI thread (via toUI message)
- Need to track which records changed (adds, updates, deletes)

**Files to modify:**
- `src/worker/db/Cache.ts` - add change tracking
- `src/worker/api/index.ts` - add function to get pending changes
- `src/ui/util/cloudSync.ts` - wire up the push mechanism
- Need a bridge between worker (where changes happen) and UI (where Firebase lives)

### 2. Invite/Join System
**Status:** NOT IMPLEMENTED
**Priority:** CRITICAL
**Difficulty:** Medium

**Current state:**
- `addLeagueMember()` function exists but has no UI
- No way for commissioner to invite users
- No way for users to join a league

**Solution Required:**
- Commissioner UI: Generate invite link/code, invite by email
- Join UI: Enter invite code or click invite link
- Backend: Store pending invites, validate join requests
- Query leagues where user is a member (not just owner)

**Files to create/modify:**
- `src/ui/views/CloudSync.tsx` - add invite/join UI
- `src/ui/util/cloudSync.ts` - add invite functions
- Possibly Firestore security rules for invites

### 3. Team Assignment/Claiming
**Status:** NOT IMPLEMENTED
**Priority:** CRITICAL
**Difficulty:** Medium

**Current state:**
- `CloudMember.teamId` exists in types
- Creator gets assigned their current team
- No UI to assign teams to other members

**Solution Required:**
- Commissioner can assign teams to members
- Members can see which team they control
- Prevent multiple users controlling same team

### 4. Permission Enforcement
**Status:** NOT IMPLEMENTED
**Priority:** HIGH
**Difficulty:** Medium

**Current state:** Anyone can do anything to any team.

**Solution Required:**
- Check user's teamId before allowing actions
- Only allow trades/signings/releases for owned team
- Only commissioner can sim games
- Enforce both client-side (for UX) and server-side (Firestore rules)

**Files to modify:**
- Various worker functions that modify team data
- Firestore security rules
- UI components (disable buttons for other teams)

---

## What's MISSING (Important but not blocking)

### 5. Conflict Resolution
**Status:** NOT IMPLEMENTED
**Priority:** Medium
**Difficulty:** High

**Problem:** What if two users modify the same data simultaneously?

**Current behavior:** Last write wins (Firestore default)

**Potential solutions:**
- Optimistic locking with version numbers
- Merge strategies for specific data types
- Turn-based system (one user at a time)
- For now, can document that commissioner should coordinate

### 6. Sim Coordination
**Status:** NOT IMPLEMENTED
**Priority:** Medium
**Difficulty:** Medium

**Problem:** Who can sim? When can they sim? Should there be a ready check?

**Potential solution:**
- Only commissioner can sim
- Optional: all members must click "ready" before sim
- Show who is ready/waiting

### 7. Reconnection Handling
**Status:** PARTIAL
**Priority:** Medium
**Difficulty:** Low

**Current state:** If connection drops, status shows "error" but no auto-reconnect.

**Solution Required:**
- Detect disconnection
- Auto-reconnect with exponential backoff
- Re-sync any missed changes

### 8. Exclude Large Stores from Real-time Sync
**Status:** NOT IMPLEMENTED
**Priority:** Low
**Difficulty:** Low

**Suggestion:** `games` (box scores) and `events` (news feed) are huge and not critical for multiplayer. Could exclude from real-time sync to reduce bandwidth/costs.

---

## Architecture Notes

### Current Data Flow
```
[Local IndexedDB] ←→ [Worker Cache] ←→ [Worker API]
                                            ↓
                                    [UI Thread via toWorker]
                                            ↓
                                    [Firebase Firestore]
                                            ↓
                                    [Other Users' Devices]
```

### Key Challenge
Firebase SDK doesn't work in SharedWorker (where the game engine runs). All Firebase operations must happen in the UI thread. This requires message passing between worker and UI for sync operations.

### Files Reference
- `src/ui/util/cloudSync.ts` - Main sync logic (UI thread)
- `src/ui/util/firebase.ts` - Firebase initialization and auth
- `src/ui/views/CloudSync.tsx` - Cloud sync UI page
- `src/common/cloudTypes.ts` - Type definitions
- `src/worker/api/index.ts` - Worker API (getLeagueDataForCloud, applyCloudChanges, createLeagueFromCloud)
- `src/worker/db/Cache.ts` - Where data changes happen (needs modification)

---

## Estimated Work Remaining

| Task | Priority | Estimate |
|------|----------|----------|
| Push local changes to cloud | CRITICAL | 4-6 hours |
| Invite/join system | CRITICAL | 3-4 hours |
| Team assignment UI | CRITICAL | 2-3 hours |
| Permission enforcement | HIGH | 3-4 hours |
| Testing with multiple users | HIGH | 2-3 hours |
| Conflict resolution | Medium | 4-6 hours |
| Sim coordination | Medium | 2-3 hours |
| Reconnection handling | Medium | 1-2 hours |

**Total for MVP (Critical + High):** ~15-20 hours of development

---

## Next Steps (Recommended Order)

1. **Push local changes to cloud** - Without this, nothing syncs. Most critical.
2. **Invite/join system** - So other users can access the league
3. **Team assignment** - So users know which team they control
4. **Permission enforcement** - So users can only modify their own team
5. **Test with real users** - Catch edge cases early
6. **Polish and edge cases** - Reconnection, conflict handling, etc.
