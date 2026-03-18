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
import { g, helpers } from "../../util/index.ts";
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
	positions?: Set<string>,
	usedPids?: Set<number>,
) => {
	for (const p of players) {
		if (usedPids) {
			if (usedPids.has(p.pid)) {
				continue;
			}
		}

		if (positions === undefined || positions.has(p.pos)) {
			if (usedPids) {
				usedPids.add(p.pid);
			}

			return getPlayerInfo(p);
		}
	}
};

export const makeTeams = (
	playersOffense: PlayerFiltered[],
	playersOL: PlayerFiltered[],
	playersDefense: PlayerFiltered[],
	rookie: boolean = false,
): any => {
	const usedPids = new Set<number>();
	const slots = [
		{
			positions: new Set(["QB"]),
			players: playersOffense,
		},
		{
			positions: new Set(["RB"]),
			players: playersOffense,
		},
		{
			positions: new Set(["RB", "WR"]),
			players: playersOffense,
		},
		{
			positions: new Set(["WR"]),
			players: playersOffense,
		},
		{
			positions: new Set(["WR"]),
			players: playersOffense,
		},
		{
			positions: new Set(["TE"]),
			players: playersOffense,
		},
		{
			positions: new Set(["OL"]),
			players: playersOL,
		},
		{
			positions: new Set(["OL"]),
			players: playersOL,
		},
		{
			positions: new Set(["OL"]),
			players: playersOL,
		},
		{
			positions: new Set(["OL"]),
			players: playersOL,
		},
		{
			positions: new Set(["OL"]),
			players: playersOL,
		},
		{
			positions: new Set(["DL"]),
			players: playersDefense,
		},
		{
			positions: new Set(["DL"]),
			players: playersDefense,
		},
		{
			positions: new Set(["DL"]),
			players: playersDefense,
		},
		{
			positions: new Set(["DL"]),
			players: playersDefense,
		},
		{
			positions: new Set(["LB"]),
			players: playersDefense,
		},
		{
			positions: new Set(["LB"]),
			players: playersDefense,
		},
		{
			positions: new Set(["LB"]),
			players: playersDefense,
		},
		{
			positions: new Set(["S"]),
			players: playersDefense,
		},
		{
			positions: new Set(["S"]),
			players: playersDefense,
		},
		{
			positions: new Set(["CB"]),
			players: playersDefense,
		},
		{
			positions: new Set(["CB"]),
			players: playersDefense,
		},
	];

	const kickers = getTopPlayers(
		{
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.fg,
		},
		playersOffense,
	);
	const punters = getTopPlayers(
		{
			amount: 2,
			score: (p: PlayerFiltered) => p.currentStats.pntYds,
		},
		playersOffense,
	);
	const kickReturners = getTopPlayers(
		{
			amount: 2,
			score: (p: PlayerFiltered) =>
				p.currentStats.krYds + 500 * p.currentStats.krTD,
		},
		playersOffense,
	);
	const puntReturners = getTopPlayers(
		{
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
		].filter((p) => p !== undefined);
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
			].filter((p) => p !== undefined),
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
			].filter((p) => p !== undefined),
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

const DEFENSIVE_POSITIONS = new Set(["DL", "LB", "S", "CB"]);
const OFFENSIVE_POSITIONS = new Set(["QB", "RB", "WR", "TE", "OL"]);

const POS_FACTOR: Record<string, number> = {
	CB: 1.05,
	S: 0.95,
};
export const dpoyScore = (p: PlayerFiltered) => {
	const s = p.currentStats;

	const posFactor = POS_FACTOR[p.pos] ?? 1;

	return (
		posFactor *
		(s.defSk * 4 +
			s.defTckLoss * 0.4 +
			s.defTckAst * 0.2 +
			s.defTckSolo * 0.4 +
			s.defFmbFrc * 3 +
			s.defFmbRec * 3 +
			s.defInt * 6 +
			s.defPssDef * 2)
	);
};

export const opoyScore = (p: PlayerFiltered) => {
	const s = p.currentStats;
	let rushing = s.rusYds * 0.125 + s.rusTD * 6 - s.fmbLost * 2;
	const receiving = s.recYds * 0.0975 + s.recTD * 6;

	// Penalty for rushing QBs
	if (s.pssYds > s.rusYds) {
		rushing *= 0.5;
	}

	return rushing + receiving;
};

export const offScore = (p: PlayerFiltered) => {
	const s = p.currentStats;
	const passing = s.pssYds * 0.04 + s.pssTD * 4 - s.pssInt * 2.5;
	const rushingReceiving = opoyScore(p);

	return 1.1 * passing + rushingReceiving;
};

export const mvpScore = (p: PlayerFiltered) => {
	const s = p.currentStats;
	const offense = offScore(p);
	const defense = 2.25 * dpoyScore(p);
	const returns = (s.prTD + s.krTD) * 6;

	return offense + defense + returns;
};

export const poyScore = (p: PlayerFiltered) => {
	const s = p.currentStats;
	const attempts = s.pba + s.rba;
	if (attempts === 0) {
		return 0;
	}

	// Account for rate and volume
	return ((s.pbw + s.rbw) / attempts) * Math.sqrt(attempts);
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

const doAwards = async (season: number, conditions: Conditions) => {
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
			season,
			showNoStats: true,
		},
		"noCopyCache",
	);
	const players = await getPlayers(season);
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
		{
			name: "League Interceptions Leader",
			stat: "defInt",
			minValue: 0,
		},
		{
			name: "League Sacks Leader",
			stat: "defSk",
			minValue: 0,
		},
		{
			name: "League TD Leader",
			stat: "totTD",
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
	const mvp = getTopByPos(mvpPlayers);

	const opoyPlayers = getTopPlayers(
		{
			amount: 1,
			score: opoyScore,
		},
		players,
	);
	let opoy;
	if (mvp) {
		if (mvp.pos === "QB") {
			// MVP is a QB - OPOY is best non-QB unless the MVP is way better than any other offensive player (including other QBs)
			const offensePlayers = getTopPlayers(
				{
					amount: 2,
					score: offScore,
				},
				players,
			);

			// Make sure MVP is best offensive player (in case MVP is a two way player)
			if (
				offensePlayers[0] &&
				offensePlayers[1] &&
				offensePlayers[0].pid === mvp.pid
			) {
				const ratio = offScore(offensePlayers[0]) / offScore(offensePlayers[1]);
				if (ratio > 1.2) {
					opoy = helpers.deepCopy(mvp);
				}
			}
			if (!opoy) {
				opoy = getTopByPos(opoyPlayers);
			}
		} else {
			// MVP is a defensive player - OPOY is non-QB offensive player
			// MVP is a non-QB offensive player - make him OPOY too, unless he somehow is not the best offensive player (could be two way)
			opoy = getTopByPos(opoyPlayers);
		}

		if (!opoy) {
			// This probably will never happen (MVP but no OPOY) but if it does, might as well make the MVP the OPOY too
			opoy = helpers.deepCopy(mvp);
		}
	}

	const poyPlayers = getTopPlayers(
		{
			amount: Infinity,
			score: poyScore,
		},
		players,
	);
	const poy = getTopByPos(poyPlayers, new Set(["OL"]));

	const dpoyPlayers = getTopPlayers(
		{
			amount: Infinity,
			score: dpoyScore,
		},
		players,
	);
	const dpoy = getTopByPos(dpoyPlayers, DEFENSIVE_POSITIONS);

	const allLeague = makeTeams(mvpPlayers, poyPlayers, dpoyPlayers);

	const oroyPlayers = getTopPlayers(
		{
			amount: Infinity,
			filter: royFilter,
			score: mvpScore,
		},
		players,
	);
	const oroy = getTopByPos(oroyPlayers, OFFENSIVE_POSITIONS);

	const droyPlayers = getTopPlayers(
		{
			amount: Infinity,
			filter: royFilter,
			score: dpoyScore,
		},
		players,
	);
	const droy = getTopByPos(droyPlayers, DEFENSIVE_POSITIONS);

	const proyPlayers = getTopPlayers(
		{
			amount: Infinity,
			filter: royFilter,
			score: poyScore,
		},
		players,
	);

	const allRookie = makeTeams(oroyPlayers, proyPlayers, droyPlayers, true);
	let finalsMvp;
	const champTeam = teams.find(
		(t) =>
			t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", season).length,
	);

	if (champTeam) {
		const champTid = champTeam.tid;
		finalsMvp = await getRealFinalsMvp(players, champTid);
	}

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		opoy,
		poy,
		dpoy,
		oroy,
		droy,
		finalsMvp,
		allLeague,
		allRookie,
		season,
	};
	addSimpleAndTeamAwardsToAwardsByPlayer(awards, awardsByPlayer);
	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions, awards.season);
};

export default doAwards;
