import { helpers } from "../../util";
import type { Basketball } from "./loadData.basketball";

export const averageSalary = (
	row: Basketball["salaries"][number],
	start: number,
	exp: number,
) => {
	if (start < row.start) {
		start = row.start;
	}
	if (exp > row.exp) {
		exp = row.exp;
	}

	const amountStart = start - row.start;
	const amountYearsToKeep = exp - start + 1;
	const amounts = row.amounts.slice(
		amountStart,
		amountStart + amountYearsToKeep,
	);

	let average = 0;
	for (const amount of amounts) {
		average += amount;
	}
	average /= amounts.length * 1000;

	const rounded = helpers.roundContract(average);

	return rounded;
};
