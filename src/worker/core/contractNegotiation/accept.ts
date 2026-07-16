import { player, team } from "../index.ts";
import cancel from "./cancel.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, toUI } from "../../util/index.ts";
import type { Negotiation, PlayerContract } from "../../../common/types.ts";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import { actualPhase } from "../../util/actualPhase.ts";

/**
 * Accept the player's offer.
 *
 * If successful, then the team's current roster will be displayed.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise.<string=>} If an error occurs, resolves to a string error message.
 */
const accept = async ({
	negotiation,
	amount,
	exp,
	dryRun,
}: {
	negotiation: Negotiation;
	amount: number;
	exp: number;
	dryRun?: boolean;
}) => {
	const salaryCapType = g.get("salaryCapType");
	const tid = g.get("userTid");

	if (salaryCapType !== "none") {
		const payroll = await team.getPayroll(tid);
		const birdException = negotiation.resigning && salaryCapType === "soft";

		// If this contract brings team over the salary cap, it's not a minimum contract, and it's not re-signing a current
		// player with the Bird exception, ERROR!
		if (
			!birdException &&
			payroll + amount - 1 > g.get("salaryCap") &&
			amount - 1 > g.get("minContract")
		) {
			return `You cannot go over the salary cap to sign ${
				salaryCapType === "hard" ? "players" : "free agents"
			} to contracts higher than the minimum salary.`;
		}
	}

	// This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it
	// wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
	if (negotiation.tid !== undefined && negotiation.tid !== tid) {
		return `This negotiation was started by the ${
			g.get("teamInfoCache")[negotiation.tid]?.region
		} ${g.get("teamInfoCache")[negotiation.tid]?.name} but you are the ${
			g.get("teamInfoCache")[tid]?.region
		} ${
			g.get("teamInfoCache")[tid]?.name
		}. Either switch teams or cancel this negotiation.`;
	}

	const p = await idb.cache.players.get(negotiation.pid);
	if (!p) {
		return "Invalid pid";
	}

	// Make sure the user didn't do something in another tab to change the willingness to negotiate, such as trading away players
	const mood = await player.moodInfo(p, tid);
	if (!mood.willing) {
		return "Player is no longer willing to negotiate.";
	}

	const phase = actualPhase();

	const contract: PlayerContract = {
		amount,
		exp,
	};
	if (p.contract.rookie && phase === PHASE.RESIGN_PLAYERS) {
		// Not sure if the phase condition is necessary. The purpose of this is for hard cap rookies with rookie contract scale.
		contract.rookie = true;
	}

	if (!dryRun) {
		const rollbackInfo = {
			numDaysFreeAgent: p.numDaysFreeAgent,
			numPlayersTradedAwayNormalized: helpers.deepCopy(
				p.numPlayersTradedAwayNormalized,
			),
			jerseyNumber: p.jerseyNumber,
			contract: helpers.deepCopy(p.contract),
			salaries: helpers.deepCopy(p.salaries),
			transactions: helpers.deepCopy(p.transactions),
		};

		const eid = await player.sign(p, tid, contract, phase);
		await idb.cache.players.put(p);
		await cancel(negotiation.pid);

		// Rollback
		return async () => {
			const p = await idb.cache.players.get(negotiation.pid);
			if (!p) {
				return false;
			}

			if (p.tid !== tid) {
				return false;
			}

			Object.assign(p, rollbackInfo);
			p.tid = PLAYER.FREE_AGENT;

			if (phase === PHASE.RESIGN_PLAYERS) {
				await idb.cache.negotiations.add({
					pid: p.pid,
					tid,
					resigning: true,
				});
			}

			await idb.cache.players.put(p);

			if (eid !== undefined) {
				await idb.cache.events.delete(eid);
			}

			void toUI("realtimeUpdate", [["playerMovement"]]);

			return true;
		};
	}
};

export default accept;
