import evaluatePointsFormula from "./evaluatePointsFormula";

const ptsMax = (ts: {
	won: number;
	lost: number;
	tied: number;
	otl: number;
	season: number;
}) => {
	const dummyRow = {
		won: ts.won + ts.lost + ts.tied + ts.otl,
		lost: 0,
		tied: 0,
		otl: 0,
	};

	return evaluatePointsFormula(dummyRow, {
		season: ts.season,
	});
};

export default ptsMax;
