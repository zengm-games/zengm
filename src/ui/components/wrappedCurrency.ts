import helpers from "../util/helpers.ts";

export const wrappedCurrency = (
	amount: number,
	initialUnits?: "M" | "",
	precision?: number,
) => {
	const value = helpers.formatCurrency(amount, initialUnits, precision);

	return {
		value,
		sortValue: amount,
		searchValue: value,
	};
};
