import { getWinProbabilityBaseball } from "../../common/baseballWinProbability.ts";
import { getSeconds } from "../../common/formatClock.ts";
import { helpers } from "../../common/helpers.ts";
import {
	getGameLengthScale,
	getGamePrediction,
	getWinProbability,
} from "../../common/gamePrediction.ts";

// Approximate points per team in a default length game, to turn Elam points left into a fraction of a game
const ELAM_POINTS_PER_GAME = 100;

const getLiveWinpBaseball = ({
	boxScore,
	spread,
	sportState,
}: {
	boxScore: any;
	spread: number;
	sportState: any;
}) => {
	const { numPeriods, teams } = boxScore;
	const o: 0 | 1 = sportState?.o ?? 1;
	const inning = teams[o].ptsQtrs.length;

	// Before the first pitch, the away team is about to bat
	if (inning === 0) {
		return getWinProbabilityBaseball({
			basesOccupied: [false, false, false],
			inning: 1,
			margin: 0,
			numInnings: numPeriods,
			o: 1,
			outs: 0,
			spread,
		});
	}

	const bases: unknown[] = sportState?.bases ?? [];
	return getWinProbabilityBaseball({
		basesOccupied: [0, 1, 2].map((i) => bases[i] !== undefined) as [
			boolean,
			boolean,
			boolean,
		],
		inning,
		margin: teams[0].pts - teams[1].pts,
		numInnings: numPeriods,
		o,
		outs: sportState?.outs ?? 0,
		spread,
	});
};

const getFrac = ({
	boxScore,
	expectedGamePoints,
	quarterLength,
}: {
	boxScore: any;
	expectedGamePoints: number;
	quarterLength: number;
}) => {
	const { numPeriods, teams } = boxScore;

	if (boxScore.elamTarget !== undefined) {
		const pointsLeft =
			boxScore.elamTarget - Math.max(teams[0].pts, teams[1].pts);
		return Math.max(pointsLeft, 1) / expectedGamePoints;
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
	const prediction = getGamePrediction({
		homeCourtAdvantage,
		neutral: !!boxScore.neutralSite || allStarGame,
		numPeriods,
		ovrs: [teams[0].ovr, teams[1].ovr],
		quarterLength,
	});

	if (__SPORT === "baseball") {
		return {
			prob: getLiveWinpBaseball({
				boxScore,
				spread: prediction.spread,
				sportState,
			}),
		};
	}

	const expectedGamePoints =
		ELAM_POINTS_PER_GAME * getGameLengthScale({ numPeriods, quarterLength });

	return {
		prob: getWinProbability({
			...prediction,
			frac: getFrac({
				boxScore,
				expectedGamePoints,
				quarterLength,
			}),
			margin: teams[0].pts - teams[1].pts,
		}),
	};
};
