import { defaultGameAttributes, g, helpers } from "../../util";
import setGameAttributes from "./setGameAttributes";
import type { GameAttributesLeague } from "../../../common/types";
import { PLAYER } from "../../../common";
import { idb } from "../../db";
import player from "../player";

const setRepeatSeason = async (
	type: "players" | "playersAndRosters" | "disabled",
) => {
	const allPlayers = await idb.cache.players.getAll();

	if (type === "playersAndRosters") {
		const players: Extract<
			Exclude<GameAttributesLeague["repeatSeason"], undefined>,
			{ type: "playersAndRosters" }
		>["players"] = {};
		for (const p of allPlayers) {
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
	} else if (type === "players") {
		await setGameAttributes({
			numSeasonsFutureDraftPicks: 0,
			repeatSeason: {
				type: "players",
				startingSeason: g.get("season"),
			},
		});
	} else {
		await setGameAttributes({
			numSeasonsFutureDraftPicks:
				defaultGameAttributes.numSeasonsFutureDraftPicks,
			repeatSeason: undefined,
		});
	}

	// Recompute player values, since with repeatSeason enabled, age and pot are ignored in player value
	for (const p of allPlayers) {
		await player.updateValues(p);
		await idb.cache.players.put(p);
	}
};

export default setRepeatSeason;
