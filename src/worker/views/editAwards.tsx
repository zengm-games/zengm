import { PLAYER } from "../../common";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { g } from "../util";

const updateAwards = async (
	inputs: ViewInput<"editAwards">,
	updateEvents: UpdateEvents,
) => {
	if (!g.get("godMode")) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: "You can't edit awards unless you enable God Mode.",
		};
		return returnValue;
	}
	const season = inputs.season;
	const awards = await idb.getCopy.awards({
		season,
	});

	let playersAll;
	if (g.get("season") === season) {
		playersAll = await idb.cache.players.getAll();
		playersAll = playersAll.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
	} else {
		playersAll = await idb.getCopies.players({
			activeSeason: season,
		});
	}

	return {
		godMode: g.get("godMode"),
		playersAll,
		awards,
		season,
	};
};
export default updateAwards;
