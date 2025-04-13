import { PHASE, PLAYER } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

const updateExportPlayers = async (
	{ season }: ViewInput<"exportPlayers">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		season !== state.season
	) {
		let playersAll;
		if (g.get("season") === season) {
			playersAll = await idb.cache.players.getAll();
			playersAll = playersAll.filter((p) => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
		} else {
			playersAll = await idb.getCopies.players(
				{
					activeSeason: season,
				},
				"noCopyCache",
			);
		}

		const players = addFirstNameShort(
			await idb.getCopies.playersPlus(playersAll, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"age",
					"injury",
					"watch",
					"tid",
					"abbrev",
					"jerseyNumber",
				],
				ratings: ["ovr", "pot", "skills", "pos"],
				season,
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			}),
		);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			multipleSeasons: g.get("season") > g.get("startingSeason"),
			players,
			season,
		};
	}
};

export default updateExportPlayers;
