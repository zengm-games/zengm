import { PHASE, PLAYER } from "../../../common/constants.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getContractStartSeason } from "../../util/getContractStartSeason.ts";

// After the season has already started, free agents ask for a short contract. Very cheap players ask for the shortest possible contract, everyone else asks for an extra season.
export const getInSeasonContractExp = (
	amount: number,
	contractStartSeason: number,
) => {
	if (amount < 1.34 * g.get("minContract")) {
		return contractStartSeason;
	}

	return contractStartSeason + 1;
};

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

	const minContract = g.get("minContract");
	const contractStartSeason = getContractStartSeason();
	const minContractExp = contractStartSeason + g.get("minContractLength") - 1;

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
		p.contract.amount = helpers.roundContract(p.contract.amount);

		if (p.contract.amount < minContract) {
			p.contract.amount = minContract;
		}

		if (g.get("phase") !== PHASE.FREE_AGENCY) {
			p.contract.exp = getInSeasonContractExp(
				p.contract.amount,
				contractStartSeason,
			);
		}

		if (p.contract.exp < minContractExp) {
			p.contract.exp = minContractExp;
		}

		// Free agents' resistance to signing decays after every regular season game
		p.numDaysFreeAgent += 1;

		// Also, heal.
		if (g.get("phase") <= PHASE.PLAYOFFS) {
			if (p.injury.gamesRemaining > 0) {
				p.injury.gamesRemaining -= 1;
			} else {
				p.injury = {
					type: "Healthy",
					gamesRemaining: 0,
				};
			}
		}
	}

	await idb.cache.players.putAll(players);
};

export default decreaseDemands;
