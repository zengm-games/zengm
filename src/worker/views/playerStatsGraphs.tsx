import {
	isSport,
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
	RATINGS,
} from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	PlayerStatType,
} from "../../common/types";

async function getPlayerStats(
	statTypeInput: any,
	season: number,
	playoffs: any,
) {
	let statsTable;
	if (isSport("basketball")) {
		if (statTypeInput === "advanced") {
			statsTable = PLAYER_STATS_TABLES.advanced;
		} else if (statTypeInput === "shotLocations") {
			statsTable = PLAYER_STATS_TABLES.shotLocations;
		} else if (statTypeInput === "gameHighs") {
			statsTable = PLAYER_STATS_TABLES.gameHighs;
		} else {
			statsTable = PLAYER_STATS_TABLES.regular;
		}
	} else {
		statsTable = PLAYER_STATS_TABLES[statTypeInput];
	}

	const ratings = [...RATINGS, "ovr", "pot"];
	let statType: PlayerStatType;
	if (isSport("basketball")) {
		if (statTypeInput === "totals") {
			statType = "totals";
		} else if (statTypeInput === "per36") {
			statType = "per36";
		} else {
			statType = "perGame";
		}
	} else {
		statType = "totals";
	}

	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (!statsTable) {
		throw new Error(`Invalid statType: "${statTypeInput}"`);
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
	console.log(playoffs === "playoffs");

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			...(statTypeInput == "contract" ? ["contract"] : []),
		],
		ratings: ratings,
		stats: statsTable.stats,
		season: typeof season === "number" ? season : undefined,
		tid: undefined,
		statType,
		playoffs: playoffs === "playoffs",
		regularSeason: playoffs !== "playoffs",
		mergeStats: "totOnly",
	});
	let stats;
	if (statTypeInput === "ratings") {
		stats = ratings;
	} else if (statTypeInput == "contract") {
		stats = ["amount", "exp"];
	} else {
		stats = statsTable.stats;
	}
	return { players, stats };
}

const updatePlayers = async (
	inputs: ViewInput<"playerStatsGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.seasonX === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.seasonX !== state.seasonX ||
		inputs.statTypeX !== state.statTypeX ||
		inputs.statTypeY !== state.statTypeY ||
		inputs.playoffsX !== state.playoffsX ||
		inputs.playoffsY !== state.playoffsY
	) {
		let statForXAxis = await getPlayerStats(
			inputs.statTypeX,
			inputs.seasonX,
			inputs.playoffsX,
		);
		let statForYAxis = await getPlayerStats(
			inputs.statTypeY,
			inputs.seasonY,
			inputs.playoffsY,
		);

		return {
			seasonX: inputs.seasonX,
			seasonY: inputs.seasonY,
			statTypeX: inputs.statTypeX,
			statTypeY: inputs.statTypeY,
			playoffsX: inputs.playoffsX,
			playoffsY: inputs.playoffsY,
			playersX: statForXAxis.players,
			playersY: statForYAxis.players,
			statsX: statForXAxis.stats,
			statsY: statForYAxis.stats,
		};
	}
};

export default updatePlayers;
