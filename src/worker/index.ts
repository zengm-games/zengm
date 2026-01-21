// Debug: Capture any errors during worker initialization
self.onerror = (event) => {
	console.error("[Worker] Global error:", event);
};

self.onunhandledrejection = (event) => {
	console.error("[Worker] Unhandled rejection:", event.reason);
};

console.log("[Worker] Error handlers set up, starting imports...");

try {
	// Dynamic imports to catch errors
	await import("../common/polyfills.ts");
	console.log("[Worker] 1/6 Polyfills loaded");

	const api = (await import("./api/index.ts")).default;
	console.log("[Worker] 2/6 API loaded");

	const common = await import("../common/index.ts");
	console.log("[Worker] 3/6 Common loaded");

	const core = await import("./core/index.ts");
	console.log("[Worker] 4/6 Core loaded");

	const db = await import("./db/index.ts");
	console.log("[Worker] 5/6 DB loaded");

	const util = await import("./util/index.ts");
	console.log("[Worker] 6/6 Util loaded");

	self.bbgm = { api, ...common, ...core, ...db, ...util };
	console.log("[Worker] self.bbgm assigned");

	if (process.env.NODE_ENV === "development") {
		import("./core/debug/index.ts").then(({ default: debug }) => {
			self.bbgm.debug = debug;
		});
	}

	util.promiseWorker.register(([type, name, param], hostID) => {
		const conditions = {
			hostID,
		};

		// @ts-expect-error
		if (!api[type] || !Object.hasOwn(api[type], name)) {
			throw new Error(
				`API call to nonexistant worker function "${type}.${name}"`,
			);
		}

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		return api[type][name](param, conditions);
	});

	console.log("[Worker] Worker fully initialized!");
} catch (error) {
	console.error("[Worker] INITIALIZATION ERROR:", error);
	// Try to send error to main thread
	self.postMessage({ type: "error", error: String(error) });
}

export type WorkerAPICategory =
	| "actions"
	| "exhibitionGame"
	| "leagueFileUpload"
	| "main"
	| "playMenu"
	| "toolsMenu";
