import type { AwardSettingIndividual } from "../../../common/types.ts";

// If two awards share the same formula, we can only need to evaluate the formula once! Unless they have different values of some properties like statRange which change the result...
export const hashFormula = (
	award: Pick<
		AwardSettingIndividual,
		"formula" | "formulaByPos" | "mip" | "statRange"
	>,
	pos: string,
) => {
	const formula = award.formulaByPos?.[pos] ?? award.formula;

	let formulaHash;
	if (award.mip === undefined) {
		if (award.statRange === undefined) {
			formulaHash = formula;
		} else {
			formulaHash = JSON.stringify([formula, award.statRange]);
		}
	} else {
		formulaHash = JSON.stringify([formula, award.mip, award.statRange]);
	}

	return { formula, formulaHash };
};
