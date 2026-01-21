# Cloud Sync Implementation Status - Audit

**Last Updated:** January 2026
**Status:** MVP Implemented - Ready for initial multi-user testing

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
- Sets user's teamId based on their cloud membership

### 4. Real-time Listeners (Receiving Changes)
- **Location:** `src/ui/util/cloudSync.ts` → `startRealtimeSync()`
- Sets up Firestore `onSnapshot` listeners for all stores
- When remote changes detected, calls `handleRemoteChanges()`
- Applies changes to local IndexedDB via `applyCloudChanges()` worker function

### 5. Pushing Local Changes to Cloud [NEW]
- **Location:** `src/worker/db/Cache.ts` → `flush()` method
- After each cache flush, captures dirty records
- Sends changes to UI via `toUI("syncCloudChanges", ...)`
- UI calls `syncLocalChanges()` to push to Firestore
- Non-blocking - doesn't slow down game operations

### 6. Cloud League Management UI
- **Location:** `src/ui/views/CloudSync.tsx`
- View cloud leagues (owned and joined)
- Upload current league
- Open/download cloud league
- Delete cloud league
- Sync status badge

### 7. Invite/Join System [NEW]
- **Location:** `src/ui/views/CloudSync.tsx` → `JoinLeagueSection`
- Commissioner can share League ID with friends
- Join UI: Enter League ID, select available team from dropdown
- `joinCloudLeague()` validates and adds member to league
- `getJoinedLeagues()` shows leagues user has joined

### 8. Team Assignment [NEW]
- **Location:** `src/ui/util/cloudSync.ts` → `getCloudLeagueTeams()`
- Shows all teams with region/name
- Displays which teams are already claimed
- User selects from available teams when joining
- Team ID stored in `CloudMember.teamId`

### 9. Permission Enforcement [NEW]
- **Location:** `src/ui/util/cloudSync.ts` → permission functions
- `canSimulateGames()` - only commissioner can sim
- `canControlTeam()` - users can only control assigned team
- `isCloudCommissioner()` - check if user is commissioner
- Play menu disabled for non-commissioners in cloud leagues
- User's assigned teamId set as local `userTid` when opening league

### 10. Data Structures
- **Location:** `src/common/cloudTypes.ts`
- `CloudLeague` - league metadata with members array
- `CloudMember` - userId, teamId, role (commissioner/member)

---

## What's MISSING (Important but not blocking)

### 1. Conflict Resolution
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

### 2. Sim Coordination / Ready Check
**Status:** PARTIAL (commissioner-only sim implemented)
**Priority:** Medium
**Difficulty:** Medium

**Current state:** Only commissioner can simulate games.

**Potential enhancement:**
- Optional: all members must click "ready" before sim
- Show who is ready/waiting
- Notification when commissioner is about to sim

### 3. Reconnection Handling
**Status:** PARTIAL
**Priority:** Medium
**Difficulty:** Low

**Current state:** If connection drops, status shows "error" but no auto-reconnect.

**Solution Required:**
- Detect disconnection
- Auto-reconnect with exponential backoff
- Re-sync any missed changes

### 4. Full Team Permission Enforcement
**Status:** PARTIAL
**Priority:** Medium
**Difficulty:** Medium

**Current state:** Sim permission enforced. Team-specific actions (trades, signings) not yet restricted.

**Remaining work:**
- Add team checks to trade UI
- Add team checks to free agent signing
- Add team checks to roster moves
- Firestore security rules (server-side enforcement)

### 5. Exclude Large Stores from Real-time Sync
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
                    [toUI: syncCloudChanges]
                           ↓
                    [UI Thread]
                           ↓
                    [Firebase Firestore]
                           ↓
                    [Other Users' Devices]
```

### Key Challenge
Firebase SDK doesn't work in SharedWorker (where the game engine runs). All Firebase operations must happen in the UI thread. This requires message passing between worker and UI for sync operations.

### Files Reference
- `src/ui/util/cloudSync.ts` - Main sync logic (UI thread), permission functions
- `src/ui/util/firebase.ts` - Firebase initialization and auth
- `src/ui/views/CloudSync.tsx` - Cloud sync UI page, join/invite UI
- `src/ui/api/index.ts` - `syncCloudChanges` handler for worker→UI sync
- `src/common/cloudTypes.ts` - Type definitions
- `src/worker/api/index.ts` - Worker API (getLeagueDataForCloud, applyCloudChanges, createLeagueFromCloud)
- `src/worker/db/Cache.ts` - Change tracking for cloud sync
- `src/ui/components/PlayMenu.tsx` - Commissioner-only sim enforcement

---

## Estimated Work Remaining

| Task | Priority | Status |
|------|----------|--------|
| Push local changes to cloud | CRITICAL | DONE |
| Invite/join system | CRITICAL | DONE |
| Team assignment UI | CRITICAL | DONE |
| Basic permission enforcement (sim) | HIGH | DONE |
| Full team permission enforcement | Medium | Partial |
| Testing with multiple users | HIGH | Pending |
| Conflict resolution | Medium | Not started |
| Sim coordination (ready check) | Medium | Not started |
| Reconnection handling | Medium | Not started |

**MVP Complete!** Ready for initial testing with multiple users.

---

## Next Steps (Recommended Order)

1. **Test with real users** - Catch edge cases early with actual multiplayer testing
2. **Add team-specific permission checks** - Prevent users from trading/signing for other teams
3. **Reconnection handling** - Make the connection more robust
4. **Conflict resolution** - Handle simultaneous edits gracefully
5. **Polish and edge cases** - Ready check, notifications, etc.

---

## How to Use (Quick Start)

### For the Commissioner (League Owner):
1. Go to Tools → Cloud Sync
2. Sign in with Google
3. Click "Upload to Cloud" on your current league
4. Share the **League ID** with your friends

### For Members (Joining):
1. Go to Tools → Cloud Sync
2. Sign in with Google
3. In "Join a League", enter the League ID
4. Click "Load Teams" to see available teams
5. Select your team and click "Join League"
6. The league will download to your device

### Playing Together:
- The commissioner simulates games (other members cannot sim)
- Each member controls their assigned team
- Changes sync in real-time via Firestore
- All members see updates within seconds
