import { PHASE, PLAYER } from "../../../common";
import { idb } from "../../db";
import { g, helpers } from "../../util";

/**
 * Decrease contract demands for all free agents.
 *
 * This is called after each day in the regular season, as free agents become more willing to take smaller contracts.
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
const decreaseDemands = async () => {
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.FREE_AGENT,
	);

	for (const p of players) {
		const baseAmount = 50 * Math.sqrt(g.get("maxContract") / 20000);

		// 82 is purposely not defaultGameAttributes.numGames so it works across basketball and football
		const factor =
			g.get("phase") !== PHASE.FREE_AGENCY ? 82 / g.get("numGames") : 1;
		p.contract.amount -= helpers.bound(
			baseAmount * factor,
			baseAmount,
			Infinity,
		);
		p.contract.amount = 10 * Math.round(p.contract.amount / 10); // Round to nearest 10k

		if (p.contract.amount < g.get("minContract")) {
			p.contract.amount = g.get("minContract");
		}

		if (g.get("phase") !== PHASE.FREE_AGENCY) {
			// Since this is after the season has already started, ask for a short contract
			if (p.contract.amount < 1000) {
				p.contract.exp = g.get("season");
			} else {
				p.contract.exp = g.get("season") + 1;
			}
		}

		// Free agents' resistance to signing decays after every regular season game
		p.numDaysFreeAgent += 1;

		// Also, heal.
		if (p.injury.gamesRemaining > 0) {
			p.injury.gamesRemaining -= 1;
		} else {
			p.injury = {
				type: "Healthy",
				gamesRemaining: 0,
			};
		}

		await idb.cache.players.put(p);
	}
};

export default decreaseDemands;
