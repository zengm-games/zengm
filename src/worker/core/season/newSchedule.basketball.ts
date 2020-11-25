import flatten from "lodash/flatten";
import { g, random } from "../../../worker/util";
import newScheduleCrappy from "./newScheduleCrappy";

/**
 * Creates a new regular season schedule for 30 teams.
 *
 * This makes an NBA-like schedule in terms of conference matchups, division matchups, and home/away games.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newScheduleDefault = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	const tids: [number, number][] = []; // tid_home, tid_away

	// Collect info needed for scheduling
	const homeGames: number[] = [];
	const awayGames: number[] = [];

	for (let i = 0; i < teams.length; i++) {
		homeGames[i] = 0;
		awayGames[i] = 0;
	}

	for (let i = 0; i < teams.length; i++) {
		for (let j = 0; j < teams.length; j++) {
			if (teams[i].tid !== teams[j].tid) {
				const game: [number, number] = [teams[i].tid, teams[j].tid]; // Constraint: 1 home game vs. each team in other conference

				if (teams[i].seasonAttrs.cid !== teams[j].seasonAttrs.cid) {
					tids.push(game);
					homeGames[i] += 1;
					awayGames[j] += 1;
				}

				// Constraint: 2 home games vs. each team in same division
				if (teams[i].seasonAttrs.did === teams[j].seasonAttrs.did) {
					tids.push(game);
					tids.push(game);
					homeGames[i] += 2;
					awayGames[j] += 2;
				}

				// Constraint: 1-2 home games vs. each team in same conference and different division
				// Only do 1 now
				if (
					teams[i].seasonAttrs.cid === teams[j].seasonAttrs.cid &&
					teams[i].seasonAttrs.did !== teams[j].seasonAttrs.did
				) {
					tids.push(game);
					homeGames[i] += 1;
					awayGames[j] += 1;
				}
			}
		}
	}

	// Constraint: 1-2 home games vs. each team in same conference and different division
	// Constraint: We need 8 more of these games per home team!
	const tidsByConf: {
		[key: number]: number[];
	} = {};
	const dids: {
		[key: number]: number[];
	} = {};

	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		const cid = t.seasonAttrs.cid;
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!tidsByConf[cid]) {
			tidsByConf[cid] = [];
		}
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!dids[cid]) {
			dids[cid] = [];
		}
		tidsByConf[cid].push(i);
		dids[cid].push(t.seasonAttrs.did);
	}

	for (const conf of g.get("confs", "current")) {
		const cid = conf.cid;

		const matchups = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]];
		let games = 0;

		while (games < 8) {
			let newMatchup: number[] = [];
			let n = 0;

			while (n <= 14) {
				// 14 = num teams in conference - 1
				let iters = 0;

				while (true) {
					const tryNum = random.randInt(0, 14); // Pick tryNum such that it is in a different division than n and has not been picked before

					if (
						dids[cid][tryNum] !== dids[cid][n] &&
						!newMatchup.includes(tryNum)
					) {
						let good = true;

						// Check for duplicate games
						for (let j = 0; j < matchups.length; j++) {
							const matchup = matchups[j];

							if (matchup[n] === tryNum) {
								good = false;
								break;
							}
						}

						if (good) {
							newMatchup.push(tryNum);
							break;
						}
					}

					iters += 1;

					// Sometimes this gets stuck (for example, first 14 teams in fine but 15th team must play itself)
					// So, catch these situations and reset the newMatchup
					if (iters > 50) {
						newMatchup = [];
						n = -1;
						break;
					}
				}

				n += 1;
			}

			matchups.push(newMatchup);
			games += 1;
		}

		matchups.shift(); // Remove the first row in matchups

		for (let j = 0; j < matchups.length; j++) {
			const matchup = matchups[j];

			for (let k = 0; k < matchup.length; k++) {
				const t = matchup[k];
				const ii = tidsByConf[cid][t];
				const jj = tidsByConf[cid][matchup[t]];
				const game: [number, number] = [teams[ii].tid, teams[jj].tid];
				tids.push(game);
				homeGames[ii] += 1;
				awayGames[jj] += 1;
			}
		}
	}

	return tids;
};

/**
 * Wrapper function to generate a new schedule with the appropriate algorithm based on the number of teams in the league.
 *
 * For leagues with NBA-like structure, use newScheduleDefault. Otherwise, newScheduleCrappy.
 *
 * @memberOf core.season
 * @return {Array.<Array.<number>>} All the season's games. Each element in the array is an array of the home team ID and the away team ID, respectively.
 */
const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	let tids: [number, number][];
	let threeDivsPerConf = true;

	for (const conf of g.get("confs", "current")) {
		if (
			g.get("divs", "current").filter(div => div.cid === conf.cid).length !== 3
		) {
			threeDivsPerConf = false;
			break;
		}
	}

	let twoConfsEvenTeams = g.get("confs", "current").length === 2;

	for (const conf of g.get("confs", "current")) {
		if (
			teams.filter(t => t.seasonAttrs.cid === conf.cid).length !==
			teams.length / 2
		) {
			twoConfsEvenTeams = false;
			break;
		}
	}

	if (
		teams.length === 30 &&
		g.get("numGames") === 82 &&
		g.get("confs", "current").length === 2 &&
		threeDivsPerConf &&
		twoConfsEvenTeams
	) {
		tids = newScheduleDefault(teams);
	} else {
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

	// Add an All-Star Game
	if (g.get("allStarGame")) {
		const ind = Math.round(0.7 * tids.length);
		tids.splice(ind, 0, [-1, -2]);
	}

	return tids;
};

export default newSchedule;
