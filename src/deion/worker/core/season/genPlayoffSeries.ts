import range from "lodash/range";
import { g, helpers } from "../../util";
import type {
	TeamFiltered,
	PlayoffSeries,
	PlayoffSeriesTeam,
} from "../../../common/types";

type Seed = [number, number | undefined]; // Return the seeds (0 indexed) for the matchups, in order (undefined is a bye)

const genSeeds = (numPlayoffTeams: number, numPlayoffByes: number): Seed[] => {
	const numRounds = Math.log2(numPlayoffTeams + numPlayoffByes);

	if (!Number.isInteger(numRounds)) {
		throw new Error(
			`Invalid genSeeds input: ${numPlayoffTeams} teams and ${numPlayoffByes} byes`,
		);
	}

	// Handle byes - replace lowest seeds with undefined
	const byeSeeds: number[] = [];

	for (let i = 0; i < numPlayoffByes; i++) {
		byeSeeds.push(numPlayoffTeams + i);
	}

	const addMatchup = (
		currentRound: Seed[],
		team1: number | undefined,
		maxTeamInRound: number,
	) => {
		if (typeof team1 !== "number") {
			throw Error("Invalid type");
		}

		const otherTeam = maxTeamInRound - team1;
		currentRound.push([
			team1,
			byeSeeds.includes(otherTeam) ? undefined : otherTeam,
		]);
	};

	// Grow from the final matchup
	let lastRound: Seed[] = [[0, 1]];

	for (let i = 0; i < numRounds - 1; i++) {
		// Add two matchups to currentRound, for the two teams in lastRound. The sum of the seeds in a matchup is constant for an entire round!
		const numTeamsInRound = lastRound.length * 4;
		const maxTeamInRound = numTeamsInRound - 1;
		const currentRound: Seed[] = [];

		for (const matchup of lastRound) {
			// swapOrder stuff is just cosmetic, matchups would be the same without it, just displayed slightly differently
			const swapOrder =
				(currentRound.length / 2) % 2 === 1 && matchup[1] !== undefined;
			addMatchup(currentRound, matchup[swapOrder ? 1 : 0], maxTeamInRound);
			addMatchup(currentRound, matchup[swapOrder ? 0 : 1], maxTeamInRound);
		}

		lastRound = currentRound;
	}

	return lastRound;
};

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

const genPlayoffSeries = (teams: MyTeam[]) => {
	// Playoffs are split into two branches by conference only if there are exactly 2 conferences
	const playoffsByConference = g.get("confs").length === 2; // Don't let there be an odd number of byes if playoffsByConference, otherwise it would get confusing

	const numPlayoffByes = helpers.bound(
		playoffsByConference && g.get("numPlayoffByes") % 2 === 1
			? g.get("numPlayoffByes") - 1
			: g.get("numPlayoffByes"),
		0,
		Infinity,
	);
	const numRounds = g.get("numGamesPlayoffSeries").length;
	helpers.validateRoundsByes(numRounds, numPlayoffByes, g.get("numTeams"));
	const tidPlayoffs: number[] = [];
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	const series: PlayoffSeries["series"] = range(numRounds).map(() => []);

	if (playoffsByConference) {
		if (numRounds > 1) {
			const seeds = genSeeds(numPlayoffTeams / 2, numPlayoffByes / 2); // Default: top 50% of teams in each of the two conferences

			for (const conf of g.get("confs")) {
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

				if (teamsConf.length < numPlayoffTeams / 2) {
					throw new Error(
						`Not enough teams for playoffs in conference ${cid} (${conf.name})`,
					);
				}

				series[0].push(
					...seeds.map(matchup => {
						const home = genTeam(teamsConf[matchup[0]], matchup[0] + 1);
						const away =
							matchup[1] !== undefined
								? genTeam(teamsConf[matchup[1]], matchup[1] + 1)
								: undefined;

						return {
							home,
							away,
						};
					}),
				);
			}
		} else {
			// Special case - if there is only one round, pick the best team in each conference to play
			const teamsConf: MyTeam[] = [];

			for (const conf of g.get("confs")) {
				for (let i = 0; i < teams.length; i++) {
					if (teams[i].seasonAttrs.cid === conf.cid) {
						teamsConf.push(teams[i]);
						tidPlayoffs.push(teams[i].tid);
						break;
					}
				}
			}

			if (teamsConf.length !== 2) {
				throw new Error("Could not find two conference champs");
			}

			const t1 = genTeam(teamsConf[0], 1);
			const t2 = genTeam(teamsConf[1], 1);

			series[0][0] = {
				home: t1.winp > t2.winp ? t1 : t2,
				away: t1.winp > t2.winp ? t2 : t1,
			};
		}
	} else {
		// Alternative: top 50% of teams overall
		const teamsConf: MyTeam[] = [];

		for (let i = 0; i < teams.length; i++) {
			teamsConf.push(teams[i]);
			tidPlayoffs.push(teams[i].tid);

			if (teamsConf.length >= numPlayoffTeams) {
				break;
			}
		}

		if (teamsConf.length < numPlayoffTeams) {
			throw new Error("Not enough teams for playoffs");
		}

		const seeds = genSeeds(numPlayoffTeams, numPlayoffByes);
		series[0] = seeds.map(matchup => {
			const home = genTeam(teamsConf[matchup[0]], matchup[0] + 1);
			const away =
				matchup[1] !== undefined
					? genTeam(teamsConf[matchup[1]], matchup[1] + 1)
					: undefined;

			return {
				home,
				away,
			};
		});
	}

	return {
		series,
		tidPlayoffs,
	};
};

export default genPlayoffSeries;
