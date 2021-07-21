import range from "lodash-es/range";
import flatten from "lodash-es/flatten";
import { g, helpers, random } from "../../../worker/util";
import newScheduleCrappy from "./newScheduleCrappy";
import { groupByUnique } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";

type MyTeam = {
	seasonAttrs: {
		cid: number;
		did: number;
	};
	tid: number;
};

const LEVELS = ["div", "conf", "other"] as const;

const groupTeamsByDid = (teams: MyTeam[]) => {
	const divs = g.get("divs");

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
			div: teams.filter(t => t.seasonAttrs.did === div.did),
			conf: teams.filter(
				t => t.seasonAttrs.did !== div.did && t.seasonAttrs.cid === div.cid,
			),
			other: teams.filter(t => t.seasonAttrs.cid !== div.cid),
		};
	}

	return teamsGroupedByDid;
};

const getNumGamesTargetsByDid = (
	teamsGroupedByDid: ReturnType<typeof groupTeamsByDid>,
) => {
	const numGames = g.get("numGames");
	const numGamesDiv = 16;
	const numGamesConf = 36;
	const numGamesOther = numGames - numGamesDiv - numGamesConf;
	if (numGamesOther < 0) {
		throw new Error(
			"Can't have more division and conference games than total games",
		);
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
	const numActiveTeams = g.get("numActiveTeams");

	for (const div of divs) {
		const divSize = teamsGroupedByDid[div.did].div.length;
		if (divSize === 0) {
			continue;
		}

		const confSize = teamsGroupedByDid[div.did].conf.length;

		// -1 for div size because that's the only one that includes the given team
		const denominators = {
			div: divSize - 1,
			conf: confSize,
			other: numActiveTeams - confSize - divSize,
		};

		numGamesTargetsByDid[div.did] = {
			perTeam: {
				div: Math.floor(numGamesDiv / denominators.div),
				conf: Math.floor(numGamesConf / denominators.conf),
				other: Math.floor(numGamesOther / denominators.other),
			},
			excess: {
				div: numGamesDiv % denominators.div,
				conf: numGamesConf % denominators.conf,
				other: numGamesOther % denominators.other,
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
	numGamesTargetsByDid,
	teams,
	teamsGroupedByDid,
	...toCopy
}: {
	numGamesTargetsByDid: ReturnType<typeof getNumGamesTargetsByDid>;
	teams: MyTeam[];
	teamsGroupedByDid: ReturnType<typeof groupTeamsByDid>;
	scheduleCounts: ReturnType<typeof initScheduleCounts>;
	tidsEither: [number, number][];
}) => {
	const MAX_ITERATIONS = 1000;
	let iteration1 = 0;

	MAIN_LOOP_1: while (iteration1 < MAX_ITERATIONS) {
		iteration1 += 1;

		// Copy some variables
		const tidsEither = helpers.deepCopy(toCopy.tidsEither);

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
						tidsEither.push([t.tid, t2.tid]);

						// This is not needed, since it's never checked against anything
						// scheduleCounts[t.tid][level].either += 1;
						// scheduleCounts[t2.tid][level].either += 1;

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
		let iteration2 = 1;
		MAIN_LOOP_2: while (iteration2 < MAX_ITERATIONS) {
			iteration2 += 1;

			const scheduleCounts = helpers.deepCopy(toCopy.scheduleCounts);

			// Assign tidsEither to home/away games
			const tidsDone: [number, number][] = []; // tid_home, tid_away

			random.shuffle(tidsEither);

			const teamsByTid = groupByUnique(teams, "tid");

			for (const [tid0, tid1] of tidsEither) {
				const t0 = teamsByTid[tid0];
				const t1 = teamsByTid[tid1];

				let level: typeof LEVELS[number];
				if (t0.seasonAttrs.did === t1.seasonAttrs.did) {
					level = "div";
				} else if (t0.seasonAttrs.cid === t1.seasonAttrs.cid) {
					level = "conf";
				} else {
					level = "other";
				}

				if (
					scheduleCounts[tid0][level].home > 0 &&
					scheduleCounts[tid1][level].away > 0
				) {
					// Try making tid0 home
					tidsDone.push([tid0, tid1]);
					scheduleCounts[tid0][level].home -= 1;
					scheduleCounts[tid1][level].away -= 1;
				} else if (
					scheduleCounts[tid1][level].home > 0 &&
					scheduleCounts[tid0][level].away > 0
				) {
					// Try making tid1 home
					tidsDone.push([tid1, tid0]);
					scheduleCounts[tid1][level].home -= 1;
					scheduleCounts[tid0][level].away -= 1;
				} else {
					// Failed to make matchups, try again
					// console.log(iteration1, iteration2, `${tidsDone.length} / ${tidsEither.length}`);
					continue MAIN_LOOP_2;
				}
			}

			return tidsDone;
		}
	}

	// No valid schedule found
	return undefined;
};

const newScheduleGood = (teams: MyTeam[]): [number, number][] | undefined => {
	const teamsGroupedByDid = groupTeamsByDid(teams);
	const numGamesTargetsByDid = getNumGamesTargetsByDid(teamsGroupedByDid);
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

	console.log("teamsGroupedByDid", teamsGroupedByDid);
	console.log("numGamesTargetsByDid", numGamesTargetsByDid);
	console.log("scheduleCounts", scheduleCounts);
	console.log("tidsDone", tidsDone);
	console.log("tidsEither", tidsEither);

	// Everything above is deterministic, but below is where randomness is introduced
	const tidsDone2 = finalize({
		numGamesTargetsByDid,
		teams,
		teamsGroupedByDid,
		scheduleCounts,
		tidsEither,
	});

	if (tidsDone2) {
		const tids = [...tidsDone, ...tidsDone2];

		console.log("tids", tids);
		return tids;
	}

	console.log("failed");
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

	if (!tids) {
		tids = newScheduleCrappy(teams);
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

	return tids;
};

export default newSchedule;
