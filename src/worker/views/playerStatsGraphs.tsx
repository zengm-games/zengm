import {
	helpers,
	isSport,
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
} from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	PlayerStatType,
} from "../../common/types";
import addFirstNameShort from "../util/addFirstNameShort";

const updatePlayers = async (
	inputs: ViewInput<"playerStatsGraphs">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.abbrev !== state.abbrev ||
		inputs.season !== state.season ||
		inputs.statType !== state.statType ||
		inputs.playoffs !== state.playoffs
	) {
		let statsTable;

		if (isSport("basketball")) {
			if (inputs.statType === "advanced") {
				statsTable = PLAYER_STATS_TABLES.advanced;
			} else if (inputs.statType === "shotLocations") {
				statsTable = PLAYER_STATS_TABLES.shotLocations;
			} else if (inputs.statType === "gameHighs") {
				statsTable = PLAYER_STATS_TABLES.gameHighs;
			} else {
				statsTable = PLAYER_STATS_TABLES.regular;
			}
		} else {
			statsTable = PLAYER_STATS_TABLES[inputs.statType];
		}

		let statType: PlayerStatType;
		if (isSport("basketball")) {
			if (inputs.statType === "totals") {
				statType = "totals";
			} else if (inputs.statType === "per36") {
				statType = "per36";
			} else {
				statType = "perGame";
			}
		} else {
			statType = "totals";
		}

		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!statsTable) {
			throw new Error(`Invalid statType: "${inputs.statType}"`);
		}

		let playersAll;

		if (g.get("season") === inputs.season && g.get("phase") <= PHASE.PLAYOFFS) {
			playersAll = await idb.cache.players.indexGetAll("playersByTid", [
				PLAYER.FREE_AGENT,
				Infinity,
			]);
		} else {
			playersAll = await idb.getCopies.players(
				{
					activeSeason:
						typeof inputs.season === "number" ? inputs.season : undefined,
				},
				"noCopyCache",
			);
		}

		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "firstName", "lastName"],
			ratings: ["skills", "pos", "season"],
			stats: statsTable.stats,
			season: typeof inputs.season === "number" ? inputs.season : undefined,
			tid: undefined,
			statType,
			playoffs: inputs.playoffs === "playoffs",
			regularSeason: inputs.playoffs !== "playoffs",
			mergeStats: "totOnly",
		});

		const stats = statsTable.stats;

		return {
			abbrev: inputs.abbrev,
			season: inputs.season,
			statType: inputs.statType,
			playoffs: inputs.playoffs,
			players: players,
			stats,
		};
	}
};

export default updatePlayers;
