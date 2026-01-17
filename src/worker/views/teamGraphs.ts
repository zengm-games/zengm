import {
	isSport,
	NOT_REAL_POSITIONS,
	POSITIONS,
	RATINGS,
	TEAM_STATS_TABLES,
} from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers, random } from "../util/index.ts";
import type {
	TeamFiltered,
	TeamSeasonAttr,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import type { TeamStatAttr } from "../../common/types.baseball.ts";
import { season } from "../core/index.ts";
import { addPowerRankingsStuffToTeams } from "./powerRankings.ts";

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

export const getStats = (statTypePlus: string, seasons: [number, number]) => {
	if (statTypePlus === "standings") {
		const stats = [
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

		// Show ties/otl if they are enabled in one of the seasons in question
		const useTies = seasons.some((x) => season.hasTies(x));
		const useOtl = seasons.some((x) => g.get("otl", x));

		// Check pts/winp together since they are based on the same thing
		let usePts = false;
		let useWinp = false;
		for (const season of seasons) {
			const pointsFormula = g.get("pointsFormula", season);
			if (pointsFormula !== "") {
				usePts = true;
			} else {
				useWinp = true;
			}
		}

		const toRemove: string[] = [];
		if (!useTies) {
			toRemove.push("tied");
		}
		if (!useOtl) {
			toRemove.push("otl");
		}
		if (!useWinp) {
			toRemove.push("winp");
		}
		if (!usePts) {
			toRemove.push("ptsPct", "pts");
		}

		return stats.filter((stat) => {
			for (const part of toRemove) {
				if (stat.startsWith(part)) {
					return false;
				}
			}

			return true;
		});
	} else if (statTypePlus === "powerRankings") {
		const stats = ["avgAge", "rank"];

		if (!g.get("challengeNoRatings")) {
			stats.push("ovr", "ovrCurrent");
		}

		if (isSport("basketball")) {
			for (const rating of RATINGS) {
				stats.push(`rank_${rating}`, `rankCurrent_${rating}`);
			}
		} else {
			for (const pos of POSITIONS) {
				if (NOT_REAL_POSITIONS.includes(pos)) {
					continue;
				}
				stats.push(`rank_${pos}`, `rankCurrent_${pos}`);
			}
		}

		return stats;
	} else if (statTypePlus === "finances") {
		return [
			"pop",
			"att",
			"revenue",
			"profit",
			"cash",
			"payrollOrSalaryPaid",
			"scoutingLevel",
			"coachingLevel",
			"healthLevel",
			"facilitiesLevel",
		];
	} else {
		const statsTable = getStatsTableByType(statTypePlus);
		if (!statsTable) {
			throw new Error(`Invalid statType: "${statTypePlus}"`);
		}

		// Remove pos for fielding stats
		if (isSport("baseball")) {
			return statsTable.stats.filter((stat) => stat !== "pos");
		}

		return [...statsTable.stats];
	}
};

const getTeamStats = async (
	statTypeInput: string | undefined,
	season: number,
	playoffs: "playoffs" | "regularSeason",
	seasons: [number, number],
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

	const stats = getStats(statTypePlus, seasons);

	if (statTypePlus === "standings") {
		seasonAttrs.push(...(stats as any[]));
	} else if (statTypePlus === "finances") {
		seasonAttrs.push(
			...(stats as any[]).filter((stat) => !stat.endsWith("Level")),
			"expenseLevels",
		);
	} else if (statTypePlus === "powerRankings") {
		statKeys.push("mov");
		seasonAttrs.push("lastTen");
	}

	// To match power rankings behavior, playoff stats are not used, but playoffs status is passed to addPowerRankingsStuffToTeams below
	const teamsPlayoffs =
		playoffs === "playoffs" && statTypePlus !== "powerRankings";

	let teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid", "playThroughInjuries", "abbrev"],
			seasonAttrs,
			stats: statKeys as TeamStatAttr[],
			season,
			playoffs: teamsPlayoffs,
			regularSeason: !teamsPlayoffs,
		},
		"noCopyCache",
	);

	if (statTypePlus === "powerRankings") {
		teams = await addPowerRankingsStuffToTeams(
			teams as any[],
			season,
			playoffs,
		);
	}

	// HACKY! Sum up fielding stats, rather than by position
	if (
		isSport("baseball") &&
		(statTypePlus === "fielding" || statTypePlus === "oppFielding")
	) {
		for (const t of teams) {
			const statsAny = t.stats as any;

			// Sum up stats
			for (const stat of statKeys) {
				if (Array.isArray(statsAny[stat])) {
					let sum = 0;
					for (const value of statsAny[stat]) {
						if (value !== undefined) {
							sum += value;
						}
					}
					statsAny[stat] = sum;
				}
			}

			// Fix Fld%
			statsAny.fldp = helpers.ratio(
				(statsAny.po ?? 0) + (statsAny.a ?? 0),
				(statsAny.po ?? 0) + (statsAny.a ?? 0) + (statsAny.e ?? 0),
			);
		}
	}

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
			[inputs.seasonX, inputs.seasonY],
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

type Team = TeamFiltered<
	["tid", "abbrev"],
	["season", "abbrev", "region", "name", "imgURL", "imgURLSmall"],
	["gp"],
	number
>;

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
			teamsX: Team[];
			teamsY: Team[];
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
