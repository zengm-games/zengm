import { idb } from "../db";
import { g, helpers } from "../util";
import { GetOutput, UpdateEvents } from "../../common/types";

async function updateUserRoster(inputs: GetOutput, updateEvents: UpdateEvents) {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim")
	) {
		const stats =
			process.env.SPORT === "basketball"
				? ["min", "pts", "trb", "ast", "per"]
				: ["gp", "keyStats", "av"];
		const [userRosterAll, userPicks] = await Promise.all([
			idb.cache.players.indexGetAll("playersByTid", g.userTid),
			await idb.getCopies.draftPicks({
				tid: g.userTid,
			}),
		]);
		const userRoster = await idb.getCopies.playersPlus(userRosterAll, {
			attrs: [
				"pid",
				"name",
				"age",
				"contract",
				"injury",
				"watch",
				"untradable",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.season,
			tid: g.userTid,
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
			gameOver: g.gameOver,
			phase: g.phase,
			stats,
			ties: g.ties,
			userPicks: userPicks2,
			userRoster,
		};
	}
}

export default updateUserRoster;
