import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { bySport } from "../../common";
import { TableConfig } from "../../ui/util/TableConfig";

const updateUserRoster = async (
	inputs: ViewInput<"tradingBlock">,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("customizeTable") ||
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const stats = bySport({
			basketball: [
				"stat:gp",
				"stat:min",
				"stat:pts",
				"stat:trb",
				"stat:ast",
				"stat:per",
			],
			football: ["stat:gp", "stat:keyStats", "stat:av"],
			hockey: ["stat:gp", "stat:keyStats", "stat:ops", "stat:dps", "stat:ps"],
		});
		const [userRosterAll, userPicks] = await Promise.all([
			idb.cache.players.indexGetAll("playersByTid", g.get("userTid")),
			await idb.getCopies.draftPicks({
				tid: g.get("userTid"),
			}),
		]);

		const config: TableConfig = new TableConfig("tradingBlock", [
			"Name",
			"Pos",
			"Age",
			"Ovr",
			"Pot",
			"Contract",
			"Exp",
			...stats,
		]);
		await config.load();

		const userRoster = await idb.getCopies.playersPlus(userRosterAll, {
			attrs: [...config.attrsNeeded, "untradable", "pid"],
			ratings: config.ratingsNeeded,
			stats: config.statsNeeded,
			tid: g.get("userTid"),
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

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
			config,
			userPicks: userPicks2,
			userRoster,
		};
	}
};

export default updateUserRoster;
