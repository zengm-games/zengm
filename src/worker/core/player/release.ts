import addToFreeAgents from "./addToFreeAgents.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import { PLAYER } from "../../../common/constants.ts";
import { updateOwedByTids } from "../contract/index.ts";
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
 * @return {Promise<() => Promise<boolean>>} Resolves to a function that undoes the release, which resolves to true on success and false on failure.
 */
const release = async (p: Player, justDrafted: boolean) => {
	const rollbackInfo = {
		tid: p.tid,
		contracts: helpers.deepCopy(p.contracts),
		contractDemand: helpers.deepCopy(p.contractDemand),
		numDaysFreeAgent: p.numDaysFreeAgent,
		numPlayersTradedAwayNormalized: helpers.deepCopy(
			p.numPlayersTradedAwayNormalized,
		),
		ptModifier: p.ptModifier,
	};

	// Just drafted players can be released without paying anything. Otherwise, the team still owes the rest of his contract, see addToFreeAgents.
	const contract = getCurrentContract(p);
	if (contract && justDrafted) {
		p.contracts = p.contracts.filter((row) => row !== contract);
	}

	const eid = await logEvent({
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

	const pid = p.pid;

	// Undo
	return async () => {
		const p = await idb.cache.players.get(pid);
		if (!p) {
			return false;
		}

		// Could have been signed by another team since being released
		if (p.tid !== PLAYER.FREE_AGENT) {
			return false;
		}

		Object.assign(p, rollbackInfo);
		updateOwedByTids(p);

		await idb.cache.players.put(p);
		await idb.cache.events.delete(eid);

		return true;
	};
};

export default release;
