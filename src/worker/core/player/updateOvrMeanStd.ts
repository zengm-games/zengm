import { local } from "../../util";
import { idb } from "../../db";

const updateOvrMeanStd = async () => {
	if (local.playerOvrMeanStdStale) {
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			-1,
			Infinity,
		]);

		if (players.length > 0) {
			let sum = 0;
			for (const p of players) {
				sum += p.ratings.at(-1).ovr;
			}
			local.playerOvrMean = sum / players.length;

			let sumSquareDeviations = 0;
			for (const p of players) {
				sumSquareDeviations +=
					(p.ratings.at(-1).ovr - local.playerOvrMean) ** 2;
			}
			local.playerOvrStd = Math.sqrt(sumSquareDeviations / players.length);

			local.playerOvrMeanStdStale = false;
		}
	}
};

export default updateOvrMeanStd;
