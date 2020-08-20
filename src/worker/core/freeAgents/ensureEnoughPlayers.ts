import { idb } from "../../db";
import { PLAYER } from "../../../common";
import { g } from "../../util";
import { player } from "..";

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
