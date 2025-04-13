import { g, helpers } from "../../../worker/util/index.ts";
import type { GamePlayer } from "../../../common/types.ts";
import { PHASE } from "../../../common/index.ts";

const checkStatisticalFeat = (p: GamePlayer) => {
	const minFactor = helpers.quarterLengthFactor();

	const FIVE = minFactor * 5;
	const FOUR = minFactor * 4;
	const THREE = minFactor * 3;

	const statArr: any = {};

	const goals = p.stat.evG + p.stat.ppG + p.stat.shG;
	const assists = p.stat.evA + p.stat.ppA + p.stat.shA;

	if (goals >= THREE) {
		statArr.goals = goals;
	}

	if (goals + assists >= FOUR) {
		statArr.goals = goals;
		statArr.assists = assists;
	}

	if (p.stat.so > 0) {
		statArr.shutouts = p.stat.so;
	}

	if (Object.keys(statArr).length > 0) {
		let score = goals + assists >= FIVE ? 20 : 10;
		if (g.get("phase") === PHASE.PLAYOFFS) {
			score += 10;
		}

		return {
			feats: statArr,
			score,
		};
	}

	return {
		score: 0,
	};
};

export default checkStatisticalFeat;
