import { defineView } from "../util/defineView.ts";
import type { AdvancedPlayerSearchFilter } from "../../ui/views/AdvancedPlayerSearch.tsx";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";
import { validateSeasonType } from "../util/processInputs.ts";
import { validateStatType } from "../util/processInputs.ts";

export const processInputs = (params: RouteParams<"advancedPlayerSearch">) => {
	const singleSeason: "totals" | "singleSeason" =
		params.singleSeason === "totals" ? "totals" : "singleSeason";

	let filters: AdvancedPlayerSearchFilter[];
	try {
		const parsed = JSON.parse(params.filters!) as any[][];
		filters = parsed.map((row) => {
			return {
				category: row[0],
				key: row[1],
				operator: row[2],
				value: row[3],
			};
		});
	} catch {
		filters = [];
	}

	let showStatTypes: string[];
	try {
		showStatTypes = JSON.parse(params.showStatTypes!);
	} catch {
		showStatTypes = [];
	}

	return {
		seasonStart: validateSeason(params.seasonStart),
		seasonEnd: validateSeason(params.seasonEnd),
		singleSeason,
		playoffs: validateSeasonType(params.playoffs, "regularSeason"),
		statType: validateStatType(params.statType),
		filters,
		showStatTypes,
	};
};

export default defineView({
	id: "advancedPlayerSearch",
	processInputs,
	load: ({
		inputs: {
			seasonStart,
			seasonEnd,
			singleSeason,
			playoffs,
			statType,
			filters,
			showStatTypes,
		},
		updateEvents,
	}) => {
		if (updateEvents.includes("firstRun")) {
			return {
				seasonStart,
				seasonEnd,
				singleSeason,
				playoffs,
				statType,
				filters,
				showStatTypes,
			};
		}
	},
});
