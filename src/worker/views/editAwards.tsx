import orderBy from "lodash/orderBy";
import { PHASE, PLAYER } from "../../common";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { g } from "../util";

const updateAwards = async (
	inputs: ViewInput<"editAwards">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (!g.get("godMode")) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: "You can't edit awards unless you enable God Mode.",
		};
		return returnValue;
	}

	let season = inputs.season;
	let awards = await idb.getCopy.awards({
		season,
	});
	if (!awards) {
		if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
			season -= 1;
			awards = await idb.getCopy.awards({
				season,
			});
		}
	}
	if (
		(season === g.get("season") && updateEvents.includes("newPhase")) ||
		season !== state.season
	) {
		let playersAll;
		if (g.get("season") === season) {
			playersAll = await idb.cache.players.getAll();
			playersAll = playersAll.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
		} else {
			playersAll = await idb.getCopies.players({
				activeSeason: season,
			});
		}

		playersAll = orderBy(playersAll, ["lastName", "firstName"]);

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "name"],
			ratings: ["pos"],
			stats:
				process.env.SPORT === "basketball"
					? ["abbrev", "tid", "pts", "trb", "ast", "blk", "stl"]
					: ["abbrev", "tid", "keyStats"],
			fuzz: true,
			mergeStats: true,
			season,
		});

		return {
			godMode: g.get("godMode"),
			players,
			awards,
			season,
		};
	}
};
export default updateAwards;
