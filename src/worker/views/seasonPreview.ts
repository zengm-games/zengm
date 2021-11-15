import { idb } from "../db";
import { g, helpers, updatePlayMenu, updateStatus } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import orderBy from "lodash-es/orderBy";

const updateSeasonPreview = async (
	{ season }: ViewInput<"seasonPreview">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("watchList") ||
		state.season !== season
	) {
		const playersRaw = await idb.getCopies.players({
			activeSeason: season,
		});

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: [
				"pid",
				"tid",
				"abbrev",
				"name",
				"age",
				"watch",
				"face",
				"imgURL",
				"hgt",
				"weight",
			],
			ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills"],
			season,
			fuzz: true,
			showNoStats: true,
		});

		const playersTop = orderBy(players, p => p.ratings.ovr, "desc").slice(
			0,
			10,
		);
		const playersImproving = orderBy(
			players.filter(p => p.ratings.dovr > 0),
			p => p.ratings.ovr + 2 * p.ratings.dovr,
			"desc",
		).slice(0, 10);
		const playersDeclining = orderBy(
			players.filter(p => p.ratings.dovr < 0),
			p => p.ratings.ovr - 3 * p.ratings.dovr,
			"desc",
		).slice(0, 10);

		return {
			playersDeclining,
			playersImproving,
			playersTop,
			season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateSeasonPreview;
