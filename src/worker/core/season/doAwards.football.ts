import orderBy from "lodash/orderBy";
import {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	saveAwardsByPlayer,
	teamAwards,
	AwardsByPlayer,
} from "./awards";
import { idb } from "../../db";
import { g } from "../../util";
import type { Conditions, PlayerFiltered } from "../../../common/types";

import type { AwardPlayer, Awards } from "../../../common/types.football";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		pos: p.pos,
		tid: p.tid,
		abbrev: p.abbrev,
		keyStats: p.currentStats.keyStats,
	};
};

const getTopByPos = (
	players: PlayerFiltered[],
	positions?: string[],
	usedPids?: Set<number>,
) => {
	for (const p of players) {
		if (usedPids) {
			if (usedPids.has(p.pid)) {
				continue;
			}
		}

		if (positions === undefined || positions.includes(p.pos)) {
			if (usedPids) {
				usedPids.add(p.pid);
			}

			return getPlayerInfo(p);
		}
	}
};

export const makeTeams = (
	players: PlayerFiltered[],
	rookie: boolean = false,
): any => {
	const usedPids = new Set<number>();
	const teamPositions = [
		["QB"],
		["RB"],
		["RB", "WR"],
		["WR"],
		["WR"],
		["TE"],
		["OL"],
		["OL"],
		["OL"],
		["OL"],
		["OL"],
		["DL"],
		["DL"],
		["DL"],
		["DL"],
		["LB"],
		["LB"],
		["LB"],
		["S"],
		["S"],
		["CB"],
		["CB"],
	];
	const kickers = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.fg,
		},
		players,
	);
	const punters = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.pntYds,
		},
		players,
	);
	const kickReturners = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) =>
				p.currentStats.krYds + 500 * p.currentStats.krTD,
		},
		players,
	);
	const puntReturners = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) =>
				p.currentStats.prYds + 500 * p.currentStats.prTD,
		},
		players,
	);

	if (rookie) {
		return [
			...teamPositions.map(positions =>
				getTopByPos(players, positions, usedPids),
			),
			kickers[0],
			punters[0],
			kickReturners[0],
			puntReturners[0],
		];
	}

	return [
		{
			title: "First Team",
			players: [
				...teamPositions.map(positions =>
					getTopByPos(players, positions, usedPids),
				),
				kickers[0],
				punters[0],
				kickReturners[0],
				puntReturners[0],
			],
		},
		{
			title: "Second Team",
			players: [
				...teamPositions.map(positions =>
					getTopByPos(players, positions, usedPids),
				),
				kickers[1],
				punters[1],
				kickReturners[1],
				puntReturners[1],
			],
		},
	];
};

const getRealFinalsMvp = async (
	players: PlayerFiltered[],
	champTid: number,
): Promise<AwardPlayer | undefined> => {
	const games = await idb.cache.games.getAll(); // Last game of the season will have the two finals teams

	const finalsTids = games[games.length - 1].teams.map(t => t.tid); // Get all playoff games between those two teams - that will be all finals games

	const finalsGames = games.filter(
		game =>
			game.playoffs &&
			finalsTids.includes(game.teams[0].tid) &&
			finalsTids.includes(game.teams[1].tid),
	);

	if (finalsGames.length === 0) {
		return;
	}

	// Calculate sum of game scores for each player
	const playerInfos: Map<
		number,
		{
			pid: number;
			score: number;
		}
	> = new Map();

	for (const game of finalsGames) {
		for (const t of game.teams) {
			for (const p of t.players) {
				const info = playerInfos.get(p.pid) || {
					pid: p.pid,
					score: 0,
				};

				// 50% bonus for the winning team
				const factor = t.tid === champTid ? 1.5 : 1;
				const ydsFromScrimmage = p.recYds + p.rusYds;
				const otherTD =
					p.recTD + p.rusTD + p.prTD + p.krTD + p.defIntTD + p.defFmbTD;
				info.score +=
					factor *
					(p.pssYds / 25 + 4 * p.pssTD + ydsFromScrimmage / 10 + 6 * otherTD);
				playerInfos.set(p.pid, info);
			}
		}
	}

	const playerArray = orderBy(
		Array.from(playerInfos.values()),
		"score",
		"desc",
	);

	if (playerArray.length === 0) {
		return;
	}

	const { pid } = playerArray[0];
	const p = players.find(p2 => p2.pid === pid);

	if (p) {
		return {
			pid: p.pid,
			name: p.name,
			tid: p.tid,
			abbrev: p.abbrev,
			pos: p.pos,
			keyStats: "",
		};
	}
};

export const avScore = (p: PlayerFiltered) => p.currentStats.av;

const SKILL_POSITIONS = ["QB", "RB", "WR", "TE"];
export const mvpScore = (p: PlayerFiltered) => {
	const posMultiplier = SKILL_POSITIONS.includes(p.pos) ? 1.2 : 1;
	return posMultiplier * p.currentStats.av;
};
export const dpoyScore = (p: PlayerFiltered) => {
	let posBonus = 0;
	if (p.pos === "S" || p.pos === "CB") {
		posBonus = 3.9;
	} else if (p.pos === "LB") {
		posBonus = 1.9;
	}
	return posBonus + p.currentStats.av;
};

const doAwards = async (conditions: Conditions) => {
	// Careful - this array is mutated in various functions called below
	const awardsByPlayer: AwardsByPlayer = [];
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: [
			"won",
			"lost",
			"tied",
			"winp",
			"playoffRoundsWon",
			"abbrev",
			"region",
			"name",
			"cid",
			"did",
		],
		season: g.get("season"),
		active: true,
	});
	const players = await getPlayers(g.get("season"));
	const { bestRecord, bestRecordConfs } = teamAwards(teams);
	leagueLeaders(players, [], awardsByPlayer);

	const avPlayers = getTopPlayers(
		{
			amount: Infinity,
			score: avScore,
		},
		players,
	);
	const mvpPlayers = getTopPlayers(
		{
			amount: Infinity,
			score: mvpScore,
		},
		players,
	);
	const dpoyPlayers = getTopPlayers(
		{
			amount: Infinity,
			score: dpoyScore,
		},
		players,
	);
	const mvp = getTopByPos(mvpPlayers);
	const dpoy = getTopByPos(dpoyPlayers, ["DL", "LB", "S", "CB"]);
	const allLeague = makeTeams(avPlayers);
	const royPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			filter: p => {
				// This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
				return p.draft.year === p.currentStats.season - 1;
			},
			score: avScore,
		},
		players,
	);
	const oroy = getTopByPos(royPlayers, ["QB", "RB", "WR", "TE", "OL"]);
	const droy = getTopByPos(royPlayers, ["DL", "LB", "S", "CB"]);
	const allRookie = makeTeams(royPlayers, true);
	let finalsMvp;
	const champTeam = teams.find(
		t =>
			t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length,
	);

	if (champTeam) {
		const champTid = champTeam.tid;
		const champPlayersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			champTid,
		);

		// Alternatively, could filter original players array by tid, but still need playersPlus to fill in playoff stats
		const champPlayers = await idb.getCopies.playersPlus(champPlayersAll, {
			// Only the champions, only playoff stats
			attrs: ["pid", "name", "tid", "abbrev"],
			stats: ["pts", "trb", "ast", "ws", "ewa"],
			season: g.get("season"),
			playoffs: true,
			regularSeason: false,
			tid: champTid,
		});

		// For symmetry with players array
		for (const p of champPlayers) {
			p.currentStats = p.stats;
		}

		finalsMvp = await getRealFinalsMvp(players, champTid);
	}

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		dpoy,
		oroy,
		droy,
		finalsMvp,
		allLeague,
		allRookie,
		season: g.get("season"),
	};
	const awardNames = {
		mvp: "Most Valuable Player",
		dpoy: "Defensive Player of the Year",
		oroy: "Offensive Rookie of the Year",
		droy: "Defensive Rookie of the Year",
		finalsMvp: "Finals MVP",
		allLeague: "All-League",
		allRookie: "All-Rookie Team",
	};
	const simpleAwards = ["mvp", "dpoy", "oroy", "droy", "finalsMvp"] as const;

	for (const key of simpleAwards) {
		const type = awardNames[key];
		const award = awards[key];

		if (award === undefined) {
			// e.g. MIP in first season
			continue;
		}

		const { pid, tid, name } = award;
		awardsByPlayer.push({
			pid,
			tid,
			name,
			type,
		});
	}

	// Special cases for teams
	for (const key of ["allRookie", "allLeague"] as const) {
		const type = awardNames[key];

		if (key === "allRookie") {
			for (const award of awards.allRookie) {
				if (award === undefined) {
					continue;
				}

				const { pid, tid, name } = award;
				awardsByPlayer.push({
					pid,
					tid,
					name,
					type,
				});
			}
		} else {
			for (const level of awards[key]) {
				for (const award of level.players) {
					if (award === undefined) {
						continue;
					}

					const { pid, tid, name } = award;
					awardsByPlayer.push({
						pid,
						tid,
						name,
						type: `${level.title} ${type}`,
					});
				}
			}
		}
	}

	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions);
};

export default doAwards;
