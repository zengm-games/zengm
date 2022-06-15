import { g, helpers } from "../../../worker/util";
import type { GamePlayer } from "../../../common/types";
import { PHASE } from "../../../common";

const checkStatisticalFeat = (p: GamePlayer) => {
	const minFactor = helpers.quarterLengthFactor();

	const TWENTY = minFactor * 20;
	const FIFTEEN = minFactor * 15;
	const EIGHT = minFactor * 8;
	const SIX = minFactor * 6;
	const FIVE = minFactor * 5;
	const FOUR = minFactor * 4;
	const THREE = minFactor * 3;

	const statArr: any = {};

	let score = 0;

	if (p.stat.hr >= THREE && p.stat.hr >= 2) {
		statArr["home runs"] = p.stat.hr;
		score += p.stat.hr >= FOUR ? 20 : 10;
	}

	if (p.stat.hits >= FIVE && p.stat.h >= 2) {
		statArr.hits = p.stat.h;
		score += p.stat.h >= SIX ? 20 : 10;
	}

	if (p.stat.rbi >= SIX && p.stat.rbi >= 2) {
		statArr.RBIs = p.stat.rbi;
		score += p.stat.rbi >= EIGHT ? 20 : 10;
	}

	if (p.stat.r >= FOUR && p.stat.r >= 2) {
		statArr.RBIs = p.stat.r;
		score += p.stat.r >= FIVE ? 20 : 10;
	}

	if (p.stat.sb >= THREE && p.stat.sb >= 2) {
		statArr["stolen bases"] = p.stat.sb;
		score += p.stat.sb >= FOUR ? 20 : 10;
	}

	if (
		p.stat.h >= 4 &&
		p.stat["3b"] >= 1 &&
		p.stat["2b"] >= 1 &&
		p.stat.hr >= 1
	) {
		statArr.cycle === 1;
		score += 20;
	}

	if (p.stat.soPit >= FIFTEEN) {
		statArr.strikeouts = p.stat.soPit;
		score += p.stat.soPit >= TWENTY ? 20 : 10;
	}

	const noHitter = p.stat.cg > 0 && p.stat.sho > 0 && p.stat.hPit === 0;
	const perfectGame = noHitter && p.stat.bbPit === 0 && p.stat.hbp === 0;
	if (perfectGame) {
		statArr["perfect games"] = 1;
		score += 20;
	} else if (noHitter) {
		statArr["no hitters"] = 1;
		score += 20;
	} else if (p.stat.sho > 0) {
		statArr.shutouts = p.stat.sho;
		score += 10;
	}

	if (Object.keys(statArr).length > 0) {
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
