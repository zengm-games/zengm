import { truncGauss } from "../../../common/random.ts";
import { helpers } from "../../util/index.ts";
import type { TeamCoaching } from "../../../common/types.ts";

// A coach's preferred style dials, each a signed level in [-1, 1] centered on 0
// (most coaches are moderate; a few are extreme).
const genDial = () =>
	Math.round(helpers.bound(truncGauss(0, 0.45, -1, 1), -1, 1) * 10) / 10;

const genPhilosophy = (): TeamCoaching => {
	return {
		threePointTendency: genDial(),
		pace: genDial(),
		crashOffensiveGlass: genDial(),
		paintDefense: genDial(),
		defensiveAggression: genDial(),
	};
};

export default genPhilosophy;
