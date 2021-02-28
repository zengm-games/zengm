import orderBy from "lodash/orderBy";
import {
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	teamAwards,
	AwardsByPlayer,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	saveAwardsByPlayer,
} from "./awards";
import { idb } from "../../db";
import { g } from "../../util";
import type { Conditions, PlayerFiltered } from "../../../common/types";

import type { AwardPlayer, Awards } from "../../../common/types.hockey";
import { processPlayerStats } from "../../../common";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
		abbrev: p.abbrev,
		pos: p.pos,
		g: p.currentStats.g,
		a: p.currentStats.a,
		pts: p.currentStats.pts,
		ops: p.currentStats.ops,
		tk: p.currentStats.tk,
		hit: p.currentStats.hit,
		dps: p.currentStats.dps,
		gaa: p.currentStats.gaa,
		svPct: p.currentStats.svPct,
		gps: p.currentStats.gps,
	};
};

const getTopByPos = (
	players: AwardPlayer[],
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

			return p;
		}
	}
};

export const makeTeams = (
	players: AwardPlayer[],
	rookie: boolean = false,
): any => {
	const usedPids = new Set<number>();
	const teamPositions = [["C"], ["W"], ["W"], ["D"], ["D"], ["G"]];

	if (rookie) {
		const teams = teamPositions.map(positions =>
			getTopByPos(players, positions, usedPids),
		);
		return teams;
	}

	const teams = [
		{
			title: "First Team",
			players: teamPositions.map(positions =>
				getTopByPos(players, positions, usedPids),
			),
		},
		{
			title: "Second Team",
			players: teamPositions.map(positions =>
				getTopByPos(players, positions, usedPids),
			),
		},
	];
	return teams;
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
			tid: number;
			g: number;
			a: number;
			pts: number;
		}
	> = new Map();

	for (const game of finalsGames) {
		for (const t of game.teams) {
			for (const p of t.players) {
				const row = processPlayerStats(p, ["g", "a", "pts"]);

				const info = playerInfos.get(p.pid) || {
					pid: p.pid,
					score: 0,
					tid: t.tid,
					g: 0,
					a: 0,
					pts: 0,
				};

				// 75% bonus for the winning team
				const factor = t.tid === champTid ? 1.75 : 1;
				info.score += factor * row.pts;
				info.pts += row.pts;
				info.g += row.g;
				info.a += row.a;
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
			g: playerArray[0].g,
			a: playerArray[0].a,
			pts: playerArray[0].pts,
			ops: 0,
			tk: 0,
			hit: 0,
			dps: 0,
			gaa: 0,
			svPct: 0,
			gps: 0,
		};
	}
};

export const mvpScore = (p: PlayerFiltered) => {
	let teamFactor = 0;
	if (p.currentStats.gp >= 20) {
		teamFactor =
			(Math.min(p.currentStats.gp - 20, 40) / 40) * p.teamInfo.winp * 20;
	}

	return (
		p.currentStats.pts / 25 +
		p.currentStats.ps -
		0.4 * p.currentStats.gps +
		teamFactor
	);
};

export const royScore = (p: PlayerFiltered) =>
	p.currentStats.pts / 25 + p.currentStats.ps;

export const dpoyScore = (p: PlayerFiltered) =>
	p.currentStats.tk / 25 + p.currentStats.hit / 25 + p.currentStats.dps;

export const goyScore = (p: PlayerFiltered) => p.currentStats.gps;

// This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
export const royFilter = (p: PlayerFiltered) => {
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
	const teams = await idb.getCopies.teamsPlus({
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
	});
	const players = await getPlayers(g.get("season"));
	const { bestRecord, bestRecordConfs } = await teamAwards(teams);
	leagueLeaders(players, [], awardsByPlayer);

	const mvpPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			score: mvpScore,
		},
		players,
	).map(getPlayerInfo);
	const mvp = mvpPlayers[0];
	const allLeague = makeTeams(mvpPlayers);
	const royPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			filter: royFilter,
			score: royScore,
		},
		players,
	).map(getPlayerInfo);

	// Unlike mvp and allLeague, roy can be undefined and allRookie can be any length <= 5
	const roy = royPlayers[0];
	const allRookie = makeTeams(royPlayers, true);
	const dpoyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: dpoyScore,
		},
		players,
	).map(getPlayerInfo);
	const dpoy = dpoyPlayers[0];
	const goyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: goyScore,
		},
		players,
	).map(getPlayerInfo);
	const goy = goyPlayers[0];

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

		// If for some reason there is no Finals MVP (like if the finals box scores were not found), use total playoff stats
		if (finalsMvp === undefined) {
			[finalsMvp] = getTopPlayers(
				{
					score: mvpScore,
				},
				champPlayers,
			).map(getPlayerInfo);
		}
	}

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		dpoy,
		goy,
		roy,
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
