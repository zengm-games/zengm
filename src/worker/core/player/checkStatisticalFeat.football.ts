import { defaultGameAttributes, g } from "../../../worker/util";
import type { GamePlayer } from "../../../common/types";

const checkStatisticalFeat = (p: GamePlayer) => {
	const minFactor = Math.sqrt(
		g.get("quarterLength") / defaultGameAttributes.quarterLength,
	);

	// sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596
	const FIVE_HUNDRED = minFactor * 500;
	const FOUR_HUNDRED = minFactor * 400;
	const THREE_HUNDRED = minFactor * 300;
	const TWO_HUNDRED = minFactor * 200;
	const ONE_HUNDRED_FIFTY = minFactor * 150;
	const SEVEN = minFactor * 7;
	const SIX = minFactor * 6;
	const FIVE = minFactor * 5;
	const FOUR = minFactor * 4;
	const THREE = minFactor * 3;
	const TWO = minFactor * 2; // If no touchdown feat is found for individual passing/rushing/etc TDs, it'll check at the end for grouped TDs.

	let touchdownFeatFound = false;
	let rusRecYdsFeatFound = false;
	const statArr: any = {};

	let score = 0;

	if (p.stat.pssYds >= FOUR_HUNDRED) {
		statArr["passing yds"] = p.stat.pssYds;
		score += 10;
		if (p.stat.pssYds >= FIVE_HUNDRED) {
			score += 10;
		}
	}

	if (p.stat.pssTD >= SIX) {
		statArr["passing TDs"] = p.stat.pssTD;
		touchdownFeatFound = true;
		score += 10;
		if (p.stat.pssTD >= SEVEN) {
			score += 10;
		}
	}

	if (p.stat.rusYds >= ONE_HUNDRED_FIFTY) {
		statArr["rushing yds"] = p.stat.rusYds;
		rusRecYdsFeatFound = true;
		score += 10;
		if (p.stat.rusYds >= TWO_HUNDRED) {
			score += 10;
		}
	}

	if (p.stat.rusTD >= THREE) {
		statArr["rushing TDs"] = p.stat.rusTD;
		touchdownFeatFound = true;
		score += 10;
		if (p.stat.rusTD >= FOUR) {
			score += 10;
		}
	}

	if (p.stat.recYds >= ONE_HUNDRED_FIFTY) {
		statArr["receiving yds"] = p.stat.recYds;
		rusRecYdsFeatFound = true;
		score += 10;
		if (p.stat.recYds >= TWO_HUNDRED) {
			score += 10;
		}
	}

	if (p.stat.recTD >= THREE) {
		statArr["receiving TDs"] = p.stat.recTD;
		touchdownFeatFound = true;
		score += 10;
		if (p.stat.recTD >= FOUR) {
			score += 10;
		}
	}

	if (p.stat.defSk >= THREE) {
		statArr.sacks = p.stat.defSk;
		score += 10;
		if (p.stat.defSk >= FOUR) {
			score += 10;
		}
	}

	if (p.stat.defInt >= TWO) {
		statArr.interceptions = p.stat.defInt;
		score += 10;
		if (p.stat.defInt >= THREE) {
			score += 10;
		}
	}

	if (p.stat.defFmbRec >= TWO) {
		statArr["fumble recoveries"] = p.stat.defFmbRec;
		score += 10;
		if (p.stat.defFmbRec >= THREE) {
			score += 10;
		}
	}

	if (p.stat.defFmbFrc >= TWO) {
		statArr["forced fumbles"] = p.stat.defFmbFrc;
		score += 10;
		if (p.stat.defFmbFrc >= THREE) {
			score += 10;
		}
	}

	if (p.stat.defIntTD + p.stat.defFmbTD >= TWO) {
		statArr["defensive TDs"] = p.stat.defIntTD + p.stat.defFmbTD;
		touchdownFeatFound = true;
		score += 10;
		if (p.stat.defIntTD + p.stat.defFmbTD >= THREE) {
			score += 10;
		}
	}

	if (p.stat.prTD + p.stat.krTD >= TWO) {
		statArr["return TDs"] = p.stat.prTD + p.stat.krTD;
		touchdownFeatFound = true;
		score += 10;
		if (p.stat.prTD + p.stat.krTD >= THREE) {
			score += 10;
		}
	}

	if (!touchdownFeatFound && p.stat.rusTD + p.stat.recTD >= FOUR) {
		statArr["rushing/receiving TDs"] = p.stat.rusTD + p.stat.recTD;
		touchdownFeatFound = true;
		score += 10;
		if (!touchdownFeatFound && p.stat.rusTD + p.stat.recTD >= FIVE) {
			score += 10;
		}
	}

	if (
		!touchdownFeatFound &&
		p.stat.rusTD +
			p.stat.recTD +
			p.stat.defIntTD +
			p.stat.defFmbTD +
			p.stat.prTD +
			p.stat.krTD +
			0.5 * p.stat.pssTD >=
			FIVE
	) {
		statArr["total TDs"] =
			p.stat.rusTD +
			p.stat.recTD +
			p.stat.defIntTD +
			p.stat.defFmbTD +
			p.stat.prTD +
			p.stat.krTD +
			p.stat.pssTD;
		touchdownFeatFound = true;
		score += 20;
	}

	if (!rusRecYdsFeatFound && p.stat.rusYds + p.stat.recYds >= TWO_HUNDRED) {
		statArr["rushing/receiving yds"] = p.stat.rusYds + p.stat.recYds;
		rusRecYdsFeatFound = true;
		score += 10;
		if (!rusRecYdsFeatFound && p.stat.rusYds + p.stat.recYds >= THREE_HUNDRED) {
			score += 10;
		}
	}

	if (Object.keys(statArr).length > 0) {
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
