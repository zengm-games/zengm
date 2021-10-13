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

			const not = text[0] === "!";
			if (not) {
				text = text.slice(1);
			}

			let exact = false;
			if (text.length > 2 && text[0] === '"' && text.at(-1) === '"') {
				exact = true;
				text = text.slice(1, -1);
			}

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
				exact,
				not,
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

		for (const { direction, exact, not, number, text } of filters) {
			if (not) {
				const checkTextSearch = () => {
					const searchVal = getSearchVal(value);

					if (!exact && !searchVal.includes(text)) {
						return true;
					}

					if (exact && searchVal !== text) {
						return true;
					}

					return false;
				};

				if (typeof number === "number") {
					const numericVal = parseFloat(getSortVal(value, sortType));

					if (Number.isNaN(numericVal)) {
						continue;
					}

					if (direction === ">" && numericVal <= number) {
						return true;
					}

					if (direction === "<" && numericVal >= number) {
						return true;
					}

					if (direction === "=" && numericVal !== number) {
						return true;
					}

					if (direction === undefined) {
						if (checkTextSearch()) {
							return true;
						}
					}
				} else {
					if (checkTextSearch()) {
						return true;
					}
				}
			} else {
				const checkTextSearch = () => {
					const searchVal = getSearchVal(value);

					if (!exact && searchVal.includes(text)) {
						return true;
					}

					if (exact && searchVal === text) {
						return true;
					}

					return false;
				};

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

					if (direction === undefined) {
						if (checkTextSearch()) {
							return true;
						}
					}
				} else {
					if (checkTextSearch()) {
						return true;
					}
				}
			}
		}

		return false;
	};
};

export default createFilterFunction;
