import "bbgm-polyfills"; // eslint-disable-line
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";

self.bbgm = { api, ...common, ...core, ...db, ...util };

(async () => {
	util.promiseWorker.register(([type, name, ...params], hostID) => {
		const conditions = {
			hostID,
		};

		if (type === "actions") {
			if (!api.actions.hasOwnProperty(name)) {
				throw new Error(
					`API call to nonexistant worker function "actions.${name}" with params ${JSON.stringify(
						params,
					)}`,
				);
			}

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			return api.actions[name](...params, conditions);
		}

		if (type === "playMenu") {
			if (!api.actions.playMenu.hasOwnProperty(name)) {
				throw new Error(
					`API call to nonexistant worker function "playMenu.${name}" with params ${JSON.stringify(
						params,
					)}`,
				);
			}

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			return api.actions.playMenu[name](...params, conditions);
		}

		if (type === "toolsMenu") {
			if (!api.actions.toolsMenu.hasOwnProperty(name)) {
				throw new Error(
					`API call to nonexistant worker function "toolsMenu.${name}" with params ${JSON.stringify(
						params,
					)}`,
				);
			}

			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			return api.actions.toolsMenu[name](...params, conditions);
		}

		if (!api.hasOwnProperty(name)) {
			throw new Error(
				`API call to nonexistant worker function "${name}" with params ${JSON.stringify(
					params,
				)}`,
			);
		}

		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-ignore
		return api[name](...params, conditions);
	});
})();
