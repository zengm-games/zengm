// @flow

import booleanParser from "boolean-parser";
import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";

// false - doesn't match. true - does match
const createFilterFunction = (originalFilterText: string, sortType: string) => {
	const matches = booleanParser.parseBooleanQuery(originalFilterText);

	return value => {
		if (matches.length === 0) {
			return true;
		}

		let foundMatch = false;

		for (const match of matches) {
			let noMatch = false;
			for (const filterText of match) {
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

					if (direction === ">" && numericVal < number) {
						noMatch = true;
						break;
					}
					if (direction === "<" && numericVal > number) {
						noMatch = true;
						break;
					}
					if (direction === "=" && numericVal !== number) {
						noMatch = true;
						break;
					}
					if (
						direction === undefined &&
						!getSearchVal(value).includes(filterText)
					) {
						noMatch = true;
						break;
					}
				} else {
					if (filterText === "") {
						continue;
					}

					if (!getSearchVal(value).includes(filterText)) {
						noMatch = true;
						break;
					}
				}
			}
			if (!noMatch) {
				foundMatch = true;
			}
		}

		return foundMatch;
	};
};

export default createFilterFunction;
