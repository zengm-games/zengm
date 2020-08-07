import value from "./value";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";
import { idb } from "../../db";
import { local } from "../../util";

const updateValues = async (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
) => {
	if (
		(process.env.SPORT === "basketball" && local.playerOvrMean === undefined) ||
		local.playerOvrStd === undefined
	) {
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			-1,
			Infinity,
		]);

		if (players.length > 0) {
			let sum = 0;
			for (const p of players) {
				sum += p.ratings[p.ratings.length - 1].ovr;
			}
			local.playerOvrMean = sum / players.length;

			let sumSquareDeviations = 0;
			for (const p of players) {
				sumSquareDeviations +=
					(p.ratings[p.ratings.length - 1].ovr - local.playerOvrMean) ** 2;
			}
			local.playerOvrStd = Math.sqrt(sumSquareDeviations / players.length);
		}
	}

	p.value = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
	});
	p.valueNoPot = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
		noPot: true,
	});
	p.valueFuzz = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
		fuzz: true,
	});
	p.valueNoPotFuzz = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
		noPot: true,
		fuzz: true,
	});
};

export default updateValues;
