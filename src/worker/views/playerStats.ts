import {
	bySport,
	helpers,
	isSport,
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
} from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	PlayerStatType,
} from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getBestPos } from "../core/player/checkJerseyNumberRetirement.ts";

const updatePlayers = async (
	inputs: ViewInput<"playerStats">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		updateEvents.includes("playerMovement") ||
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

		// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!statsTable) {
			throw new Error(`Invalid statType: "${inputs.statType}"`);
		}

		const stats = statsTable.stats;
		let actualStats;
		if (inputs.season === "career") {
			actualStats = [
				...stats,

				// Used in processPlayersHallOfFame
				bySport({
					baseball: "war",
					basketball: "ewa",
					football: "av",
					hockey: "ps",
				}),
			];
		} else {
			actualStats = stats;
		}

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
			.findIndex((t) => t.abbrev === inputs.abbrev);

		if (tid < 0) {
			tid = undefined;
		}

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
			playersAll = playersAll.filter((p) => p.watch);
		}

		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
				"age",
				"born",
				"ageAtDeath",
				"injury",
				"tid",
				"abbrev",
				"hof",
				"watch",
				"awards",
			],
			ratings: ["skills", "pos", "season"],
			stats: ["abbrev", "tid", "jerseyNumber", "season", ...actualStats],
			season: typeof inputs.season === "number" ? inputs.season : undefined,
			tid,
			statType,
			playoffs: inputs.playoffs === "playoffs",
			regularSeason: inputs.playoffs === "regularSeason",
			combined: inputs.playoffs === "combined",
			mergeStats: "totOnly",
		});

		if (inputs.season === "all") {
			players = players.flatMap((p) =>
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
			);
		}

		// Only keep players who actually played
		if (inputs.abbrev !== "watch" && isSport("basketball")) {
			players = players.filter((p) => {
				if (inputs.season !== "career") {
					return p.stats.gp > 0;
				} else if (inputs.playoffs === "playoffs") {
					return p.careerStatsPlayoffs.gp > 0;
				} else if (inputs.playoffs === "combined") {
					return p.careerStatsCombined.gp > 0;
				} else {
					return p.careerStats.gp > 0;
				}
			});
		} else if (
			inputs.abbrev !== "watch" &&
			statsTable.onlyShowIf &&
			!isSport("basketball")
		) {
			// Ensure some non-zero stat for this position
			const onlyShowIf = statsTable.onlyShowIf;

			let obj:
				| "careerStatsPlayoffs"
				| "careerStatsCombined"
				| "careerStats"
				| "stats";
			if (inputs.season === "career") {
				if (inputs.playoffs === "playoffs") {
					obj = "careerStatsPlayoffs";
				} else if (inputs.playoffs === "combined") {
					obj = "careerStatsCombined";
				} else {
					obj = "careerStats";
				}
			} else {
				obj = "stats";
			}

			players = players.filter((p) => {
				for (const stat of onlyShowIf) {
					// Array check is for byPos stats
					if (
						(typeof p[obj][stat] === "number" && p[obj][stat] > 0) ||
						(Array.isArray(p[obj][stat]) && p[obj][stat].length > 0)
					) {
						return true;
					}
				}

				return false;
			});
		}

		players = addFirstNameShort(players);

		for (const p of players) {
			if (inputs.season === "career") {
				p.pos = getBestPos(p, tid);
			} else if (Array.isArray(p.ratings) && p.ratings.length > 0) {
				p.pos = p.ratings.at(-1).pos;
			} else if (p.ratings.pos !== undefined) {
				p.pos = p.ratings.pos;
			} else {
				p.pos = "?";
			}
		}

		let superCols;
		if (inputs.season === "all") {
			if (statsTable.superCols) {
				// Account for extra "Season" column
				superCols = helpers.deepCopy(statsTable.superCols);
				superCols[0].colspan += 1;
			}
		} else {
			superCols = statsTable.superCols;
		}

		return {
			players,
			abbrev: inputs.abbrev,
			season: inputs.season,
			statType: inputs.statType,
			playoffs: inputs.playoffs,
			stats,
			superCols,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
