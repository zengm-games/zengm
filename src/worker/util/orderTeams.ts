import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { helpers } from ".";
import { isSport, TIEBREAKERS } from "../../common";
import type { HeadToHead } from "../../common/types";
import { idb } from "../db";
import g from "./g";
import random from "./random";

export const getTiebreakers = (season: number) => {
	const tiebreakers = [...g.get("tiebreakers", season)];
	if (!tiebreakers.includes("coinFlip")) {
		tiebreakers.push("coinFlip");
	}

	return tiebreakers;
};

type Tiebreaker = keyof typeof TIEBREAKERS;

type BaseTeam = {
	seasonAttrs: {
		winp: number;
		won: number;
		lost: number;
		otl: number;
		tied: number;
		did: number;

		// Needed for some tiebreakers
		cid: number;
		wonDiv: number;
		lostDiv: number;
		otlDiv: number;
		tiedDiv: number;
		wonConf: number;
		lostConf: number;
		otlConf: number;
		tiedConf: number;
	};

	// Needed for some tiebreakers
	stats: {
		gp: number;
		pts: number;
		oppPts: number;
	};

	tid: number;
	tiebreaker?: Tiebreaker;
};

type BaseAllTeams = {
	seasonAttrs: {
		won: number;
		lost: number;
		otl: number;
		tied: number;
	};
	tid: number;
};

// In football and hockey, top conference playoff seeds go to the division winners
const DIVISION_LEADERS_ALWAYS_GO_FIRST = !isSport("basketball");

const arraysEqual = (x: number[], y: number[]) => {
	for (let i = 0; i < x.length; i++) {
		if (x[i] !== y[i]) {
			return false;
		}
	}
	return true;
};

type BreakTiesOptions = {
	addTiebreakersField?: boolean;
	divisionWinners: Set<number>;
	headToHead?: HeadToHead;
	season: number;
	tiebreakers: Tiebreaker[];
};

export const breakTies = <T extends BaseTeam>(
	teams: T[],
	allTeams: BaseAllTeams[],
	options: BreakTiesOptions,
): T[] => {
	if (teams.length <= 1) {
		return teams;
	}

	const headToHead = options.headToHead;

	let headToHeadInfo:
		| Record<
				number,
				{
					won: number;
					lost: number;
					tied: number;
					otl: number;
					winp: number;
				}
		  >
		| undefined;
	if (options.tiebreakers.includes("headToHeadRecord") && headToHead) {
		headToHeadInfo = {};

		for (const t of teams) {
			let won = 0;
			let lost = 0;
			let tied = 0;
			let otl = 0;

			for (const t2 of teams) {
				if (t === t2) {
					continue;
				}

				let matchup = headToHead.regularSeason[t.tid]?.[t2.tid];
				let reverse = false;
				if (!matchup) {
					matchup = headToHead.regularSeason[t2.tid]?.[t.tid];
					reverse = true;
				}

				if (matchup) {
					if (reverse) {
						won += matchup.lost + matchup.otl;
						lost += matchup.won;
						otl += matchup.otw;
					} else {
						won += matchup.won + matchup.otw;
						lost += matchup.lost;
						otl += matchup.otl;
					}
					tied += matchup.tied;
				}
			}

			headToHeadInfo[t.tid] = {
				won,
				lost,
				tied,
				otl,
				winp: 0,
			};
			headToHeadInfo[t.tid].winp = helpers.calcWinp(headToHeadInfo[t.tid]);
		}
	}

	const strengthOfScheduleOrVictory = (
		type: "strengthOfSchedule" | "strengthOfVictory",
	) => {
		if (options.tiebreakers.includes(type) && headToHead) {
			const info: Record<
				number,
				{
					won: number;
					lost: number;
					tied: number;
					otl: number;
					winp: number;
				}
			> = {};

			for (const t of teams) {
				let won = 0;
				let lost = 0;
				let tied = 0;
				let otl = 0;

				for (const t2 of allTeams) {
					if (t.tid === t2.tid) {
						continue;
					}

					let matchup = headToHead.regularSeason[t.tid]?.[t2.tid];
					let reverse = false;
					if (!matchup) {
						matchup = headToHead.regularSeason[t2.tid]?.[t.tid];
						reverse = true;
					}

					if (matchup) {
						let factor;
						if (type === "strengthOfSchedule") {
							factor = matchup.won + matchup.lost + matchup.otl + matchup.tied;
						} else {
							factor = reverse ? matchup.lost + matchup.otl : matchup.won;
						}

						if (factor > 0) {
							won += factor * t2.seasonAttrs.won;
							lost += factor * t2.seasonAttrs.lost;
							tied += factor * (t2.seasonAttrs.tied ?? 0);
							otl += factor * (t2.seasonAttrs.otl ?? 0);
						}
					}
				}

				info[t.tid] = {
					won,
					lost,
					tied,
					otl,
					winp: 0,
				};
				info[t.tid].winp = helpers.calcWinp(info[t.tid]);
			}

			return info;
		}
	};

	const strengthOfScheduleInfo = strengthOfScheduleOrVictory(
		"strengthOfSchedule",
	);
	const strengthOfVictoryInfo = strengthOfScheduleOrVictory(
		"strengthOfVictory",
	);

	let commonOpponentsInfo:
		| Record<
				number,
				{
					won: number;
					lost: number;
					tied: number;
					otl: number;
					winp: number;
				}
		  >
		| undefined;
	if (options.tiebreakers.includes("commonOpponentsRecord") && headToHead) {
		commonOpponentsInfo = {};

		const addOpponentTids = (tid: number, set: Set<number>) => {
			const tids: number[] = [];

			for (const t2 of teams) {
				const firstLevel = headToHead.regularSeason[t2.tid];
				if (firstLevel) {
					const tids = Object.keys(firstLevel).map(string => parseInt(string));
					for (const tid2 of tids) {
						if (tid2 === tid) {
							set.add(t2.tid);
						} else if (t2.tid === tid) {
							set.add(tid2);
						}
					}
				}
			}

			return tids;
		};

		// First, identify the common opponents shared by all of the teams
		const commonOpponents = new Set<number>();
		let firstTeam = true;
		for (const t of teams) {
			if (firstTeam) {
				firstTeam = false;

				// Initialize with first team
				addOpponentTids(t.tid, commonOpponents);
			} else {
				// Check all other teams against the first team
				const opponents = new Set<number>();
				addOpponentTids(t.tid, opponents);
				for (const opponent of commonOpponents) {
					if (!opponents.has(opponent)) {
						commonOpponents.delete(opponent);
					}
				}
			}

			// Remove self from list
			commonOpponents.delete(t.tid);
		}

		if (commonOpponents.size > 0) {
			for (const t of teams) {
				let won = 0;
				let lost = 0;
				let tied = 0;
				let otl = 0;
				for (const tid of commonOpponents) {
					let matchup = headToHead.regularSeason[t.tid]?.[tid];
					let reverse = false;
					if (!matchup) {
						matchup = headToHead.regularSeason[tid]?.[t.tid];
						reverse = true;
					}

					if (matchup) {
						if (reverse) {
							won += matchup.lost + matchup.otl;
							lost += matchup.won;
							otl += matchup.otw;
						} else {
							won += matchup.won + matchup.otw;
							lost += matchup.lost;
							otl += matchup.otl;
						}
						tied += matchup.tied;
					} else {
						throw new Error("Should never happen");
					}
				}

				commonOpponentsInfo[t.tid] = {
					won,
					lost,
					tied,
					otl,
					winp: 0,
				};
				commonOpponentsInfo[t.tid].winp = helpers.calcWinp(
					commonOpponentsInfo[t.tid],
				);
			}
		}
	}

	let allSameDiv = false;
	if (options.tiebreakers.includes("divRecordIfSame")) {
		allSameDiv = true;
		const did = teams[0].seasonAttrs.did;
		for (const t of teams) {
			if (t.seasonAttrs.did !== did) {
				allSameDiv = false;
				break;
			}
		}
	}

	let allSameConf = false;
	if (options.tiebreakers.includes("confRecordIfSame")) {
		allSameConf = true;
		if (!allSameDiv) {
			const cid = teams[0].seasonAttrs.cid;
			for (const t of teams) {
				if (t.seasonAttrs.cid !== cid) {
					allSameConf = false;
					break;
				}
			}
		}
	}

	const TIEBREAKER_FUNCTIONS: Record<
		Tiebreaker,
		[(t: T) => number, "asc" | "desc"][]
	> = {
		commonOpponentsRecord: [
			[(t: T) => commonOpponentsInfo?.[t.tid]?.winp ?? 0, "desc"],
			[(t: T) => commonOpponentsInfo?.[t.tid]?.won ?? 0, "desc"],
		],

		confRecordIfSame: [
			[
				(t: T) => {
					if (!allSameConf) {
						return -Infinity;
					}

					return helpers.calcWinp({
						won: t.seasonAttrs.wonConf,
						lost: t.seasonAttrs.lostConf,
						otl: t.seasonAttrs.otlConf,
						tied: t.seasonAttrs.tiedConf,
					});
				},
				"desc",
			],
			[
				(t: T) => {
					if (!allSameConf) {
						return -Infinity;
					}

					return t.seasonAttrs.wonConf;
				},
				"desc",
			],
		],

		divRecordIfSame: [
			[
				(t: T) => {
					if (!allSameDiv) {
						return -Infinity;
					}

					return helpers.calcWinp({
						won: t.seasonAttrs.wonDiv,
						lost: t.seasonAttrs.lostDiv,
						otl: t.seasonAttrs.otlDiv,
						tied: t.seasonAttrs.tiedDiv,
					});
				},
				"desc",
			],
			[
				(t: T) => {
					if (!allSameDiv) {
						return -Infinity;
					}

					return t.seasonAttrs.wonDiv;
				},
				"desc",
			],
		],

		divWinner: [
			[(t: T) => (options.divisionWinners.has(t.tid) ? 1 : 0), "desc"],
		],

		headToHeadRecord: [
			[(t: T) => headToHeadInfo?.[t.tid]?.winp ?? 0, "desc"],
			[(t: T) => headToHeadInfo?.[t.tid]?.won ?? 0, "desc"],
		],

		marginOfVictory: [
			[
				(t: T) =>
					t.stats.gp > 0
						? (t.stats.pts - t.stats.oppPts) / t.stats.gp
						: -Infinity,
				"desc",
			],
		],

		strengthOfSchedule: [
			[(t: T) => strengthOfScheduleInfo?.[t.tid]?.winp ?? 0, "desc"],
			[(t: T) => strengthOfScheduleInfo?.[t.tid]?.won ?? 0, "desc"],
		],

		strengthOfVictory: [
			[(t: T) => strengthOfVictoryInfo?.[t.tid]?.winp ?? 0, "desc"],
			[(t: T) => strengthOfVictoryInfo?.[t.tid]?.won ?? 0, "desc"],
		],

		// We want ties to be randomly decided, but consistently so orderTeams can be called multiple times with a deterministic result
		coinFlip: [
			[
				(t: T) =>
					random.uniformSeed(
						t.tid + options.season + (t.seasonAttrs.won + t.seasonAttrs.winp),
					),
				"asc",
			],
		],
	};

	// Values are index on "teams" array for teams that already lost a tiebreaker round
	const alreadyLost = new Set();

	// Find top team among teams and pass through. The rest, evaluate in an individaul tiebreaker
	for (const tiebreaker of options.tiebreakers) {
		for (const [iteree, order] of TIEBREAKER_FUNCTIONS[tiebreaker]) {
			const values = teams.map((t, i) => {
				if (alreadyLost.has(i)) {
					return -Infinity;
				}

				return (order === "asc" ? -1 : 1) * iteree(t);
			});

			let maxValue;
			let maxIndexes: number[] = [];
			for (let i = 0; i < values.length; i++) {
				if (maxValue === undefined || values[i] > maxValue) {
					maxValue = values[i];
					maxIndexes = [i];
				} else if (values[i] === maxValue) {
					maxIndexes.push(i);
				}
			}

			if (maxIndexes.length === 1) {
				// If there's only one team at max, that's our team! On to the next iteration
				const t = teams[maxIndexes[0]];

				return [
					!options.addTiebreakersField
						? t
						: {
								...t,

								// Overwrite any existing tiebreaker. The last one is the relevant one.
								tiebreaker,
						  },
					...breakTies(
						teams.filter(t2 => t2 !== t),
						allTeams,
						options,
					),
				];
			} else {
				// If there's a tie at this level, mark the teams which are not part of the tie, and continue to the next tiebreaker
				for (let i = 0; i < values.length; i++) {
					if (values[i] !== maxValue) {
						alreadyLost.add(i);
					}
				}
			}
		}
	}

	throw new Error("random tiebreaker should have been used");
};

// This should be called only with whatever group of teams you are sorting. So if you are displying division standings, call this once for each division, passing in all the teams. Because tiebreakers could mean two tied teams swap order depending on the teams in the group.
const orderTeams = async <T extends BaseTeam>(
	teams: T[],
	allTeams: BaseAllTeams[],
	{
		addTiebreakersField,
		skipTiebreakers,
		season = g.get("season"),
	}: {
		addTiebreakersField?: boolean;
		skipTiebreakers?: boolean;
		season?: number;
	} = {},
): Promise<
	(T & {
		tiebreaker?: Tiebreaker;
	})[]
> => {
	if (teams.length <= 1) {
		return teams;
	}

	// Figure out who the division leaders are, if necessary by applying tiebreakers
	const divisionLeaders = new Map<number, T>();
	const groupedByDivision = groupBy(teams, (t: T) => t.seasonAttrs.did);
	const teamsDivs = Object.values(groupedByDivision);
	if (teamsDivs.length > 1) {
		// If there are only teams from one division here, then this is useless
		for (const teamsDiv of teamsDivs) {
			const teamsDivSorted = await orderTeams(teamsDiv, allTeams, {
				season,
				skipTiebreakers,
			});

			const t = teamsDivSorted[0];
			if (t) {
				divisionLeaders.set(t.seasonAttrs.did, t);
			}
		}
	}

	// First pass - order by winp and won
	const iterees = [(t: T) => t.seasonAttrs.winp, (t: T) => t.seasonAttrs.won];
	const orders: ("asc" | "desc")[] = ["desc", "desc"];
	if (DIVISION_LEADERS_ALWAYS_GO_FIRST && divisionLeaders.size > 0) {
		// ...and apply division leader boost, if necessary
		iterees.unshift(t =>
			divisionLeaders.get(t.seasonAttrs.did) === t ? 1 : 0,
		);
		orders.unshift("desc");
	}

	const teamsSorted = orderBy(teams, iterees, orders);

	if (skipTiebreakers) {
		return teamsSorted;
	}

	// Identify any ties
	type TiedGroup = {
		index: number;
		length: number;
	};
	let prevValues: number[] | undefined;
	let currentTiedGroup: TiedGroup | undefined;
	const tiedGroups: TiedGroup[] = [];

	for (let i = 0; i < teamsSorted.length; i++) {
		const t = teamsSorted[i];
		const currentValues = iterees.map(func => func(t));

		if (prevValues && arraysEqual(prevValues, currentValues)) {
			if (!currentTiedGroup) {
				// Tie between this team and the previous one
				currentTiedGroup = {
					index: i - 1,
					length: 2,
				};
			} else {
				// Tie between this team and the previous N
				currentTiedGroup.length += 1;
			}
		} else if (currentTiedGroup) {
			// This team isn't tied, but the N previous teams were
			tiedGroups.push(currentTiedGroup);
			currentTiedGroup = undefined;
		}

		prevValues = currentValues;
	}
	if (currentTiedGroup) {
		tiedGroups.push(currentTiedGroup);
	}

	const tiebreakers = getTiebreakers(season);

	const breakTiesOptions: BreakTiesOptions = {
		addTiebreakersField,
		divisionWinners: new Set(
			Array.from(divisionLeaders.values()).map(t => t.tid),
		),
		season,
		tiebreakers,
	};
	if (
		tiedGroups.length > 0 &&
		(tiebreakers.includes("commonOpponentsRecord") ||
			tiebreakers.includes("headToHeadRecord"))
	) {
		breakTiesOptions.headToHead = await idb.getCopy.headToHeads({
			season,
		});
	}

	// Break ties
	for (const tiedGroup of tiedGroups) {
		const teamsTied = breakTies(
			teamsSorted.slice(tiedGroup.index, tiedGroup.index + tiedGroup.length),
			allTeams,
			{
				...breakTiesOptions,
			},
		);

		teamsSorted.splice(tiedGroup.index, tiedGroup.length, ...teamsTied);
	}

	return teamsSorted;
};

export default orderTeams;
