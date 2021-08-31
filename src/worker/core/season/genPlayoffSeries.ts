import range from "lodash-es/range";
import { g, helpers, orderTeams } from "../../util";
import type {
	TeamFiltered,
	PlayoffSeries,
	PlayoffSeriesTeam,
	PlayInTournament,
} from "../../../common/types";
import genPlayoffSeeds from "./genPlayoffSeeds";
import { idb } from "../../db";
import getPlayoffsByConf from "./getPlayoffsByConf";
import validatePlayoffSettings from "./validatePlayoffSettings";

type MyTeam = TeamFiltered<
	["tid"],
	[
		"cid",
		"did",
		"won",
		"lost",
		"tied",
		"otl",
		"winp",
		"pts",
		"wonDiv",
		"lostDiv",
		"tiedDiv",
		"otlDiv",
		"wonConf",
		"lostConf",
		"tiedConf",
		"otlConf",
	],
	["pts", "oppPts", "gp"],
	number
>;

type MinimalTeam = TeamFiltered<["tid"], ["cid", "winp"], any, number>;

const genTeam = (t: MinimalTeam, seed: number): PlayoffSeriesTeam => {
	return {
		tid: t.tid,
		cid: t.seasonAttrs.cid,
		seed,
		won: 0,
	};
};

// In a 2 conference playoff, this should be called once with each side of the bracket
export const makeMatchups = (
	teams: MinimalTeam[],
	numPlayoffTeams: number,
	numPlayoffByes: number,
) => {
	const seeds = genPlayoffSeeds(numPlayoffTeams, numPlayoffByes);

	const round = seeds.map(matchup => {
		const home = genTeam(teams[matchup[0]], matchup[0] + 1);
		const away =
			matchup[1] !== undefined
				? genTeam(teams[matchup[1]], matchup[1] + 1)
				: undefined;

		return {
			home,
			away,
		};
	});

	let playIn: PlayInTournament | undefined;
	if (g.get("playIn")) {
		// Find the 2 last teams in the playoffs, and the 2 first teams out
		const playInTeams = teams.slice(numPlayoffTeams - 2, numPlayoffTeams + 2);

		if (playInTeams.length < 4) {
			throw new Error("Not enough teams found for play-in tournament");
		}

		playIn = [
			{
				home: genTeam(playInTeams[0], numPlayoffTeams - 1),
				away: genTeam(playInTeams[1], numPlayoffTeams),
			},
			{
				home: genTeam(playInTeams[2], numPlayoffTeams + 1),
				away: genTeam(playInTeams[3], numPlayoffTeams + 2),
			},
		];
	}

	return {
		round,
		playIn,
	};
};

const getTidPlayIns = (playIns: PlayInTournament[]) => {
	const tids = [];
	for (const playIn of playIns) {
		for (const matchup of playIn) {
			tids.push(matchup.home.tid);
			if (matchup.away !== undefined) {
				tids.push(matchup.away.tid);
			}
		}
	}

	return tids;
};

const getTidPlayoffs = (series: PlayoffSeries["series"]) => {
	const tids = [];
	for (const matchup of series[0]) {
		tids.push(matchup.home.tid);
		if (matchup.away !== undefined) {
			tids.push(matchup.away.tid);
		}
	}

	return tids;
};

export const genPlayoffSeriesFromTeams = async (
	teams: MyTeam[],
	orderTeamsOptions?: {
		skipTiebreakers?: boolean;
	},
) => {
	// Playoffs are split into two branches by conference only if there are exactly 2 conferences
	let playoffsByConf = await getPlayoffsByConf(g.get("season"));

	// Don't let there be an odd number of byes if playoffsByConf, otherwise it would get confusing
	const numPlayoffByes = helpers.bound(
		playoffsByConf && g.get("numPlayoffByes", "current") % 2 === 1
			? g.get("numPlayoffByes", "current") - 1
			: g.get("numPlayoffByes", "current"),
		0,
		Infinity,
	);
	const numRounds = g.get("numGamesPlayoffSeries", "current").length;

	if (numRounds === 0) {
		return {
			byConf: playoffsByConf,
			series: [],
			tidPlayIn: [],
			tidPlayoffs: [],
		};
	}

	const byConf = await getPlayoffsByConf(g.get("season"));
	validatePlayoffSettings({
		numRounds,
		numPlayoffByes,
		numActiveTeams: g.get("numActiveTeams"),
		playIn: g.get("playIn"),
		byConf,
	});
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	if (teams.length < numPlayoffTeams) {
		throw new Error("Not enough teams for playoffs");
	}

	let series: PlayoffSeries["series"] = range(numRounds).map(() => []);

	let playIns: PlayoffSeries["playIns"] = [];

	if (playoffsByConf) {
		if (numRounds > 1) {
			// Default: top 50% of teams in each of the two conferences
			for (const conf of g.get("confs", "current")) {
				const cid = conf.cid;
				const teamsConf: MyTeam[] = teams.filter(
					t => t.seasonAttrs.cid === cid,
				);

				if (teamsConf.length >= numPlayoffTeams / 2) {
					const { round, playIn } = await makeMatchups(
						await orderTeams(teamsConf, teams, orderTeamsOptions),
						numPlayoffTeams / 2,
						numPlayoffByes / 2,
					);
					series[0].push(...round);
					if (playIn) {
						playIns.push(playIn);
					}
				} else {
					// Not enough teams in conference for playoff bracket
					playoffsByConf = false;
					playIns = [];
				}
			}
		} else {
			// Special case - if there is only one round, pick the best team in each conference to play
			const teamsFinals: MyTeam[] = [];

			for (const conf of g.get("confs", "current")) {
				const cid = conf.cid;
				const teamsConf: MyTeam[] = teams.filter(
					t => t.seasonAttrs.cid === cid,
				);
				if (teamsConf.length > 0) {
					// This sort determines conference champ. Sort inside makeMatchups call will determine overall #1 seed
					const sorted = await orderTeams(teamsConf, teams, orderTeamsOptions);
					teamsFinals.push(sorted[0]);
				}
			}

			if (teamsFinals.length === 2) {
				const { round } = await makeMatchups(
					await orderTeams(teamsFinals, teams, orderTeamsOptions),
					numPlayoffTeams / 2,
					numPlayoffByes / 2,
				);
				series[0].push(...round);
			} else {
				// Not enough teams in conference for playoff bracket
				playoffsByConf = false;
			}
		}
	}

	// Not an "else" because if the (playoffsByConf) branch fails it sets it to false and runs this as backup
	if (!playoffsByConf) {
		// Reset, in case it was partially set in prior branch
		series = range(numRounds).map(() => []);

		const { round, playIn } = await makeMatchups(
			await orderTeams(teams, teams, orderTeamsOptions),
			numPlayoffTeams,
			numPlayoffByes,
		);
		series[0].push(...round);
		if (playIn) {
			playIns.push(playIn);
		}
	}

	const tidPlayIn = getTidPlayIns(playIns);
	const tidPlayoffs = getTidPlayoffs(series).filter(
		tid => !tidPlayIn.includes(tid),
	);

	for (const matchup of series[0]) {
		for (const type of ["home", "away"] as const) {
			const t = matchup[type];
			if (t && tidPlayIn.includes(t.tid)) {
				t.pendingPlayIn = true;
			}
		}
	}

	if (playIns.length > 0) {
		return {
			byConf: playoffsByConf,
			playIns,
			series,
			tidPlayIn,
			tidPlayoffs,
		};
	}

	return {
		byConf: playoffsByConf,
		series,
		tidPlayIn,
		tidPlayoffs,
	};
};

const genPlayoffSeries = async () => {
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: [
			"cid",
			"did",
			"won",
			"lost",
			"tied",
			"otl",
			"winp",
			"pts",
			"wonDiv",
			"lostDiv",
			"tiedDiv",
			"otlDiv",
			"wonConf",
			"lostConf",
			"tiedConf",
			"otlConf",
		],
		stats: ["pts", "oppPts", "gp"],
		season: g.get("season"),
		showNoStats: true,
	});

	return genPlayoffSeriesFromTeams(teams);
};

export default genPlayoffSeries;
