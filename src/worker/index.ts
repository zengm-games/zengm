import "bbgm-polyfills"; // eslint-disable-line
import "./util/polyfills-modern";
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";

self.bbgm = { api, ...common, ...core, ...db, ...util };

const categories = [
	"actions",
	"leagueFileUpload",
	"main",
	"playMenu",
	"toolsMenu",
] as const;
export type WorkerAPICategory = typeof categories[number];

// API functions should have at most 2 arguments. First argument is passed here from toWorker. If you need to pass multiple variables, use an object/array. Second argument is Conditions.

(async () => {
	util.promiseWorker.register(([type, name, param], hostID) => {
		const conditions = {
			hostID,
		};

		// @ts-expect-error
		if (!api[type] || !api[type].hasOwnProperty(name)) {
			throw new Error(
				`API call to nonexistant worker function "${type}.${name}"`,
			);
		}

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-expect-error
		return api[type][name](param, conditions);
	});
})();
