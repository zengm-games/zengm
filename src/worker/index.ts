import "../common/polyfills.ts";
import api from "./api/index.ts";
import * as common from "../common/index.ts";
import * as core from "./core/index.ts";
import * as db from "./db/index.ts";
import * as util from "./util/index.ts";

self.bbgm = { api, ...common, ...core, ...db, ...util };

if (process.env.NODE_ENV === "development") {
	import("./core/debug/index.ts").then(({ default: debug }) => {
		self.bbgm.debug = debug;
	});
}

export type WorkerAPICategory =
	| "actions"
	| "exhibitionGame"
	| "leagueFileUpload"
	| "main"
	| "playMenu"
	| "toolsMenu";

// API functions should have at most 2 arguments. First argument is passed here from toWorker. If you need to pass multiple variables, use an object/array. Second argument is Conditions.

(async () => {
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
})();
