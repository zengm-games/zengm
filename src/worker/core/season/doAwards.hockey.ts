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
import type { AwardPlayer, Awards } from "../../../common/types.hockey.ts";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
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

const makeTeams = (players: AwardPlayer[], rookie: boolean = false): any => {
	const usedPids = new Set<number>();
	const teamPositions = [["C"], ["W"], ["W"], ["D"], ["D"], ["G"]];

	if (rookie) {
		const teams = teamPositions.map((positions) =>
			getTopByPos(players, positions, usedPids),
		);
		return teams;
	}

	const teams = [
		{
			title: "First Team",
			players: teamPositions.map((positions) =>
				getTopByPos(players, positions, usedPids),
			),
		},
		{
			title: "Second Team",
			players: teamPositions.map((positions) =>
				getTopByPos(players, positions, usedPids),
			),
		},
	];
	return teams;
};

const GOALIE_ADJUSTMENT = 0.225;

export const mvpScore = (p: PlayerFiltered) => {
	let teamFactor = 0;
	if (p.currentStats.gp >= 20) {
		teamFactor =
			(Math.min(p.currentStats.gp - 20, 40) / 40) * p.teamInfo.winp * 20;
	}

	return (
		p.currentStats.pts / 25 +
		p.currentStats.ps -
		GOALIE_ADJUSTMENT * p.currentStats.gps +
		teamFactor
	);
};

export const royScore = (p: PlayerFiltered) =>
	p.currentStats.pts / 25 +
	p.currentStats.ps -
	GOALIE_ADJUSTMENT * p.currentStats.gps;

export const dpoyScore = (p: PlayerFiltered) =>
	p.currentStats.tk / 25 + p.currentStats.hit / 25 + p.currentStats.dps;

export const dfoyFilter = (p: PlayerFiltered) => p.pos === "C" || p.pos === "W";

export const goyScore = (p: PlayerFiltered) => {
	// This will be inconsistent when viewing past seasons if this setting changed
	const numGames = g.get("numGames");

	// Only credit GPS up to 75% of games played, so as to not penalize goalies with good backups who play a bit less
	const numGamesMax = Math.round(0.75 * numGames);
	const gpsPerGame =
		p.currentStats.gpGoalie === 0
			? 0
			: p.currentStats.gps / p.currentStats.gpGoalie;
	return gpsPerGame * Math.min(numGamesMax, p.currentStats.gpGoalie);
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
			name: "League Points Leader",
			stat: "pts",
			minValue: 0,
		},
		{
			name: "League Goals Leader",
			stat: "g",
			minValue: 0,
		},
		{
			name: "League Assists Leader",
			stat: "a",
			minValue: 0,
		},
	];
	leagueLeaders(players, categories, awardsByPlayer);

	const dpoyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: dpoyScore,
		},
		players,
	).map(getPlayerInfo);
	const dpoy = dpoyPlayers[0]!;

	let mvpPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: Infinity,
			score: mvpScore,
		},
		players,
	).map(getPlayerInfo);
	const mvp = mvpPlayers[0];

	// Move dpoy to top, so he's always on All-League team
	mvpPlayers = [dpoy, ...mvpPlayers.filter((p) => p.pid !== dpoy.pid)];

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

	const dfoyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			filter: dfoyFilter,
			score: dpoyScore,
		},
		players,
	).map(getPlayerInfo);
	const dfoy = dfoyPlayers[0]!;

	const goyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: goyScore,
		},
		players,
	).map(getPlayerInfo);
	const goy = goyPlayers[0]!;

	let finalsMvp;
	const champTeam = teams.find(
		(t) =>
			t.seasonAttrs.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length,
	);

	if (champTeam) {
		const champTid = champTeam.tid;
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

		// In hockey, it's the MVP of the playoffs, not just the finals
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

	const awards: Awards = {
		bestRecord,
		bestRecordConfs,
		mvp,
		dpoy,
		dfoy,
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
