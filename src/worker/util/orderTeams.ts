import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { g } from ".";
import { isSport } from "../../common";
import random from "./random";

type BaseTeam = {
	seasonAttrs: {
		winp: number;
		won: number;
		did: number;
	};
	tid: number;
};

type Tiebreaker = "random";

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
const TIEBREAKERS: Tiebreaker[] = ["random"];

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

const breakTies = <T extends BaseTeam>(
	teams: T[],
	{
		addTiebreakersField,
		season,
	}: {
		addTiebreakersField?: boolean;
		season: number;
	},
): T[] => {
	const TIEBREAKER_FUNCTIONS: Record<
		Tiebreaker,
		[(t: T) => number, "asc" | "desc"]
	> = {
		// We want ties to be randomly decided, but consistently so orderTeams can be called multiple times with a deterministic result
		random: [
			(t: T) =>
				random.uniformSeed(
					t.tid + season + (t.seasonAttrs.won + t.seasonAttrs.winp),
				),
			"asc",
		],
	};

	const iterees = TIEBREAKERS.map(key => TIEBREAKER_FUNCTIONS[key][0]);
	const orders = TIEBREAKERS.map(key => TIEBREAKER_FUNCTIONS[key][1]);

	const teamsSorted = orderBy(teams, iterees, orders);

	if (addTiebreakersField) {
		return teamsSorted.map(t => ({
			...t,
			tiebreakers: ["random"],
		}));
	}

	return teamsSorted;
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
			const teamsDivSorted = await orderTeams(teamsDiv, { season });
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

	// Break ties
	for (const tiedGroup of tiedGroups) {
		const teamsTied = breakTies(
			teamsSorted.slice(tiedGroup.index, tiedGroup.index + tiedGroup.length),
			{
				addTiebreakersField,
				season,
			},
		);

		teamsSorted.splice(tiedGroup.index, tiedGroup.length, ...teamsTied);
	}

	return teamsSorted;
};

export default orderTeams;
