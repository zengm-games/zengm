import { idb } from "../db/index.ts";
import type { Player } from "../../common/types.ts";
import { groupByUnique, last } from "../../common/utils.ts";
import { statsRowIsCurrent } from "../core/player/statsRowIsCurrent.ts";
import { processPlayerStats } from "./processPlayerStats.ts";
import helpers from "./helpers.ts";
import { bySport } from "../../common/sportFunctions.ts";

export const advStatsSave = async (
	players: any[],
	playersRaw: Player[],
	updatedStats: Record<string, number[] | number[][]>,
) => {
	const playersByPid = groupByUnique(playersRaw, (p) => p.pid);
	const playersToSave = [];
	const keys = Object.keys(updatedStats);
	for (const [i, { pid }] of players.entries()) {
		const p = playersByPid[pid];

		if (p) {
			const ps = p.stats.at(-1);

			if (ps) {
				for (const key of keys) {
					if (!Number.isNaN(updatedStats[key]![i])) {
						ps[key] = updatedStats[key]![i];
					}
				}

				playersToSave.push(p);
			}
		}
	}
	await idb.cache.players.putAll(playersToSave);
};

const PLAYER_STATS = bySport({
	baseball: [
		"h",
		"2b",
		"3b",
		"hr",
		"bb",
		"hbp",
		"ab",
		"sb",
		"cs",
		"gpF",
		"po",
		"poSo",
		"outs",
		"er",
		"bf",
		"pa",
		"gp",
		"gpPit",
	],
	basketball: [
		"min",
		"tp",
		"ast",
		"fg",
		"ft",
		"tov",
		"fga",
		"fta",
		"trb",
		"orb",
		"stl",
		"blk",
		"pf",
		"drb",
		"pts",
		"pm",
	],
	football: [
		"gp",
		"gs",
		"pss",
		"pssYds",
		"pssAdjYdsPerAtt",
		"rus",
		"rusYds",
		"rusYdsPerAtt",
		"rec",
		"recYds",
		"defSk",
		"defFmbRec",
		"defFmbFrc",
		"defInt",
		"defPssDef",
		"defIntTD",
		"defFmbTD",
		"defTck",
		"prTD",
		"krTD",
		"fg0",
		"fg20",
		"fg30",
		"fg40",
		"fg50",
		"fga0",
		"fga20",
		"fga30",
		"fga40",
		"fga50",
		"xp",
		"xpa",
		"pnt",
		"pntYds",
		"pntBlk",
		"pbw",
		"pba",
		"pbwr",
		"rbw",
		"rba",
		"rbwr",
	],
	hockey: ["gp", "min", "g", "a", "sa", "ga", "pm"],
});

// Since WAR uses current team's stats rather than mergedStats, we can avoid a playersPlus call
export const getPlayers = async (playoffs: boolean) => {
	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);

	const players: {
		allLeagueTeam?: number;
		pid: number;
		ratings: {
			pos: string;
		};
		stats: any[];
		tid: number;
	}[] = [];
	for (const p of playersRaw) {
		const ps = p.stats.at(-1);

		// Ignore players with no stats row, such as players signed/traded who haven't played a game yet, since we don't call addStatsRow when joining the roster now
		if (!ps || !statsRowIsCurrent(ps, p.tid, playoffs)) {
			continue;
		}

		const stats = processPlayerStats(ps, PLAYER_STATS, "totals");
		for (const key in stats) {
			const value = stats[key];
			if (value !== null && typeof value === "object") {
				stats[key] = helpers.deepCopy(value);
			}
		}
		players.push({
			pid: p.pid,
			ratings: { pos: last(p.ratings).pos },
			stats,
			tid: p.tid,
		});
	}

	return { players, playersRaw };
};
