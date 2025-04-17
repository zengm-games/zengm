import { PHASE, PLAYER } from "../../../common/index.ts";
import { contractNegotiation, draft, league } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, local } from "../../util/index.ts";
import type { Conditions, PhaseReturn } from "../../../common/types.ts";

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
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseFantasyDraft;
