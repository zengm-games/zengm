import value from "./value";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";
import { local } from "../../util";
import updateOvrMeatStd from "./updateOvrMeanStd";

const updateValues = async (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
) => {
	await updateOvrMeatStd();

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
