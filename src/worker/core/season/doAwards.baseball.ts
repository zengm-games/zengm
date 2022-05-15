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
import type { AwardPlayer, Awards } from "../../../common/types.baseball";

const getPlayerInfo = (p: PlayerFiltered): AwardPlayer => {
	return {
		pid: p.pid,
		name: p.name,
		tid: p.tid,
		pos: p.pos,
		keyStats: p.currentStats.keyStats,
		w: p.currentStats.w,
		sv: p.currentStats.sv,
		l: p.currentStats.l,
		ip: p.currentStats.ip,
		era: p.currentStats.era,
		war: p.currentStats.war,
		rpit: p.currentStats.rpit,
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

export const mvpScore = (p: PlayerFiltered) => {
	return p.currentStats.war;
};

export const qoyFilter = (p: PlayerFiltered) =>
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
			score: mvpScore,
		},
		players,
	).map(getPlayerInfo);

	// Unlike mvp and allLeague, roy can be undefined and allRookie can be any length <= 5
	const roy = royPlayers[0];
	const allRookie = makeTeams(royPlayers, true);

	const poyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			score: poyScore,
		},
		players,
	).map(getPlayerInfo);
	const poy = poyPlayers[0];

	const qoyPlayers = getTopPlayers(
		{
			allowNone: true,
			amount: 1,
			filter: qoyFilter,
			score: poyScore,
		},
		players,
	).map(getPlayerInfo);
	const qoy = qoyPlayers[0];

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
		poy,
		qoy,
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
