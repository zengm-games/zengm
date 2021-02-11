import range from "lodash/range";
import { g, helpers } from "../../util";
import type {
	TeamFiltered,
	PlayoffSeries,
	PlayoffSeriesTeam,
} from "../../../common/types";
import genPlayoffSeeds from "./genPlayoffSeeds";

type MyTeam = TeamFiltered<["tid"], ["cid", "winp"], any, number>;

const genTeam = (t: MyTeam, seed: number): PlayoffSeriesTeam => {
	return {
		tid: t.tid,
		cid: t.seasonAttrs.cid,
		winp: t.seasonAttrs.winp,
		seed,
		won: 0,
	};
};

// In a 2 conference playoff, this should be called once with each side of the bracket
const makeMatchups = (
	teams: MyTeam[],
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

const genPlayoffSeries = async (teams: MyTeam[]) => {
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

	let tidPlayoffs: number[] = [];
	let series: PlayoffSeries["series"] = range(numRounds).map(() => []);

	if (playoffsByConference) {
		if (numRounds > 1) {
			// Default: top 50% of teams in each of the two conferences
			for (const conf of g.get("confs", "current")) {
				const cid = conf.cid;
				const teamsConf: MyTeam[] = [];

				for (const t of teams) {
					if (t.seasonAttrs.cid === cid) {
						teamsConf.push(t);
						tidPlayoffs.push(t.tid);

						if (teamsConf.length >= numPlayoffTeams / 2) {
							break;
						}
					}
				}

				if (teamsConf.length >= numPlayoffTeams / 2) {
					const round = makeMatchups(
						teamsConf,
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
				for (const t of teams) {
					if (t.seasonAttrs.cid === cid) {
						teamsFinals.push(t);
						tidPlayoffs.push(t.tid);
						break;
					}
				}
			}

			if (teamsFinals.length === 2) {
				const round = makeMatchups(
					teamsFinals,
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
		// Reset, in case they were set in prior branch
		tidPlayoffs = [];
		series = range(numRounds).map(() => []);

		// Alternative: top 50% of teams overall
		const teamsPlayoffs: MyTeam[] = [];

		for (let i = 0; i < teams.length; i++) {
			teamsPlayoffs.push(teams[i]);
			tidPlayoffs.push(teams[i].tid);

			if (teamsPlayoffs.length >= numPlayoffTeams) {
				break;
			}
		}

		if (teamsPlayoffs.length < numPlayoffTeams) {
			throw new Error("Not enough teams for playoffs");
		}

		const round = makeMatchups(teamsPlayoffs, numPlayoffTeams, numPlayoffByes);
		series[0].push(...round);
	}

	return {
		series,
		tidPlayoffs,
	};
};

export default genPlayoffSeries;
