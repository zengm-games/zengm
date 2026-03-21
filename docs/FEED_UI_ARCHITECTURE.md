# Social Feed UI — Architecture

## Mission

Display a live, chronological list of AI-generated social posts reacting to in-game events. The feed gives the player a sense of a living world around their franchise — players, journalists, fans, and team orgs reacting to trades, game results, injuries, and draft picks as they happen.

The UI is a thin display layer. It owns no game state, performs no inference, and writes nothing. Its only jobs are: read posts from `socialFeedDb`, and re-render when new ones arrive.

---

## Principles

These are inherited from `TWITTER_ARCHITECTURE.md` and apply equally here.

- **The UI is a display layer only.** All writes happen in the Feed Worker. The UI reads; it never writes.
- **No polling.** New posts arrive via event listener. The component does not set timers or intervals.
- **No global state.** The component owns its own post list. No Redux, no context, no shared store.
- **IndexedDB is the source of truth.** On new events, the UI re-reads from `socialFeedDb` rather than appending optimistically.

---

## V1 Scope

### In scope

| Feature                   | Notes                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| Chronological post list   | Newest first, up to 50 posts via `getPosts(50)`                      |
| 3 loading states          | `loading`, `empty`, `ready` — see Loading States section             |
| Event type badge per post | Bootstrap badge showing `eventType` (e.g. `GAME_END`, `TRADE_ALERT`) |
| Handle + body + timestamp | `@handle`, post body, relative time (e.g. "2 minutes ago")           |
| Live update on new events | `addFeedEventListener` → re-read IDB → re-render                     |

### Out of scope (v2)

- Threading UI (replies, quote-posts, thread view)
- Likes and reposts interaction
- Profile pages (`/l/:lid/feed/account/:agentId`)
- Image display (the `imageUrl` field exists in the data model but is not rendered in v1)
- Sidebar nav entry and notification badge
- Notification system

---

## Component Architecture

All v1 code lives in a single file. No sub-components are needed yet.

```
SocialFeedPage
  └── PostList
        └── PostCard (handle, eventType badge, body, relative time)
```

**File:** `src/ui/views/SocialFeed.tsx`

The entire page — `SocialFeedPage`, `PostList`, and `PostCard` — is defined here as local functions. They are not exported individually. Only the default export (`SocialFeedPage`) is used by the router.

When v2 warrants extraction, `PostCard` moves to `src/ui/views/SocialFeed/PostCard.tsx` and so on. The router import does not change.

---

## Data Flow

```
On mount
  └── getPosts(50)              ← socialFeedDb.ts
        └── render PostList

On new feed event
  └── addFeedEventListener fires
        └── getPosts(50)        ← re-read IDB (Feed Worker has already written)
              └── re-render PostList
```

**`getPosts`** opens the `posts` store via the `by-time` index in reverse (newest first) and returns up to `limit` records. It is defined in `src/ui/db/socialFeedDb.ts`.

**`addFeedEventListener`** is defined in `src/ui/util/feedEventHandler.ts`. It registers a callback that fires whenever `feedEventHandler` is called (i.e. when the Feed Worker notifies the UI of new posts). It returns an unsubscribe function for use in `useEffect` cleanup.

The component never calls `addPost` or any write function. It never touches the Feed Worker directly.

```typescript
// Sketch — not final code
useEffect(() => {
	getPosts(50)
		.then(setPosts)
		.finally(() => setStatus("ready-or-empty"));

	const unsubscribe = addFeedEventListener(() => {
		getPosts(50).then(setPosts);
	});

	return unsubscribe;
}, []);
```

---

## Loading States

Three states, one at a time. The component tracks a `status` value alongside its `posts` array.

| State     | When                                      | UI                                                   |
| --------- | ----------------------------------------- | ---------------------------------------------------- |
| `loading` | Initial mount, before `getPosts` resolves | Spinner + "Waiting for game activity..."             |
| `empty`   | `getPosts` resolved with 0 posts          | "No posts yet. Simulate a game to see agents react." |
| `ready`   | `getPosts` resolved with 1+ posts         | List of `PostCard` components                        |

The `loading` state is expected to be brief (single IDB read). A full-page spinner is fine; no skeleton loaders needed in v1.

---

## PostCard Design

Each card renders four pieces of information from the `GeneratedPost` record:

| Field      | Source           | Rendered as                                                                  |
| ---------- | ---------------- | ---------------------------------------------------------------------------- |
| Handle     | `post.handle`    | Bold text, e.g. `@ShamsCharania`                                             |
| Event type | `post.eventType` | Bootstrap badge, e.g. `<span className="badge bg-secondary">GAME_END</span>` |
| Body       | `post.body`      | Plain paragraph text                                                         |
| Timestamp  | `post.createdAt` | Relative time string, e.g. "2 minutes ago"                                   |

Relative time is computed from `post.createdAt` (Unix ms) and the current time. No external library is needed — a small local helper is sufficient for v1.

```typescript
function relativeTime(createdAt: number): string {
	const seconds = Math.floor((Date.now() - createdAt) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.floor(minutes / 60);
	return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}
```

Cards are displayed in a simple vertical list, newest at top. No card interaction (no click handler, no hover state) in v1.

---

## Route Registration

Add one entry to `src/ui/util/routeInfos.ts`:

```typescript
"/l/:lid/social_feed": "socialFeed",
```

The view key `"socialFeed"` must match the dynamic import in the router's view loader. Follow the same pattern as existing league views (`leagueDashboard`, `standings`, etc.).

The view file `src/ui/views/SocialFeed.tsx` must export a default React component. No worker view (`src/worker/views/`) is needed — the page reads directly from `socialFeedDb`, not from the game worker.

---

## How to Navigate There

During development, navigate directly:

```
/l/1/social_feed
```

Replace `1` with the actual `lid` for the open league. The URL can be typed directly in the browser or linked from any debug panel.

The page is not yet in the sidebar nav. To reach it in a real session, the URL must be entered manually. This is intentional for v1 — sidebar nav entry is a v2 addition.

---

## V2 Additions

Not designed. Brief list for planning:

- **Profile pages** — `/l/:lid/feed/account/:agentId` showing all posts by one agent; linked from `@handle` in `PostCard`
- **Threading UI** — indented reply chains; `parentId` and `threadId` fields already exist in the data model
- **Image display** — render `post.imageUrl` when present; stat cards, portraits, action shots
- **Sidebar nav entry** — "Social Feed" link in the league sidebar, alongside existing nav items
- **Notification badge** — unread post count on the sidebar nav entry, cleared on visit
- **Likes and reposts** — display `post.likes` and `post.reposts` counts; interaction (increment) is a separate design decision
