// feedWorkerInstance.ts — singleton holder for the Feed Worker inside the game worker.
//
// The Feed Worker must be instantiated exactly once, inside the game worker.
// Call initFeedWorker() during league startup (see beforeView.ts).
// Call getFeedWorker() anywhere in the game worker to post messages to it.

let feedWorker: Worker | null = null;

export function initFeedWorker(): void {
	if (feedWorker !== null) {
		// Already initialized — idempotent.
		return;
	}
	feedWorker = new Worker(new URL("../feedWorker.ts", import.meta.url));
	feedWorker.onmessage = (e: MessageEvent) => {
		// Handle postsReady acknowledgements from the Feed Worker.
		if (e.data?.type === "postsReady") {
			console.log(`[feedWorker] postsReady: ${e.data.count} post(s) generated`);
		}
	};
	feedWorker.onerror = (e: ErrorEvent) => {
		console.error("[feedWorker] uncaught error:", e.message);
	};
}

export function getFeedWorker(): Worker | null {
	return feedWorker;
}
