import { PLAYER, PHASE } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type {
	Award2,
	Conditions,
	DistributiveOmit,
	Player,
	PlayerAward,
	PlayerFiltered,
	PlayerStatType,
	TeamFiltered,
} from "../../../common/types.ts";
import { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball.ts";
import addAward from "../player/addAward.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { orderTeams } from "../../util/orderTeams.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "./getLeaderRequirements.ts";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "../../views/leaders.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";

export type AwardsByPlayer = {
	pid: number;
	tid: number;
	name: string;
	award: DistributiveOmit<PlayerAward, "season">;
}[];

export type GetTopPlayersOptions = {
	allowNone?: boolean;
	amount?: number;
	filter?: (a: PlayerFiltered) => boolean;
	score: (a: PlayerFiltered) => number;
};

export const awardStats = bySport({
	baseball: [
		"keyStats",
		"gpPit",
		"gsPit",
		"w",
		"l",
		"sv",
		"era",
		"ip",
		"war",
		"rpit",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",

		// For all-offense/defense teams
		"rbat",
		"rbr",
		"rfld",

		// For position determination
		"gpF",

		// For season leaders (and requirements)
		"hr",
		"rbi",
		"r",
		"sb",
		"bb",
		"soPit",
		"ba",
		"ops",
	],
	basketball: [
		"gp",
		"gs",
		"min",
		"pts",
		"trb",
		"ast",
		"blk",
		"stl",
		"per",
		"ewa",
		"ws",
		"dws",
		"vorp",
		"ws48",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
	],
	football: [
		"keyStats",
		"pntYds",
		"fg",
		"krTD",
		"krYds",
		"prTD",
		"prYds",
		"pssYds",
		"pssTD",
		"pssInt",
		"rusYds",
		"rusTD",
		"recYds",
		"recTD",
		"fmbLost",
		"prTD",
		"krTD",
		"ydsFromScrimmage",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
		"defIntTD",
		"defFmbTD",
		"defSft",
		"defSk",
		"defInt",
		"defPssDef",
		"defFmbFrc",
		"defFmbRec",
		"defTckSolo",
		"defTckAst",
		"defTckLoss",
		"totTD",
		"pbw",
		"pba",
		"pbwr",
		"rbw",
		"rba",
		"rbwr",
	],
	hockey: [
		"keyStats",
		"gpGoalie",
		"g",
		"a",
		"pts",
		"hit",
		"tk",
		"gaa",
		"svPct",
		"ops",
		"dps",
		"gps",
		"ps",
		"season",
		"abbrev",
		"tid",
		"jerseyNumber",
	],
});

const getProcessedPlayers = async (
	playersAll: Player[],
	season: number,
	playoffs?: boolean,
) => {
	const stats = Array.from(
		new Set([
			...awardStats,
			...getLeaderRequirementsStats(getLeaderRequirements(), awardStats),
		]),
	);

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"lastName",
			"tid",
			"abbrev",
			"draft",
			"injury",
			"born",
			"watch",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats,
		playoffs,
		regularSeason: !playoffs,
		fuzz: true,
		mergeStats: "totOnly",
	});

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter((p) =>
		p.stats.some((ps: any) => ps.season === season),
	);

	// This can happen if there are 0 games in the regular season - in that case, might as well look for playoff stats too
	if (players.length === 0 && !playoffs) {
		return getProcessedPlayers(playersAll, season, true);
	}

	return players;
};

const getPlayers = async (season: number): Promise<PlayerFiltered[]> => {
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

	const players = await getProcessedPlayers(playersAll, season);

	// Add winp, for later
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);
	const teamInfos: Record<
		number,
		{
			gp: number;
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		teamInfos[teamSeason.tid] = {
			gp: helpers.getTeamSeasonGp(teamSeason),
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// For convenience later
	for (const p of players) {
		p.currentStats = p.stats.at(-1);
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		p.pos = p.ratings.at(-1).pos;
		if (isSport("baseball")) {
			// Overwrite position with actual position played
			const gpF = (p.currentStats.gpF as (number | undefined)[]).map((gp) =>
				gp === undefined ? 0 : gp,
			);
			let maxGP = 0; // Start at 0 rather than -Infinity because we're not interested in positions with 0 games played
			let maxIndex;
			for (const [i, gp] of gpF.entries()) {
				if (gp > maxGP) {
					maxGP = gp;
					maxIndex = i;
				}
			}

			if (maxIndex !== undefined) {
				p.pos = (POS_NUMBERS_INVERSE as any)[maxIndex + 1];
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		// Player somehow on an inactive team needs this fallback, should only happen in a weird custom roster
		p.teamInfo = teamInfos[p.currentStats.tid] ?? {
			gp: 0,
			winp: 0,
		};
	}

	// Add fracWS for basketball current season
	if (isSport("basketball")) {
		const totalWS: Record<number, number> = {};
		for (const p of players) {
			if (totalWS[p.currentStats.tid] === undefined) {
				totalWS[p.currentStats.tid] = 0;
			}
			totalWS[p.currentStats.tid] += p.currentStats.ws;
		}

		for (const p of players) {
			p.currentStats.fracWS = Math.min(
				// Inner max is to handle negative totalWS
				p.currentStats.ws / Math.max(totalWS[p.currentStats.tid]!, 1),

				// In the rare case that a team has very low or even negative WS, don't let anybody have a crazy high fracWS
				0.8,
			);
		}
	}

	return players;
};

const teamAwards = async (
	teamsUnsorted: TeamFiltered<
		["tid"],
		[
			"winp",
			"pts",
			"won",
			"lost",
			"tied",
			"otl",
			"wonDiv",
			"lostDiv",
			"tiedDiv",
			"otlDiv",
			"wonConf",
			"lostConf",
			"tiedConf",
			"otlConf",
			"cid",
			"did",
		],
		["pts", "oppPts", "gp"],
		number
	>[],
) => {
	const teams = await orderTeams(teamsUnsorted, teamsUnsorted);
	if (!teams[0]) {
		throw new Error("No teams found");
	}

	const bestRecord = teams[0].tid;

	const bestRecordConfs: Record<number, number> = {};
	for (const conf of g.get("confs", "current")) {
		const teamsConf = await orderTeams(
			teams.filter((t2) => t2.seasonAttrs.cid === conf.cid),
			teams,
		);
		const t = teamsConf[0];
		if (t) {
			bestRecordConfs[conf.cid] = t.tid;
		}
	}

	const bestRecordDivs: Record<number, number> = {};
	for (const div of g.get("divs", "current")) {
		const teamsDiv = await orderTeams(
			teams.filter((t2) => t2.seasonAttrs.did === div.did),
			teams,
		);
		const t = teamsDiv[0];
		if (t) {
			bestRecordDivs[div.did] = t.tid;
		}
	}

	return {
		bestRecord,
		bestRecordConfs,
		bestRecordDivs,
	};
};

const leagueLeaders = async (
	players: PlayerFiltered[],
	categories: {
		name: string;
		stat: string;
	}[],
	awardsByPlayer: AwardsByPlayer,
) => {
	const requirements = getLeaderRequirements();
	const statType: PlayerStatType = bySport({
		baseball: "totals",
		basketball: "perGame",
		football: "totals",
		hockey: "totals",
	});
	const season = g.get("season");

	const gamesPlayedCache = new GamesPlayedCache();
	await gamesPlayedCache.loadSeasons([season], false);

	for (const { stat, name } of categories) {
		if (!requirements[stat]) {
			throw new Error(`Missing leader requirements for ${stat}`);
		}

		const statInfo = {
			stat,
			...requirements[stat],
		};

		let leaders = [];
		let leaderValue = statInfo.sortAscending ? Infinity : -Infinity;
		for (const p of players) {
			const playerValue = p.currentStats[stat];

			const pass = playerMeetsCategoryRequirements({
				career: false,
				cat: statInfo,
				gamesPlayedCache,
				p,
				playerStats: p.currentStats,
				seasonType: "regularSeason",
				season,
				statType,
			});

			if (pass) {
				if (
					statInfo.sortAscending
						? playerValue < leaderValue
						: playerValue > leaderValue
				) {
					leaders = [p];
					leaderValue = playerValue;
				} else if (playerValue === leaderValue) {
					leaders.push(p);
				}
			}
		}

		for (const p of leaders) {
			awardsByPlayer.push({
				pid: p.pid,
				tid: p.tid,
				name: p.name,
				award: { type: name },
			});
		}
	}
};

const getTopPlayers = (
	{ amount, filter, score }: GetTopPlayersOptions,
	playersUnsorted: PlayerFiltered[],
): PlayerFiltered[] => {
	if (playersUnsorted.length === 0) {
		return [];
	}

	const actualFilter = filter ?? (() => true);
	const actualAmount = amount ?? 1;
	const cache: Map<number, number> = new Map();
	const players = playersUnsorted.filter(actualFilter).sort((a, b) => {
		let aScore = cache.get(a.pid);

		if (aScore === undefined) {
			aScore = score(a);
			cache.set(a.pid, aScore);
		}

		let bScore = cache.get(b.pid);

		if (bScore === undefined) {
			bScore = score(b);
			cache.set(b.pid, bScore);
		}

		return bScore - aScore;
	});

	// If all players are filtered out above (like MIP initial year), then this will return an empty array
	return players.slice(0, actualAmount);
};

const saveAwardsByPlayer = async (
	awardsByPlayer: AwardsByPlayer,
	conditions: Conditions,
	season: number = g.get("season"),
	logEvents: boolean = true,
	allStarGID?: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	// None of this stuff needs to block, it's just notifications
	for (const p of awardsByPlayer) {
		let text = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
			p.name
		}</a> (<a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[p.tid]?.abbrev}_${p.tid}`,
			g.get("season"),
		])}">${g.get("teamInfoCache")[p.tid]?.abbrev}</a>) `;
		let score;

		if (p.award.type?.includes("Leader")) {
			text += `led the league in ${p.award.type
				.replace("League ", "")
				.replace(" Leader", "")
				.toLowerCase()}.`;
			score = 10;
		} else if (p.award.type === "All-Star") {
			text += "made the All-Star team.";
			score = 10;
		} else if (p.award.type === "All-Star MVP") {
			text += `won the <a href="${helpers.leagueUrl([
				"game_log",
				"special",
				season,
				allStarGID,
			])}">All-Star MVP</a> award.`;
			score = 10;
		} else if (p.award.type === "Slam Dunk Contest Winner") {
			text += "won the slam dunk contest.";
			score = 10;
		} else if (p.award.type === "Three-Point Contest Winner") {
			text += "won the three-point contest.";
			score = 10;
		} else if (p.award.type === undefined && p.award.numTeams !== undefined) {
			// Team awards
			text += `made the ${formatPlayerAwardName(p.award)}.`;
			score = 10;
		} else {
			if (p.award.type !== undefined || p.award.rank === 1) {
				text += `won the ${formatPlayerAwardName(p.award)} award.`;
				score = 20;
			}
		}

		if (logEvents && score !== undefined) {
			logEvent(
				{
					type: "award",
					text,
					showNotification: false,
					pids: [p.pid],
					tids: [p.tid],
					score,
				},
				conditions,
			);
		}
	}
	const pids = Array.from(
		new Set(awardsByPlayer.map((award) => award.pid)),
	).filter((x) => x != undefined);
	for (const pid of pids) {
		let p = await idb.cache.players.get(pid);
		if (!p) {
			p = await idb.getCopy.players(
				{
					pid,
				},
				"noCopyCache",
			);
		}

		if (p && pid != undefined) {
			for (const awardByPlayer of awardsByPlayer) {
				if (awardByPlayer.pid === pid) {
					addAward(p, {
						...awardByPlayer.award,
						season,
					});
				}
			}
			await idb.cache.players.put(p);
		}
	}
};

const deleteAwardsByPlayer = async (
	awardsByPlayer: {
		pid: number;
		type: string;
	}[],
	season: number,
) => {
	if (awardsByPlayer.length === 0) {
		return;
	}

	const pids = Array.from(new Set(awardsByPlayer.map((award) => award.pid)));
	const players = await idb.getCopies.players(
		{
			pids,
		},
		"noCopyCache",
	);
	for (const p of players) {
		const typesToDelete = awardsByPlayer
			.filter((award) => award.pid === p.pid)
			.map((award) => award.type);
		p.awards = p.awards.filter(
			(award) => award.season != season || !typesToDelete.includes(award.type),
		);
		await idb.cache.players.put(p);
	}
};

const addSimpleAndTeamAwardsToAwardsByPlayer = () => {};

const getInitials = (string: string) => {
	return (
		string
			.match(/\b\p{L}/gu)
			?.join("")
			.toUpperCase() ?? ""
	);
};

export const formatAwardName = (
	award: Award2,
	season: number,
	short?: boolean,
) => {
	let prefix = "";
	const group = award.group;
	if (group) {
		if (group.type === "conf") {
			const confs = g.get("confs", season);
			const conf = confs.find((conf) => conf.cid === group.cid);
			if (conf) {
				prefix = getInitials(conf.name);
			}
		} else {
			const divs = g.get("divs", season);
			const div = divs.find((div) => div.did === group.did);
			if (div) {
				prefix = getInitials(div.name);
			}
		}
	}

	if (short) {
		return `${prefix}${award.shortName}`;
	}

	return `${prefix} ${award.name}`;
};

export {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	deleteAwardsByPlayer,
	saveAwardsByPlayer,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	teamAwards,
};
