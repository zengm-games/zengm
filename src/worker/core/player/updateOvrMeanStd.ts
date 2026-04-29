import { local } from "../../util/index.ts";
import { idb } from "../../db/index.ts";
import { last } from "../../../common/utils.ts";

const updateOvrMeanStd = async () => {
	if (local.playerOvrMeanStdStale) {
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			-1,
			Infinity,
		]);

		if (players.length > 0) {
			let sum = 0;
			for (const p of players) {
				sum += last(p.ratings).ovr;
			}
			local.playerOvrMean = sum / players.length;

			let sumSquareDeviations = 0;
			for (const p of players) {
				sumSquareDeviations += (last(p.ratings).ovr - local.playerOvrMean) ** 2;
			}
			local.playerOvrStd = Math.sqrt(sumSquareDeviations / players.length);

			local.playerOvrMeanStdStale = false;
		}
	}
};

export default updateOvrMeanStd;
