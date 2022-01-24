import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents } from "../../common/types";
import { bySport } from "../../common";

const tragicDeaths = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const events = await idb.getCopies.events(
			{
				filter: event => event.type === "tragedy",
			},
			"noCopyCache",
		);
		const pids: number[] = [];

		for (const event of events) {
			// if would not be necessary if EventBBGM was typed better! See check below too.
			if (event.pids) {
				pids.push(...event.pids);
			}
		}

		const stats = bySport({
			basketball: [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"per",
				"ewa",
				"ws",
				"ws48",
			],
			football: ["keyStats", "av"],
			hockey: ["keyStats", "ops", "dps", "ps"],
		});
		const playersAll = (
			await idb.getCopies.players(
				{
					pids,
				},
				"noCopyCache",
			)
		).filter(p => p !== undefined);

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

		const players2 = processPlayersHallOfFame(players).map((p: any) => {
			const event = events.find(
				event2 => event2.pids && event2.pids.includes(p.pid),
			);
			const details = event?.text ?? "";
			return {
				...p,
				details,
			};
		});

		return {
			players: players2,
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default tragicDeaths;
