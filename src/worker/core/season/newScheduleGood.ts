import range from "lodash-es/range";
import flatten from "lodash-es/flatten";
import { g, helpers, random } from "../../../worker/util";
// import newScheduleCrappy from "./newScheduleCrappy";
import { groupByUnique } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";
import type { Div, GameAttributesLeague } from "../../../common/types";

type MyTeam = {
	seasonAttrs: {
		cid: number;
		did: number;
	};
	tid: number;
};

export type NewScheduleGoodSettings = {
	divs: GameAttributesLeague["divs"];
	numGames: GameAttributesLeague["numGames"];
	numGamesConf: GameAttributesLeague["numGamesConf"];
	numGamesDiv: GameAttributesLeague["numGamesDiv"];
};

const LEVELS = ["div", "conf", "other"] as const;

const getNumGames = (
	settings: NewScheduleGoodSettings,
	ignoreNumGamesDivConf: boolean,
) => {
	return {
		numGames: settings.numGames,
		numGamesDiv: ignoreNumGamesDivConf ? null : settings.numGamesDiv,
		numGamesConf: ignoreNumGamesDivConf ? null : settings.numGamesConf,
	};
};

const isDiv = (t: MyTeam, div: Div) => t.seasonAttrs.did === div.did;
const isConf = (t: MyTeam, div: Div) =>
	t.seasonAttrs.did !== div.did && t.seasonAttrs.cid === div.cid;
const isOther = (t: MyTeam, div: Div) => t.seasonAttrs.cid !== div.cid;

const groupTeamsByDid = (
	teams: MyTeam[],
	settings: NewScheduleGoodSettings,
	ignoreNumGamesDivConf: boolean,
) => {
	const divs = settings.divs;
	const { numGamesDiv, numGamesConf } = getNumGames(
		settings,
		ignoreNumGamesDivConf,
	);

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
			conf: teams.filter(
				t =>
					numGamesConf !== null &&
					(isConf(t, div) || (numGamesDiv === null && isDiv(t, div))),
			),
			other: teams.filter(
				t =>
					isOther(t, div) ||
					(numGamesDiv === null && numGamesConf === null && isDiv(t, div)) ||
					(numGamesConf === null && isConf(t, div)),
			),
		};
	}

	return teamsGroupedByDid;
};

const getNumGamesTargetsByDid = (
	numActiveTeams: number,
	teamsGroupedByDid: ReturnType<typeof groupTeamsByDid>,
	settings: NewScheduleGoodSettings,
	ignoreNumGamesDivConf: boolean,
) => {
	const numGamesInfo = getNumGames(settings, ignoreNumGamesDivConf);
	const numGames = numGamesInfo.numGames;

	// 0 if null, because those teams will get lumped into "other" in groupTeamsByDid
	const numGamesDiv = numGamesInfo.numGamesDiv ?? 0;
	const numGamesConf = numGamesInfo.numGamesConf ?? 0;

	const numGamesOther = numGames - numGamesDiv - numGamesConf;
	if (numGamesOther < 0) {
		return "Can't have more division and conference games than total games.";
	}

	const numGamesTargetsByDid: Record<
		number,
		{
			// Number of games played against every single team in (div: same division; conf: same conference but not same division; other: not in same conference)
			perTeam: {
				div: number;
				conf: number;
				other: number;
			};

			// Number of total games that need to be played in the div/conf/other, but can't be spread evenly across all teams
			excess: {
				div: number;
				conf: number;
				other: number;
			};
		}
	> = {};

	const divs = settings.divs;

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
			if (numGamesInfo.numGamesConf === null) {
				denominators.other -= 1;
			} else {
				denominators.conf -= 1;
			}
		} else {
			denominators.div -= 1;
		}

		for (const level of LEVELS) {
			if (denominators[level] === 0 && numerators[level] > 0) {
				if (level === "div") {
					return `Team needs ${numerators[level]} division games but there are no other teams in the ${div.name} division.`;
				} else if (level === "conf") {
					return `Team needs ${numerators[level]} conference games outside its division, but the ${div.name} division is the only division in its conference.`;
				} else {
					return `Team needs ${numerators[level]} non-conference games, but there is only one conference.`;
				}
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
	settings,
	teams,
	teamsGroupedByDid,
	...toCopy
}: {
	ignoreNumGamesDivConf: boolean;
	numGamesTargetsByDid: Exclude<
		ReturnType<typeof getNumGamesTargetsByDid>,
		string
	>;
	settings: NewScheduleGoodSettings;
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
		settings,
		ignoreNumGamesDivConf,
	);

	// 0 if null, because those teams will get lumped into "other" in groupTeamsByDid
	const numGamesConf2 = numGamesConf ?? 0;

	// Used when numGames * numTeams is odd. conf one is tricky, because we need to consider the whole conf not just the conf teams for a given div (think 3 divisions and 15 teams in a conf with 1 game, that's 7.5 needed games).
	const allowOneTeamWithOneGameRemainingBase: {
		div: Record<number, boolean>;
		conf: Record<number, boolean>;
		other: boolean;
	} = {
		div: {},
		conf: {},
		other: (teams.length * numGames) % 2 === 1,
	};

	for (const didString of Object.keys(teamsGroupedByDid)) {
		const did = parseInt(didString);

		// If there are no teams in a div, this check is needed
		if (numGamesTargetsByDid[did]) {
			const numTeams = teamsGroupedByDid[did].div.length;
			const numGames = numGamesTargetsByDid[did].excess.div;
			allowOneTeamWithOneGameRemainingBase.div[did] =
				(numTeams * numGames) % 2 === 1;
		}
	}

	const cids = new Set(settings.divs.map(div => div.cid));
	for (const cid of cids) {
		const numTeams = teams.filter(t => t.seasonAttrs.cid === cid).length;
		allowOneTeamWithOneGameRemainingBase.conf[cid] =
			(numTeams * numGamesConf2) % 2 === 1;
	}

	const getLevel = (t0: MyTeam, t1: MyTeam): typeof LEVELS[number] => {
		if (numGamesDiv !== null && t0.seasonAttrs.did === t1.seasonAttrs.did) {
			return "div";
		} else if (
			numGamesConf !== null &&
			t0.seasonAttrs.cid === t1.seasonAttrs.cid &&
			(numGamesDiv === null || t0.seasonAttrs.did !== t1.seasonAttrs.did)
		) {
			return "conf";
		} else {
			return "other";
		}
	};

	MAIN_LOOP_1: while (iteration1 < MAX_ITERATIONS_1) {
		iteration1 += 1;

		// Copy some variables
		const tidsEither = helpers.deepCopy(toCopy.tidsEither);
		const scheduleCounts = helpers.deepCopy(toCopy.scheduleCounts);
		const allowOneTeamWithOneGameRemaining = helpers.deepCopy(
			allowOneTeamWithOneGameRemainingBase,
		);

		const skippedGameTids: number[] = [];

		const allowOneGameRemaining = (t: MyTeam, level: typeof LEVELS[number]) => {
			if (level === "div") {
				return allowOneTeamWithOneGameRemaining.div[t.seasonAttrs.did];
			}
			if (level === "conf") {
				return allowOneTeamWithOneGameRemaining.conf[t.seasonAttrs.cid];
			}
			return allowOneTeamWithOneGameRemaining.other;
		};

		const applyOneGameRemaining = (t: MyTeam, level: typeof LEVELS[number]) => {
			if (level === "div") {
				allowOneTeamWithOneGameRemaining.div[t.seasonAttrs.did] = false;
			} else if (level === "conf") {
				allowOneTeamWithOneGameRemaining.conf[t.seasonAttrs.cid] = false;
			} else {
				allowOneTeamWithOneGameRemaining.other = false;
			}
		};

		// Make all the excess matchups (for odd number of games between teams, someone randomly gets an extra home game)
		{
			// console.log('numGamesTargetsByDid', helpers.deepCopy(numGamesTargetsByDid));
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
			// console.log('excessGamesRemainingByTid', helpers.deepCopy(excessGamesRemainingByTid));

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
					// console.log('team games remaining', groupIndexes.map(i => excessGamesRemainingByTid[group[i].tid][level]));

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

					if (
						allowOneGameRemaining(t, level) &&
						excessGamesRemaining[level] === 1
					) {
						applyOneGameRemaining(t, level);
						excessGamesRemaining[level] -= 1;
						skippedGameTids.push(t.tid);

						// Move am
					}

					if (excessGamesRemaining[level] > 0) {
						// console.log("FAILED", level, t.tid, excessGamesRemainingByTid)
						// Failed to make matchups, try again
						continue MAIN_LOOP_1;
					}
				}
			}
		}

		// If two team skipped games (must be due to div/conf constraints, since other constraint can only skip one), make them play each other. Better than uneven game count.
		if (skippedGameTids.length >= 2) {
			// Put teams skipped multiple times in the front, so we don't get stuck with them at the end and have to skip a game
			const counts = new Map<number, number>();
			for (const tid of skippedGameTids) {
				counts.set(tid, (counts.get(tid) ?? 0) + 1);
			}
			const countsInfo = orderBy(
				Array.from(counts.entries()).map(([tid, count]) => ({ tid, count })),
				"count",
				"desc",
			);
			let skippedGameTidsOrdered: number[] = [];
			for (const { tid, count } of countsInfo) {
				for (let i = 0; i < count; i++) {
					skippedGameTidsOrdered.push(tid);
				}
			}

			while (skippedGameTidsOrdered.length >= 2) {
				const tid0 = skippedGameTidsOrdered.pop();

				// Are any teams skipped multiple times? If so, need to be careful they don't play themselves
				const tid1: number | undefined = skippedGameTidsOrdered.filter(
					tid => tid !== tid0,
				)[0];

				let found = false;
				skippedGameTidsOrdered = skippedGameTidsOrdered.filter(tid => {
					if (found) {
						return true;
					}

					if (tid !== tid1) {
						return true;
					}

					found = true;
					return false;
				});

				if (tid0 === undefined || tid1 === undefined || tid0 === tid1) {
					break;
				}

				tidsEither.push([tid0, tid1]);

				const t0 = teamsByTid[tid0];
				const t1 = teamsByTid[tid1];
				const level = getLevel(t0, t1);

				scheduleCounts[tid0][level].either += 1;
				scheduleCounts[tid1][level].either += 1;
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

			// This can differ even for teams in the same division, because if numGamesLevel*numTeams is odd, somebody gets an extra game at some other level
			const maxHomeOrAway = (tid: number, level: typeof LEVELS[number]) => {
				// Use scheduleCounts rather than scheduleCounts2 because scheduleCounts2 gets mutated in the tidsEither for loop and is inconsistent when this is called (game removed from either before placed in home/away)
				const numGamesAtLevel =
					scheduleCounts[tid][level].away +
					scheduleCounts[tid][level].home +
					scheduleCounts[tid][level].either;

				// If it's an odd number of games, round up to allow extra home/away game
				return Math.ceil(numGamesAtLevel / 2);
			};

			for (const [tid0, tid1] of tidsEither) {
				const t0 = teamsByTid[tid0];
				const t1 = teamsByTid[tid1];

				const level = getLevel(t0, t1);

				scheduleCounts2[tid0][level].either -= 1;
				scheduleCounts2[tid1][level].either -= 1;

				const getHomeMinCutoffDiffs = () => {
					const cutoffDiff = (tid: number, homeAway: "home" | "away") =>
						maxHomeOrAway(tid, level) - scheduleCounts2[tid][level][homeAway];
					const cutoffDiffs = [tid0, tid1].map(tid => ({
						home: cutoffDiff(tid, "home"),
						away: cutoffDiff(tid, "away"),
					}));
					// console.log('cutoffDiffs', cutoffDiffs, [tid0, tid1], scheduleCounts2[tid0][level].home, scheduleCounts2[tid0][level].away, scheduleCounts2[tid1][level].home, scheduleCounts2[tid1][level].away)
					/*[0, 1].map(i => {
						if (cutoffDiffs[i].home === 0 && cutoffDiffs[i].away === 0) {
							const tid = i === 0 ? tid0 : tid1;
							console.log([tid0, tid1], "No games left for team", tid, scheduleCounts2[tid])
						}
					});*/

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

								// Skip if it's the same two teams, cause reversing that won't help
								if (
									(matchup[0] === tid0 && matchup[1] === tid1) ||
									(matchup[1] === tid0 && matchup[0] === tid1)
								) {
									continue;
								}

								// Will both teams still be valid if we swap?
								if (
									maxHomeOrAway(matchup[0], level) >
										scheduleCounts2[matchup[0]][level].away &&
									maxHomeOrAway(matchup[1], level) >
										scheduleCounts2[matchup[1]][level].home
								) {
									// console.log('before', scheduleCounts2[matchup[0]][level].home, scheduleCounts2[matchup[0]][level].away, scheduleCounts2[matchup[1]][level].home, scheduleCounts2[matchup[1]][level].away)
									scheduleCounts2[matchup[0]][level].home -= 1;
									scheduleCounts2[matchup[0]][level].away += 1;
									scheduleCounts2[matchup[1]][level].home += 1;
									scheduleCounts2[matchup[1]][level].away -= 1;
									// console.log('after', scheduleCounts2[matchup[0]][level].home, scheduleCounts2[matchup[0]][level].away, scheduleCounts2[matchup[1]][level].home, scheduleCounts2[matchup[1]][level].away)

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
					// console.log('iteration2', iteration2);
					// This should only happen if one of the teams is already at the limit for both home and away games, which should not happen
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
	// console.log('iteration counts', iteration1, iteration2all);
	if (iteration2all === 0) {
		return "Failed to find valid matchups between teams.";
	}

	return "Failed to find valid home/away assignments.";
};

const newScheduleGood = (
	teams: MyTeam[],
	settings: NewScheduleGoodSettings,
	ignoreNumGamesDivConf: boolean = false,
): [number, number][] | string => {
	const teamsGroupedByDid = groupTeamsByDid(
		teams,
		settings,
		ignoreNumGamesDivConf,
	);

	const numGamesTargetsByDid = getNumGamesTargetsByDid(
		teams.length,
		teamsGroupedByDid,
		settings,
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
		settings,
		teams,
		teamsGroupedByDid,
		scheduleCounts,
		tidsEither,
	});

	if (typeof tidsDone2 === "string") {
		return tidsDone2;
	}

	const tids = [...tidsDone, ...tidsDone2];
	// console.log("tids", tids);
	return tids;
};

const newSchedule = (
	teams: MyTeam[],
	settingsInput?: NewScheduleGoodSettings,
) => {
	const settings = settingsInput ?? {
		divs: g.get("divs"),
		numGames: g.get("numGames"),
		numGamesConf: g.get("numGamesConf"),
		numGamesDiv: g.get("numGamesDiv"),
	};

	let tids = newScheduleGood(teams, settings);
	let warning: string | undefined;

	if (typeof tids === "string") {
		// console.log("FAILED FIRST TRY", tids)
		warning = tids;
		tids = newScheduleGood(teams, settings, true);
		// tids = [];
	}

	if (typeof tids === "string") {
		throw new Error("newScheduleGood double fail");
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
