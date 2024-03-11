import { PLAYER, RATINGS, bySport } from "../../common";
import { idb } from "../db";
import type { UpdateEvents, ViewInput } from "../../common/types";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "./customizePlayer";
import { choice, shuffle } from "../../common/random";
import { dequal } from "dequal/lite";
import { g } from "../util";
import { maxBy } from "../../common/utils";

const updateComparePlayers = async (
	inputs: ViewInput<"comparePlayers">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		inputs.playoffs !== state.playoffs ||
		!dequal(inputs.players, state.players)
	) {
		const currentPlayers = (await idb.cache.players.getAll()).filter(p => {
			// Don't include far future players
			if (p.tid === PLAYER.UNDRAFTED && p.draft.year > g.get("season") + 2) {
				return false;
			}

			return true;
		});

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
			const pRaw = await idb.getCopy.players({ pid }, "noCopyCache");
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
						"awards",
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

				if (season === "career") {
					const statsKey =
						inputs.playoffs === "playoffs"
							? "careerStatsPlayoffs"
							: inputs.playoffs === "combined"
								? "careerStatsCombined"
								: "careerStats";
					p.stats = p[statsKey];
					delete p[statsKey];

					// Peak ratings
					p.ratings = maxBy(p.ratings, "ovr");
				} else {
					p.awards = (p.awards as any[]).filter(
						award => award.season === season,
					);
				}
				console.log(p);

				players.push({
					p,
					season,
					firstSeason: pRaw.ratings[0].season as number,
					lastSeason: pRaw.ratings.at(-1)!.season as number,
				});
			}
		}

		const initialAvailablePlayers = finalizePlayersRelativesList(
			currentPlayers.map(formatPlayerRelativesList),
		);

		return {
			initialAvailablePlayers,
			playoffs: inputs.playoffs,
			players,
			stats,
		};
	}
};

export default updateComparePlayers;
