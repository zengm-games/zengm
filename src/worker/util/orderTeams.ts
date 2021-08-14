import { groupBy } from "../../common/groupBy";
import orderBy from "lodash-es/orderBy";
import { helpers } from ".";
import type { TIEBREAKERS } from "../../common";
import type { HeadToHead } from "../../common/types";
import { team } from "../core";
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

const wonMinusLost = (obj?: { won?: number; lost?: number; otl?: number }) => {
	if (!obj) {
		return 0;
	}

	return (obj.won ?? 0) - (obj.lost ?? 0) - (obj.otl ?? 0);
};

type Tiebreaker = keyof typeof TIEBREAKERS;

type BaseTeam = {
	seasonAttrs: {
		winp: number;
		pts: number;
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
	usePts: boolean;
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
					score: number;
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
				score: 0,
			};
			headToHeadInfo[t.tid].score = options.usePts
				? team.evaluatePointsFormula(headToHeadInfo[t.tid])
				: helpers.calcWinp(headToHeadInfo[t.tid]);
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
					score: number;
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
					score: 0,
				};
				info[t.tid].score = options.usePts
					? team.evaluatePointsFormula(info[t.tid])
					: helpers.calcWinp(info[t.tid]);
			}

			return info;
		}
	};

	const strengthOfScheduleInfo =
		strengthOfScheduleOrVictory("strengthOfSchedule");
	const strengthOfVictoryInfo =
		strengthOfScheduleOrVictory("strengthOfVictory");

	let commonOpponentsInfo:
		| Record<
				number,
				{
					won: number;
					lost: number;
					tied: number;
					otl: number;
					score: number;
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
					score: 0,
				};
				commonOpponentsInfo[t.tid].score = options.usePts
					? team.evaluatePointsFormula(commonOpponentsInfo[t.tid])
					: helpers.calcWinp(commonOpponentsInfo[t.tid]);
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
			[(t: T) => commonOpponentsInfo?.[t.tid]?.score ?? 0, "desc"],
			[(t: T) => wonMinusLost(commonOpponentsInfo?.[t.tid]), "desc"],
		],

		confRecordIfSame: [
			[
				(t: T) => {
					if (!allSameConf) {
						return -Infinity;
					}

					const data = {
						won: t.seasonAttrs.wonConf,
						lost: t.seasonAttrs.lostConf,
						otl: t.seasonAttrs.otlConf,
						tied: t.seasonAttrs.tiedConf,
					};
					return options.usePts
						? team.evaluatePointsFormula(data)
						: helpers.calcWinp(data);
				},
				"desc",
			],
			[
				(t: T) => {
					if (!allSameConf) {
						return -Infinity;
					}

					return wonMinusLost({
						won: t.seasonAttrs.wonConf,
						lost: t.seasonAttrs.lostConf,
						otl: t.seasonAttrs.otlConf,
					});
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

					const data = {
						won: t.seasonAttrs.wonDiv,
						lost: t.seasonAttrs.lostDiv,
						otl: t.seasonAttrs.otlDiv,
						tied: t.seasonAttrs.tiedDiv,
					};
					return options.usePts
						? team.evaluatePointsFormula(data)
						: helpers.calcWinp(data);
				},
				"desc",
			],
			[
				(t: T) => {
					if (!allSameDiv) {
						return -Infinity;
					}

					return wonMinusLost({
						won: t.seasonAttrs.wonDiv,
						lost: t.seasonAttrs.lostDiv,
						otl: t.seasonAttrs.otlDiv,
					});
				},
				"desc",
			],
		],

		divWinner: [
			[(t: T) => (options.divisionWinners.has(t.tid) ? 1 : 0), "desc"],
		],

		headToHeadRecord: [
			[(t: T) => headToHeadInfo?.[t.tid]?.score ?? 0, "desc"],
			[(t: T) => wonMinusLost(headToHeadInfo?.[t.tid]), "desc"],
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
			[(t: T) => strengthOfScheduleInfo?.[t.tid]?.score ?? 0, "desc"],
			[(t: T) => wonMinusLost(strengthOfScheduleInfo?.[t.tid]), "desc"],
		],

		strengthOfVictory: [
			[(t: T) => strengthOfVictoryInfo?.[t.tid]?.score ?? 0, "desc"],
			[(t: T) => wonMinusLost(strengthOfVictoryInfo?.[t.tid]), "desc"],
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

	const formatOutput = (t: T, tiebreaker: Tiebreaker) => {
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
	};

	// Find top team among teams and pass through. The rest, evaluate in an individaul tiebreaker
	let maxIndexes: number[];
	for (const tiebreaker of options.tiebreakers) {
		for (const [iteree, order] of TIEBREAKER_FUNCTIONS[tiebreaker]) {
			const values = teams.map((t, i) => {
				if (alreadyLost.has(i)) {
					return -Infinity;
				}

				return (order === "asc" ? -1 : 1) * iteree(t);
			});

			let maxValue;
			maxIndexes = [];
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
				return formatOutput(t, tiebreaker);
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

	// We could reach here if the seed for the deterministic RNG in coinFlip is the same for two teams, which does happen unfortunately. In that case, just return the teams and pretend it was a coin flip result. Would be better to make the seed more unique, but that would break backwards compatibility.
	return formatOutput(teams[0], "coinFlip");
};

export const getDivisionRanks = async <T extends BaseTeam>(
	teams: T[],
	allTeams: T[],
	{
		skipDivisionLeaders,
		skipTiebreakers,
		season = g.get("season"),
	}: {
		skipDivisionLeaders?: boolean;
		skipTiebreakers?: boolean;
		season?: number;
	} = {},
) => {
	// Figure out who the division leaders are, if necessary by applying tiebreakers
	const divisionRanks = new Map<number, number>();

	// This is useful for a finals matchup, where we want home court determined based on team records without regard for division leaders, like the NHL
	if (skipDivisionLeaders) {
		return divisionRanks;
	}

	// Only look at divisions repeseted in teams
	const dids = new Set();
	for (const t of teams) {
		dids.add(t.seasonAttrs.did);
	}

	// If there are only teams from one division here, then this is useless, division leaders don't matter in tiebreaker
	if (dids.size <= 1) {
		return divisionRanks;
	}

	const groupedByDivision = groupBy(allTeams, (t: T) => t.seasonAttrs.did);
	for (const [didString, teamsDiv] of Object.entries(groupedByDivision)) {
		const did = parseInt(didString);
		if (dids.has(did)) {
			const teamsDivSorted = await orderTeams(teamsDiv, allTeams, {
				season,
				skipTiebreakers,
			});

			for (let i = 0; i < teamsDivSorted.length; i++) {
				const t = teamsDivSorted[i];
				const rank = i + 1;
				divisionRanks.set(t.tid, rank);
			}
		}
	}

	return divisionRanks;
};

// This should be called only with whatever group of teams you are sorting. So if you are displying division standings, call this once for each division, passing in all the teams. Because tiebreakers could mean two tied teams swap order depending on the teams in the group.
const orderTeams = async <T extends BaseTeam>(
	teams: T[],
	allTeams: T[],
	{
		addTiebreakersField,
		skipDivisionLeaders,
		skipTiebreakers,
		season = g.get("season"),
		tiebreakersOverride,
	}: {
		addTiebreakersField?: boolean;
		skipDivisionLeaders?: boolean;
		skipTiebreakers?: boolean;
		season?: number;
		tiebreakersOverride?: Tiebreaker[];
	} = {},
): Promise<
	(T & {
		tiebreaker?: Tiebreaker;
	})[]
> => {
	if (teams.length <= 1) {
		return teams;
	}

	const usePts = g.get("pointsFormula", season) !== "";

	const divisionRanks = await getDivisionRanks(teams, allTeams, {
		skipDivisionLeaders,
		skipTiebreakers,
		season,
	});

	// First pass - order by winp and won
	const iterees = [
		(t: T) => (usePts ? t.seasonAttrs.pts : t.seasonAttrs.winp),
		(t: T) => wonMinusLost(t.seasonAttrs),
	];
	const orders: ("asc" | "desc")[] = ["desc", "desc"];
	const numTeamsDiv = g.get("playoffsNumTeamsDiv", season);
	if (numTeamsDiv > 0 && divisionRanks.size > 0) {
		// ...and apply division leader boost, if necessary
		iterees.unshift(t => {
			const rank = divisionRanks.get(t.tid);
			if (rank === undefined || rank > numTeamsDiv) {
				return Infinity;
			}

			return rank;
		});
		orders.unshift("asc");
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

	const tiebreakers = tiebreakersOverride ?? getTiebreakers(season);

	const divisionWinners = new Set<number>();
	for (const [tid, rank] of divisionRanks) {
		if (rank === 1) {
			divisionWinners.add(tid);
		}
	}

	const breakTiesOptions: BreakTiesOptions = {
		addTiebreakersField,
		divisionWinners,
		season,
		tiebreakers,
		usePts,
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
