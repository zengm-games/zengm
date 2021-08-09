import orderBy from "lodash-es/orderBy";
import {
	AwardsByPlayer,
	GetTopPlayersOptions,
	getPlayers,
	getTopPlayers,
	leagueLeaders,
	teamAwards,
	addSimpleAndTeamAwardsToAwardsByPlayer,
	saveAwardsByPlayer,
} from "./awards";
import { idb } from "../../db";
import { defaultGameAttributes, g, helpers } from "../../util";
import type { Conditions, PlayerFiltered } from "../../../common/types";
import type {
	AwardPlayer,
	AwardPlayerDefense,
	Awards,
} from "../../../common/types.basketball";

const getPlayerInfoOffense = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
		pts: p.currentStats.pts,
		trb: p.currentStats.trb,
		ast: p.currentStats.ast,
	};
};

const getPlayerInfoDefense = (p: PlayerFiltered): AwardPlayerDefense => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
		trb: p.currentStats.trb,
		blk: p.currentStats.blk,
		stl: p.currentStats.stl,
	};
};

const getTopPlayersOffense = (
	options: GetTopPlayersOptions,
	playersUnsorted: PlayerFiltered[],
): AwardPlayer[] => {
	return getTopPlayers(options, playersUnsorted).map(getPlayerInfoOffense);
};

const getTopPlayersDefense = (
	options: GetTopPlayersOptions,
	playersUnsorted: PlayerFiltered[],
): AwardPlayerDefense[] => {
	return getTopPlayers(options, playersUnsorted).map(getPlayerInfoDefense);
};

const makeTeams = <T>(
	players: T[],
): [
	{
		title: "First Team";
		players: T[];
	},
	{
		title: "Second Team";
		players: T[];
	},
	{
		title: "Third Team";
		players: T[];
	},
] => {
	return [
		{
			title: "First Team",
			players: players.slice(0, 5),
		},
		{
			title: "Second Team",
			players: players.slice(5, 10),
		},
		{
			title: "Third Team",
			players: players.slice(10, 15),
		},
	];
};

const getRealFinalsMvp = async (
	players: PlayerFiltered[],
	champTid: number,
): Promise<AwardPlayer | void> => {
	const games = await idb.cache.games.getAll();
	if (games.length === 0) {
		return;
	}

	// Last game of the season will have the two finals teams
	const finalsTids = games.at(-1).teams.map(t => t.tid);

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

	// Calculate sum of game scores for each player
	const playerInfos: Map<
		number,
		{
			pid: number;
			score: number;
			tid: number;
			pts: number;
			trb: number;
			ast: number;
			gp: number;
		}
	> = new Map();

	for (const game of finalsGames) {
		for (const t of game.teams) {
			for (const p of t.players) {
				const info = playerInfos.get(p.pid) || {
					pid: p.pid,
					score: 0,
					tid: t.tid,
					pts: 0,
					trb: 0,
					ast: 0,
					gp: 0,
				};

				// 75% bonus for the winning team
				const factor = t.tid === champTid ? 1.75 : 1;
				info.score += factor * helpers.gameScore(p);
				info.pts += p.pts;
				info.trb += p.drb + p.orb;
				info.ast += p.ast;
				if (p.min > 0) {
					info.gp += 1;
				}
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
			pts: playerArray[0].pts / playerArray[0].gp,
			trb: playerArray[0].trb / playerArray[0].gp,
			ast: playerArray[0].ast / playerArray[0].gp,
		};
	}
};

// For mvpScore, smoyScore, royScore, and dpoyScore, @nicidob did some kind of regression against NBA data to find these coefficients
// https://github.com/nicidob/bbgm/blob/master/historical-gen.ipynb
// https://discord.com/channels/290013534023057409/290015468939640832/855914179693379614

// Not great to use defaultGameAttributes here, because it messes up for non-default settings. Would be better to use the real value, but that's not stored for previous seasons. For completed seasons, might be good to have a flag indicating that, and then just make winpScale 1.

export const mvpScore = (p: PlayerFiltered) => {
	const winpScale = Math.min(p.teamInfo.gp / defaultGameAttributes.numGames, 1);
	return (
		winpScale * p.teamInfo.winp +
		p.currentStats.ewa / 22 +
		p.currentStats.vorp / 32 +
		p.currentStats.fracWS / 10
	);
};

export const smoyScore = (p: PlayerFiltered) => {
	const winpScale = Math.min(p.teamInfo.gp / defaultGameAttributes.numGames, 1);
	const perGameScale = Math.min(
		p.currentStats.gp / defaultGameAttributes.numGames,
		1,
	);
	return (
		winpScale * p.teamInfo.winp +
		(perGameScale * p.currentStats.pts) / 9.9 +
		p.currentStats.ewa / 5.5 +
		p.currentStats.vorp / 2.3 +
		p.currentStats.ws / 4.9
	);
};

export const royScore = (p: PlayerFiltered) => {
	const perGameScale = Math.min(
		p.currentStats.gp / defaultGameAttributes.numGames,
		1,
	);
	return (
		p.currentStats.ewa / 2.1 +
		p.currentStats.vorp +
		(perGameScale * p.currentStats.pts) / 2
	);
};

export const dpoyScore = (p: PlayerFiltered) => {
	const winpScale = Math.min(p.teamInfo.gp / defaultGameAttributes.numGames, 1);
	const perGameScale = Math.min(
		p.currentStats.gp / defaultGameAttributes.numGames,
		1,
	);

	// nicidob kind of arbitrarily made up this formula
	return (
		winpScale * p.teamInfo.winp +
		p.currentStats.dws / 3.1 +
		(perGameScale * p.currentStats.blk) / 4.1 +
		(perGameScale * p.currentStats.stl) / 1.8
	);
};

// Handle case where GS is not available, which happens when loading historical stats
export const getSmoyFilter = (players: PlayerFiltered[]) => {
	if (players.some(p => p.currentStats.gs > 0)) {
		return (p: PlayerFiltered) =>
			p.currentStats.gs === 0 || p.currentStats.gp / p.currentStats.gs > 2;
	}

	return () => false;
};

// This doesn't factor in players who didn't start playing right after being drafted, because currently that doesn't really happen in the game.
export const royFilter = (p: PlayerFiltered) => {
	const repeatSeason = g.get("repeatSeason");
	return (
		p.draft.year === p.currentStats.season - 1 ||
		(repeatSeason !== undefined &&
			p.draft.year === repeatSeason.startingSeason - 1)
	);
};

const getMipFactor = () => g.get("numGames") * helpers.quarterLengthFactor();

export const mipScore = (p: PlayerFiltered) => {
	const seasonScore = (ps: any) => {
		return ps.pts + ps.trb + ps.ast + ps.per;
	};

	const currentSeasonScore = seasonScore(p.currentStats);

	const minCutoff = 20 * getMipFactor();
	const oldSeasonScores = p.stats
		.filter((ps: { season: number }) => ps.season < p.currentStats.season)
		.filter(
			(ps: { gp: number; min: number }) => ps.min * ps.gp >= minCutoff / 2,
		)
		.map((ps: any) => seasonScore(ps));
	const prevSeasonScore = oldSeasonScores.at(-1);

	// Include prevSeasonScore because minCutoff could result in that not being included in oldSeasonScores
	const prevMax = Math.max(...oldSeasonScores, prevSeasonScore);

	return 2 * currentSeasonScore - prevSeasonScore - prevMax;
};

export const mipFilter = (p: PlayerFiltered) => {
	// Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
	if (p.draft.year + 2 >= p.currentStats.season && p.draft.round === 1) {
		return false;
	}

	// Must have stats last year!
	const oldStatsAll = p.stats.filter(
		(ps: { season: number }) => ps.season === p.currentStats.season - 1,
	);

	if (oldStatsAll.length === 0) {
		return false;
	}

	// Sanity check for minutes played
	const oldStats = oldStatsAll.at(-1);
	const mipFactor = getMipFactor();
	if (
		p.currentStats.min * p.currentStats.gp < 20 * mipFactor ||
		oldStats.min * oldStats.gp < 10 * mipFactor
	) {
		return false;
	}

	return true;
};

/**
 * Compute the awards (MVP, etc) after a season finishes.
 *
 * The awards are saved to the "awards" object store.
 *
 * @memberOf core.season
 * @return {Promise}
 */
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
	const categories = [
		{
			name: "League Scoring Leader",
			stat: "pts",
			minValue: 1400,
		},
		{
			name: "League Rebounding Leader",
			stat: "trb",
			minValue: 800,
		},
		{
			name: "League Assists Leader",
			stat: "ast",
			minValue: 400,
		},
		{
			name: "League Steals Leader",
			stat: "stl",
			minValue: 125,
		},
		{
			name: "League Blocks Leader",
			stat: "blk",
			minValue: 100,
		},
	];
	leagueLeaders(players, categories, awardsByPlayer);

	const mvpPlayers = getTopPlayersOffense(
		{
			allowNone: true,
			amount: 15,
			score: mvpScore,
		},
		players,
	);

	const mvp = mvpPlayers[0];

	const allLeague = makeTeams(mvpPlayers);

	const [smoy] = getTopPlayersOffense(
		{
			allowNone: true,
			filter: getSmoyFilter(players),
			score: smoyScore,
		},
		players,
	);

	const royPlayers = getTopPlayersOffense(
		{
			allowNone: true,
			amount: 5,
			filter: royFilter,
			score: royScore,
		},
		players,
	);

	// Unlike mvp and allLeague, roy can be undefined and allRookie can be any length <= 5
	const roy = royPlayers[0];
	const allRookie = royPlayers.slice(0, 5);
	const dpoyPlayers: AwardPlayerDefense[] = getTopPlayersDefense(
		{
			allowNone: true,
			amount: 15,
			score: dpoyScore,
		},
		players,
	);
	const dpoy = dpoyPlayers[0];
	const allDefensive = makeTeams(dpoyPlayers);
	const [mip] = getTopPlayersOffense(
		{
			allowNone: true,
			filter: mipFilter,
			score: mipScore,
		},
		players,
	);
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
				stats: ["pts", "trb", "ast", "ws", "ewa"],
				season: g.get("season"),
				playoffs: !noPlayoffs,
				regularSeason: noPlayoffs,
				tid: champTid,
			});

			// For symmetry with players array
			for (const p of champPlayers) {
				p.currentStats = p.stats;
				p.teamInfo = {
					gp: 0,
					winp: 0,
				};
			}

			[finalsMvp] = getTopPlayersOffense(
				{
					score: mvpScore,
				},
				champPlayers,
			);
		}
	}

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		dpoy,
		smoy,
		mip,
		roy,
		finalsMvp,
		allLeague,
		allDefensive,
		allRookie,
		season: g.get("season"),
	};
	addSimpleAndTeamAwardsToAwardsByPlayer(awards, awardsByPlayer);
	await idb.cache.awards.put(awards);
	await saveAwardsByPlayer(awardsByPlayer, conditions, awards.season);
};

export default doAwards;
