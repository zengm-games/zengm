import { defaultGameAttributes } from "./defaultGameAttributes.ts";
import { bySport } from "./sportFunctions.ts";

// Measured by simulating games in 12 random leagues per sport with simGamesForPrediction (in worker/core/debug), and fitting to whether the home team won. Use many leagues rather than many games in one league, because how well team ovr predicts results varies from league to league.
type GamePredictionConstants = {
	// Expected margin per point of team ovr difference, in a default length game
	perOvr: number;

	// Each 1% of homeCourtAdvantage is worth this many points of team ovr for the home team
	homeCourtOvr: number;

	// Standard deviation of the margin in a default length game. This is a bit lower than the actual standard deviation, because it's fit to who wins, and overtime makes close games less random than a normal distribution would.
	sigma: number;

	// During a game, the part of a lead that is expected to be given back is liveLeadDecay times the fraction of the game left. 0 means leads are kept on average.
	liveLeadDecay: number;

	// During a game, the uncertainty left is sigma times the fraction of the game left to this power. 0.5 would be if each part of the game was independent, but late game strategy makes the end more random than that.
	liveSigmaExponent: number;
};

const GAME_PREDICTION_CONSTANTS: GamePredictionConstants = bySport({
	// Baseball uses the simple live model, because the fitted one made late leads less accurate. Runs are scored in bunches and most innings are scoreless, which a normal distribution can't capture.
	baseball: {
		perOvr: 0.0276,
		homeCourtOvr: 6.7,
		sigma: 3.36,
		liveLeadDecay: 0,
		liveSigmaExponent: 0.5,
	},
	basketball: {
		perOvr: 0.307,
		homeCourtOvr: 7.8,
		sigma: 13.15,
		liveLeadDecay: 0.455,
		liveSigmaExponent: 0.353,
	},
	football: {
		perOvr: 0.227,
		homeCourtOvr: 9.15,
		sigma: 12.98,
		liveLeadDecay: 0.199,
		liveSigmaExponent: 0.349,
	},
	hockey: {
		perOvr: 0.0189,
		homeCourtOvr: 4.9,
		sigma: 2.17,
		liveLeadDecay: 0.093,
		liveSigmaExponent: 0.375,
	},
});

export const getGameLengthScale = ({
	numPeriods,
	quarterLength,
}: {
	numPeriods: number;
	quarterLength: number;
}) => {
	return (
		(numPeriods * quarterLength) /
		(defaultGameAttributes.numPeriods * defaultGameAttributes.quarterLength)
	);
};

/**
 * Prediction for a game before it starts, for teams[0], the home team.
 *
 * spread is the expected margin, not rounded (see formatGameSpreads). sigma is how uncertain the margin is.
 *
 * Only the total length of the game matters, not how it's split into periods. The spread grows in proportion to it and sigma with its square root, which is close enough to what was measured.
 *
 * Sport constants are only a parameter so tests can cover a sport other than the one they run in.
 */
export const getGamePrediction = ({
	constants = GAME_PREDICTION_CONSTANTS,
	homeCourtAdvantage,
	neutral,
	numPeriods,
	ovrs,
	quarterLength,
}: {
	constants?: GamePredictionConstants;
	homeCourtAdvantage: number;
	neutral: boolean;
	numPeriods: number;
	ovrs: readonly [number, number];
	quarterLength: number;
}) => {
	const lengthScale = getGameLengthScale({ numPeriods, quarterLength });
	const homeCourtOvr = neutral
		? 0
		: constants.homeCourtOvr * homeCourtAdvantage;

	return {
		spread: constants.perOvr * (ovrs[0] - ovrs[1] + homeCourtOvr) * lengthScale,
		sigma: constants.sigma * Math.sqrt(lengthScale),
	};
};

/**
 * Probability that teams[0] wins.
 *
 * For a game in progress, margin is the current lead of teams[0] and frac is the fraction of the game left. The defaults are the pre-game value.
 */
export const getWinProbability = ({
	constants = GAME_PREDICTION_CONSTANTS,
	frac = 1,
	margin = 0,
	sigma,
	spread,
}: {
	constants?: GamePredictionConstants;
	frac?: number;
	margin?: number;
	sigma: number;
	spread: number;
}) => {
	const expectedMargin =
		(1 - constants.liveLeadDecay * frac) * margin + spread * frac;
	const sigmaLeft = sigma * frac ** constants.liveSigmaExponent;

	if (sigmaLeft === 0) {
		return expectedMargin > 0 ? 1 : expectedMargin < 0 ? 0 : 0.5;
	}

	return normalCdf(expectedMargin / sigmaLeft);
};

// Abramowitz and Stegun 26.2.17, since there is no normal CDF elsewhere
const normalCdf = (x: number) => {
	const t = 1 / (1 + 0.2316419 * Math.abs(x));
	const density = Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
	const tail =
		density *
		t *
		(0.31938153 +
			t *
				(-0.356563782 +
					t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
	return x > 0 ? 1 - tail : tail;
};

const roundHalf = (x: number) => {
	return Math.round(x * 2) / 2;
};

export const formatGameSpreads = (
	unroundedSpread: number,
): [string | undefined, string | undefined] => {
	const spread = roundHalf(unroundedSpread);

	if (spread > 0) {
		return [
			(-spread).toLocaleString("en-US", {
				maximumFractionDigits: 1,
			}),
			undefined,
		];
	}
	if (spread < 0) {
		return [
			undefined,
			spread.toLocaleString("en-US", {
				maximumFractionDigits: 1,
			}),
		];
	}
	return [undefined, "PK"];
};

// Rounds the favorite and gives the rest to the other team, so the two always sum to 100. Only a game that is over should be resolved, otherwise neither team can reach 0 or 100.
export const roundWinPercents = (prob: number, resolved?: boolean) => {
	const favorite = Math.max(prob, 1 - prob);
	const rounded = Math.round(favorite * 100);
	const favoritePercent = resolved ? rounded : Math.min(rounded, 99);
	const otherPercent = 100 - favoritePercent;

	return {
		even: favoritePercent === 50,
		percents: (prob >= 0.5
			? [favoritePercent, otherPercent]
			: [otherPercent, favoritePercent]) as [number, number],
	};
};

// resolved is for 0% and 100% that come from game state, like an eliminated team or a champion
export const formatOdds = (prob: number, resolved?: boolean) => {
	if (!resolved) {
		if (prob < 0.005) {
			return "<1%";
		}
		if (prob >= 0.995) {
			return ">99%";
		}
	}

	return `${Math.round(prob * 100)}%`;
};
