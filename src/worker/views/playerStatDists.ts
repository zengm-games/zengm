import {
	getPlayerStatsTableStats,
	PLAYER_STATS_TABLES,
} from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { getActiveSeasonSelector } from "../db/merged/players.ts";
import { g } from "../util/index.ts";
import type { PlayerStatType } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { getNumericStat, hasNonZeroStat } from "../../common/statValue.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

const processInputs = (params: RouteParams<"playerStatDists">) => {
	const defaultStatType = bySport({
		baseball: "batting",
		basketball: "perGame",
		football: "passing",
		hockey: "skater",
	});
	return {
		season: validateSeason(params.season),
		statType: params.statType !== undefined ? params.statType : defaultStatType,
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

			let stats = undefined;
			let statType: PlayerStatType = "perGame";
			if (
				bySport({
					baseball: true,
					basketball: false,
					football: true,
					hockey: true,
				})
			) {
				stats = PLAYER_STATS_TABLES[inputs.statType]!.stats;
			} else {
				if (inputs.statType === "advanced") {
					stats = PLAYER_STATS_TABLES.advanced!.stats;
				} else if (inputs.statType === "shotLocations") {
					stats = PLAYER_STATS_TABLES.shotLocations!.stats;
				} else {
					stats = PLAYER_STATS_TABLES.regular!.stats;
					if (inputs.statType === "totals") {
						statType = "totals";
					} else if (inputs.statType === "per36") {
						statType = "per36";
					}
				}
			}

			let players = await player.formatAll(playersRaw, {
				ratings: ["skills"],
				stats: getPlayerStatsTableStats(stats),
				season: inputs.season,
				statType,
			});
			if (
				bySport({
					baseball: true,
					basketball: false,
					football: true,
					hockey: true,
				})
			) {
				const statTable = PLAYER_STATS_TABLES[inputs.statType]!;
				const onlyShowIf = statTable.onlyShowIf;
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
