import { defaultGameAttributes } from "./defaultGameAttributes.ts";
import { bySport } from "./sportFunctions.ts";

const roundHalf = (x: number) => {
	return Math.round(x * 2) / 2;
};

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

// Expected margin of victory for teams[0], the home team. Not rounded, see formatGameSpreads.
export const getGameSpread = ({
	homeCourtAdvantage,
	neutral,
	numPeriods,
	ovrs,
	quarterLength,
}: {
	homeCourtAdvantage: number;
	neutral: boolean;
	numPeriods: number;
	ovrs: readonly [number, number];
	quarterLength: number;
}) => {
	// From @nicidob https://github.com/nicidob/bbgm/blob/master/team_win_testing.ipynb
	// Default homeCourtAdvantage is 1
	const actualHomeCourtAdvantage = neutral
		? 0
		: bySport({
				baseball: 1,
				basketball: 3.3504,
				football: 3,
				hockey: 0.25,
			}) * homeCourtAdvantage;

	const [ovr0, ovr1] = ovrs;
	const spread = bySport({
		baseball: () => (1 / 10) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

		basketball: () => (15 / 50) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

		football: () => (3 / 10) * (ovr0 - ovr1) + actualHomeCourtAdvantage,

		hockey: () => (1.8 / 100) * (ovr0 - ovr1) + actualHomeCourtAdvantage,
	})();

	// Adjust for game length
	return spread * getGameLengthScale({ numPeriods, quarterLength });
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
