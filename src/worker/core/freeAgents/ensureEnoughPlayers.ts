import { idb } from "../../db/index.ts";
import { PLAYER } from "../../../common/index.ts";
import { g } from "../../util/index.ts";
import { player } from "../index.ts";

// Ensure enough players, in case there was some huge expansion draft
const ensureEnoughPlayers = async () => {
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);
	const target = g.get("numActiveTeams") * (g.get("maxRosterSize") + 1);

	if (players.length < target) {
		const numToAdd = target - players.length;
		for (let i = 0; i < numToAdd; i++) {
			await player.genRandomFreeAgent();
		}
	}
};

export default ensureEnoughPlayers;
