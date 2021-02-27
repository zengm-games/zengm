import evaluatePointsFormula from "./evaluatePointsFormula";

const ptsPct = (ts: {
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

	if (dummyRow.won > 0) {
		return (
			evaluatePointsFormula(ts, {
				season: ts.season,
			}) /
			evaluatePointsFormula(dummyRow, {
				season: ts.season,
			})
		);
	}

	return 0;
};

export default ptsPct;
