import { defaultGameAttributes, g } from "../../../../deion/worker/util";
import { GamePlayer } from "../../../../deion/common/types";

const checkStatisticalFeat = (p: GamePlayer) => {
	const minFactor = Math.sqrt(
		g.quarterLength / defaultGameAttributes.quarterLength,
	); // sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596

	const FOUR_HUNDRED = minFactor * 400;
	const TWO_HUNDRED = minFactor * 200;
	const ONE_HUNDRED_FIFTY = minFactor * 150;
	const SIX = minFactor * 6;
	const FIVE = minFactor * 5;
	const FOUR = minFactor * 4;
	const THREE = minFactor * 3;
	const TWO = minFactor * 2; // If no touchdown feat is found for individual passing/rushing/etc TDs, it'll check at the end for grouped TDs.

	let touchdownFeatFound = false;
	let rusRecYdsFeatFound = false;
	const statArr = {};

	if (p.stat.pssYds >= FOUR_HUNDRED) {
		statArr["passing yds"] = p.stat.pssYds;
	}

	if (p.stat.pssTD >= SIX) {
		statArr["passing TDs"] = p.stat.pssTD;
		touchdownFeatFound = true;
	}

	if (p.stat.rusYds >= ONE_HUNDRED_FIFTY) {
		statArr["rushing yds"] = p.stat.rusYds;
		rusRecYdsFeatFound = true;
	}

	if (p.stat.rusTD >= THREE) {
		statArr["rushing TDs"] = p.stat.rusTD;
		touchdownFeatFound = true;
	}

	if (p.stat.recYds >= ONE_HUNDRED_FIFTY) {
		statArr["receiving yds"] = p.stat.recYds;
		rusRecYdsFeatFound = true;
	}

	if (p.stat.recTD >= THREE) {
		statArr["receiving TDs"] = p.stat.recTD;
		touchdownFeatFound = true;
	}

	if (p.stat.defSk >= THREE) {
		statArr.sacks = p.stat.defSk;
	}

	if (p.stat.defInt >= TWO) {
		statArr.interceptions = p.stat.defInt;
	}

	if (p.stat.defFmbRec >= TWO) {
		statArr["fumble recoveries"] = p.stat.defFmbRec;
	}

	if (p.stat.defFmbFrc >= TWO) {
		statArr["forced fumbles"] = p.stat.defFmbFrc;
	}

	if (p.stat.defIntTD + p.stat.defFmbTD >= TWO) {
		statArr["defensive TDs"] = p.stat.defIntTD + p.stat.defFmbTD;
		touchdownFeatFound = true;
	}

	if (p.stat.prTD + p.stat.krTD >= TWO) {
		statArr["return TDs"] = p.stat.prTD + p.stat.krTD;
		touchdownFeatFound = true;
	}

	if (!touchdownFeatFound && p.stat.rusTD + p.stat.recTD >= FOUR) {
		statArr["rushing/receiving TDs"] = p.stat.rusTD + p.stat.recTD;
		touchdownFeatFound = true;
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
	}

	if (!rusRecYdsFeatFound && p.stat.rusYds + p.stat.recYds >= TWO_HUNDRED) {
		statArr["rushing/receiving yds"] = p.stat.rusYds + p.stat.recYds;
		rusRecYdsFeatFound = true;
	}

	if (Object.keys(statArr).length > 0) {
		return statArr;
	}
};

export default checkStatisticalFeat;
