import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, league } from "..";
import { idb } from "../../db";
import { g, helpers, local } from "../../util";
import type { Conditions, PhaseReturn } from "../../../common/types";

const newPhaseFantasyDraft = async (
	conditions: Conditions,
	tids: number[],
): Promise<PhaseReturn> => {
	local.fantasyDraftResults = [];
	await contractNegotiation.cancelAll();
	await draft.genOrderFantasy(tids);
	await league.setGameAttributes({
		nextPhase: g.get("phase"),
	});
	await idb.cache.releasedPlayers.clear();

	// Protect draft prospects from being included in this
	const playersUndrafted = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);

	for (const p of playersUndrafted) {
		p.tid = PLAYER.UNDRAFTED_FANTASY_TEMP;
		await idb.cache.players.put(p);
	}

	// Make all players draftable
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);

	for (const p of players) {
		p.tid = PLAYER.UNDRAFTED;

		// Delete empty stats row in preseason
		if (g.get("phase") === PHASE.PRESEASON) {
			const lastStats = p.stats.at(-1);
			if (
				lastStats &&
				lastStats.season === g.get("season") &&
				lastStats.gp === 0
			) {
				p.stats.pop();
			}
		}

		await idb.cache.players.put(p);
	}

	// Return traded draft picks to original teams
	const draftPicks = await idb.cache.draftPicks.getAll();

	for (const dp of draftPicks) {
		if (dp.tid !== dp.originalTid) {
			dp.tid = dp.originalTid;
			await idb.cache.draftPicks.put(dp);
		}
	}

	return {
		url: helpers.leagueUrl(["draft"]),
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseFantasyDraft;
