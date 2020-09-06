import addToFreeAgents from "./addToFreeAgents";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
import type { Player } from "../../../common/types";
import { PHASE } from "../../../common";

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
	// Keep track of player salary even when he's off the team, but make an exception for players who were just drafted.
	if (!justDrafted) {
		// ...and of course for players whose contracts have already expired.
		if (
			p.contract.exp > g.get("season") ||
			(p.contract.exp === g.get("season") && g.get("phase") < PHASE.PLAYOFFS)
		) {
			await idb.cache.releasedPlayers.add({
				pid: p.pid,
				tid: p.tid,
				contract: helpers.deepCopy(p.contract),
			});
		}
	}

	if (justDrafted) {
		// Clear player salary log if just drafted, because this won't be paid.
		p.salaries = [];
	}

	logEvent({
		type: "release",
		text: `The <a href="${helpers.leagueUrl([
			"roster",
			g.get("teamInfoCache")[p.tid]?.abbrev,
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
	addToFreeAgents(p);
	await idb.cache.players.put(p);
};

export default release;
