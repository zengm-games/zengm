import { idb } from "../db/index.ts";
import { defineView } from "../util/defineView.ts";
import { env } from "../util/env.ts";
import {
	getSettingsFromGameAttributes,
	type NewLeagueSettings,
} from "./settings.ts";
import { unwrapGameAttribute } from "../../common/unwrapGameAttribute.ts";
import { newLeagueGodModeLimits } from "../util/newLeagueGodModeLimits.ts";
import { getNewLeagueLid } from "../util/getNewLeagueLid.ts";
import { defaultGameAttributes } from "../../common/defaultGameAttributes.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { getMetaAttribute } from "../db/metaAttributes.ts";

const processInputs = (params: RouteParams<"newLeague">) => {
	let type: "custom" | "random" | "real" | "legends" | "crossEra" = "custom";
	let lid;
	if (params.x === "random") {
		type = "random";
	} else if (params.x === "real") {
		type = "real";
	} else if (params.x === "legends") {
		type = "legends";
	} else if (params.x === "cross_era") {
		type = "crossEra";
	} else if (params.x !== undefined) {
		lid = Number.parseInt(params.x);
		if (Number.isNaN(lid)) {
			lid = undefined;
		}
		type = "custom";
	}

	return {
		lid,
		type,
	};
};

const getDefaultRealStats = () => {
	return env.mobile ? "none" : "allActiveHOF";
};

export const getDefaultSettings = (): NewLeagueSettings => {
	return {
		...getSettingsFromGameAttributes((key) =>
			unwrapGameAttribute(defaultGameAttributes, key),
		),
		realStats: getDefaultRealStats(),
	};
};

export const getRealTeamInfo = async () => {
	const realTeamInfo = await getMetaAttribute("realTeamInfo");

	return realTeamInfo;
};

export default defineView({
	id: "newLeague",
	processInputs,
	load: async ({ inputs: { lid, type } }) => {
		const godModeLimits = newLeagueGodModeLimits();

		const overrides = await getMetaAttribute("defaultSettingsOverrides");

		const defaultSettings = {
			...getDefaultSettings(),
			...overrides,
		};

		if (lid !== undefined) {
			// Importing!
			const l = await idb.meta.get("leagues", lid);

			if (l) {
				return {
					lid,
					difficulty: l.difficulty,
					name: l.name,
					type,
					godModeLimits,
					defaultSettings,
				};
			}
		}

		// Find most recent league and add one to the LID
		const newLid = await getNewLeagueLid();

		return {
			lid: undefined,
			difficulty: defaultSettings.difficulty,
			name: `League ${newLid}`,
			realTeamInfo: await getRealTeamInfo(),
			type,
			godModeLimits,
			defaultSettings,
		};
	},
});
