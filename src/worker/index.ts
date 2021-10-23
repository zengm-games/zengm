import "bbgm-polyfills"; // eslint-disable-line
import "./util/polyfills-modern"; // IMPORTANT THAT THIS GOES AFTER bbgm-polyfills FOR NATIVE STREAM DETECTION
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";

self.bbgm = { api, ...common, ...core, ...db, ...util };

const categories = ["actions", "leagueFileUpload"] as const;

(async () => {
	util.promiseWorker.register(([type, name, ...params], hostID) => {
		const conditions = {
			hostID,
		};

		for (const category of categories) {
			if (type === category) {
				if (!api[category].hasOwnProperty(name)) {
					throw new Error(
						`API call to nonexistant worker function "${category}.${name}" with params ${JSON.stringify(
							params,
						)}`,
					);
				}

				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				return api[category][name](...params, conditions);
			}
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
