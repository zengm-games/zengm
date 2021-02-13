import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { helpers } from ".";
import { isSport } from "../../common";
import type { HeadToHead } from "../../common/types";
import { idb } from "../db";
import g from "./g";
import random from "./random";

type Tiebreaker = "divWinner" | "headToHead" | "random";

type BaseTeam = {
	seasonAttrs: {
		winp: number;
		won: number;
		did: number;
	};
	tid: number;
	tiebreakers?: Tiebreaker[];
};

/*const TIEBREAKERS: Tiebreaker[] = isSport("basketball") ? [
	"headToHead",
	"divWinner",
	"divRecordIfSame",
	"confRecordIfSame",
	"marginOfVictory",
	"random",
] : [
	"headToHead",
	"divRecordIfSame",
	"commonGames",
	"confRecordIfSame",
	"strengthOfVictory",
	"strengthOfSchedule",
	"random",
];*/
const TIEBREAKERS: Tiebreaker[] = ["divWinner", "headToHead", "random"];

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
};

const breakTies = <T extends BaseTeam>(
	teams: T[],
	options: BreakTiesOptions,
): T[] => {
	if (teams.length <= 1) {
		return teams;
	}

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
	const headToHead = options.headToHead;
	if (headToHead) {
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
						won += matchup.won + matchup.otw;
						lost += matchup.lost;
						otl += matchup.otl;
					} else {
						won += matchup.lost + matchup.otl;
						lost += matchup.won;
						otl += matchup.otw;
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

	const TIEBREAKER_FUNCTIONS: Record<
		Tiebreaker,
		[(t: T) => number, "asc" | "desc"][]
	> = {
		divWinner: [
			[(t: T) => (options.divisionWinners.has(t.tid) ? 1 : 0), "desc"],
		],

		headToHead: [
			[(t: T) => headToHeadInfo?.[t.tid]?.winp ?? 0, "desc"],
			[(t: T) => headToHeadInfo?.[t.tid]?.won ?? 0, "desc"],
		],

		// We want ties to be randomly decided, but consistently so orderTeams can be called multiple times with a deterministic result
		random: [
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
	for (const tiebreaker of TIEBREAKERS) {
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
								tiebreakers: t.tiebreakers
									? [...t.tiebreakers, tiebreaker]
									: [tiebreaker],
						  },
					...breakTies(
						teams.filter(t2 => t2 !== t),
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

	throw new Error("Should never happen");
};

// This should be called only with whatever group of teams you are sorting. So if you are displying division standings, call this once for each division, passing in all the teams. Because tiebreakers could mean two tied teams swap order depending on the teams in the group.
const orderTeams = async <T extends BaseTeam>(
	teams: T[],
	{
		addTiebreakersField,
		season = g.get("season"),
	}: {
		addTiebreakersField?: boolean;
		season?: number;
	} = {},
): Promise<
	(T & {
		tiebreakers?: Tiebreaker[];
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
			const teamsDivSorted = await orderTeams(teamsDiv, {
				season,
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

	const breakTiesOptions: BreakTiesOptions = {
		addTiebreakersField,
		divisionWinners: new Set(
			Array.from(divisionLeaders.values()).map(t => t.tid),
		),
		season,
	};
	if (tiedGroups.length > 0 && TIEBREAKERS.includes("headToHead")) {
		breakTiesOptions.headToHead = await idb.getCopy.headToHeads({
			season,
		});
	}

	// Break ties
	for (const tiedGroup of tiedGroups) {
		const teamsTied = breakTies(
			teamsSorted.slice(tiedGroup.index, tiedGroup.index + tiedGroup.length),
			{
				...breakTiesOptions,
			},
		);

		teamsSorted.splice(tiedGroup.index, tiedGroup.length, ...teamsTied);
	}

	return teamsSorted;
};

export default orderTeams;
