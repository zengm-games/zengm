import { isSport, PHASE, PLAYER, PLAYER_STATS_TABLES } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	PlayerStatType,
} from "../../common/types";

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

		if (isSport("basketball")) {
			if (inputs.statType === "advanced") {
				statsTable = PLAYER_STATS_TABLES.advanced;
			} else if (inputs.statType === "shotLocations") {
				statsTable = PLAYER_STATS_TABLES.shotLocations;
			} else if (inputs.statType === "gameHighs") {
				statsTable = PLAYER_STATS_TABLES.gameHighs;
			} else {
				statsTable = PLAYER_STATS_TABLES.regular;
			}
		} else {
			statsTable = PLAYER_STATS_TABLES[inputs.statType];
		}

		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
			playersAll = await idb.getCopies.players(
				{
					activeSeason:
						typeof inputs.season === "number" ? inputs.season : undefined,
				},
				"noCopyCache",
			);
		}

		let tid: number | undefined = g
			.get("teamInfoCache")
			.findIndex(t => t.abbrev === inputs.abbrev);

		if (tid < 0) {
			tid = undefined;
		}

		// Show all teams
		let statType: PlayerStatType;

		if (isSport("basketball")) {
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

		if (tid === undefined && inputs.abbrev === "watch") {
			playersAll = playersAll.filter(p => p.watch);
		}

		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"nameAbbrev",
				"name",
				"age",
				"born",
				"ageAtDeath",
				"injury",
				"tid",
				"abbrev",
				"hof",
				"watch",
			],
			ratings: ["skills", "pos", "season"],
			stats: ["abbrev", "tid", "jerseyNumber", "season", ...stats],
			season: typeof inputs.season === "number" ? inputs.season : undefined,
			tid,
			statType,
			playoffs: inputs.playoffs === "playoffs",
			regularSeason: inputs.playoffs !== "playoffs",
			mergeStats: true,
		});

		if (inputs.season === "all") {
			players = players
				.map(p =>
					p.stats.map((ps: any) => {
						const ratings =
							p.ratings.find((pr: any) => pr.season === ps.season) ??
							p.ratings.at(-1);

						return {
							...p,
							ratings,
							stats: ps,
						};
					}),
				)
				.flat();
		}

		// Only keep players who actually played
		if (inputs.abbrev !== "watch" && isSport("basketball")) {
			players = players.filter(p => {
				if (inputs.statType === "gameHighs") {
					if (inputs.season !== "career") {
						return p.stats.gp > 0;
					} else if (inputs.playoffs !== "playoffs") {
						return p.careerStats.gp > 0;
					}
					return p.careerStatsPlayoffs.gp > 0;
				}

				if (inputs.season !== "career") {
					return p.stats.gp > 0;
				} else if (inputs.playoffs === "playoffs") {
					return p.careerStatsPlayoffs.gp > 0;
				} else if (inputs.playoffs !== "playoffs") {
					return p.careerStats.gp > 0;
				}

				return false;
			});
		} else if (
			inputs.abbrev !== "watch" &&
			statsTable.onlyShowIf &&
			(isSport("football") || isSport("hockey"))
		) {
			// Ensure some non-zero stat for this position
			const onlyShowIf = statsTable.onlyShowIf;

			let obj: "careerStatsPlayoffs" | "careerStats" | "stats";
			if (inputs.season === "career") {
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
