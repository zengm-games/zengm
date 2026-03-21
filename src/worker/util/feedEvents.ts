import toUI from "./toUI.ts";
import { processFeedEvent } from "./processFeedEvent.ts";
import type {
	FeedEvent,
	FeedEventType,
	SocialContext,
} from "../../common/types.feedEvent.ts";

export function emitFeedEvent(
	type: FeedEventType,
	context: SocialContext,
	eventMetadata?: Record<string, unknown>,
): void {
	const event: FeedEvent = {
		type,
		timestamp: Date.now(),
		context,
		...(eventMetadata !== undefined ? { eventMetadata } : {}),
	};

	console.log("[feed:emit] emitFeedEvent:", type);
	// Process the event inline in the game worker (fire-and-forget).
	processFeedEvent(event);

	// Notify the UI thread so the SocialFeedPanel re-reads IDB.
	toUI("feedEvent", [event]);
}
