import { g, helpers } from "../../util";
import setGameAttributes from "./setGameAttributes";
import type { GameAttributesLeague } from "../../../common/types";
import { PLAYER } from "../../../common";
import { idb } from "../../db";

const initRepeatSeason = async () => {
	const players: Exclude<
		GameAttributesLeague["repeatSeason"],
		undefined
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
			startingSeason: g.get("season"),
			players,
		},
	});
};

export default initRepeatSeason;
