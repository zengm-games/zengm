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

const getStatsTableByType = (statTypePlus: string) => {
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
	if (statTypePlus == "contract" || statTypePlus == "ratings") {
		if (isSport("baseball")) {
			return PLAYER_STATS_TABLES.batting;
		} else if (isSport("football")) {
			return PLAYER_STATS_TABLES.passing;
		} else if (isSport("hockey")) {
			return PLAYER_STATS_TABLES.skater;
		}
	} else {
		return PLAYER_STATS_TABLES[statTypePlus];
	}
};

async function getPlayerStats(
	statTypeInput: any,
	season: number,
	playoffs: any,
) {
	const statTypes = bySport({
		baseball: [
			"contract",
			"ratings",
			"batting",
			"pitching",
			"fielding",
			"advanced",
			"gameHighs",
		],
		basketball: [
			"contract",
			"ratings",
			"perGame",
			"per36",
			"totals",
			"shotLocations",
			"advanced",
			"gameHighs",
		],
		football: [
			"contract",
			"ratings",
			"passing",
			"rushing",
			"defense",
			"kicking",
			"returns",
		],
		hockey: [
			"contract",
			"ratings",
			"skater",
			"goalie",
			"advanced",
			"gameHighs",
		],
	});

	// This is the value form the form/URL (or a random one), which confusingly is not the same as statType passed to playersPlus
	const statTypePlus = statTypes.includes(statTypeInput)
		? statTypeInput
		: random.choice(statTypes);

	const statsTable = getStatsTableByType(statTypePlus);

	const ratings = ["ovr", "pot", ...RATINGS];
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

	if (!statsTable) {
		throw new Error(`Invalid statType: "${statTypeInput}"`);
	}
	console.log(statTypeInput, statTypePlus, statType, statsTable);

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
		attrs: ["pid", "name", ...(statTypePlus == "contract" ? ["contract"] : [])],
		ratings: ratings,
		stats: statsTable.stats,
		season: typeof season === "number" ? season : undefined,
		tid: undefined,
		statType,
		playoffs: playoffs === "playoffs",
		regularSeason: playoffs !== "playoffs",
		mergeStats: "totOnly",
	});
	let stats: string[];
	if (statTypePlus === "ratings") {
		stats = ratings;
	} else if (statTypePlus == "contract") {
		stats = ["amount", "exp"];
	} else {
		stats = statsTable.stats;
	}
	return { players, stats, statType: statTypePlus };
}

const updatePlayers = async (
	inputs: ViewInput<"playerGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	console.log("inputs", inputs);
	if (
		(inputs.seasonX === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		// Purposely skip checking statX, statY, minGames - those are only used client side, they in the URL for usability
		inputs.seasonX !== state.seasonX ||
		inputs.seasonY !== state.seasonY ||
		inputs.statTypeX !== state.statTypeX ||
		inputs.statTypeY !== state.statTypeY ||
		inputs.playoffsX !== state.playoffsX ||
		inputs.playoffsY !== state.playoffsY
	) {
		const statForXAxis = await getPlayerStats(
			inputs.statTypeX,
			inputs.seasonX,
			inputs.playoffsX,
		);
		const statForYAxis = await getPlayerStats(
			inputs.statTypeY,
			inputs.seasonY,
			inputs.playoffsY,
		);

		const statX = statForXAxis.stats.includes(inputs.statX)
			? inputs.statX
			: random.choice(statForXAxis.stats);
		const statY = statForYAxis.stats.includes(inputs.statY)
			? inputs.statY
			: random.choice(statForYAxis.stats);

		return {
			seasonX: inputs.seasonX,
			seasonY: inputs.seasonY,
			statTypeX: statForXAxis.statType,
			statTypeY: statForYAxis.statType,
			playoffsX: inputs.playoffsX,
			playoffsY: inputs.playoffsY,
			playersX: statForXAxis.players,
			playersY: statForYAxis.players,
			statsX: statForXAxis.stats,
			statsY: statForYAxis.stats,
			statX,
			statY,
			minGames: inputs.minGames,
		};
	} else if (
		inputs.minGames !== state.minGames ||
		inputs.statX !== state.statX ||
		inputs.statY !== state.statY
	) {
		return {
			statX: inputs.statX,
			statY: inputs.statY,
			minGames: inputs.minGames,
		} as {
			// We can assert this because we know the above block runs on first render, so this is just updating an existing state, so we don't want TypeScript to get confused
			seasonX: number;
			seasonY: number;
			statTypeX: string;
			statTypeY: string;
			playoffsX: string;
			playoffsY: string;
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

export default updatePlayers;
