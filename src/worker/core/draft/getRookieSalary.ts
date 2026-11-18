import { g } from "../../util/index.ts";

// Rookie scale salary for an overall pick number (1 is the first pick). rookieSalaries is from getRookieSalaries, passed in so it is computed once when looking up many picks.
export const getRookieSalaryByPickNumber = (
	pickNumber: number,
	rookieSalaries: number[],
) => {
	// The rookie scale only covers numDraftRounds full rounds, but some drafts have more picks, like real drafts with extra rounds or picks. The end of the scale is the min contract anyway.
	return rookieSalaries[pickNumber - 1] ?? g.get("minContract");
};

// Rookie scale salary for a draft pick. rookieSalaries is from getRookieSalaries, passed in so it is computed once when looking up many picks.
export const getRookieSalary = (
	{ round, pick }: { round: number; pick: number },
	rookieSalaries: number[],
) => {
	return getRookieSalaryByPickNumber(
		pick + g.get("numActiveTeams") * (round - 1),
		rookieSalaries,
	);
};
