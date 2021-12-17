import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player, ViewInput } from "../../common/types";
import { bySport } from "../../common";

const updatePlayers = async (
	{ pid }: ViewInput<"relatives">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || pid !== state.pid) {
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
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});

		let playersAll: Player[] = [];

		if (typeof pid === "number") {
			const target = await idb.getCopy.players(
				{
					pid,
				},
				"noCopyCache",
			);

			if (target) {
				const pids = target.relatives.map(rel => rel.pid);
				const otherPlayers = await idb.getCopies.players(
					{
						pids,
					},
					"noCopyCache",
				);
				playersAll = [target, ...otherPlayers];
			}
		} else {
			playersAll = await idb.getCopies.players(
				{
					filter: p => p.relatives.length > 0,
				},
				"noCopyCache",
			);
		}

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"draft",
				"retiredYear",
				"statsTids",
				"hof",
				"relatives",
				"numBrothers",
				"numFathers",
				"numSons",
				"college",
				"jerseyNumber",
			],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			pid,
			players: processPlayersHallOfFame(players),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
