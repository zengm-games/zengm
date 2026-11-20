import { getSeconds } from "../../common/formatClock.ts";
import { getGameLengthScale } from "../../common/getGameSpread.ts";
import { helpers } from "../../common/helpers.ts";
import {
	getWinModelInputs,
	getWinProbability,
} from "../../common/winProbability.ts";

// Approximate points per team in a default length game, to turn Elam points left into a fraction of a game
const ELAM_POINTS_PER_GAME = 100;

const BASEBALL_OUTS_PER_INNING = 3;

const getFracBaseball = ({
	numPeriods,
	outs,
	teams,
}: {
	numPeriods: number;
	outs: number;
	teams: any[];
}) => {
	const inning = teams[1].ptsQtrs.length;
	if (inning === 0 || numPeriods === 0) {
		return 1;
	}

	const bottom = teams[0].ptsQtrs.length === inning;
	const totalOuts = 2 * numPeriods * BASEBALL_OUTS_PER_INNING;

	// Any extra inning could be the last, so only the current one counts as left
	const halfInningsPlayed = inning > numPeriods ? 0 : 2 * (inning - 1);
	const halfInningsTotal = inning > numPeriods ? 2 : 2 * numPeriods;
	const outsLeft =
		(halfInningsTotal - halfInningsPlayed - (bottom ? 1 : 0)) *
			BASEBALL_OUTS_PER_INNING -
		outs;

	// Floored because the trailing team always has a turn at bat left when this is used
	return Math.max(outsLeft, 1) / totalOuts;
};

const getFrac = ({
	boxScore,
	expectedGamePoints,
	quarterLength,
	sportState,
}: {
	boxScore: any;
	expectedGamePoints: number;
	quarterLength: number;
	sportState: any;
}) => {
	const { numPeriods, teams } = boxScore;

	if (boxScore.elamTarget !== undefined) {
		const pointsLeft =
			boxScore.elamTarget - Math.max(teams[0].pts, teams[1].pts);
		return Math.max(pointsLeft, 1) / expectedGamePoints;
	}

	if (__SPORT === "baseball") {
		return getFracBaseball({ numPeriods, outs: sportState?.outs ?? 0, teams });
	}

	const regulationSeconds = numPeriods * quarterLength * 60;
	if (regulationSeconds === 0) {
		return 0;
	}

	const period = teams[0].ptsQtrs.length;
	const clockSeconds = getSeconds(boxScore.time);
	const secondsLeft =
		period > numPeriods
			? clockSeconds
			: (numPeriods - Math.max(period, 1)) * quarterLength * 60 + clockSeconds;

	return helpers.bound(secondsLeft / regulationSeconds, 0, 1);
};

// Probability that teams[0] wins. This never reads boxScore.won, boxScore.lost, or forceWin, because those know how the game ends.
export const getLiveWinp = ({
	boxScore,
	homeCourtAdvantage,
	quarterLength,
	sportState,
}: {
	boxScore: any;
	homeCourtAdvantage: number;
	quarterLength: number;
	sportState: any;
}) => {
	const { numPeriods, teams } = boxScore;

	if (boxScore.gameOver) {
		const [t0, t1] = teams;
		const diff = t0.pts - t1.pts || (t0.sPts ?? 0) - (t1.sPts ?? 0);
		return {
			prob: diff === 0 ? 0.5 : diff > 0 ? 1 : 0,
			resolved: true,
			tied: diff === 0,
		};
	}

	if (teams[0].ovr === undefined || teams[1].ovr === undefined) {
		return;
	}

	if (boxScore.shootout) {
		const lead = (teams[0].sPts ?? 0) - (teams[1].sPts ?? 0);
		return { prob: helpers.bound(0.5 + 0.1 * lead, 0.05, 0.95) };
	}

	const allStarGame = teams[0].tid === -1;
	const { expectedMargin, sigma } = getWinModelInputs({
		homeCourtAdvantage,
		neutral: !!boxScore.neutralSite || allStarGame,
		numPeriods,
		ovrs: [teams[0].ovr, teams[1].ovr],
		quarterLength,
	});

	const expectedGamePoints =
		ELAM_POINTS_PER_GAME * getGameLengthScale({ numPeriods, quarterLength });

	return {
		prob: getWinProbability({
			expectedMargin,
			frac: getFrac({
				boxScore,
				expectedGamePoints,
				quarterLength,
				sportState,
			}),
			margin: teams[0].pts - teams[1].pts,
			sigma,
		}),
	};
};
