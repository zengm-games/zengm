import evaluatePointsFormula from "./evaluatePointsFormula";
import ptsMax from "./ptsMax";

const ptsPct = (ts: {
	won: number;
	lost: number;
	tied: number;
	otl: number;
	season: number;
}) => {
	const max = ptsMax(ts);

	if (max !== 0) {
		return (
			evaluatePointsFormula(ts, {
				season: ts.season,
			}) / max
		);
	}

	return 0;
};

export default ptsPct;
