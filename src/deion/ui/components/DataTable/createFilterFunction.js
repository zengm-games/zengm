// @flow

import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";
import type { SortType } from "../../../common/types";

const createFilterFunction = (
	originalFilterText: string,
	sortType?: SortType,
) => {
	const filterTexts = originalFilterText
		.split("|")
		.map(text => text.trim())
		.filter(text => text !== "" && text !== "|");

	// false - doesn't match. true - does match
	return (value: any) => {
		if (filterTexts.length === 0) {
			return true;
		}

		for (const filterText of filterTexts) {
			if (sortType === "number" || sortType === "currency") {
				let number = filterText.replace(/[^0-9.<>]/g, "");
				let direction;
				if (number[0] === ">" || number[0] === "<" || number[0] === "=") {
					direction = number[0];
					number = number.slice(1); // Remove first char
				}
				number = parseFloat(number);

				if (Number.isNaN(number)) {
					continue;
				}

				const numericVal = parseFloat(getSortVal(value, sortType));
				if (Number.isNaN(numericVal)) {
					continue;
				}

				if (direction === ">" && numericVal >= number) {
					return true;
				}
				if (direction === "<" && numericVal <= number) {
					return true;
				}
				if (direction === "=" && numericVal === number) {
					return true;
				}
				if (
					direction === undefined &&
					getSearchVal(value).includes(filterText)
				) {
					return true;
				}
			} else if (getSearchVal(value).includes(filterText)) {
				return true;
			}
		}

		return false;
	};
};

export default createFilterFunction;
