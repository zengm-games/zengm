import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import { GetOutput, UpdateEvents } from "../../common/types";

async function tragicDeaths(inputs: GetOutput, updateEvents: UpdateEvents) {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const events = await idb.getCopies.events({
			filter: event => event.type === "tragedy",
		});
		const pids = [];

		for (const event of events) {
			pids.push(...event.pids);
		}

		const stats =
			process.env.SPORT === "basketball"
				? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
				: ["keyStats", "av"];
		const playersAll = (
			await Promise.all(
				pids.map(pid =>
					idb.getCopy.players({
						pid,
					}),
				),
			)
		).filter(p => p !== undefined);

		// @ts-ignore
		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"draft",
				"diedYear",
				"ageAtDeath",
				"statsTids",
				"hof",
			],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});
		processPlayersHallOfFame(players);

		for (const p of players) {
			const event = events.find(event2 => event2.pids.includes(p.pid));
			p.details = event ? event.text : "";
		}

		return {
			players,
			stats,
			userTid: g.userTid,
		};
	}
}

export default {
	runBefore: [tragicDeaths],
};
