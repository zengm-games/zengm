import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateTradeOffers = async (
	inputs: ViewInput<"tradingBlock">,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		const gp = teamSeason?.gp ?? 0;

		const NUM_GAMES_BEFORE_NEW_OFFERS = 10;

		const offerSeed =
			Math.floor(gp / NUM_GAMES_BEFORE_NEW_OFFERS) +
			g.get("season") +
			g.get("phase");

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoTrades: g.get("challengeNoTrades"),
			gameOver: g.get("gameOver"),
			phase: g.get("phase"),
			spectator: g.get("spectator"),
		};
	}
};

export default updateTradeOffers;
