import { getGameLengthScale } from "./getGameSpread.ts";
import { bySport } from "./sportFunctions.ts";

type WinModelConstants = {
	// Home team's expected margin in a default length game with default homeCourtAdvantage
	homeEdge: number;

	// Expected margin per point of team ovr difference, from src/common/ovr.*.ts
	perOvr: number;

	// Standard deviation of a default length game's margin
	sigma: number;
};

const WIN_MODEL_CONSTANTS: WinModelConstants = bySport({
	baseball: { homeEdge: 1, perOvr: 0.018, sigma: 4.2 },
	basketball: { homeEdge: 3.3504, perOvr: 0.3, sigma: 12 },
	football: { homeEdge: 3, perOvr: 0.2, sigma: 13.5 },
	hockey: { homeEdge: 0.25, perOvr: 0.018, sigma: 2.3 },
});

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

// Sport constants are only a parameter so tests can cover a sport other than the one they run in
export const getWinModelInputs = ({
	constants = WIN_MODEL_CONSTANTS,
	homeCourtAdvantage,
	neutral,
	numPeriods,
	ovrs,
	quarterLength,
}: {
	constants?: WinModelConstants;
	homeCourtAdvantage: number;
	neutral: boolean;
	numPeriods: number;
	ovrs: readonly [number, number];
	quarterLength: number;
}) => {
	const lengthScale = getGameLengthScale({ numPeriods, quarterLength });
	const homeEdge = neutral ? 0 : constants.homeEdge * homeCourtAdvantage;

	return {
		expectedMargin:
			(constants.perOvr * (ovrs[0] - ovrs[1]) + homeEdge) * lengthScale,
		sigma: constants.sigma * Math.sqrt(lengthScale),
	};
};

// Probability that teams[0] wins. margin is its current lead and frac is the fraction of the game left, so the defaults are the pre-game value.
export const getWinProbability = ({
	expectedMargin,
	frac = 1,
	margin = 0,
	sigma,
}: {
	expectedMargin: number;
	frac?: number;
	margin?: number;
	sigma: number;
}) => {
	if (sigma === 0 || (frac === 0 && margin === 0)) {
		return 0.5;
	}

	return normalCdf(
		(margin + expectedMargin * frac) / (sigma * Math.sqrt(frac)),
	);
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
export const formatTitleOdds = (prob: number, resolved?: boolean) => {
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
