import {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	teamAwards,
	type AwardsByPlayer,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	saveAwardsByPlayer,
} from "./awards";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { Conditions, PlayerFiltered } from "../../../common/types";
import type { AwardPlayer, Awards } from "../../../common/types.baseball";
import orderBy from "lodash-es/orderBy";
import {
	POS_NUMBERS,
	POS_NUMBERS_INVERSE,
} from "../../../common/constants.baseball";
import processPlayerStats, {
	NUM_OUTS_PER_GAME,
} from "../../../common/processPlayerStats.baseball";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer | undefined => {
	if (!p) {
		return;
	}

	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
		pos: p.pos,
		keyStats: p.currentStats.keyStats,
	};
};

const getTopByPos = (
	players: AwardPlayer[],
	position: string,
	usedPids?: Set<number>,
) => {
	for (const p of players) {
		if (usedPids) {
			if (usedPids.has(p.pid)) {
				continue;
			}
		}

		if (position === p.pos) {
			if (usedPids) {
				usedPids.add(p.pid);
			}

			return p;
		}
	}
};

const makeTeams = (
	players: PlayerFiltered[],
	type: "offense" | "defense" | "rookie",
): any => {
	const usedPids = new Set<number>();
	const teamPositions = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];

	const dh = g.get("dh");
	const confs = g.get("confs");
	let dhType: "allDH" | "noDH" | "mix";
	if (
		dh === "all" ||
		(Array.isArray(dh) && confs.every(conf => dh.includes(conf.cid)))
	) {
		dhType = "allDH";
	} else if (dh === "none" || (Array.isArray(dh) && dh.length === 0)) {
		dhType = "noDH";
	} else {
		dhType = "mix";
	}

	// Add DH or P as necessary
	if (type === "offense") {
		if (dhType === "allDH") {
			teamPositions.push("DH");
		} else if (dhType === "noDH") {
			teamPositions.push("P");
		} else {
			teamPositions.push("DH", "P");
		}
	} else if (type === "defense") {
		teamPositions.push("P");
	} else {
		if (dhType === "allDH" || dhType === "mix") {
			teamPositions.push("DH");
		}
		teamPositions.push("P");
	}

	const team = teamPositions.map(pos => {
		// Rookie and offense come pre-sorted. For defense, need to sort by position each time
		let sorted = players;
		if (type === "defense") {
			const index = (POS_NUMBERS as any)[pos] - 1;
			sorted = orderBy(players, p => p.currentStats.rfld[index] ?? 0, "desc");
		}

		return getTopByPos(sorted, pos, usedPids);
	});
	return team;
};

export const mvpScore = (p: PlayerFiltered) => {
	return p.currentStats.war;
};

export const rpoyFilter = (p: PlayerFiltered) =>
	p.currentStats.gpPit > 2 * p.currentStats.gsPit;

export const poyScore = (p: PlayerFiltered) => p.currentStats.rpit;

// This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
export const royFilter = (p: PlayerFiltered) => {
	const repeatSeason = g.get("repeatSeason");
	return (
		p.draft.year === p.currentStats.season - 1 ||
		(repeatSeason !== undefined &&
			p.draft.year === repeatSeason.startingSeason - 1)
	);
};

export const getPosByGpF = (gpF: (number | undefined)[]) => {
	let posIndex = -1;
	let maxGP = -Infinity;
	for (let i = 0; i < gpF.length; i++) {
		const gp = gpF[i];
		if (gp !== undefined && gp > maxGP) {
			posIndex = i;
			maxGP = gp;
		}
	}
	return (POS_NUMBERS_INVERSE as any)[posIndex + 1] ?? "?";
};

const getRealFinalsMvp = async (
	players: PlayerFiltered[],
	champTid: number,
): Promise<AwardPlayer | undefined> => {
	const games = await idb.cache.games.getAll();
	if (games.length === 0) {
		return;
	}

	// Last game of the season will have the two finals teams
	const finalsTids = games.at(-1)!.teams.map(t => t.tid);

	// Get all playoff games between those two teams - that will be all finals games
	const finalsGames = games.filter(
		game =>
			game.playoffs &&
			finalsTids.includes(game.teams[0].tid) &&
			finalsTids.includes(game.teams[1].tid),
	);

	if (finalsGames.length === 0) {
		return;
	}

	// Calculate sum of something WAR-like for each player
	const keysToSum = [
		"h",
		"2b",
		"3b",
		"hr",
		"bb",
		"hbp",
		"pa",
		"sf",
		"sb",
		"cs",
		"outs",
		"er",
		"pc",
		"w",
		"l",
		"sv",
	] as const;

	const playerInfos: Map<
		number,
		{
			pid: number;
			score: number;
			tid: number;
			fakeWAR: number;
			gpF: number[];
		} & Record<(typeof keysToSum)[number], number>
	> = new Map();

	const total = {
		h: 0,
		"2b": 0,
		"3b": 0,
		hr: 0,
		bb: 0,
		hbp: 0,
		pa: 0,
		sf: 0,
		outs: 0,
		er: 0,
	};
	for (const game of finalsGames) {
		for (const t of game.teams) {
			for (const p of t.players) {
				if (!p.gp) {
					continue;
				}

				const info = playerInfos.get(p.pid) || {
					pid: p.pid,
					score: 0,
					tid: t.tid,
					fakeWAR: 0,
					gpF: [],
					h: 0,
					"2b": 0,
					"3b": 0,
					hr: 0,
					bb: 0,
					hbp: 0,
					pa: 0,
					sf: 0,
					sb: 0,
					cs: 0,
					outs: 0,
					er: 0,
					pc: 0,
					w: 0,
					l: 0,
					sv: 0,
				};

				for (const key of keysToSum) {
					info[key] += p[key];

					if (Object.hasOwn(total, key)) {
						// @ts-expect-error
						total[key] += p[key];
					}
				}

				for (let i = 0; i < p.gpF.length; i++) {
					const value = p.gpF[i];
					if (info.gpF[i] === undefined) {
						info.gpF[i] = 0;
					}
					if (value !== undefined) {
						info.gpF[i] += value;
					}
				}

				playerInfos.set(p.pid, info);
			}
		}
	}

	const totalERA = helpers.ratio(total.er, total.outs / NUM_OUTS_PER_GAME);

	const totalAB = total.pa - total.bb - total.hbp - total.sf;
	const abf =
		(0.47 * total.h +
			0.38 * total["2b"] +
			0.55 * total["3b"] +
			0.93 * total.hr +
			0.33 * (total.bb + total.hbp)) /
		(totalAB - total.h);

	for (const info of playerInfos.values()) {
		// 75% bonus for the winning team
		const factor = info.tid === champTid ? 1.75 : 1;

		const ab = info.pa - info.bb - info.hbp - info.sf;

		const rbat =
			0.47 * info.h +
			0.38 * info["2b"] +
			0.55 * info["3b"] +
			0.93 * info.hr +
			0.33 * (info.bb + info.hbp) -
			abf * (ab - info.h);

		const rbr = 0.3 * info.sb - 0.6 * info.cs;

		const rpit = (info.outs / NUM_OUTS_PER_GAME) * totalERA - info.er;

		info.fakeWAR = factor * (rbat + rbr + rpit);
	}

	const playerArray = orderBy(
		Array.from(playerInfos.values()),
		"fakeWAR",
		"desc",
	);

	if (playerArray.length === 0) {
		return;
	}

	const { pid } = playerArray[0];
	const p = players.find(p2 => p2.pid === pid);

	if (p) {
		const info = playerArray[0];

		const pos = getPosByGpF(info.gpF);

		return {
			pid: p.pid,
			name: p.name,
			tid: p.tid,
			pos,
			keyStats: processPlayerStats(info, ["keyStats"]).keyStats,
		};
	}
};

const doAwards = async (conditions: Conditions) => {
	// Careful - this array is mutated in various functions called below
	const awardsByPlayer: AwardsByPlayer = [];
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: [
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
				"winp",
				"pts",
				"playoffRoundsWon",
				"abbrev",
				"region",
				"name",
				"cid",
				"did",
			],
			stats: ["pts", "oppPts", "gp"],
			season: g.get("season"),
			showNoStats: true,
		},
		"noCopyCache",
	);
	const players = await getPlayers(g.get("season"));
	const { bestRecord, bestRecordConfs } = await teamAwards(teams);
	const categories = [
		{
			name: "League HR Leader",
			stat: "hr",
			minValue: 0,
		},
		{
			name: "League RBI Leader",
			stat: "rbi",
			minValue: 0,
		},
		{
			name: "League Runs Leader",
			stat: "r",
			minValue: 0,
		},
		{
			name: "League Stolen Bases Leader",
			stat: "sb",
			minValue: 0,
		},
		{
			name: "League Walks Leader",
			stat: "bb",
			minValue: 0,
		},
		{
			name: "League Wins Leader",
			stat: "w",
			minValue: 0,
		},
		{
			name: "League Strikeouts Leader",
			stat: "soPit",
			minValue: 0,
		},
		{
			name: "League WAR Leader",
			stat: "war",
			minValue: 0,
		},
	];
	leagueLeaders(players, categories, awardsByPlayer);

	const mvpPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			score: mvpScore,
		},
		players,
	).map(getPlayerInfo);
	const mvp = mvpPlayers[0];

	const royPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			filter: royFilter,
			score: mvpScore,
		},
		players,
	);
	const roy = getPlayerInfo(royPlayers[0]);

	const offensePlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			score: p => p.currentStats.rbr + p.currentStats.rbat,
		},
		players,
	);
	const allOffense = makeTeams(offensePlayers, "offense").map(getPlayerInfo);
	const allDefense = makeTeams(offensePlayers, "defense").map(getPlayerInfo);
	const allRookie = makeTeams(royPlayers, "rookie").map(getPlayerInfo);

	const poyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: poyScore,
		},
		players,
	).map(getPlayerInfo);
	const poy = poyPlayers[0];

	const rpoyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			filter: rpoyFilter,
			score: poyScore,
		},
		players,
	).map(getPlayerInfo);
	const rpoy = rpoyPlayers[0];

	let finalsMvp;
	const champTeam = teams.find(
		t =>
			t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length,
	);

	if (champTeam) {
		const champTid = champTeam.tid;
		finalsMvp = await getRealFinalsMvp(players, champTid);

		// If for some reason there is no Finals MVP (like if the finals box scores were not found), use total playoff stats
		if (finalsMvp === undefined) {
			const champPlayersAll = await idb.cache.players.indexGetAll(
				"playersByTid",
				champTid,
			);

			const noPlayoffs = g.get("numGamesPlayoffSeries", "current").length === 0;

			const champPlayers = await idb.getCopies.playersPlus(champPlayersAll, {
				// Only the champions, only playoff stats
				attrs: ["pid", "name", "tid", "abbrev"],
				stats: [
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
				],
				ratings: ["pos"],
				season: g.get("season"),
				playoffs: !noPlayoffs,
				regularSeason: noPlayoffs,
				tid: champTid,
			});

			// For symmetry with players array
			for (const p of champPlayers) {
				p.currentStats = p.stats;
				p.pos = p.ratings.pos;
			}

			const p = getTopPlayers(
				{
					score: mvpScore,
				},
				champPlayers,
			)[0];

			if (p) {
				finalsMvp = getPlayerInfo(p);
			}
		}
	}

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		poy,
		rpoy,
		roy,
		finalsMvp,
		allOffense,
		allDefense,
		allRookie,
		season: g.get("season"),
	};
	addSimpleAndTeamAwardsToAwardsByPlayer(awards, awardsByPlayer);
	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions, awards.season);
};

export default doAwards;
