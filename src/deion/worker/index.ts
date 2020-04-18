import "../common/polyfills";
import api from "./api";
import * as common from "../common";
import * as core from "./core";
import * as db from "./db";
import * as util from "./util";
import type {
	Names,
	WorkerOverridesConstants,
	WorkerOverridesCore,
	WorkerOverridesUtil,
} from "../common/types";

const overrides = util.overrides;

self.bbgm = { ...common, ...core, ...db, ...util };

const deionWorker = async (options: {
	overrides: {
		common: {
			constants: WorkerOverridesConstants;
			[key: string]: any;
		};
		core: WorkerOverridesCore;
		names: Names;
		util: WorkerOverridesUtil;
		views: {
			[key: string]: any;
		};
	};
}) => {
	Object.assign(overrides, options.overrides);

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
};

export default deionWorker;
