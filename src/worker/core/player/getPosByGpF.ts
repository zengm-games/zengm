import { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball.ts";

export const getPosByGpF = (
	gpF: (number | undefined)[] | undefined,
	defaultPos: string = "?",
) => {
	if (!gpF) {
		return defaultPos;
	}
	let posIndex = -1;
	let maxGP = -Infinity;
	for (const [i, gp] of gpF.entries()) {
		if (gp !== undefined && gp > maxGP) {
			posIndex = i;
			maxGP = gp;
		}
	}
	return (
		(POS_NUMBERS_INVERSE as unknown as string[])[posIndex + 1] ?? defaultPos
	);
};
