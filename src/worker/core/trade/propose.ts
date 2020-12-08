import { PHASE } from "../../../common";
import { team } from "..";
import { g } from "../../util";
import clear from "./clear";
import processTrade from "./processTrade";
import summary from "./summary";
import get from "./get";

/**
 * Proposes the current trade in the database.
 *
 * Before proposing the trade, the trade is validated to ensure that all player IDs match up with team IDs.
 *
 * @memberOf core.trade
 * @param {boolean} forceTrade When true (like in God Mode), this trade is accepted regardless of the AI
 * @return {Promise.<boolean, string>} Resolves to an array. The first argument is a boolean for whether the trade was accepted or not. The second argument is a string containing a message to be dispalyed to the user.
 */
const propose = async (
	forceTrade: boolean = false,
): Promise<[boolean, string | undefined | null]> => {
	if (
		g.get("phase") >= PHASE.AFTER_TRADE_DEADLINE &&
		g.get("phase") <= PHASE.PLAYOFFS
	) {
		return [
			false,
			`Error! You're not allowed to make trades ${
				g.get("phase") === PHASE.AFTER_TRADE_DEADLINE
					? "after the trade deadline"
					: "now"
			}.`,
		];
	}

	const { teams } = await get();
	const tids: [number, number] = [teams[0].tid, teams[1].tid];
	const pids: [number[], number[]] = [teams[0].pids, teams[1].pids];
	const dpids: [number[], number[]] = [teams[0].dpids, teams[1].dpids];

	// The summary will return a warning if (there is a problem. In that case,
	// that warning will already be pushed to the user so there is no need to
	// return a redundant message here.
	const s = await summary(teams);

	if (s.warning && !forceTrade) {
		return [false, null];
	}

	let outcome = "rejected"; // Default

	const dv = await team.valueChange(
		teams[1].tid,
		teams[0].pids,
		teams[1].pids,
		teams[0].dpids,
		teams[1].dpids,
		undefined,
		g.get("userTid"),
	);

	if (dv > 0 || forceTrade) {
		// Trade players
		outcome = "accepted";
		await processTrade(s, tids, pids, dpids);
	}

	if (outcome === "accepted") {
		await clear(); // Auto-sort team rosters

		for (const tid of tids) {
			const onlyNewPlayers =
				g.get("userTids").includes(tid) && !g.get("keepRosterSorted");

			await team.rosterAutoSort(tid, onlyNewPlayers);
		}

		return [true, 'Trade accepted! "Nice doing business with you!"'];
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

	return [false, `Trade rejected! "${message}"`];
};

export default propose;
