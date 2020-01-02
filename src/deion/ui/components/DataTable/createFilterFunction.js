// @flow

import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";

// false - doesn't match. true - does match
const createFilterFunction = (filterText: string, sortType: string) => {
	if (sortType === "number" || sortType === "currency") {
		let number = filterText.replace(/[^0-9.<>]/g, "");
		let direction;
		if (number[0] === ">" || number[0] === "<" || number[0] === "=") {
			direction = number[0];
			number = number.slice(1); // Remove first char
		}
		number = parseFloat(number);

		return value => {
			if (Number.isNaN(number)) {
				return true;
			}

			const numericVal = parseFloat(getSortVal(value, sortType));
			if (Number.isNaN(numericVal)) {
				return true;
			}

			if (direction === ">" && numericVal < number) {
				return false;
			}
			if (direction === "<" && numericVal > number) {
				return false;
			}
			if (direction === "=" && numericVal !== number) {
				return false;
			}
			if (
				direction === undefined &&
				!getSearchVal(value).includes(filterText)
			) {
				return false;
			}
		};
	}

	return value => {
		if (filterText === "") {
			return true;
		}

		if (!getSearchVal(value).includes(filterText)) {
			return false;
		}

		return true;
	};
};

export default createFilterFunction;
