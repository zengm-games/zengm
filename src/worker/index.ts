import "../common/polyfills.ts";
import api from "./api/index.ts";
import * as common from "../common/constants.ts";
import * as core from "./core/index.ts";
import * as db from "./db/index.ts";
import * as util from "./util/index.ts";
import * as random from "../common/random.ts";
import { promiseWorker } from "./util/promiseWorker.ts";
import { registerGlobal } from "../common/registerGlobal.ts";
import { getCopies, getCopy } from "./db/deprecatedConsoleApi.ts";

// Old functions that people used from the console. They are added to the idb object itself so bbgm.idb.league etc. still work, but they are not in the type of idb, so the app can't use them.
Object.assign(db.idb, { getCopies, getCopy });

registerGlobal({
	...common,
	...core,
	...db,
	...util,
	random,
});

if (__NODE_ENV === "development") {
	import("./core/debug/index.ts").then(({ default: debug }) => {
		registerGlobal({ debug });
	});
}

// API functions should have at most 2 arguments. First argument is passed here from toWorker. If you need to pass multiple variables, use an object/array. Second argument is Conditions.
promiseWorker.register(([type, name, param]: any, hostID) => {
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
