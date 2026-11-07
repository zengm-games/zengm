import addToFreeAgents from "./addToFreeAgents.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type { Player } from "../../../common/types.ts";
import { getCurrentContract } from "../../../common/contracts.ts";
import { getNumPlayersTradedAwayNormalizedAll } from "./getNumPlayersTradedAwayNormalized.ts";

/**
 * Release player.
 *
 * This keeps track of what the player's current team owes him, and then calls addToFreeAgents.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {boolean} justDrafted True if the player was just drafted by his current team and the regular season hasn't started yet. False otherwise. If True, then the player can be released without paying his salary.
 * @return {Promise}
 */
const release = async (p: Player, justDrafted: boolean) => {
	// Just drafted players can be released without paying anything. Otherwise, the team still owes the rest of his contract, see addToFreeAgents.
	const contract = getCurrentContract(p);
	if (contract && justDrafted) {
		p.contracts = p.contracts.filter((row) => row !== contract);
	}

	logEvent({
		type: "release",
		text: `The <a href="${helpers.leagueUrl([
			"roster",
			`${g.get("teamInfoCache")[p.tid]?.abbrev}_${p.tid}`,
			g.get("season"),
		])}">${
			g.get("teamInfoCache")[p.tid]?.name
		}</a> released <a href="${helpers.leagueUrl(["player", p.pid])}">${
			p.firstName
		} ${p.lastName}</a>.`,
		showNotification: false,
		pids: [p.pid],
		tids: [p.tid],
	});
	addToFreeAgents(p, await getNumPlayersTradedAwayNormalizedAll(), p.tid);
	await idb.cache.players.put(p);
};

export default release;
