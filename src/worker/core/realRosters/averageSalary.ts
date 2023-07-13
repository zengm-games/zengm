import { helpers } from "../../util";
import type { Basketball } from "./loadData.basketball";

export const averageSalary = (
	row: Basketball["salaries"][number],
	start: number,
	exp: number,
) => {
	if (start < row.start) {
		throw new Error("Invalid start");
	}
	if (exp > row.exp) {
		throw new Error("Invalid exp");
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
