import { player, team } from "..";
import cancel from "./cancel";
import { idb } from "../../db";
import { g, toUI, recomputeLocalUITeamOvrs } from "../../util";
import type { PlayerContract } from "../../../common/types";
import { PHASE } from "../../../common";

/**
 * Accept the player's offer.
 *
 * If successful, then the team's current roster will be displayed.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise.<string=>} If an error occurs, resolves to a string error message.
 */
const accept = async (
	pid: number,
	amount: number,
	exp: number,
): Promise<string | undefined | null> => {
	const negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		return `No negotiation with player ${pid} found.`;
	}

	const salaryCapType = g.get("salaryCapType");

	if (salaryCapType !== "none") {
		const payroll = await team.getPayroll(g.get("userTid"));
		const birdException = negotiation.resigning && salaryCapType === "soft";

		// If this contract brings team over the salary cap, it's not a minimum contract, and it's not re-signing a current
		// player with the Bird exception, ERROR!
		if (
			!birdException &&
			payroll + amount - 1 > g.get("salaryCap") &&
			amount - 1 > g.get("minContract")
		) {
			return `This contract would put you over the salary cap. You cannot go over the salary cap to sign ${
				salaryCapType === "hard" ? "players" : "free agents"
			} to contracts higher than the minimum salary.`;
		}
	}

	// This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it
	// wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
	if (negotiation.tid !== undefined && negotiation.tid !== g.get("userTid")) {
		return `This negotiation was started by the ${
			g.get("teamInfoCache")[negotiation.tid]?.region
		} ${g.get("teamInfoCache")[negotiation.tid]?.name} but you are the ${
			g.get("teamInfoCache")[g.get("userTid")]?.region
		} ${
			g.get("teamInfoCache")[g.get("userTid")]?.name
		}. Either switch teams or cancel this negotiation.`;
	}

	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("Invalid pid");
	}

	const contract: PlayerContract = {
		amount,
		exp,
	};
	if (p.contract.rookie && g.get("phase") === PHASE.RESIGN_PLAYERS) {
		// Not sure if the phase condition is necessary. The purpose of this is for hard cap rookies with rookie contract scale.
		contract.rookie = true;
	}

	await player.sign(p, g.get("userTid"), contract, g.get("phase"));
	await idb.cache.players.put(p);
	await cancel(pid);

	// If a depth chart exists, place this player in the depth chart so they are ahead of every player they are
	// better than, without otherwise disturbing the depth chart order
	const t = await idb.cache.teams.get(p.tid);
	const onlyNewPlayers = t ? !t.keepRosterSorted : false;
	await team.rosterAutoSort(g.get("userTid"), onlyNewPlayers);

	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();
};

export default accept;
