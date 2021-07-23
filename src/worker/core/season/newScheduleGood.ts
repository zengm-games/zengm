import range from "lodash-es/range";
import flatten from "lodash-es/flatten";
import { g, helpers, random } from "../../../worker/util";
import newScheduleCrappy from "./newScheduleCrappy";
import { groupByUnique } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";
import type { Div } from "../../../common/types";

type MyTeam = {
	seasonAttrs: {
		cid: number;
		did: number;
	};
	tid: number;
};

const LEVELS = ["div", "conf", "other"] as const;

const getNumGames = (ignoreNumGamesDivConf: boolean) => {
	return {
		numGames: g.get("numGames"),
		numGamesDiv: ignoreNumGamesDivConf ? null : g.get("numGamesDiv"),
		numGamesConf: ignoreNumGamesDivConf ? null : g.get("numGamesConf"),
	};
};

const isDiv = (t: MyTeam, div: Div) => t.seasonAttrs.did === div.did;
const isConf = (t: MyTeam, div: Div) =>
	t.seasonAttrs.did !== div.did && t.seasonAttrs.cid === div.cid;
const isOther = (t: MyTeam, div: Div) => t.seasonAttrs.cid !== div.cid;

const groupTeamsByDid = (teams: MyTeam[], ignoreNumGamesDivConf: boolean) => {
	const divs = g.get("divs");
	const { numGamesDiv, numGamesConf } = getNumGames(ignoreNumGamesDivConf);

	const teamsGroupedByDid: Record<
		number,
		{
			div: MyTeam[];
			conf: MyTeam[];
			other: MyTeam[];
		}
	> = {};

	for (const div of divs) {
		teamsGroupedByDid[div.did] = {
			div: teams.filter(t => numGamesDiv !== null && isDiv(t, div)),
			conf: teams.filter(t => numGamesConf !== null && isConf(t, div)),
			other: teams.filter(
				t =>
					isOther(t, div) ||
					(numGamesDiv === null && isDiv(t, div)) ||
					(numGamesConf === null && isConf(t, div)),
			),
		};
	}

	return teamsGroupedByDid;
};

const getNumGamesTargetsByDid = (
	numActiveTeams: number,
	teamsGroupedByDid: ReturnType<typeof groupTeamsByDid>,
	ignoreNumGamesDivConf: boolean,
) => {
	const numGamesInfo = getNumGames(ignoreNumGamesDivConf);
	const numGames = numGamesInfo.numGames;

	// 0 if null, because those teams will get lumped into "other" in groupTeamsByDid
	const numGamesDiv = numGamesInfo.numGamesDiv ?? 0;
	const numGamesConf = numGamesInfo.numGamesConf ?? 0;

	const numGamesOther = numGames - numGamesDiv - numGamesConf;
	if (numGamesOther < 0) {
		return "Can't have more division and conference games than total games";
	}

	const numGamesTargetsByDid: Record<
		number,
		{
			// Number of games played against every single team in (Div: same division; Conf: same conference but not same division; Other: not in same conference)
			perTeam: {
				div: number;
				conf: number;
				other: number;
			};

			// Number of total games that need to be played in the division/conference/other, but can't be spread evenly across all teams
			excess: {
				div: number;
				conf: number;
				other: number;
			};
		}
	> = {};

	const divs = g.get("divs");

	for (const div of divs) {
		const divSize = teamsGroupedByDid[div.did].div.length;
		if (divSize === 0 && numGamesInfo.numGamesDiv !== null) {
			continue;
		}

		const confSize = teamsGroupedByDid[div.did].conf.length;

		const denominators = {
			div: divSize,
			conf: confSize,
			other: numActiveTeams - confSize - divSize,
		};
		const numerators = {
			div: numGamesDiv,
			conf: numGamesConf,
			other: numGamesOther,
		};

		// -1 for the group containing the current team
		if (numGamesInfo.numGamesDiv === null) {
			denominators.other -= 1;
		} else {
			denominators.div -= 1;
		}

		for (const level of LEVELS) {
			if (denominators[level] === 0 && numerators[level] > 0) {
				return `Team needs ${numerators[level]} games in "${level}" but no teams exist in that group`;
			}
		}

		numGamesTargetsByDid[div.did] = {
			perTeam: {
				div:
					denominators.div > 0
						? Math.floor(numerators.div / denominators.div)
						: 0,
				conf:
					denominators.conf > 0
						? Math.floor(numerators.conf / denominators.conf)
						: 0,
				other:
					denominators.other > 0
						? Math.floor(numerators.other / denominators.other)
						: 0,
			},
			excess: {
				div: denominators.div > 0 ? numerators.div % denominators.div : 0,
				conf: denominators.conf > 0 ? numerators.conf % denominators.conf : 0,
				other:
					denominators.other > 0 ? numerators.other % denominators.other : 0,
			},
		};
	}

	return numGamesTargetsByDid;
};

const initScheduleCounts = (teams: MyTeam[]) => {
	// Keep track of the number of home/away/either games assigned to each team, at either the div/conf/other level. "either" means that it's been determined a game between two teams is definitely necessary, but it has not yet been determined if it's a home or away game. Like if two teams only play each other twice, each will have one home and one away game. But if they play three times, there will be one more game that could go either way.
	const scheduleCounts: Record<
		number,
		Record<
			typeof LEVELS[number],
			{
				home: number;
				away: number;
				either: number;
			}
		>
	> = {};

	for (const t of teams) {
		scheduleCounts[t.tid] = {
			div: { home: 0, away: 0, either: 0 },
			conf: { home: 0, away: 0, either: 0 },
			other: { home: 0, away: 0, either: 0 },
		};
	}

	return scheduleCounts;
};

const finalize = ({
	ignoreNumGamesDivConf,
	numGamesTargetsByDid,
	teams,
	teamsGroupedByDid,
	...toCopy
}: {
	ignoreNumGamesDivConf: boolean;
	numGamesTargetsByDid: Exclude<
		ReturnType<typeof getNumGamesTargetsByDid>,
		string
	>;
	teams: MyTeam[];
	teamsGroupedByDid: ReturnType<typeof groupTeamsByDid>;
	scheduleCounts: ReturnType<typeof initScheduleCounts>;
	tidsEither: [number, number][];
}) => {
	const MAX_ITERATIONS_1 = 1000;
	const MAX_ITERATIONS_2 = 1000;
	let iteration1 = 0;
	let iteration2all = 0;

	const teamsByTid = groupByUnique(teams, "tid");
	const { numGames, numGamesDiv, numGamesConf } = getNumGames(
		ignoreNumGamesDivConf,
	);

	// 0 if null, because those teams will get lumped into "other" in groupTeamsByDid
	const numGamesDiv2 = numGamesDiv ?? 0;
	const numGamesConf2 = numGamesConf ?? 0;

	// If it's an odd number of games, round up to allow extra home/away game
	const maxHomeOrAway = {
		div: Math.ceil(numGamesDiv2 / 2),
		conf: Math.ceil(numGamesConf2 / 2),
		other: Math.ceil((numGames - numGamesDiv2 - numGamesConf2) / 2),
	};

	MAIN_LOOP_1: while (iteration1 < MAX_ITERATIONS_1) {
		iteration1 += 1;

		// Copy some variables
		const tidsEither = helpers.deepCopy(toCopy.tidsEither);
		const scheduleCounts = helpers.deepCopy(toCopy.scheduleCounts);

		// Make all the excess matchups (for odd number of games between teams, someone randomly gets an extra home game)
		{
			// Track number of games left for each team in each category
			const excessGamesRemainingByTid: Record<
				number,
				typeof numGamesTargetsByDid[number]["excess"]
			> = {};
			for (const t of teams) {
				excessGamesRemainingByTid[t.tid] = {
					...numGamesTargetsByDid[t.seasonAttrs.did].excess,
				};
			}

			// Shuffle teams, cause particularly with confs you have the same teams available in multiple different groups, since in-division teams are already subtracted, so we don't want to fall into a rut based on team order
			const teamIndexes = range(teams.length);
			random.shuffle(teamIndexes);

			for (const teamIndex of teamIndexes) {
				const t = teams[teamIndex];

				const teamsGrouped = teamsGroupedByDid[t.seasonAttrs.did];
				const excessGamesRemaining = excessGamesRemainingByTid[t.tid];

				for (const level of LEVELS) {
					const numGames = excessGamesRemaining[level];
					if (numGames === 0) {
						continue;
					}
					// console.log(t.tid, `did${t.seasonAttrs.did}`, level, `needs ${numGames} games`);

					const group = teamsGrouped[level];

					// Randomly find numGames games in group. Max one game per team, because if it was more than one game per team it wouldn't be an "excess" matchup

					let groupIndexes = range(group.length);
					random.shuffle(groupIndexes);

					// Order by team with most games remaining
					groupIndexes = orderBy(
						groupIndexes,
						i => excessGamesRemainingByTid[group[i].tid][level],
						"desc",
					);
					// console.log('team games remaining', groupIndexes.map(i => excessGamesRemainingByTid[group[i].tid][level]))

					for (const groupIndex of groupIndexes) {
						const t2 = group[groupIndex];

						if (t.tid === t2.tid) {
							continue;
						}

						// Make sure other team needs a game
						if (excessGamesRemainingByTid[t2.tid][level] === 0) {
							continue;
						}

						// Record as an "either" game
						// console.log('found matchup', t.tid, t2.tid);
						tidsEither.push([t.tid, t2.tid]);
						scheduleCounts[t.tid][level].either += 1;
						scheduleCounts[t2.tid][level].either += 1;

						excessGamesRemaining[level] -= 1;
						excessGamesRemainingByTid[t2.tid][level] -= 1;

						if (excessGamesRemaining[level] === 0) {
							break;
						}
					}

					if (excessGamesRemaining[level] > 0) {
						// Failed to make matchups, try again
						continue MAIN_LOOP_1;
					}
				}
			}
		}

		// Assign all the "either" games to home/away, while balancing home/away within div/conf/other
		let iteration2 = 0;
		MAIN_LOOP_2: while (iteration2 < MAX_ITERATIONS_2) {
			const scheduleCounts2 = helpers.deepCopy(scheduleCounts);

			iteration2 += 1;
			iteration2all += 1;

			// Assign tidsEither to home/away games
			const tidsDone: [number, number][] = []; // tid_home, tid_away

			random.shuffle(tidsEither);

			const tidsDoneIndexesByLevel: Record<
				typeof LEVELS[number],
				Record<number, number[]>
			> = {
				div: {},
				conf: {},
				other: {},
			};

			for (const [tid0, tid1] of tidsEither) {
				const t0 = teamsByTid[tid0];
				const t1 = teamsByTid[tid1];

				let level: typeof LEVELS[number];
				if (numGamesDiv !== null && t0.seasonAttrs.did === t1.seasonAttrs.did) {
					level = "div";
				} else if (
					numGamesConf !== null &&
					t0.seasonAttrs.cid === t1.seasonAttrs.cid
				) {
					level = "conf";
				} else {
					level = "other";
				}

				scheduleCounts2[tid0][level].either -= 1;
				scheduleCounts2[tid1][level].either -= 1;

				const getHomeMinCutoffDiffs = () => {
					const cutoffDiff = (tid: number, homeAway: "home" | "away") =>
						maxHomeOrAway[level] - scheduleCounts2[tid][level][homeAway];
					const cutoffDiffs = [tid0, tid1].map(tid => ({
						home: cutoffDiff(tid, "home"),
						away: cutoffDiff(tid, "away"),
					}));

					// Should we first try making tid0 or tid1 home? Whichever has someone closest to the cutoff
					return [
						Math.min(cutoffDiffs[0].home, cutoffDiffs[1].away),
						Math.min(cutoffDiffs[1].home, cutoffDiffs[0].away),
					];
				};

				let homeMinCutoffDiffs = getHomeMinCutoffDiffs();

				if (homeMinCutoffDiffs[0] === 0 && homeMinCutoffDiffs[1] === 0) {
					// console.log(iteration2all, `${tidsDone.length} / ${tidsEither.length}`, level, homeMinCutoffDiffs);

					// Try swapping a past matchup, if that is valid
					let swapped = false;
					for (const tid of [tid0, tid1]) {
						if (tidsDoneIndexesByLevel[level][tid] && !swapped) {
							for (const tidsDoneIndex of tidsDoneIndexesByLevel[level][tid]) {
								const matchup = tidsDone[tidsDoneIndex];

								// Will both teams still be valid if we swap?
								if (
									maxHomeOrAway[level] -
										scheduleCounts2[matchup[0]][level].away >
										0 &&
									maxHomeOrAway[level] -
										scheduleCounts2[matchup[1]][level].home >
										0
								) {
									scheduleCounts2[matchup[0]][level].home -= 1;
									scheduleCounts2[matchup[0]][level].away += 1;
									scheduleCounts2[matchup[1]][level].home += 1;
									scheduleCounts2[matchup[1]][level].away -= 1;
									matchup.reverse();

									homeMinCutoffDiffs = getHomeMinCutoffDiffs();

									swapped = true;
									break;
								}
							}
						}
					}

					if (!swapped) {
						// Failed to make matchups, try again
						continue MAIN_LOOP_2;
					}
				}

				if (homeMinCutoffDiffs[0] === 0 && homeMinCutoffDiffs[1] === 0) {
					throw new Error("Should never happen");
				} else if (homeMinCutoffDiffs[0] > homeMinCutoffDiffs[1]) {
					// tid0 home
					tidsDone.push([tid0, tid1]);
					scheduleCounts2[tid0][level].home += 1;
					scheduleCounts2[tid1][level].away += 1;
				} else {
					// tid1 home
					tidsDone.push([tid1, tid0]);
					scheduleCounts2[tid1][level].home += 1;
					scheduleCounts2[tid0][level].away += 1;
				}

				// Track in tidsDoneIndexesByLevel
				for (const tid of [tid0, tid1]) {
					if (!tidsDoneIndexesByLevel[level][tid]) {
						tidsDoneIndexesByLevel[level][tid] = [];
					}
					tidsDoneIndexesByLevel[level][tid].push(tidsDone.length - 1);
				}
			}

			// console.log('iteration counts', iteration1, iteration2, iteration2all);
			return tidsDone;
		}
	}

	// No valid schedule found
	return undefined;
};

const newScheduleGood = (
	teams: MyTeam[],
	ignoreNumGamesDivConf: boolean = false,
): [number, number][] | string => {
	const teamsGroupedByDid = groupTeamsByDid(teams, ignoreNumGamesDivConf);

	const numGamesTargetsByDid = getNumGamesTargetsByDid(
		teams.length,
		teamsGroupedByDid,
		ignoreNumGamesDivConf,
	);
	if (typeof numGamesTargetsByDid === "string") {
		return numGamesTargetsByDid;
	}

	const scheduleCounts = initScheduleCounts(teams);

	const tidsDone: [number, number][] = []; // tid_home, tid_away
	const tidsEither: [number, number][] = []; // home/away not yet set, add to tids later

	// Make all the required matchups (perTeam)
	for (const t of teams) {
		const teamsGrouped = teamsGroupedByDid[t.seasonAttrs.did];
		const numGamesTargets = numGamesTargetsByDid[t.seasonAttrs.did];

		for (const level of LEVELS) {
			const group = teamsGrouped[level];

			for (const t2 of group) {
				if (t.tid === t2.tid) {
					continue;
				}

				// Record home games, away games will be handled by t2
				const numHome = Math.floor(numGamesTargets.perTeam[level] / 2);
				for (let i = 0; i < numHome; i++) {
					tidsDone.push([t.tid, t2.tid]);
					scheduleCounts[t.tid][level].home += 1;
					scheduleCounts[t2.tid][level].away += 1;
				}

				// Record either games only for the lower tid, so they don't get double counted
				if (t.tid < t2.tid) {
					const numEither = numGamesTargets.perTeam[level] % 2;
					for (let i = 0; i < numEither; i++) {
						tidsEither.push([t.tid, t2.tid]);
						scheduleCounts[t.tid][level].either += 1;
						scheduleCounts[t2.tid][level].either += 1;
					}
				}
			}
		}
	}

	/*console.log("teamsGroupedByDid", teamsGroupedByDid);
	console.log("numGamesTargetsByDid", numGamesTargetsByDid);
	console.log("scheduleCounts", scheduleCounts);
	console.log("tidsDone", tidsDone);
	console.log("tidsEither", tidsEither);*/

	// Everything above is deterministic, but below is where randomness is introduced
	const tidsDone2 = finalize({
		ignoreNumGamesDivConf,
		numGamesTargetsByDid,
		teams,
		teamsGroupedByDid,
		scheduleCounts,
		tidsEither,
	});

	if (tidsDone2) {
		const tids = [...tidsDone, ...tidsDone2];

		// console.log("tids", tids);
		return tids;
	}

	// console.log("failed");
	return "Failed to find valid schedule";
};

/**
 * Wrapper function to generate a new schedule with the appropriate algorithm based on the number of teams in the league.
 *
 * For leagues with NBA-like structure, use newScheduleDefault. Otherwise, newScheduleCrappy.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newSchedule = (teams: MyTeam[]) => {
	let tids = newScheduleGood(teams);
	let warning: string | undefined;

	if (typeof tids === "string") {
		// console.log("FAILED FIRST TRY", tids)
		warning = `Failed to generate a schedule with the current "# Division Games" and "# Conference Games" settings, so the schedule was generated with those settings ignored. Error from schedule generator: ${tids}`;
		tids = newScheduleGood(teams, true);
	}

	if (typeof tids === "string") {
		// console.log("CRAPPY", tids)
		// warning = "CRAPPY";
		// tids = newScheduleCrappy(teams);
		tids = [];
	}

	// Order the schedule so that it takes fewer days to play
	random.shuffle(tids);
	const days: [number, number][][] = [[]];
	const tidsInDays: number[][] = [[]];
	let jMax = 0;

	for (let i = 0; i < tids.length; i++) {
		let used = false;

		for (let j = 0; j <= jMax; j++) {
			if (
				!tidsInDays[j].includes(tids[i][0]) &&
				!tidsInDays[j].includes(tids[i][1])
			) {
				tidsInDays[j].push(tids[i][0]);
				tidsInDays[j].push(tids[i][1]);
				days[j].push(tids[i]);
				used = true;
				break;
			}
		}

		if (!used) {
			days.push([tids[i]]);
			tidsInDays.push([tids[i][0], tids[i][1]]);
			jMax += 1;
		}
	}

	random.shuffle(days);

	// Otherwise the most dense days will be at the beginning and the least dense days will be at the end
	tids = flatten(days);

	return {
		tids,
		warning,
	};
};

export default newSchedule;
