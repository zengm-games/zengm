import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";
import type { SortType } from "../../../common/types";

// searchType is assumed to be equal to sortType, unless it's specified
const createFilterFunction = (
	originalFilterText: string,
	sortType?: SortType,
	searchType?: SortType,
) => {
	searchType = searchType ?? sortType;

	const filters = originalFilterText
		.split("|")
		.map(text => text.trim().toLowerCase())
		.filter(text => text !== "" && text !== "|")
		.map(text => {
			let direction;
			let number;

			if (
				searchType === "number" ||
				searchType === "currency" ||
				searchType === "draftPick"
			) {
				number = text.replace(/[^-?0-9.<>=]/g, "");
				if (number[0] === ">" || number[0] === "<" || number[0] === "=") {
					direction = number[0];
					number = number.slice(1); // Remove first char
				}

				if (searchType === "draftPick") {
					if (direction) {
						number = getSortVal(number, "draftPick");
					} else {
						// No direction? Just treat it like text search
						number = undefined;
					}
				} else {
					number = parseFloat(number);
				}
			}

			return {
				direction,
				number,
				text,
			};
		})
		.filter(({ number }) => {
			if (number !== undefined) {
				return !Number.isNaN(number);
			}

			return true;
		});

	// false - doesn't match. true - does match
	return (value: any) => {
		if (filters.length === 0) {
			return true;
		}

		for (const { direction, number, text } of filters) {
			if (typeof number === "number") {
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

				if (direction === undefined && getSearchVal(value).includes(text)) {
					return true;
				}
			} else if (getSearchVal(value).includes(text)) {
				return true;
			}
		}

		return false;
	};
};

export default createFilterFunction;
