import type { FeedEvent } from "../../common/types.feedEvent.ts";

// Registered listeners from UI components (e.g. SocialFeed)
const listeners = new Set<(event: FeedEvent) => void>();

export function feedEventHandler(event: FeedEvent): void {
	listeners.forEach((fn) => fn(event));
}

export function addFeedEventListener(
	fn: (event: FeedEvent) => void,
): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
