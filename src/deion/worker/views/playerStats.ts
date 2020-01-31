import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g, overrides } from "../util";
import { UpdateEvents, ViewInput, PlayerStatType } from "../../common/types";

const updatePlayers = async (
	inputs: ViewInput<"playerStats">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.abbrev !== state.abbrev ||
		inputs.season !== state.season ||
		inputs.statType !== state.statType ||
		inputs.playoffs !== state.playoffs
	) {
		let statsTable;

		if (process.env.SPORT === "basketball") {
			if (inputs.statType === "advanced") {
				statsTable = overrides.common.constants.PLAYER_STATS_TABLES.advanced;
			} else if (inputs.statType === "shotLocations") {
				statsTable =
					overrides.common.constants.PLAYER_STATS_TABLES.shotLocations;
			} else {
				statsTable = overrides.common.constants.PLAYER_STATS_TABLES.regular;
			}
		} else {
			statsTable =
				overrides.common.constants.PLAYER_STATS_TABLES[inputs.statType];
		}

		if (!statsTable) {
			throw new Error(`Invalid statType: "${inputs.statType}"`);
		}

		const stats = statsTable.stats;
		let playersAll;

		if (g.get("season") === inputs.season && g.get("phase") <= PHASE.PLAYOFFS) {
			playersAll = await idb.cache.players.indexGetAll("playersByTid", [
				PLAYER.FREE_AGENT,
				Infinity,
			]);
		} else {
			playersAll = await idb.getCopies.players({
				activeSeason: inputs.season,
			});
		}

		let tid: number | undefined = g
			.get("teamAbbrevsCache")
			.indexOf(inputs.abbrev);

		if (tid < 0) {
			tid = undefined;
		}

		// Show all teams
		let statType: PlayerStatType;

		if (process.env.SPORT === "basketball") {
			if (inputs.statType === "totals") {
				statType = "totals";
			} else if (inputs.statType === "per36") {
				statType = "per36";
			} else {
				statType = "perGame";
			}
		} else {
			statType = "totals";
		}

		if (!tid && inputs.abbrev === "watch") {
			playersAll = playersAll.filter(
				p => p.watch && typeof p.watch !== "function",
			);
		}

		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"nameAbbrev",
				"age",
				"injury",
				"tid",
				"abbrev",
				"hof",
				"watch",
			],
			ratings: ["skills", "pos"],
			stats: ["abbrev", "tid", ...stats],
			season: inputs.season,
			// If null, then show career stats!
			tid,
			statType,
			playoffs: inputs.playoffs === "playoffs",
			regularSeason: inputs.playoffs !== "playoffs",
		});

		// Only keep players with more than 5 mpg in regular season, of any PT in playoffs
		if (inputs.abbrev !== "watch" && process.env.SPORT === "basketball") {
			// Find max gp to use for filtering
			let gp = 0;

			for (const p of players) {
				if (p.stats.gp > gp) {
					gp = p.stats.gp;
				}
			}

			// Special case for career totals - use g.get("numGames") games, unless this is the first season
			if (!inputs.season) {
				if (g.get("season") > g.get("startingSeason")) {
					gp = g.get("numGames");
				}
			}

			players = players.filter(p => {
				// Minutes played
				let min;

				if (inputs.statType === "totals") {
					if (inputs.season) {
						min = p.stats.min;
					} else if (inputs.playoffs !== "playoffs") {
						min = p.careerStats.min;
					}
				} else if (inputs.season) {
					min = p.stats.gp * p.stats.min;
				} else if (inputs.playoffs !== "playoffs") {
					min = p.careerStats.gp * p.careerStats.min;
				}

				if (inputs.playoffs !== "playoffs") {
					if (min !== undefined && min > gp * 5) {
						return true;
					}
				}

				// Or, keep players who played in playoffs
				if (inputs.playoffs === "playoffs") {
					if (inputs.season) {
						if (p.stats.gp > 0) {
							return true;
						}
					} else if (p.careerStatsPlayoffs.gp > 0) {
						return true;
					}
				}

				return false;
			});
		} else if (
			inputs.abbrev !== "watch" &&
			statsTable.onlyShowIf &&
			process.env.SPORT === "football"
		) {
			// Ensure some non-zero stat for this position
			const onlyShowIf = statsTable.onlyShowIf;

			let obj: "careerStatsPlayoffs" | "careerStats" | "stats";
			if (inputs.season === undefined) {
				if (inputs.playoffs === "playoffs") {
					obj = "careerStatsPlayoffs";
				} else {
					obj = "careerStats";
				}
			} else {
				obj = "stats";
			}

			players = players.filter(p => {
				for (const stat of onlyShowIf) {
					if (typeof p[obj][stat] === "number" && p[obj][stat] > 0) {
						return true;
					}
				}

				return false;
			});
		}

		return {
			players,
			abbrev: inputs.abbrev,
			season: inputs.season,
			statType: inputs.statType,
			playoffs: inputs.playoffs,
			stats,
			superCols: statsTable.superCols,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
