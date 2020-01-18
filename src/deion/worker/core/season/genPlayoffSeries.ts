import range from "lodash/range";
import { g, helpers } from "../../util";
import { TeamFiltered } from "../../../common/types";

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

	const addMatchup = (currentRound, team1, maxTeamInRound) => {
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
		const currentRound = [];

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

const genPlayoffSeries = (teams: TeamFiltered[]) => {
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
	const tidPlayoffs: number[] = [];
	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	if (numPlayoffTeams <= 0) {
		throw new Error(
			"Invalid combination of numGamesPlayoffSeries and numPlayoffByes results in no playoff teams",
		);
	}

	if (numPlayoffTeams > g.get("numTeams")) {
		if (numPlayoffTeams > g.get("numTeams")) {
			throw new Error(
				`${numRounds} playoff rounds with ${numPlayoffByes} byes means ${numPlayoffTeams} teams make the playoffs, but there are only ${g.get(
					"numTeams",
				)} teams in the league`,
			);
		}
	}

	const series: any[][] = range(numRounds).map(() => []);

	if (playoffsByConference) {
		if (numRounds > 1) {
			const seeds = genSeeds(numPlayoffTeams / 2, numPlayoffByes / 2); // Default: top 50% of teams in each of the two conferences

			for (let cid = 0; cid < g.get("confs").length; cid++) {
				const teamsConf: TeamFiltered[] = [];

				for (let i = 0; i < teams.length; i++) {
					if (teams[i].cid === cid) {
						teamsConf.push(teams[i]);
						tidPlayoffs.push(teams[i].tid);

						if (teamsConf.length >= numPlayoffTeams / 2) {
							break;
						}
					}
				}

				if (teamsConf.length < numPlayoffTeams / 2) {
					throw new Error(
						`Not enough teams for playoffs in conference ${cid} (${
							g.get("confs")[cid].name
						})`,
					);
				}

				series[0].push(
					...seeds.map(matchup => {
						const home = teamsConf[matchup[0]];
						home.seed = matchup[0] + 1;
						const away =
							matchup[1] !== undefined ? teamsConf[matchup[1]] : undefined;

						if (away) {
							// @ts-ignore
							away.seed = matchup[1] + 1;
						}

						return {
							home,
							away,
						};
					}),
				);
			}
		} else {
			// Special case - if there is only one round, pick the best team in each conference to play
			const teamsConf: any[] = [];

			for (let cid = 0; cid < g.get("confs").length; cid++) {
				for (let i = 0; i < teams.length; i++) {
					if (teams[i].cid === cid) {
						teamsConf.push(teams[i]);
						tidPlayoffs.push(teams[i].tid);
						break;
					}
				}
			}

			if (teamsConf.length !== 2) {
				throw new Error("Could not find two conference champs");
			}

			series[0][0] = {
				home:
					teamsConf[0].winp > teamsConf[1].winp ? teamsConf[0] : teamsConf[1],
				away:
					teamsConf[0].winp > teamsConf[1].winp ? teamsConf[1] : teamsConf[0],
			};
			series[0][0].home.seed = 1;
			series[0][0].away.seed = 1;
		}
	} else {
		// Alternative: top 50% of teams overall
		const teamsConf: TeamFiltered[] = [];

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
			const home = teamsConf[matchup[0]];
			home.seed = matchup[0] + 1;
			const away = matchup[1] !== undefined ? teamsConf[matchup[1]] : undefined;

			if (away) {
				// @ts-ignore
				away.seed = matchup[1] + 1;
			}

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
