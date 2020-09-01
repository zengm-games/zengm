import { PHASE, PLAYER } from "../../../common";
import afterPicks from "./afterPicks";
import getOrder from "./getOrder";
import selectPlayer from "./selectPlayer";
import { idb } from "../../db";
import { g, local, lock, random } from "../../util";
import type {
	Conditions,
	MinimalPlayerRatings,
	Player,
} from "../../../common/types";

/**
 * Simulate draft picks until it's the user's turn or the draft is over.
 *
 * This could be made faster by passing a transaction around, so all the writes for all the picks are done in one transaction. But when calling selectPlayer elsewhere (i.e. in testing or in response to the user's pick), it needs to be sure that the transaction is complete before continuing. So I would need to create a special case there to account for it. Given that this isn't really *that* slow now, that probably isn't worth the complexity. Although... team.rosterAutoSort does precisely this... so maybe it would be a good idea...
 *
 * @memberOf core.draft
 * @param {boolean} onlyOne If true, only do one pick. If false, do all picks until the user's next pick. Default false.
 * @return {Promise.[Array.<Object>, Array.<number>]} Resolves to an array of player IDs who were drafted during this function call, in order.
 */
const runPicks = async (
	type: "onePick" | "untilYourNextPick" | "untilEnd",
	conditions?: Conditions,
) => {
	if (lock.get("drafting")) {
		return [];
	}

	await lock.set("drafting", true);
	const pids: number[] = [];
	let draftPicks = await getOrder();

	const expansionDraft = g.get("expansionDraft");

	let playersAll: Player<MinimalPlayerRatings>[];
	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		playersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			PLAYER.UNDRAFTED,
		);
	} else if (expansionDraft.phase === "draft") {
		playersAll = (
			await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
		).filter(p => expansionDraft.availablePids.includes(p.pid));
	} else {
		playersAll = (
			await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
				[g.get("season")],
				[g.get("season"), Infinity],
			])
		).filter(p => p.tid === PLAYER.UNDRAFTED);
	}
	playersAll.sort((a, b) => b.value - a.value);

	// Called after either the draft is over or it's the user's pick
	const afterDoneAuto = async () => {
		await lock.set("drafting", false);

		// Is draft over?
		await afterPicks(draftPicks.length === 0, conditions);
		return pids;
	};

	// This will actually draft "untilUserOrEnd"
	const autoSelectPlayer = async (): Promise<number[]> => {
		if (draftPicks.length > 0) {
			// If there are no players, delete the rest of the picks and draft is done
			if (playersAll.length === 0) {
				for (const dp of draftPicks) {
					await idb.cache.draftPicks.delete(dp.dpid);
				}
				draftPicks = await getOrder();
			} else {
				const dp = draftPicks[0];

				const singleUserPickInSpectatorMode =
					g.get("spectator") && type === "onePick";
				const pauseForUserPick =
					g.get("userTids").includes(dp.tid) &&
					!local.autoPlayUntil &&
					!singleUserPickInSpectatorMode &&
					type !== "untilEnd";
				if (pauseForUserPick) {
					return afterDoneAuto();
				}

				draftPicks.shift();
				const selection = random.choice(playersAll, p => p.value ** 69);

				// 0=best prospect, 1=next best prospect, etc.
				const pid = selection.pid;
				await selectPlayer(dp, pid);
				pids.push(pid);
				playersAll = playersAll.filter(p => p !== selection); // Delete from the list of undrafted players

				if (type !== "onePick") {
					return autoSelectPlayer();
				}
			}
		}

		return afterDoneAuto();
	};

	return autoSelectPlayer();
};

export default runPicks;
