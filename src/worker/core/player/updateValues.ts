import value from "./value";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";
import { g, local } from "../../util";
import updateOvrMeanStd from "./updateOvrMeanStd";

const updateValues = async (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
) => {
	await updateOvrMeanStd();

	p.valueNoPot = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
		noPot: true,
	});
	p.valueNoPotFuzz = value(p, {
		ovrMean: local.playerOvrMean,
		ovrStd: local.playerOvrStd,
		noPot: true,
		fuzz: true,
	});

	// If we're repeating the season, potential and age don't matter;
	if (Object.hasOwn(g, "repeatSeason") && g.get("repeatSeason")) {
		p.value = p.valueNoPot;
		p.valueFuzz = p.valueNoPotFuzz;
	} else {
		p.value = value(p, {
			ovrMean: local.playerOvrMean,
			ovrStd: local.playerOvrStd,
		});
		p.valueFuzz = value(p, {
			ovrMean: local.playerOvrMean,
			ovrStd: local.playerOvrStd,
			fuzz: true,
		});
	}
};

export default updateValues;
