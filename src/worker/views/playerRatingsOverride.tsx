import { orderBy } from "lodash-es";
import { idb } from "../db";
import type {
	Player,
	PlayerHistoricRatings,
	ViewInput,
} from "src/common/types";
import { RATINGS } from "src/common";
import { g } from "../util";

const getPlayerHistoryRatings = async (
	inputs: ViewInput<"playerRatingsOverride">,
) => {
	let playersAll = await idb.getCopies.players({}, "noCopyCache");

	playersAll = orderBy(playersAll, ["lastName", "firstName"]);
	let playerHistoricRatings: PlayerHistoricRatings[] = [];
	let player: any;

	const pid = inputs.pid;
	if (pid !== undefined) {
		playerHistoricRatings = await idb.getCopies.playerHistoricRatings({
			pid,
		});
		player = await idb.getCopy.players({ pid });
	}

	return {
		players: playersAll,
		player: player ?? playersAll[0],
		playerHistoricRatings: playerHistoricRatings,
		cols: RATINGS,
		godMode: g.get("godMode"),
	};
};

export default getPlayerHistoryRatings;
