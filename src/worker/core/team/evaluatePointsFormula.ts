import { DEFAULT_POINTS_FORMULA } from "../../../common";
import { g } from "../../util";
import FormulaEvaluator from "../../util/FormulaEvaluator";

const SYMBOLS = ["W", "L", "T", "OTL"] as const;

// Would be nicer if it inferred `typeof SYMBOLS` from the super call, but it seems not to.
export class PointsFormulaEvaluator extends FormulaEvaluator<typeof SYMBOLS> {
	constructor(equation: string) {
		super(equation.toUpperCase(), SYMBOLS);

		// Run it once, just to confirm it works up front
		this.evaluate({
			W: 1,
			L: 2,
			OTL: 3,
			T: 4,
		});
	}
}

const formulaCache: Record<string, PointsFormulaEvaluator> = {};

const evaluatePointsFormula = (
	data: {
		won: number;
		lost: number;
		otl: number;
		tied: number;
	},
	{
		formula,
		season = g.get("season"),
	}: {
		formula?: string;
		season?: number;
	} = {},
) => {
	let pointsFormula = formula ?? g.get("pointsFormula", season);
	if (pointsFormula === "") {
		// Even if no formula defined (sort by win%), use the default, so points can still be displayed
		pointsFormula = DEFAULT_POINTS_FORMULA;
	}

	if (!formulaCache[pointsFormula]) {
		formulaCache[pointsFormula] = new PointsFormulaEvaluator(pointsFormula);
	}
	return formulaCache[pointsFormula].evaluate({
		W: data.won,
		L: data.lost,
		OTL: data.otl,
		T: data.tied,
	});
};

export default evaluatePointsFormula;
