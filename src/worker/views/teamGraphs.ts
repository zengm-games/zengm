import { isSport, TEAM_STATS_TABLES } from "../../common";
import { idb } from "../db";
import { g, random } from "../util";
import type {
	TeamSeasonAttr,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import type { TeamStatAttr } from "../../common/types.baseball";

export const statTypes = [
	"standings",
	"powerRankings",
	"finances",
	...Object.keys(TEAM_STATS_TABLES),
];

const getStatsTableByType = (statTypePlus: string) => {
	// Will be undefined for standings/powerRankings/finances
	return TEAM_STATS_TABLES[statTypePlus];
};

export const getStats = (statTypePlus: string) => {
	if (statTypePlus === "standings") {
		return [
			"won",
			"lost",
			"tied",
			"otl",
			"winp",
			"pts",
			"ptsPct",
			"wonHome",
			"lostHome",
			"tiedHome",
			"otlHome",
			"wonAway",
			"lostAway",
			"tiedAway",
			"otlAway",
			"wonDiv",
			"lostDiv",
			"tiedDiv",
			"otlDiv",
			"wonConf",
			"lostConf",
			"tiedConf",
			"otlConf",
		];
	} else if (statTypePlus === "powerRankings") {
		return ["avgAge"];
	} else if (statTypePlus === "finances") {
		return ["att", "revenue", "profit", "cash", "payroll", "salaryPaid", "pop"];
	} else {
		const statsTable = getStatsTableByType(statTypePlus);
		if (!statsTable) {
			throw new Error(`Invalid statType: "${statTypePlus}"`);
		}

		// Remove pos for fielding stats
		if (isSport("baseball")) {
			return statsTable.stats.filter(stat => stat !== "pos");
		}

		return [...statsTable.stats];
	}
};

const getTeamStats = async (
	statTypeInput: string | undefined,
	season: number,
	playoffs: "playoffs" | "regularSeason",
) => {
	// This is the value form the form/URL (or a random one), which confusingly is not the same as statType passed to playersPlus
	const statTypePlus =
		statTypeInput !== undefined && statTypes.includes(statTypeInput)
			? statTypeInput
			: random.choice(statTypes);

	const statsTable = getStatsTableByType(statTypePlus);

	const statKeys = statsTable?.stats ?? ["gp"];

	const seasonAttrs: TeamSeasonAttr[] = [
		"season",
		"abbrev",
		"region",
		"name",
		"imgURL",
		"imgURLSmall",
	];

	const stats = getStats(statTypePlus);

	if (
		statTypePlus === "standings" ||
		statTypePlus === "powerRankings" ||
		statTypePlus === "finances"
	) {
		seasonAttrs.push(...(stats as any));
	}

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid", "abbrev", "region", "name", "imgURL", "imgURLSmall"],
			seasonAttrs,
			stats: statKeys as TeamStatAttr[],
			season,
			playoffs: playoffs === "playoffs",
			regularSeason: playoffs === "regularSeason",
		},
		"noCopyCache",
	);

	return { teams, stats, statType: statTypePlus };
};

const updateTeams = async (
	axis: "X" | "Y",
	inputs: ViewInput<"teamGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	const season = `season${axis}` as const;
	const statType = `statType${axis}` as const;
	const playoffs = `playoffs${axis}` as const;
	if (
		updateEvents.includes("firstRun") ||
		(inputs[season] === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		// Purposely skip checking statX, statY - those are only used client side, they in the URL for usability
		inputs[season] !== state[season] ||
		inputs[statType] !== state[statType] ||
		inputs[playoffs] !== state[playoffs]
	) {
		const statForAxis = await getTeamStats(
			inputs[statType],
			inputs[season],
			inputs[playoffs],
		);

		const statKey = `stat${axis}` as const;
		const inputStat = inputs[statKey];

		const stat =
			inputStat !== undefined && statForAxis.stats.includes(inputStat)
				? inputStat
				: random.choice(statForAxis.stats);

		return {
			[season]: inputs[season],
			[statType]: statForAxis.statType,
			[playoffs]: inputs[playoffs],
			[`teams${axis}`]: statForAxis.teams,
			[`stats${axis}`]: statForAxis.stats,
			[statKey]: stat,
		};
	}
};

const updateClientSide = (
	inputs: ViewInput<"teamGraphs">,
	state: any,
	x: Awaited<ReturnType<typeof updateTeams>>,
	y: Awaited<ReturnType<typeof updateTeams>>,
) => {
	if (inputs.statX !== state.statX || inputs.statY !== state.statY) {
		// Check x and y for statX and statY in case they were already specified there, such as randomly selecting from statForAxis
		return {
			statX: x?.statX ?? inputs.statX,
			statY: y?.statY ?? inputs.statY,
		} as {
			// We can assert this because we know the above block runs on first render, so this is just updating an existing state, so we don't want TypeScript to get confused
			seasonX: number;
			seasonY: number;
			statTypeX: string;
			statTypeY: string;
			playoffsX: "playoffs" | "regularSeason";
			playoffsY: "playoffs" | "regularSeason";
			teamsX: any[];
			teamsY: any[];
			statsX: string[];
			statsY: string[];
			statX: string;
			statY: string;
		};
	}
};

export default async (
	inputs: ViewInput<"teamGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	const x = await updateTeams("X", inputs, updateEvents, state);
	const y = await updateTeams("Y", inputs, updateEvents, state);

	return Object.assign({}, x, y, updateClientSide(inputs, state, x, y));
};
