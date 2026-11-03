import { getPlayerStatsTableStats } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { getActiveSeasonSelector } from "../db/merged/players.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { getNumericStat, hasNonZeroStat } from "../../common/statValue.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";
import { dropdownKeys } from "../../common/dropdownKeys.ts";
import { getPlayerStatsTable, validatePlayerStatType } from "./playerStats.ts";
import { player } from "../core/index.ts";

const processInputs = (params: RouteParams<"playerStatDists">) => {
	return {
		season: validateSeason(params.season),
		statType: validatePlayerStatType(
			params.statType,
			dropdownKeys.statTypesDists,
		),
	};
};

export default defineView({
	id: "playerStatDists",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.has("gameSim") || updateEvents.has("playerMovement"))) ||
			inputs.season !== prevInputs?.season ||
			inputs.statType !== prevInputs?.statType
		) {
			const playersRaw = await idb.merged.players.getAll(
				getActiveSeasonSelector(inputs.season),
			);

			const { playerStatType, statsTable } = getPlayerStatsTable(
				inputs.statType,
			);

			let players = await player.formatAll(playersRaw, {
				ratings: ["skills"],
				stats: getPlayerStatsTableStats(statsTable.stats),
				season: inputs.season,
				statType: playerStatType,
			});
			const onlyShowIf = statsTable.onlyShowIf;
			if (onlyShowIf) {
				players = players.filter((p) => {
					for (const stat of onlyShowIf) {
						if (hasNonZeroStat(p.stats[stat])) {
							return true;
						}
					}

					return false;
				});
			}

			// Only numeric values can be plotted, so skip others like playoffs, keyStats strings, byPos arrays, and missing values in historical stats
			const statsAll: Record<string, number[]> = {};
			for (const p of players) {
				for (const [stat, value] of Object.entries(p.stats)) {
					const numericValue = getNumericStat(value);
					if (numericValue === undefined) {
						continue;
					}
					statsAll[stat] ??= [];
					statsAll[stat].push(numericValue);
				}
			}

			return {
				season: inputs.season,
				statsAll,
				statType: inputs.statType,
			};
		}
	},
});
