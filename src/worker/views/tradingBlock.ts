import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport } from "../../common";

const updateUserRoster = async (
	inputs: ViewInput<"tradingBlock">,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const stats = bySport({
			basketball: ["gp", "min", "pts", "trb", "ast", "per"],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});
		const userRosterAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		const userRoster = await idb.getCopies.playersPlus(userRosterAll, {
			attrs: [
				"pid",
				"name",
				"age",
				"contract",
				"injury",
				"watch",
				"untradable",
				"jerseyNumber",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			tid: g.get("userTid"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		const userPicks = await idb.getCopies.draftPicks(
			{
				tid: g.get("userTid"),
			},
			"noCopyCache",
		);

		const userPicks2 = userPicks.map(dp => {
			return {
				...dp,
				desc: helpers.pickDesc(dp),
			};
		});

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeNoTrades: g.get("challengeNoTrades"),
			gameOver: g.get("gameOver"),
			initialPid: inputs.pid,
			spectator: g.get("spectator"),
			phase: g.get("phase"),
			stats,
			userPicks: userPicks2,
			userRoster,
		};
	}
};

export default updateUserRoster;
