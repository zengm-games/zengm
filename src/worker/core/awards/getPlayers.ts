import type {
	AwardInfoIndividual,
	AwardPlayer,
	NonEmptyArray,
	Player,
} from "../../../common/types.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { g, helpers } from "../../util/index.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "../season/getLeaderRequirements.ts";
import { idb } from "../../db/index.ts";
import {
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
} from "../../../common/constants.ts";
import { last } from "../../../common/utils.ts";
import { getPosByGpF } from "../player/getPosByGpF.ts";
import player from "../player/index.ts";
import { SKIP_PLAYER_STATS } from "../game/loadTeams.ts";
import {
	derivedPlayerStatKeys,
	processPlayerStats,
} from "../../util/processPlayerStats.ts";
import type { FormulaEvaluators } from "./processAwards.ts";

// tid gets added from root of AwardPlayer2 - that is the only tid we need to pass in to processPlayers, because otherwise we assume we have the actual stats available
export type StatOverridesByMatchup = Record<
	string,
	Record<
		number,
		AwardPlayer["statOverrides"] & {
			tid: number;
		}
	>
>;

const AWARD_STATS = [
	...(isSport("basketball") ? [] : ["keyStats"]),

	// Anything that appears in a player stats table
	...Object.values(PLAYER_STATS_TABLES).flatMap((x) => x.stats),

	// A few extra that don't
	...bySport({
		baseball: ["outs"],
		basketball: [],
		football: ["totTD"],
		hockey: ["gs"],
	}),
];
const AWARD_STATS_SPECIAL = ["seasonFraction", "teamGp", "winp"];
if (isSport("basketball")) {
	AWARD_STATS_SPECIAL.push("teamWs");
}
export const AWARD_STATS_ALL = [...AWARD_STATS, ...AWARD_STATS_SPECIAL];

const SKIP_BY_SPORT = new Set(
	bySport({
		baseball: ["keyStatsShort", "min", "poSo", "pos"],
		basketball: [],
		football: ["min"],
		hockey: ["gMin", "keyStatsWithGoalieGP", "gW", "gL", "gT", "gOTL"],
	}),
);

const PLAYOFF_SERIES_AWARD_STATS_RAW = player.stats.raw.filter(
	(key) =>
		!SKIP_PLAYER_STATS.has(key) &&
		!SKIP_BY_SPORT.has(key) &&
		!key.startsWith("opp"),
);
const PLAYOFF_SERIES_AWARD_STATS_DERIVED = derivedPlayerStatKeys.filter(
	(key) => !SKIP_BY_SPORT.has(key) && key !== "age",
);
const PLAYOFF_SERIES_AWARD_STATS = [
	...PLAYOFF_SERIES_AWARD_STATS_RAW,
	...PLAYOFF_SERIES_AWARD_STATS_DERIVED,
];
const PLAYOFF_SERIES_AWARD_STATS_SPECIAL = ["won"];
export const PLAYOFF_SERIES_AWARD_STATS_ALL = [
	...PLAYOFF_SERIES_AWARD_STATS,
	...PLAYOFF_SERIES_AWARD_STATS_SPECIAL,
];

type StatRange =
	| NonNullable<AwardInfoIndividual["statRange"]>
	| "regularSeason";

type StatsRowDefined = {
	abbrev: string;
	tid: number;
	jerseyNumber: string;
	season: number;
	playoffs: boolean | "combined" | "playoffSeries";
};

type StatsRow = StatsRowDefined & {
	[key: string]: any;
};

type CurrentStats = {
	seasonFraction: number;
	teamGp: number;
	winp: number;
} & StatsRow;

const getProcessedPlayers = async (
	playersAll: Player[],
	statRanges: Set<StatRange>,
	variables: Set<string>,
) => {
	const statsFromVariables = new Set(AWARD_STATS).intersection(variables);

	const stats = Array.from(
		new Set([
			...statsFromVariables,
			...getLeaderRequirementsStats(
				getLeaderRequirements(),
				statsFromVariables,
			),
		]),
	);

	const regularSeason = statRanges.has("regularSeason");
	const playoffs = statRanges.has("playoffs");
	const combined = statRanges.has("combined");

	const players = (await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"lastName",
			"draft",
			"injury",
			"born",
			"watch",
			"hof",
			"tid",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats: ["abbrev", "tid", "jerseyNumber", "season", ...stats],
		playoffs,
		regularSeason,
		combined,
		fuzz: true,
		mergeStats: "totOnly",
	})) as unknown as (Pick<
		Player,
		| "pid"
		| "firstName"
		| "lastName"
		| "draft"
		| "injury"
		| "born"
		| "watch"
		| "hof"
		| "tid"
	> & {
		name: string;
		ratings: NonEmptyArray<{
			pos: string;
			season: number;
			ovr: number;
			dovr: number;
			pot: number;
			skills: string[];
		}>;
		stats: StatsRow[];

		// Added later in getPlayers
		pos: string;
		currentStats: Partial<Record<StatRange, CurrentStats>>; // Would be nice to assume currentStats.regularSeason is always defined, but it's possible for a player to play in the playoffs but not the regular season...
		age: number;
		scores: Partial<Record<StatRange, Record<string, number>>>;
	})[];

	for (const p of players) {
		delete (p as any).careerStats;
	}

	// Used to filter out some players here with no stats, but even a player with no stats could have some relevant awards (like if there are no awards for regularSeason or playoffs but there are for playoff series, series stats are loaded elsewhere)

	return players;
};

const getPlayoffSeriesStats = async (
	season: number,
	seriesIndex: number,
	abbrevsByTid: Map<number, string>,
	statOverridesByMatchup: StatOverridesByMatchup | undefined,
	variables: Set<string>,
) => {
	const playoffSeries = await idb.getCopy.playoffSeries(
		{ season },
		"noCopyCache",
	);
	if (!playoffSeries) {
		return;
	}

	const roundSeries = playoffSeries.series.at(seriesIndex);
	if (!roundSeries) {
		return;
	}

	const gids = [];

	const winningTids = new Set();
	for (const series of roundSeries) {
		if (!series.away || series.home.won > series.away.won) {
			winningTids.add(series.home.tid);
		} else if (series.away.won > series.home.won) {
			winningTids.add(series.away.tid);
		}
		if (series.gids) {
			gids.push(...series.gids);
		}
	}

	const rowsByPid: Record<number, StatsRow> = {};

	const games = await idb.getCopies.games({ gids }, "noCopyCache");

	// Some games couldn't be found, so instead see if statOverridesByMatchup has the info we need (from saved awards, like on Award Races)
	if (games.length !== gids.length) {
		if (statOverridesByMatchup) {
			for (const [matchupKey, statOverrides] of Object.entries(
				statOverridesByMatchup,
			)) {
				const [homeTid, awayTid] = JSON.parse(matchupKey) as [number, number];
				for (const series of roundSeries) {
					if (series.away?.tid === awayTid && series.home.tid === homeTid) {
						for (const [pidString, info] of Object.entries(statOverrides)) {
							const pid = Number.parseInt(pidString);
							rowsByPid[pid] = {
								...info!,
								abbrev: abbrevsByTid.get(info!.tid) ?? "???",
								jerseyNumber: "", // Would be nice to get this from player stats, but whatever
								season,
								playoffs: "playoffSeries",
							};
						}
					}
				}
			}
		}
		return rowsByPid;
	}

	const tempRowsByPid: Map<
		number,
		{
			info: StatsRowDefined;
			rawStats: Record<string, any>;
		}
	> = new Map();

	const statsForProcessPlayerStats = new Set(
		PLAYOFF_SERIES_AWARD_STATS,
	).intersection(variables);

	for (const game of games) {
		for (const t of game.teams) {
			for (const p of t.players) {
				const row = tempRowsByPid.getOrInsert(p.pid, {
					info: {
						abbrev: abbrevsByTid.get(t.tid) ?? "???",
						jerseyNumber: p.jerseyNumber,
						playoffs: "playoffSeries",
						season,
						tid: t.tid,
					},
					rawStats: {},
				});

				// Need to scan all of PLAYOFF_SERIES_AWARD_STATS_RAW because we don't know which ones will be used in processPlayerStats for derived variables
				for (const key of PLAYOFF_SERIES_AWARD_STATS_RAW) {
					row.rawStats[key] ??= 0;
					row.rawStats[key] += p[key];
				}
			}
		}
	}

	for (const [pid, { info, rawStats }] of tempRowsByPid) {
		rowsByPid[pid] = {
			...info,
			...processPlayerStats(rawStats, statsForProcessPlayerStats, "perGame"),
			won: winningTids.has(info.tid),
		};
	}

	return rowsByPid;
};

const fixMax = (currentStats: Partial<Record<StatRange, CurrentStats>>) => {
	for (const stats of Object.values(currentStats)) {
		if (stats) {
			for (const [key, value] of Object.entries(stats)) {
				if (key.endsWith("Max") && Array.isArray(value)) {
					stats[key] = value[0];
				}
			}
		}
	}
};

export const getPlayers = async (
	season: number,
	statRanges: Set<StatRange>,
	statOverridesByMatchup: StatOverridesByMatchup | undefined,
	variables: FormulaEvaluators["variables"],
) => {
	let playersAll;
	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	const players = await getProcessedPlayers(
		playersAll,
		statRanges,
		variables.normal,
	);

	// Cache some stuff for later
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);
	const teamInfos: Record<
		number,
		{
			cid: number;
			did: number;
			gp: number;
			seasonFraction: number;
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		const gp = helpers.getTeamSeasonGp(teamSeason);
		let seasonFraction;
		if (
			season < g.get("season") ||
			(season === g.get("season") && g.get("phase") >= PHASE.PLAYOFFS)
		) {
			seasonFraction = 1;
		} else {
			seasonFraction = Math.min(1, gp / g.get("numGames"));
		}
		teamInfos[teamSeason.tid] = {
			cid: teamSeason.cid,
			did: teamSeason.did,
			gp,
			seasonFraction,
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// First index is statRange, second is pid
	const playoffSeriesStats: Record<number, Record<number, StatsRow>> = {};
	for (const statRange of statRanges) {
		if (typeof statRange === "number") {
			const abbrevsByTid = new Map<number, string>();
			for (const row of teamSeasons) {
				abbrevsByTid.set(row.tid, row.abbrev);
			}
			const stats = await getPlayoffSeriesStats(
				season,
				statRange,
				abbrevsByTid,
				statOverridesByMatchup,
				variables.playoffSeries,
			);
			if (stats) {
				playoffSeriesStats[statRange] = stats;
			}
		}
	}

	for (const p of players) {
		p.currentStats = {} as any;
		for (const statRange of statRanges) {
			if (typeof statRange === "number") {
				const row = playoffSeriesStats[statRange]?.[p.pid];
				if (row) {
					p.currentStats[statRange] = row as any;
				}
			} else if (statRange === "playoffs") {
				const row = p.stats.findLast(
					(row) => row.season === season && row.playoffs === true,
				);
				if (row) {
					p.currentStats.playoffs = row as any;
				}
			} else if (statRange === "regularSeason") {
				const row = p.stats.findLast(
					(row) => row.season === season && row.playoffs === false,
				);
				if (row) {
					p.currentStats.regularSeason = row as any;
				}
			} else if (statRange === "combined") {
				const row = p.stats.findLast(
					(row) => row.season === season && row.playoffs === "combined",
				);
				if (row) {
					p.currentStats.combined = row as any;
				}
			} else {
				throw new Error("Should never happen");
			}
		}
		fixMax(p.currentStats);

		p.pos = (
			p.ratings.findLast((row) => row.season === season) ?? last(p.ratings)
		).pos;

		if (isSport("baseball") && p.currentStats.regularSeason) {
			p.pos = getPosByGpF(p.currentStats.regularSeason.gpF, p.pos);
		}

		// Sum up any byPos stats - not ideal for team awards of awards with formulas by position, but probably good enough since we're using gpF to assign position so most of their games at least will be at the correct position
		if (player.stats.byPos) {
			const byPosStats = [...player.stats.byPos];
			if (isSport("baseball")) {
				byPosStats.push("rfld");
			}
			for (const stat of byPosStats) {
				for (const currentStats of Object.values(p.currentStats)) {
					if (currentStats && Array.isArray(currentStats[stat])) {
						currentStats[stat] = helpers.sum(currentStats[stat]);
					}
				}
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		const teamInfo = p.currentStats.regularSeason
			? teamInfos[p.currentStats.regularSeason.tid]
			: undefined;

		// Make some teamInfo available in formulas - these are regular season values but get applied to every statRange!
		for (const currentStats of Object.values(p.currentStats)) {
			if (currentStats) {
				currentStats.seasonFraction = teamInfo?.seasonFraction ?? 1;
				currentStats.teamGp = teamInfo?.gp ?? 0;
				currentStats.winp = teamInfo?.winp ?? 0;
			}
		}

		p.scores = {};
	}

	// Add fracWS for basketball current season
	if (isSport("basketball")) {
		for (const statRange of statRanges) {
			if (typeof statRange !== "number") {
				const totalWS: Record<number, number> = {};
				for (const p of players) {
					const currentStats = p.currentStats[statRange];
					if (!currentStats) {
						continue;
					}

					if (totalWS[currentStats.tid] === undefined) {
						totalWS[currentStats.tid] = 0;
					}
					totalWS[currentStats.tid] += currentStats.ws;
				}

				for (const p of players) {
					const currentStats = p.currentStats[statRange];
					if (!currentStats) {
						continue;
					}

					currentStats.teamWs = totalWS[currentStats.tid] ?? 0;
				}
			}
		}
	}

	return { players, teamInfos };
};
