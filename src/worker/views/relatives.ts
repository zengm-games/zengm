import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player, ViewInput } from "../../common/types";
import { bySport } from "../../common";
import addFirstNameShort from "../util/addFirstNameShort";

const updatePlayers = async (
	{ pid }: ViewInput<"relatives">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || pid !== state.pid) {
		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
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
			const pidsSeen = new Set();
			const addPlayers = async (
				pids: number[],
				spider: "all" | "fatherOrSon" | "none",
			) => {
				const players = await idb.getCopies.players(
					{
						pids,
					},
					"noCopyCache",
				);

				const pidsNextNone = [];
				const pidsNextFatherOrSon = [];

				for (const p of players) {
					playersAll.push(p);
					pidsSeen.add(p.pid);

					for (const relative of p.relatives) {
						console.log(relative);
						if (pidsSeen.has(relative.pid)) {
							continue;
						}

						const fatherOrSon =
							relative.type === "father" || relative.type === "son";

						if (spider === "all" || (spider === "fatherOrSon" && fatherOrSon)) {
							if (fatherOrSon) {
								pidsNextFatherOrSon.push(relative.pid);
							} else {
								pidsNextNone.push(relative.pid);
							}
						}
					}
				}

				if (pidsNextNone.length > 0) {
					await addPlayers(pidsNextNone, "none");
				}
				if (pidsNextFatherOrSon.length > 0) {
					await addPlayers(pidsNextFatherOrSon, "fatherOrSon");
				}
			};

			await addPlayers([pid], "all");
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
				"firstName",
				"lastName",
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
			players: addFirstNameShort(processPlayersHallOfFame(players)),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
