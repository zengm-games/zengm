import {
	bySport,
	isSport,
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
	RATINGS,
} from "../../common";
import { idb } from "../db";
import { g, random } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	PlayerStatType,
} from "../../common/types";

export const statTypes = bySport({
	baseball: [
		"bio",
		"ratings",
		"batting",
		"pitching",
		"fielding",
		"advanced",
		"gameHighs",
	],
	basketball: [
		"bio",
		"ratings",
		"perGame",
		"per36",
		"totals",
		"shotLocations",
		"advanced",
		"gameHighs",
	],
	football: [
		"bio",
		"ratings",
		"passing",
		"rushing",
		"defense",
		"kicking",
		"returns",
	],
	hockey: ["bio", "ratings", "skater", "goalie", "advanced", "gameHighs"],
});

const getStatsTableByType = (statTypePlus: string) => {
	if (statTypePlus == "bio" || statTypePlus == "ratings") {
		return;
	}

	// Keep in sync with statTypesAdv
	if (isSport("basketball")) {
		if (statTypePlus === "advanced") {
			return PLAYER_STATS_TABLES.advanced;
		} else if (statTypePlus === "shotLocations") {
			return PLAYER_STATS_TABLES.shotLocations;
		} else if (statTypePlus === "gameHighs") {
			return PLAYER_STATS_TABLES.gameHighs;
		} else {
			return PLAYER_STATS_TABLES.regular;
		}
	}

	return PLAYER_STATS_TABLES[statTypePlus];
};

export const getStats = (statTypePlus: string) => {
	const statsTable = getStatsTableByType(statTypePlus);

	let stats: string[];
	if (statTypePlus === "ratings") {
		stats = ["ovr", "pot", ...RATINGS];
	} else if (statTypePlus == "bio") {
		stats = ["age", "salary", "draftPosition"];
	} else {
		if (!statsTable) {
			throw new Error(`Invalid statType: "${statTypePlus}"`);
		}
		stats = statsTable.stats;
	}

	return stats;
};

const getPlayerStats = async (
	statTypeInput: string | undefined,
	season: number | "career",
	playoffs: "playoffs" | "regularSeason",
) => {
	// This is the value form the form/URL (or a random one), which confusingly is not the same as statType passed to playersPlus
	const statTypePlus =
		statTypeInput !== undefined && statTypes.includes(statTypeInput)
			? statTypeInput
			: random.choice(statTypes);

	const statsTable = getStatsTableByType(statTypePlus);

	const ratings = statTypePlus === "ratings" ? ["ovr", "pot", ...RATINGS] : [];
	let statType: PlayerStatType;
	if (isSport("basketball")) {
		if (statTypePlus === "totals") {
			statType = "totals";
		} else if (statTypePlus === "per36") {
			statType = "per36";
		} else {
			statType = "perGame";
		}
	} else {
		statType = "totals";
	}

	let playersAll;

	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: typeof season === "number" ? season : undefined,
			},
			"noCopyCache",
		);
	}

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			...(statTypePlus == "bio" ? ["age", "salary", "draftPosition"] : []),
		],
		ratings: ratings,
		stats: statsTable?.stats ?? ["gp"],
		season: typeof season === "number" ? season : undefined,
		tid: undefined,
		statType,
		playoffs: playoffs === "playoffs",
		regularSeason: playoffs !== "playoffs",
		mergeStats: "totOnly",
	});

	if (season === "career") {
		for (const p of players) {
			p.stats = p.careerStats;
			delete p.careerStats;
		}
	}

	const stats = getStats(statTypePlus);
	return { players, stats, statType: statTypePlus };
};

const updatePlayers = async (
	axis: "X" | "Y",
	inputs: ViewInput<"playerGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	const season = `season${axis}` as const;
	const statType = `statType${axis}` as const;
	const playoffs = `playoffs${axis}` as const;
	if (
		(inputs[season] === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		// Purposely skip checking statX, statY, minGames - those are only used client side, they in the URL for usability
		inputs[season] !== state[season] ||
		inputs[statType] !== state[statType] ||
		inputs[playoffs] !== state[playoffs]
	) {
		const statForAxis = await getPlayerStats(
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
			[`players${axis}`]: statForAxis.players,
			[`stats${axis}`]: statForAxis.stats,
			[statKey]: stat,
			minGames: inputs.minGames,
		};
	}
};

const updateClientSide = (
	inputs: ViewInput<"playerGraphs">,
	state: any,
	x: Awaited<ReturnType<typeof updatePlayers>>,
	y: Awaited<ReturnType<typeof updatePlayers>>,
) => {
	if (
		inputs.minGames !== state.minGames ||
		inputs.statX !== state.statX ||
		inputs.statY !== state.statY
	) {
		// Check x and y for statX and statY in case they were already specified there, such as randomly selecting from statForAxis
		return {
			statX: x?.statX ?? inputs.statX,
			statY: y?.statY ?? inputs.statY,
			minGames: inputs.minGames,
		} as {
			// We can assert this because we know the above block runs on first render, so this is just updating an existing state, so we don't want TypeScript to get confused
			seasonX: number | "career";
			seasonY: number | "career";
			statTypeX: string;
			statTypeY: string;
			playoffsX: "playoffs" | "regularSeason";
			playoffsY: "playoffs" | "regularSeason";
			playersX: any[];
			playersY: any[];
			statsX: string[];
			statsY: string[];
			statX: string;
			statY: string;
			minGames: string;
		};
	}
};

export default async (
	inputs: ViewInput<"playerGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	const x = await updatePlayers("X", inputs, updateEvents, state);
	const y = await updatePlayers("Y", inputs, updateEvents, state);

	return Object.assign({}, x, y, updateClientSide(inputs, state, x, y));
};
