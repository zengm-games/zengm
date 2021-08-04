import { PHASE, PLAYER } from "../../../common";
import { league, phase, player, freeAgents } from "..";
import { idb } from "../../db";
import {
	g,
	local,
	toUI,
	updatePlayMenu,
	updatePhase,
	updateStatus,
} from "../../util";
import type { Conditions } from "../../../common/types";
import expansionDraft from "../expansionDraft";

const afterPicks = async (draftOver: boolean, conditions: Conditions = {}) => {
	if (draftOver) {
		await league.setGameAttributes({
			numDraftPicksCurrent: undefined,
		});

		// Fantasy draft special case!
		if (g.get("phase") === PHASE.FANTASY_DRAFT) {
			// Undrafted players become free agents
			const playersUndrafted = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.UNDRAFTED,
			);

			for (const p of playersUndrafted) {
				player.addToFreeAgents(p);
				await idb.cache.players.put(p);
			}
			await freeAgents.normalizeContractDemands({
				type: "freeAgentsOnly",
			});

			// Swap back in normal draft class
			const players = await idb.cache.players.indexGetAll(
				"playersByTid",
				PLAYER.UNDRAFTED_FANTASY_TEMP,
			);

			for (const p of players) {
				p.tid = PLAYER.UNDRAFTED;
				await idb.cache.players.put(p);
			}

			// Refresh draft results without redirecting away
			await toUI("realtimeUpdate", [["playerMovement"]]);

			local.fantasyDraftResults = [];
			await league.setGameAttributes({
				phase: g.get("nextPhase"),
				nextPhase: undefined,
			});
			await updatePhase();
			await updatePlayMenu();
			await updateStatus("Idle");
		} else if (g.get("phase") === PHASE.EXPANSION_DRAFT) {
			// Refresh draft results without redirecting away
			await toUI("realtimeUpdate", [["playerMovement"]]);

			local.fantasyDraftResults = [];
			await league.setGameAttributes({
				phase: g.get("nextPhase"),
				nextPhase: undefined,
			});
			await updatePhase();
			await updatePlayMenu();
			await updateStatus("Idle");

			await expansionDraft.finalize();
		} else {
			// Non-fantasy draft
			await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
		}
	} else {
		await updatePlayMenu();
		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

export default afterPicks;
