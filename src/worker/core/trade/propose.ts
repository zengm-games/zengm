import { PHASE } from "../../../common/constants.ts";
import { team } from "../index.ts";
import { g } from "../../util/index.ts";
import clear from "./clear.ts";
import processTrade from "./processTrade.ts";
import summary from "./summary.ts";
import get from "./get.ts";
import { idb } from "../../db/index.ts";
import { hashSavedTrade } from "../../../common/hashSavedTrade.ts";
import { ValueChangeCalculator } from "../team/ValueChangeCalculator.ts";

/**
 * Proposes the current trade in the database.
 *
 * Before proposing the trade, the trade is validated to ensure that all player IDs match up with team IDs.
 *
 * @memberOf core.trade
 * @param {boolean} forceTrade When true (like in God Mode), this trade is accepted regardless of the AI
 * @return {Promise.<boolean, string>} Resolves to an array. The first argument is a boolean for whether the trade was accepted or not. The second argument is a string containing a message to be dispalyed to the user.
 */
const propose = async (forceTrade: boolean = false) => {
	if (
		g.get("phase") >= PHASE.AFTER_TRADE_DEADLINE &&
		g.get("phase") <= PHASE.PLAYOFFS
	) {
		return {
			accepted: false as const,
			message: `Error! You're not allowed to make trades ${
				g.get("phase") === PHASE.AFTER_TRADE_DEADLINE
					? "after the trade deadline"
					: "now"
			}.`,
		};
	}

	const { teams } = await get();
	const tids: [number, number] = [teams[0].tid, teams[1].tid];

	// The summary will return a warning if (there is a problem. In that case,
	// that warning will already be pushed to the user so there is no need to
	// return a redundant message here.
	const s = await summary(teams);

	if (s.warning && !forceTrade) {
		return { accepted: false as const, message: null };
	}

	const dv = await new ValueChangeCalculator().evaluate({
		tid: teams[1].tid,
		pidsAdd: teams[0].pids,
		pidsRemove: teams[1].pids,
		dpidsAdd: teams[0].dpids,
		dpidsRemove: teams[1].dpids,
		tradingPartnerTid: g.get("userTid"),
	});

	if (dv > 0 || forceTrade) {
		const hash = hashSavedTrade(teams);
		const undo = await processTrade(teams, hash);

		await idb.cache.savedTrades.delete(hash);

		await clear();

		// Auto-sort team rosters
		for (const tid of tids) {
			const t = await idb.cache.teams.get(tid);
			const onlyNewPlayers =
				g.get("userTids").includes(tid) &&
				!g.get("spectator") &&
				t &&
				!t.keepRosterSorted;

			await team.rosterAutoSort(tid, onlyNewPlayers);
		}

		return {
			accepted: true as const,
			message: 'Trade accepted! "Nice doing business with you!"',
			undo,
		};
	}

	// Return a different rejection message based on how close we are to a deal. When dv < 0, the closer to 0, the better the trade for the AI.
	let message;

	if (dv > -2) {
		message = "Close, but not quite good enough.";
	} else if (dv > -5) {
		message = "That's not a good deal for me.";
	} else {
		message = "What, are you crazy?!";
	}

	return { accepted: false as const, message: `Trade rejected! "${message}"` };
};

export default propose;
