import { g, helpers } from "../../util";
import setGameAttributes from "./setGameAttributes";
import type { GameAttributesLeague } from "../../../common/types";
import { PLAYER } from "../../../common";
import { idb } from "../../db";

const initRepeatSeason = async (type: "players" | "playersAndRosters") => {
	if (type === "playersAndRosters") {
		const players: Extract<
			Exclude<GameAttributesLeague["repeatSeason"], undefined>,
			{ type: "playersAndRosters" }
		>["players"] = {};
		for (const p of await idb.cache.players.getAll()) {
			if (p.tid >= PLAYER.FREE_AGENT) {
				players[p.pid] = {
					tid: p.tid,
					contract: helpers.deepCopy(p.contract),
					injury: helpers.deepCopy(p.injury),
				};
			}
		}

		await setGameAttributes({
			numSeasonsFutureDraftPicks: 0,
			repeatSeason: {
				type,
				startingSeason: g.get("season"),
				players,
			},
		});
	} else {
		await setGameAttributes({
			numSeasonsFutureDraftPicks: 0,
			repeatSeason: {
				type: "players",
				startingSeason: g.get("season"),
			},
		});
	}
};

export default initRepeatSeason;
