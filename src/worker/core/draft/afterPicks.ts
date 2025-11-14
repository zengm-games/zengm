import { PHASE, PLAYER } from "../../../common/index.ts";
import { league, phase, player, freeAgents } from "../index.ts";
import { idb } from "../../db/index.ts";
import {
	g,
	local,
	toUI,
	updatePlayMenu,
	updatePhase,
	updateStatus,
	logEvent,
	lock,
} from "../../util/index.ts";
import type { Conditions } from "../../../common/types.ts";
import expansionDraft from "../expansionDraft/index.ts";

const afterPicks = async (draftOver: boolean, conditions: Conditions = {}) => {
	if (draftOver) {
		await league.setGameAttributes({
			numDraftPicksCurrent: undefined,
		});

		const currentPhase = g.get("phase");

		if (
			currentPhase !== PHASE.FANTASY_DRAFT &&
			currentPhase !== PHASE.EXPANSION_DRAFT
		) {
			await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
			return;
		}

		// Finishing the expansion/fantasy draft is similar to a phase change, so use newPhase lock
		if (lock.get("newPhase")) {
			logEvent(
				{
					type: "error",
					text: "Phase change already in progress.",
					saveToDb: false,
				},
				conditions,
			);
			return;
		}
		try {
			await lock.set("newPhase", true);

			// Fantasy draft special case!
			if (currentPhase === PHASE.FANTASY_DRAFT) {
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
			} else if (currentPhase === PHASE.EXPANSION_DRAFT) {
				// Refresh draft results without redirecting away
				await toUI("realtimeUpdate", [["playerMovement"]]);

				local.fantasyDraftResults = [];
				await league.setGameAttributes({
					phase: g.get("nextPhase"),
					nextPhase: undefined,
				});

				await expansionDraft.finalize();
			}
		} finally {
			await lock.set("newPhase", false);

			// Do this after unlocking newPhase or it messes up the menu
			await updatePhase();
			await updatePlayMenu();
			await updateStatus("Idle");
		}
	} else {
		await updatePlayMenu();
		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

export default afterPicks;
