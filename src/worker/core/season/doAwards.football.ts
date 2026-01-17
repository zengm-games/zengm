import {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	teamAwards,
	type AwardsByPlayer,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	saveAwardsByPlayer,
} from "./awards.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import type { Conditions, PlayerFiltered } from "../../../common/types.ts";

import type { AwardPlayer, Awards } from "../../../common/types.football.ts";
import { orderBy } from "../../../common/utils.ts";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		pos: p.pos,
		tid: p.tid,
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
	playersOffense: PlayerFiltered[],
	playersDefense: PlayerFiltered[],
	rookie: boolean = false,
): any => {
	const usedPids = new Set<number>();
	const slots = [
		{
			positions: ["QB"],
			players: playersOffense,
		},
		{
			positions: ["RB"],
			players: playersOffense,
		},
		{
			positions: ["RB", "WR"],
			players: playersOffense,
		},
		{
			positions: ["WR"],
			players: playersOffense,
		},
		{
			positions: ["WR"],
			players: playersOffense,
		},
		{
			positions: ["TE"],
			players: playersOffense,
		},
		{
			positions: ["OL"],
			players: playersOffense,
		},
		{
			positions: ["OL"],
			players: playersOffense,
		},
		{
			positions: ["OL"],
			players: playersOffense,
		},
		{
			positions: ["OL"],
			players: playersOffense,
		},
		{
			positions: ["OL"],
			players: playersOffense,
		},
		{
			positions: ["DL"],
			players: playersDefense,
		},
		{
			positions: ["DL"],
			players: playersDefense,
		},
		{
			positions: ["DL"],
			players: playersDefense,
		},
		{
			positions: ["DL"],
			players: playersDefense,
		},
		{
			positions: ["LB"],
			players: playersDefense,
		},
		{
			positions: ["LB"],
			players: playersDefense,
		},
		{
			positions: ["LB"],
			players: playersDefense,
		},
		{
			positions: ["S"],
			players: playersDefense,
		},
		{
			positions: ["S"],
			players: playersDefense,
		},
		{
			positions: ["CB"],
			players: playersDefense,
		},
		{
			positions: ["CB"],
			players: playersDefense,
		},
	];

	const kickers = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.fg,
		},
		playersOffense,
	);
	const punters = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.pntYds,
		},
		playersOffense,
	);
	const kickReturners = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) =>
				p.currentStats.krYds + 500 * p.currentStats.krTD,
		},
		playersOffense,
	);
	const puntReturners = getTopPlayers(
		{
			allowNone: rookie,
			amount: 2,
			score: (p: PlayerFiltered) =>
				p.currentStats.prYds + 500 * p.currentStats.prTD,
		},
		playersOffense,
	);

	if (rookie) {
		return [
			...slots.map((slot) =>
				getTopByPos(slot.players, slot.positions, usedPids),
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
				...slots.map((slot) =>
					getTopByPos(slot.players, slot.positions, usedPids),
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
				...slots.map((slot) =>
					getTopByPos(slot.players, slot.positions, usedPids),
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
	const games = await idb.cache.games.getAll();

	// Last game of the season will have the two finals teams
	const finalsTids = games.at(-1)?.teams.map((t) => t.tid);
	if (finalsTids === undefined) {
		return;
	}

	// Get all playoff games between those two teams - that will be all finals games
	const finalsGames = games.filter(
		(game) =>
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
				const info = playerInfos.get(p.pid) ?? {
					pid: p.pid,
					score: 0,
				};

				// 50% bonus for the winning team
				const factor = t.tid === champTid ? 1.5 : 1;
				const ydsFromScrimmage = p.recYds + p.rusYds;
				const otherTD =
					p.recTD + p.rusTD + p.prTD + p.krTD + p.defIntTD + p.defFmbTD;
				const defense =
					1.75 * p.defSk +
					(p.defTckSolo + p.defTckAst) / 10 +
					p.defInt * 2 +
					p.defPssDef +
					p.defFmbFrc * 2 +
					p.defFmbRec * 2 +
					5 * p.defSft;
				info.score +=
					factor *
					(p.pssYds / 25 +
						4 * p.pssTD +
						ydsFromScrimmage / 10 +
						6 * otherTD +
						1.75 * defense);
				playerInfos.set(p.pid, info);
			}
		}
	}

	const playerArray = orderBy(
		Array.from(playerInfos.values()),
		"score",
		"desc",
	);

	if (!playerArray[0]) {
		return;
	}

	const { pid } = playerArray[0];
	const p = players.find((p2) => p2.pid === pid);

	if (p) {
		return {
			pid: p.pid,
			name: p.name,
			tid: p.tid,
			pos: p.pos,
			keyStats: "",
		};
	}
};

const SKILL_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
export const mvpScore = (p: PlayerFiltered) => {
	const posMultiplier = SKILL_POSITIONS.has(p.pos) ? 1.2 : 1;
	return posMultiplier * p.currentStats.av;
};

// https://discord.com/channels/860302515501400094/861442922498359306/1385455960188780634
// Would be nice to use this for MVP too, but unclear how to combine with AV since we don't store separate offensive/defensive AV. If mvpScore is ever updated to not use AV or if offensive/defensive AV were stored separately, this could be done.
export const dpoyScore = (p: PlayerFiltered) => {
	return (
		(p.currentStats.defSk * 1.5 +
			p.currentStats.defTckLoss * 2.2 +
			p.currentStats.defFmbFrc * 3 +
			p.currentStats.defInt * 3 +
			p.currentStats.defPssDef * 3.15 +
			p.currentStats.defTckAst / 12 +
			p.currentStats.defTckSolo / 8) /
		8.2
	);
};

// This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
const royFilter = (p: PlayerFiltered) => {
	const repeatSeason = g.get("repeatSeason");
	return (
		p.draft.year === p.currentStats.season - 1 ||
		(repeatSeason !== undefined &&
			p.draft.year === repeatSeason.startingSeason - 1)
	);
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
			name: "League Passing Leader",
			stat: "pssYds",
			minValue: 0,
		},
		{
			name: "League Rushing Leader",
			stat: "rusYds",
			minValue: 0,
		},
		{
			name: "League Receiving Leader",
			stat: "recYds",
			minValue: 0,
		},
		{
			name: "League Scrimmage Yards Leader",
			stat: "ydsFromScrimmage",
			minValue: 0,
		},
	];
	leagueLeaders(players, categories, awardsByPlayer);

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
	const allLeague = makeTeams(mvpPlayers, dpoyPlayers);

	const oroyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			filter: royFilter,
			score: mvpScore,
		},
		players,
	);
	const oroy = getTopByPos(oroyPlayers, ["QB", "RB", "WR", "TE", "OL"]);

	const droyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			filter: royFilter,
			score: dpoyScore,
		},
		players,
	);
	const droy = getTopByPos(droyPlayers, ["DL", "LB", "S", "CB"]);

	const allRookie = makeTeams(oroyPlayers, droyPlayers, true);
	let finalsMvp;
	const champTeam = teams.find(
		(t) =>
			t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length,
	);

	if (champTeam) {
		const champTid = champTeam.tid;
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
	addSimpleAndTeamAwardsToAwardsByPlayer(awards, awardsByPlayer);
	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions, awards.season);
};

export default doAwards;
