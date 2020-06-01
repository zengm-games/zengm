import value from "./value";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types";

const updateValues = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
) => {
	p.value = value(p);
	p.valueNoPot = value(p, {
		noPot: true,
	});
	p.valueFuzz = value(p, {
		fuzz: true,
	});
	p.valueNoPotFuzz = value(p, {
		noPot: true,
		fuzz: true,
	});
	p.valueWithContract = value(p, {
		withContract: true,
	});
};

export default updateValues;
