import { helpers } from "../../util/index.ts";
import evaluatePointsFormula from "./evaluatePointsFormula.ts";

const ptsMax = (ts: {
	won: number;
	lost: number;
	tied: number;
	otl: number;
	season: number;
}) => {
	const dummyRow = {
		won: helpers.getTeamSeasonGp(ts),
		lost: 0,
		tied: 0,
		otl: 0,
	};

	return evaluatePointsFormula(dummyRow, {
		season: ts.season,
	});
};

export default ptsMax;
