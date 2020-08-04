import value from "./value";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";
import { idb } from "../../db";

const updateValues = async (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
) => {
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		-1,
		Infinity,
	]);

	let sum = 0;
	for (const p of players) {
		sum += p.ratings[p.ratings.length - 1].ovr;
	}
	const ovrMean = sum / players.length;

	let sumSquareDeviations = 0;
	for (const p of players) {
		sumSquareDeviations += (p.ratings[p.ratings.length - 1].ovr - ovrMean) ** 2;
	}
	const ovrStd = Math.sqrt(sumSquareDeviations / players.length);
	console.log(ovrMean, ovrStd);

	p.value = value(p, {
		ovrMean,
		ovrStd,
	});
	p.valueNoPot = value(p, {
		ovrMean,
		ovrStd,
		noPot: true,
	});
	p.valueFuzz = value(p, {
		ovrMean,
		ovrStd,
		fuzz: true,
	});
	p.valueNoPotFuzz = value(p, {
		ovrMean,
		ovrStd,
		noPot: true,
		fuzz: true,
	});
};

export default updateValues;
