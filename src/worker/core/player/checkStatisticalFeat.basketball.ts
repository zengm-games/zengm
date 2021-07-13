import { g, helpers } from "../../../worker/util";
import type { GamePlayer } from "../../../common/types";
import { PHASE } from "../../../common";

const checkStatisticalFeat = (p: GamePlayer) => {
	const minFactor = helpers.quarterLengthFactor();

	const TEN = minFactor * 10;
	const FIVE = minFactor * 5;
	const TWENTY = minFactor * 20;
	const TWENTY_FIVE = minFactor * 25;
	const FIFTY = minFactor * 50;
	let doubles = ["pts", "ast", "stl", "blk"].reduce((count, stat) => {
		if (p.stat[stat] >= TEN) {
			return count + 1;
		}

		return count;
	}, 0);

	if (p.stat.orb + p.stat.drb >= TEN) {
		doubles += 1;
	}

	const statArr: any = {};

	if (
		p.stat.pts >= FIVE &&
		p.stat.ast >= FIVE &&
		p.stat.stl >= FIVE &&
		p.stat.blk >= FIVE &&
		p.stat.orb + p.stat.drb >= FIVE
	) {
		statArr.points = p.stat.pts;
		statArr.rebounds = p.stat.orb + p.stat.drb;
		statArr.assists = p.stat.ast;
		statArr.steals = p.stat.stl;
		statArr.blocks = p.stat.blk;
	}

	if (doubles >= 3) {
		if (p.stat.pts >= TEN) {
			statArr.points = p.stat.pts;
		}

		if (p.stat.orb + p.stat.drb >= TEN) {
			statArr.rebounds = p.stat.orb + p.stat.drb;
		}

		if (p.stat.ast >= TEN) {
			statArr.assists = p.stat.ast;
		}

		if (p.stat.stl >= TEN) {
			statArr.steals = p.stat.stl;
		}

		if (p.stat.blk >= TEN) {
			statArr.blocks = p.stat.blk;
		}
	}

	if (p.stat.pts >= FIFTY) {
		statArr.points = p.stat.pts;
	}

	if (p.stat.orb + p.stat.drb >= TWENTY_FIVE) {
		statArr.rebounds = p.stat.orb + p.stat.drb;
	}

	if (p.stat.ast >= TWENTY) {
		statArr.assists = p.stat.ast;
	}

	if (p.stat.stl >= TEN) {
		statArr.steals = p.stat.stl;
	}

	if (p.stat.blk >= TEN) {
		statArr.blocks = p.stat.blk;
	}

	if (p.stat.tp >= TEN) {
		statArr["three pointers"] = p.stat.tp;
	}

	if (Object.keys(statArr).length > 0) {
		const gmsc = helpers.gameScore(p.stat);
		const score = Math.round(
			gmsc / 2 + (g.get("phase") === PHASE.PLAYOFFS ? 10 : 0),
		);
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
