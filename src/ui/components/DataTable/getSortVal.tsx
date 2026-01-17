import { isValidElement } from "react";
// @ts-expect-error
import textContent from "react-addons-text-content";
import type { SortType } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import { normalizeIntl } from "../../../common/normalizeIntl.ts";
import { POSITIONS } from "../../../common/index.ts";

const getSortVal = (
	value: any = null,
	sortType: SortType | undefined,
	exportCSV?: boolean,
) => {
	try {
		let val;
		let sortVal: string;

		// Get the right 'value'.
		if (value != null && Object.hasOwn(value, "sortValue")) {
			val = value.sortValue;
		} else if (value != null && Object.hasOwn(value, "value")) {
			val = value.value;
		} else {
			val = value;
		}

		if (isValidElement(val)) {
			sortVal = textContent(val);
		} else {
			sortVal = val;
		}

		if (sortType === "number") {
			if (sortVal === null) {
				return -Infinity;
			}

			if (typeof sortVal === "string") {
				// "" happens for game highs with no value, like a player with 0 GP
				if (sortVal === "--:--" || sortVal === "" || sortVal === "-inf") {
					// Sort below 0
					return -Infinity;
				}

				if (sortVal === "inf") {
					return Infinity;
				}

				if (sortVal.includes(":")) {
					const parts = sortVal.split(":");
					const minutes = parts[0] ? Number.parseInt(parts[0]) : 0;
					const seconds = parts[1] ? Number.parseInt(parts[1]) : 0;
					return minutes + seconds / 60;
				}

				sortVal = sortVal.replaceAll(",", "");
			}

			if (typeof sortVal !== "number") {
				return helpers.localeParseFloat(sortVal);
			}

			return val;
		}

		if (sortType === "lastTen") {
			if (sortVal === null) {
				return null;
			}

			const [won] = sortVal.split("-");
			if (won === undefined) {
				return null;
			}

			return Number.parseInt(won);
		}

		if (sortType === "draftPick") {
			if (sortVal === null) {
				return null;
			}

			const [round, pick] = sortVal.split("-"); // This assumes no league has more than a million teams lol

			let number;
			if (round !== undefined && pick !== undefined) {
				number = Number.parseInt(round) * 1000000 + Number.parseInt(pick);
			}

			// Handle any weird values, like "none" or "undrafted" or whatever. Such as on "Best Player at Every Pick"
			if (number === undefined || Number.isNaN(number)) {
				return Infinity;
			}
			return number;
		}

		if (sortType === "record") {
			return helpers.getRecordNumericValue(sortVal);
		}

		if (sortType === "country") {
			// Switch something like "Alabama, USA" to "USA, Alabama" so it sorts on country first
			const parts = sortVal.split(", ");
			parts.reverse();
			return parts.join(", ");
		}

		if (sortType === "pos") {
			return POSITIONS.indexOf(sortVal);
		}

		if (typeof sortVal === "string") {
			return normalizeIntl(sortVal);
		}

		return sortVal;
	} catch (error) {
		console.error(
			`getSortVal error on value "${String(value)}" and sortType "${String(
				sortType,
			)}"`,
			error,
		);
		return null;
	}
};

export default getSortVal;
