import { PLAYER, RATINGS, bySport } from "../../common";
import { idb } from "../db";
import type { UpdateEvents, ViewInput } from "../../common/types";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "./customizePlayer";
import { choice, shuffle } from "../../common/random";

const updateComparePlayers = async (
	inputs: ViewInput<"comparePlayers">,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		const currentPlayers = await idb.cache.players.getAll();

		const playersToShow = [...inputs.players];

		// If fewer than 2 players, pick some random ones
		while (playersToShow.length < 2) {
			let found = false;

			const pidsToShow = new Set(playersToShow.map(p => p.pid));

			shuffle(currentPlayers);
			for (const p of currentPlayers) {
				if (pidsToShow.has(p.pid)) {
					continue;
				}
				if (p.tid === PLAYER.UNDRAFTED) {
					continue;
				}

				const season = choice(p.ratings).season;

				playersToShow.push({
					pid: p.pid,
					season,
				});
				found = true;
				break;
			}

			if (!found) {
				break;
			}
		}

		const stats = bySport({
			baseball: [],
			basketball: [
				"gp",
				"pts",
				"trb",
				"ast",
				"stl",
				"blk",
				"tov",
				"fgp",
				"ftp",
				"tpp",
				"tsp",
				"tpar",
				"ftr",
				"per",
				"bpm",
				"vorp",
			],
			football: [],
			hockey: [],
		});

		const players = [];
		for (const { pid, season } of playersToShow) {
			const pRaw = await idb.getCopy.players({ pid });
			if (pRaw) {
				const p = await idb.getCopy.playersPlus(pRaw, {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"age",
						"watch",
						"face",
						"imgURL",
						"awards",
						"draft",
						"tid",
						"experience",
					],
					ratings: ["ovr", "pot", ...RATINGS, "pos"],
					stats,
					playoffs: inputs.playoffs === "playoffs",
					regularSeason: inputs.playoffs === "regularSeason",
					combined: inputs.playoffs === "combined",
					season: season === "career" ? undefined : season,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
					mergeStats: "totOnly",
				});
				players.push({
					p,
					season,
				});
			}
		}

		const availablePlayers = finalizePlayersRelativesList(
			currentPlayers.map(formatPlayerRelativesList),
		);

		return {
			availablePlayers,
			playoffs: inputs.playoffs,
			players,
			stats,
		};
	}
};

export default updateComparePlayers;
