import getSearchVal from "./getSearchVal.tsx";
import getSortVal from "./getSortVal.tsx";
import type { SortType } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import { normalizeIntl } from "../../../common/normalizeIntl.ts";

type Direction = ">" | "<" | "=" | undefined;

const evalFilter = (
	{
		direction,
		exact,
		not,
		number,
		text,
	}: {
		direction: Direction;
		exact: boolean;
		not: boolean;
		number: number | undefined;
		text: string;
	},
	sortType: SortType | undefined,
	value: any,
) => {
	if (not) {
		const checkTextSearch = () => {
			const searchVal = normalizeIntl(getSearchVal(value, false));

			if (!exact && !searchVal.includes(text)) {
				return true;
			}

			if (exact && searchVal !== text) {
				return true;
			}

			return false;
		};

		if (typeof number === "number") {
			const numericVal = helpers.localeParseFloat(getSortVal(value, sortType));

			if (direction === ">" && numericVal <= number + Number.EPSILON) {
				return true;
			}

			if (direction === "<" && numericVal + Number.EPSILON >= number) {
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
			const searchVal = normalizeIntl(getSearchVal(value, false));

			if (!exact && searchVal.includes(text)) {
				return true;
			}

			if (exact && searchVal === text) {
				return true;
			}

			return false;
		};

		if (typeof number === "number") {
			const numericVal = helpers.localeParseFloat(getSortVal(value, sortType));

			if (direction === ">" && numericVal + Number.EPSILON >= number) {
				return true;
			}

			if (direction === "<" && numericVal <= number + Number.EPSILON) {
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

	return false;
};

// searchType is assumed to be equal to sortType, unless it's specified
const createFilterFunction = (
	originalFilterText: string,
	sortType?: SortType,
	searchType?: SortType,
) => {
	searchType = searchType ?? sortType;

	const orOrAnd = originalFilterText.includes("&") ? "&" : ("|" as const);

	const filters = originalFilterText
		.split(orOrAnd)
		.map((text) => text.trim())
		.filter((text) => text !== "")
		.map((text) => {
			let direction: Direction;
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

			text = normalizeIntl(text);

			if (searchType === "number" || searchType === "draftPick") {
				number = text.replace(/[^\d.<=>?-]/g, "");
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
					number = helpers.localeParseFloat(number);
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
			if (number !== undefined && Number.isNaN(number)) {
				return false;
			}

			return true;
		});

	// false - doesn't match. true - does match
	return (value: any) => {
		if (filters.length === 0) {
			return true;
		}

		for (const filter of filters) {
			const match = evalFilter(filter, sortType, value);

			if (orOrAnd === "|" && match) {
				return true;
			}

			if (orOrAnd === "&" && !match) {
				return false;
			}
		}

		// If none of the ORs matched, false. If all of the ANDs matched, true.
		return orOrAnd === "|" ? false : true;
	};
};

export default createFilterFunction;
