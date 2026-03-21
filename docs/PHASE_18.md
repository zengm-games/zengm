# Phase 18: SocialFeed Panel

## Contract

A SocialFeed UI panel exists that listens for `feedEvent` notifications (delivered via `toUI("feedEvent")` from the game worker), reads the latest posts from `socialFeedDb` using its own IDB connection, and renders each post with its handle, body, timestamp, and image (when present). A profile page view renders all posts for a given account, resolved by `agentId`, `pid`, or `tid`. The panel updates without a page reload. No posts are cached in React state between events — every `feedEvent` triggers a fresh IDB read. The UI does not hold a reference to the Feed Worker and does not receive messages from it directly.

## Depends on

- **Phase 17** — `feedEventHandler.ts` exists and relays `toUI("feedEvent")` to the Feed Worker; the full pipeline fires end-to-end
- **Phase 3** — `socialFeedDb` exports `getPosts(limit?)`, `getPostsByAgent(agentId, limit?)`, `getAccountByPid(pid)`, `getAccountByTid(tid)` readable from the UI thread
- **Phase 3a** — All accounts are seeded into `socialFeedDb.accounts`; `initializeFeedAccounts` has been called on league load; `getAccountByPid` and `getAccountByTid` resolve correctly

## Delivers

- `src/ui/components/SocialFeed/index.tsx` — panel container, listens for feed events via `addFeedEventListener`, renders the main feed
- `src/ui/components/SocialFeed/Post.tsx` — renders a single `GeneratedPost`
- `src/ui/components/SocialFeed/Thread.tsx` — v1 stub; exists and exports a valid component that renders nothing
- `src/ui/views/SocialFeed.tsx` — view wrapper for the main feed page (used by the router)
- `src/ui/views/SocialFeedPlayer.tsx` — view wrapper for a player's profile feed, receives `pid` from route params
- `src/ui/views/SocialFeedTeam.tsx` — view wrapper for a team org's profile feed, receives `tid` from route params

Three new route entries in `src/ui/util/routeInfos.ts`:

```
"/l/:lid/social_feed"           → "socialFeed"
"/l/:lid/social_feed/player/:pid" → "socialFeedPlayer"
"/l/:lid/social_feed/team/:tid"   → "socialFeedTeam"
```

One new sidebar entry in `src/ui/util/menuItems.tsx` under the existing `"Agent"` header group:

```typescript
{
  type: "link",
  active: (pageID) => typeof pageID === "string" && pageID.startsWith("socialFeed"),
  league: true,
  commandPalette: true,
  path: ["social_feed"],
  text: "Social Feed",
}
```

## Component Architecture

```
SocialFeed/
  index.tsx     — SocialFeedPanel component
                  • subscribes to feed events via addFeedEventListener on mount
                  • on each feedEvent: calls getPosts(), updates status + posts state
                  • renders loading / empty / posts states (see Phase 17 loading model)
                  • also called from the view wrappers with an optional filter prop
  Post.tsx      — PostCard component
                  • accepts a single GeneratedPost
                  • renders handle, body, formatted relative timestamp, optional image
  Thread.tsx    — Thread component (stub)
                  • accepts no props with meaning in v1
                  • returns null
```

The view wrappers (`SocialFeed.tsx`, `SocialFeedPlayer.tsx`, `SocialFeedTeam.tsx`) each call `useTitleBar` and render the relevant variant of `SocialFeedPanel`. Profile views perform IDB lookups before rendering; the main feed view skips the lookup and uses `getPosts()` directly.

The `SocialFeedPanel` component in `index.tsx` is the only component that holds the feed event listener. It can be rendered in two modes:

| Mode        | Posts source                      | When used                   |
| ----------- | --------------------------------- | --------------------------- |
| `"feed"`    | `getPosts(limit)`                 | Main feed page              |
| `"profile"` | `getPostsByAgent(agentId, limit)` | Player or team profile page |

The mode and `agentId` (if any) are passed as props from the view wrappers. The `addFeedEventListener` callback is active in both modes — it triggers a re-fetch regardless of which posts are shown.

## postsReady / feedEvent Listener

The game worker calls `toUI("feedEvent", event)` after forwarding each event to the Feed Worker. The Feed Worker, after writing posts to IDB, may additionally signal the UI via a separate `toUI("postsReady")` message if that channel is wired up. In either case, the `SocialFeedPanel` component subscribes to feed notifications on mount via `useEffect`.

**The UI does not hold a reference to the Feed Worker.** The panel must not call `new Worker(...)` or import a Worker instance. Instead it uses the `addFeedEventListener` helper exported by `src/ui/util/feedEventHandler.ts` (Phase 17):

```typescript
import { addFeedEventListener } from "../../util/feedEventHandler.ts";
```

Listener lifecycle in `SocialFeedPanel`:

```typescript
useEffect(() => {
	const remove = addFeedEventListener(() => {
		void loadPosts();
	});
	return remove; // cleanup on unmount
}, [loadPosts]); // re-register if loadPosts changes (it is stable via useCallback)
```

`loadPosts` is defined inside the component using `useCallback` (with no dependencies other than the `agentId`/mode prop) so that the cleanup in the effect can reference a stable function:

```typescript
const loadPosts = useCallback(async () => {
	if (mode === "profile" && agentId) {
		const fetched = await getPostsByAgent(agentId);
		setPosts(fetched);
		setStatus(fetched.length > 0 ? "ready" : "empty");
	} else {
		const fetched = await getPosts();
		setPosts(fetched);
		setStatus(fetched.length > 0 ? "ready" : "empty");
	}
}, [mode, agentId]);
```

Initial load also happens in a separate `useEffect` that calls `loadPosts()` once on mount, so the panel is populated before any feed event arrives.

## Main Feed View

`SocialFeedPanel` in `index.tsx` manages two pieces of state: `posts: GeneratedPost[]` and `status: 'loading' | 'empty' | 'ready'`. It starts in `'loading'` and transitions to `'empty'` or `'ready'` after the first IDB read completes (see Phase 17 for the three-state loading model).

```typescript
const [status, setStatus] = useState<"loading" | "empty" | "ready">("loading");
const [posts, setPosts] = useState<GeneratedPost[]>([]);
```

Posts are not preserved between feed events — each event replaces the array entirely via `getPosts()`. No accumulation. No deduplication. The IDB is the single source of truth; the component is a stateless read projection.

Full structure of `index.tsx`:

```typescript
import { useState, useEffect, useCallback } from "react";
import type { GeneratedPost } from "../../../common/types.feedEvent.ts";
import { getPosts, getPostsByAgent } from "../../db/socialFeedDb.ts";
import { addFeedEventListener } from "../../util/feedEventHandler.ts";
import { Post } from "./Post.tsx";

type Props = {
  mode: "feed" | "profile";
  agentId?: string;
};

export function SocialFeedPanel({ mode, agentId }: Props) {
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready'>('loading');
  const [posts, setPosts] = useState<GeneratedPost[]>([]);

  const loadPosts = useCallback(async () => {
    const fetched = mode === "profile" && agentId
      ? await getPostsByAgent(agentId)
      : await getPosts();
    setPosts(fetched);
    setStatus(fetched.length > 0 ? 'ready' : 'empty');
  }, [mode, agentId]);

  // Initial load
  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // feedEvent listener — re-read IDB whenever the game worker fires a feed event
  useEffect(() => {
    return addFeedEventListener(() => {
      void loadPosts();
    });
  }, [loadPosts]);

  if (status === 'loading') return <p className="text-body-secondary">Loading…</p>;
  if (status === 'empty')   return <p className="text-body-secondary">No posts yet.</p>;

  return (
    <div className="social-feed">
      {posts.map((post) => (
        <Post key={post.postId} post={post} />
      ))}
    </div>
  );
}
```

The component is a named export (`export function SocialFeedPanel`), not a default export, consistent with the multi-export pattern of other `index.tsx` files in the codebase (e.g. `ColorPicker/index.tsx`).

Note: the UI reads posts from `socialFeedDb` using its own IDB connection opened via `openDB` from `@dumbmatter/idb`. This connection is separate from the game worker's connection to the same database — each execution context opens its own. See Phase 17 for the correct connection pattern.

## Post Component

`Post.tsx` renders a single `GeneratedPost`. It has no state and no effects — it is a pure render function.

### Props

```typescript
import type { GeneratedPost } from "../../../common/types.feedEvent.ts";

type PostProps = {
	post: GeneratedPost;
};
```

### Fields rendered

| Field            | Rendered as                                                |
| ---------------- | ---------------------------------------------------------- |
| `post.handle`    | Bold `@handle` text at the top of the card                 |
| `post.body`      | Post text, `white-space: pre-wrap`                         |
| `post.createdAt` | Formatted relative timestamp (e.g. "2 min ago", "4 h ago") |
| `post.imageUrl`  | `<img>` element if non-null; nothing rendered if null      |

### Timestamp formatting

A small helper `formatRelativeTime(createdAt: number): string` computes elapsed seconds from `Date.now()` and returns a human-readable string:

- < 60 s → `"just now"`
- < 3600 s → `"X min ago"`
- < 86400 s → `"X h ago"`
- otherwise → `"X d ago"`

This helper is defined in `Post.tsx` (not exported) so it is co-located with the only consumer.

### Image conditional

```tsx
{
	post.imageUrl !== null && (
		<img
			src={post.imageUrl}
			alt="post image"
			className="img-fluid mt-2 rounded"
		/>
	);
}
```

No fallback placeholder is rendered when `imageUrl` is null. No broken `<img>` tag. Nothing.

### Full structure of `Post.tsx`

```tsx
import type { GeneratedPost } from "../../../common/types.feedEvent.ts";

type PostProps = {
	post: GeneratedPost;
};

const formatRelativeTime = (createdAt: number): string => {
	const elapsed = Math.floor((Date.now() - createdAt) / 1000);
	if (elapsed < 60) return "just now";
	if (elapsed < 3600) return `${Math.floor(elapsed / 60)} min ago`;
	if (elapsed < 86400) return `${Math.floor(elapsed / 3600)} h ago`;
	return `${Math.floor(elapsed / 86400)} d ago`;
};

export function Post({ post }: PostProps) {
	return (
		<div className="card mb-2 shadow-sm">
			<div className="card-body py-2 px-3">
				<div className="d-flex justify-content-between align-items-baseline mb-1">
					<span className="fw-bold small">@{post.handle}</span>
					<span className="text-body-secondary small">
						{formatRelativeTime(post.createdAt)}
					</span>
				</div>
				<p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
					{post.body}
				</p>
				{post.imageUrl !== null && (
					<img
						src={post.imageUrl}
						alt="post image"
						className="img-fluid mt-2 rounded"
					/>
				)}
			</div>
		</div>
	);
}
```

## Profile Page View

Profile pages resolve accounts by `pid` (player) or `tid` (team), look up the `agentId`, then render the same `SocialFeedPanel` in `"profile"` mode.

### Player profile feed

Route: `/l/:lid/social_feed/player/:pid` → view ID `"socialFeedPlayer"`

`src/ui/views/SocialFeedPlayer.tsx`:

```typescript
import { useState, useEffect } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { useViewData } from "../util/viewManager.tsx";
import { getAccountByPid } from "../db/socialFeedDb.ts";
import { SocialFeedPanel } from "../components/SocialFeed/index.tsx";

const SocialFeedPlayerView = () => {
  useTitleBar({ title: "Player Feed" });

  const context = useViewData((s) => s.data);
  const pid = Number(context.pid ?? 0);

  const [agentId, setAgentId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void getAccountByPid(pid).then((account) => {
      setAgentId(account?.agentId ?? null);
    });
  }, [pid]);

  if (agentId === undefined) {
    return <p className="text-body-secondary">Loading…</p>;
  }

  if (agentId === null) {
    return <p className="text-body-secondary">No social feed account for this player.</p>;
  }

  return <SocialFeedPanel mode="profile" agentId={agentId} />;
};

export default SocialFeedPlayerView;
```

Three-state `agentId`:

- `undefined` — lookup is in progress (show loading)
- `null` — no account found (show empty message)
- `string` — account found; pass to `SocialFeedPanel`

The `pid` comes from the route context, which the view system populates via `useViewData` (the existing pattern for parameterized routes like `/l/:lid/player/:pid`). Since the player profile view is purely client-side, no Worker round-trip is needed — the view reads directly from `socialFeedDb`.

### Team org profile feed

Route: `/l/:lid/social_feed/team/:tid` → view ID `"socialFeedTeam"`

`src/ui/views/SocialFeedTeam.tsx`:

```typescript
import { useState, useEffect } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { useViewData } from "../util/viewManager.tsx";
import { getAccountByTid } from "../db/socialFeedDb.ts";
import { SocialFeedPanel } from "../components/SocialFeed/index.tsx";

const SocialFeedTeamView = () => {
  useTitleBar({ title: "Team Feed" });

  const context = useViewData((s) => s.data);
  const tid = Number(context.tid ?? 0);

  const [agentId, setAgentId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void getAccountByTid(tid).then((account) => {
      setAgentId(account?.agentId ?? null);
    });
  }, [tid]);

  if (agentId === undefined) {
    return <p className="text-body-secondary">Loading…</p>;
  }

  if (agentId === null) {
    return <p className="text-body-secondary">No social feed account for this team.</p>;
  }

  return <SocialFeedPanel mode="profile" agentId={agentId} />;
};

export default SocialFeedTeamView;
```

The lookup chain is always `getAccountByTid(tid)` → `account.agentId` → `getPostsByAgent(agentId)`. The `tid` parameter is the numeric team ID from the route, not the abbreviation.

## Thread.tsx Stub

`Thread.tsx` must exist, must compile, and must export a valid React component. In v1 it renders nothing. It is a placeholder for threaded reply display in a future phase.

Full content of `src/ui/components/SocialFeed/Thread.tsx`:

```tsx
export function Thread() {
	return null;
}
```

No props. No state. No effects. No imports. Returns `null`. This satisfies the TypeScript compiler and allows other code to import `Thread` without error. The v2 implementation will replace this stub with a component that renders a post and its replies together.

## Integration with Existing UI

### Routing

Add three entries to `src/ui/util/routeInfos.ts`:

```typescript
"/l/:lid/social_feed": "socialFeed",
"/l/:lid/social_feed/player/:pid": "socialFeedPlayer",
"/l/:lid/social_feed/team/:tid": "socialFeedTeam",
```

Add three exports to `src/ui/views/index.ts`:

```typescript
export { default as SocialFeed } from "./SocialFeed.tsx";
export { default as SocialFeedPlayer } from "./SocialFeedPlayer.tsx";
export { default as SocialFeedTeam } from "./SocialFeedTeam.tsx";
```

The router in `src/ui/util/routes.ts` will automatically pick these up via the existing `genPage` loop — no changes to `routes.ts` are needed.

### Sidebar navigation

Add a "Social Feed" link to the `"Agent"` header in `src/ui/util/menuItems.tsx`. The `"Agent"` header already exists with a single "Chat" child:

```typescript
{
  type: "header",
  long: "Agent",
  short: "A",
  league: true,
  commandPalette: true,
  children: [
    {
      type: "link",
      active: (pageID) => pageID === "agentChat",
      league: true,
      commandPalette: true,
      path: ["agent_chat"],
      text: "Chat",
    },
    // Add this:
    {
      type: "link",
      active: (pageID) =>
        typeof pageID === "string" && pageID.startsWith("socialFeed"),
      league: true,
      commandPalette: true,
      path: ["social_feed"],
      text: "Social Feed",
    },
  ],
},
```

This follows the same `active` predicate pattern used by other multi-route groups (e.g. `exhibition` in the non-league section, `draft` in the Players group).

### No floating panel in v1

The `AgentChat` component (`src/ui/components/AgentChat/index.tsx`) demonstrates the floating panel + FAB pattern — a fixed-position card that overlays the page content, triggered by a floating action button. Phase 18 does not implement a floating SocialFeed overlay. The feed is accessible as a full page via the sidebar link. The floating variant (if desired) would be a separate future concern.

### Account initialization — game worker, not the UI

`initializeFeedAccounts()` (from Phase 3a) **must be called inside the game worker during league startup**, not from the UI panel on mount.

The game worker is the correct location because:

- It has direct access to the game state (player records, team records) needed to seed account data
- It runs before any UI view is rendered, ensuring accounts are ready before the first IDB read
- It avoids any `toWorker` round-trip from the UI to fetch roster data just to pass it back to a function that could run in the worker directly

The call belongs in the league-load path, after `local.leagueLoaded` is set to `true` — specifically after `idb.cache.fill()` completes and game attributes are loaded, so player and team data are available. See the startup sequence below for the exact ordering.

`initializeFeedAccounts` is idempotent — it skips accounts that already exist. Calling it on every league load is safe.

## Implementation Notes

### Feed Worker instantiation — game worker only

The Feed Worker is created as a singleton inside the game worker startup sequence. It must not be created anywhere in the UI thread. The correct instantiation is:

```typescript
// Inside the game worker (src/worker/index.ts or the league-load path):
const feedWorker = new Worker(new URL("./feedWorker.ts", import.meta.url));
```

Note: with Rolldown (the bundler used in this codebase) the exact Worker instantiation syntax should match the existing pattern used for any other workers created inside `src/worker/`. Check that path for the correct form — it may differ from the Vite/Rollup `new URL(..., import.meta.url)` pattern. The key constraint is that this call appears exactly once, in the game worker, not in any UI module.

### Game worker startup sequence

The ordered startup sequence for the feed system is:

1. **Game worker starts** — `src/worker/index.ts` is evaluated; `promiseWorker.register(...)` wires up the `toWorker` API dispatch
2. **League loads** — `beforeView.ts` (or `createStream.ts` for new leagues) runs `idb.cache.fill()`, `loadGameAttributes()`, and sets `local.leagueLoaded = true`
3. **`initializeFeedAccounts()` called** — immediately after `local.leagueLoaded = true`, seed any missing account records into `socialFeedDb`; player and team data are available from the cache at this point
4. **Feed Worker instantiated** — `new Worker(new URL('./feedWorker.ts', import.meta.url))` in the game worker; the singleton is stored in a module-level variable
5. **Game event hooks registered** — `emitFeedEvent` calls in the game simulation path are now live; the game worker forwards each `FeedEvent` to the Feed Worker via `postMessage` and also calls `toUI("feedEvent", event)` so the UI panel knows to re-read IDB
6. **UI panel connects** — when the user navigates to `/l/:lid/social_feed`, `SocialFeedPanel` mounts, reads from `socialFeedDb` via its own IDB connection, and registers its `addFeedEventListener` callback for future updates

Steps 1–5 happen in the game worker before the UI has rendered any feed-related view. Step 6 happens on-demand as the user navigates.

### `runBefore` hook — clarification

ZenGM does not expose a generic `runBefore` lifecycle API for custom startup code. The correct hook for running code on league load is the `runBefore` function defined in `src/worker/api/index.ts`, which is invoked by the `toWorker` message handler when the UI requests a view update. However, feed system initialization (steps 2–4 above) should not be triggered by a view request — it should be wired directly into the league-load path in `beforeView.ts` (which already sets `local.leagueLoaded = true`) or into `createStream.ts` (for new league creation).

Concretely: add the `initializeFeedAccounts()` call and the Feed Worker instantiation after the `local.leagueLoaded = true` line in `src/worker/util/beforeView.ts`. This ensures the feed system is ready before the first view renders, regardless of which view the user navigates to first.

### feedEventListener in UI

The UI panel uses `addFeedEventListener` from `src/ui/util/feedEventHandler.ts` (Phase 17) — not a direct reference to any Worker object. The panel does not hold, import, or message any Worker instance. It reacts to `toUI("feedEvent")` notifications via the listener abstraction and reads from `socialFeedDb` via its own IDB connection.

### Route param extraction

The existing view system populates `useViewData().data` with the parsed route params as strings. `pid` and `tid` are strings in the route context and must be coerced with `Number()` before passing to `getAccountByPid` / `getAccountByTid`, which accept `number` per the Phase 3 contract.

### No server round-trip for profile views

Both `SocialFeedPlayer` and `SocialFeedTeam` are fully client-side — they read from `socialFeedDb` directly without going through `toWorker`. This is consistent with Phase 3's design: `socialFeedDb` is readable from the UI thread without touching the league IDB or the Worker. No Worker view function is needed for Phase 18.

### Post sort order

`getPosts()` returns posts ordered by `createdAt` descending (most recent first) per Phase 3's contract. `getPostsByAgent(agentId)` returns the same order scoped to one agent. The panel renders them in array order — no client-side re-sorting needed.

### Image loading

The `imageUrl` on a `GeneratedPost` is a publicly accessible `https://` URL produced by the `generatePlayerImage` tool (Phase 5). The `<img>` element renders it directly. No CORS proxy, no cache-busting, no lazy-loading wrapper is required in v1.

### TypeScript

All three component files import `GeneratedPost` from `src/common/types.feedEvent.ts`. No `any` is permitted. The `post.imageUrl` field is typed `string | null` per Phase 1, so the `!== null` guard on the image render is necessary and sufficient — TypeScript will not narrow it otherwise.

### CSS

No new CSS file is introduced. The panel uses Bootstrap utility classes (`card`, `mb-2`, `shadow-sm`, `fw-bold`, `text-body-secondary`, `img-fluid`, `rounded`, `d-flex`, etc.) already available in the codebase. Inline styles are limited to `whiteSpace: "pre-wrap"` on the post body.

### No React.memo

`Post` does not need `memo` wrapping in v1 — the post list is replaced atomically on each feed event, so there is no partial re-render optimization to be had. `SocialFeedPanel` should not be memoized either since it holds internal state.

## Verified by

- Simulating a game end causes new posts to appear in the panel (`/l/:lid/social_feed`) without any user interaction — the `toUI("feedEvent")` call triggers `addFeedEventListener` callbacks, which re-read IDB and re-render the panel
- The panel shows `'loading'` state on mount, then transitions to `'empty'` or `'ready'` after the first IDB read
- A post with a non-null `imageUrl` renders an `<img>` element with that URL as `src`; a post with `imageUrl === null` renders no `<img>` element and no broken placeholder
- The panel re-reads `socialFeedDb` on every `feedEvent` — confirmed by verifying that `getPosts` is called once per event (not once on mount and then accumulated)
- `initializeFeedAccounts()` is called in the game worker (in `beforeView.ts` or equivalent), not from any UI component — confirmed by `grep -n "initializeFeedAccounts" src/ui/` returning zero results
- `grep -r "new Worker" src/ui/` returns zero results for `feedWorker` — the Feed Worker is not instantiated in the UI thread
- Navigating to `/l/:lid/social_feed/player/42` calls `getAccountByPid(42)` and then `getPostsByAgent(account.agentId)` — the rendered list contains only posts where `agentId === "player_42"`, not posts from other agents
- Navigating to `/l/:lid/social_feed/team/3` calls `getAccountByTid(3)` and then `getPostsByAgent(account.agentId)` — the rendered list contains only posts from that team's org account
- `Thread.tsx` exists at `src/ui/components/SocialFeed/Thread.tsx`, exports a named `Thread` function, and `<Thread />` renders nothing (no DOM output)
- `tsc --noEmit` on all three `SocialFeed/` files passes with zero errors
- The sidebar shows "Social Feed" under the Agent section when inside a league; navigating to it loads the feed page

## Definition of Done

Panel renders live feed with correct three-state loading model (`loading` / `empty` / `ready`). Profile pages resolve by `pid`/`tid` via `getAccountByPid`/`getAccountByTid`. Images conditional on `imageUrl !== null`. `Thread` component stubbed and compiles. `initializeFeedAccounts()` called in the game worker on league load. Feed Worker instantiated as a singleton in the game worker. UI reads IDB via its own `openDB` connection. Full pipeline verified end-to-end: league loads → game worker calls `initializeFeedAccounts()` → Feed Worker instantiated → game event → `toUI("feedEvent")` → panel re-reads IDB → posts render.
