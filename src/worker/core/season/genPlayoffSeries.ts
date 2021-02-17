import range from "lodash/range";
import { g, helpers, orderTeams } from "../../util";
import type {
	TeamFiltered,
	PlayoffSeries,
	PlayoffSeriesTeam,
} from "../../../common/types";
import genPlayoffSeeds from "./genPlayoffSeeds";
import { idb } from "../../db";

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
		winp: t.seasonAttrs.winp,
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

	return seeds.map(matchup => {
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
};

const getTidPlayoffs = (series: PlayoffSeries["series"]) => {
	const tidPlayoffs = [];
	for (const matchup of series[0]) {
		tidPlayoffs.push(matchup.home.tid);
		if (matchup.away !== undefined) {
			tidPlayoffs.push(matchup.away.tid);
		}
	}

	return tidPlayoffs;
};

export const genPlayoffSeriesFromTeams = async (
	teams: MyTeam[],
	orderTeamsOptions?: {
		skipTiebreakers?: boolean;
	},
) => {
	console.log("teams", teams);
	// Playoffs are split into two branches by conference only if there are exactly 2 conferences
	let playoffsByConference = g.get("confs", "current").length === 2;

	// Don't let there be an odd number of byes if playoffsByConference, otherwise it would get confusing
	const numPlayoffByes = helpers.bound(
		playoffsByConference && g.get("numPlayoffByes", "current") % 2 === 1
			? g.get("numPlayoffByes", "current") - 1
			: g.get("numPlayoffByes", "current"),
		0,
		Infinity,
	);
	const numRounds = g.get("numGamesPlayoffSeries", "current").length;
	helpers.validateRoundsByes(
		numRounds,
		numPlayoffByes,
		g.get("numActiveTeams"),
	);
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	if (teams.length < numPlayoffTeams) {
		throw new Error("Not enough teams for playoffs");
	}

	let series: PlayoffSeries["series"] = range(numRounds).map(() => []);

	if (playoffsByConference) {
		if (numRounds > 1) {
			// Default: top 50% of teams in each of the two conferences
			for (const conf of g.get("confs", "current")) {
				const cid = conf.cid;
				const teamsConf: MyTeam[] = teams.filter(
					t => t.seasonAttrs.cid === cid,
				);

				if (teamsConf.length >= numPlayoffTeams / 2) {
					const round = await makeMatchups(
						await orderTeams(teamsConf, teams, orderTeamsOptions),
						numPlayoffTeams / 2,
						numPlayoffByes / 2,
					);
					series[0].push(...round);
				} else {
					// Not enough teams in conference for playoff bracket
					playoffsByConference = false;
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
					// This sort determines conference champ. Sort inside makeMatchups will determine overall #1 seed
					const sorted = await orderTeams(teamsConf, teams, orderTeamsOptions);
					teamsFinals.push(sorted[0]);
				}
			}

			if (teamsFinals.length === 2) {
				const round = await makeMatchups(
					await orderTeams(teamsFinals, teams, orderTeamsOptions),
					numPlayoffTeams / 2,
					numPlayoffByes / 2,
				);
				series[0].push(...round);
			} else {
				// Not enough teams in conference for playoff bracket
				playoffsByConference = false;
			}
		}
	}

	// Not an "else" because if the (playoffsByConference) branch fails it sets it to false and runs this as backup
	if (!playoffsByConference) {
		// Reset, in case it was partially set in prior branch
		series = range(numRounds).map(() => []);

		const round = await makeMatchups(
			await orderTeams(teams, teams, orderTeamsOptions),
			numPlayoffTeams,
			numPlayoffByes,
		);
		series[0].push(...round);
	}

	return {
		series,
		tidPlayoffs: getTidPlayoffs(series),
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
