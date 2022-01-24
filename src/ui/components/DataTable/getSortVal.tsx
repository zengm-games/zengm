import { isValidElement } from "react";
// @ts-expect-error
import textContent from "react-addons-text-content";
import type { SortType } from "../../../common/types";

const getSortVal = (
	value: any = null,
	sortType: SortType | undefined,
	exportCSV?: boolean,
) => {
	try {
		let val;
		let sortVal: string;

		// Get the right 'value'.
		if (value != null && value.hasOwnProperty("sortValue")) {
			val = value.sortValue;
		} else if (value != null && value.hasOwnProperty("value")) {
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
				if (sortVal === "--:--") {
					// Sort below 0
					return -Infinity;
				}

				if (sortVal.includes(":")) {
					const parts = sortVal.split(":");
					const minutes = parseInt(parts[0]);
					const seconds = parseInt(parts[1]);
					return minutes + seconds / 60;
				}

				sortVal = sortVal.replace(/,/g, "");
			}

			if (typeof sortVal !== "number") {
				return parseFloat(sortVal);
			}

			return val;
		}

		if (sortType === "lastTen") {
			if (sortVal === null) {
				return null;
			}

			return parseInt(sortVal.split("-")[0]);
		}

		if (sortType === "draftPick") {
			if (sortVal === null) {
				return null;
			}

			const [round, pick] = sortVal.split("-"); // This assumes no league has more than a million teams lol

			return parseInt(round) * 1000000 + parseInt(pick);
		}

		if (sortType === "name") {
			if (sortVal === null) {
				return null;
			}

			const parts = sortVal.split(" (")[0].split(" ");
			let lastName = parts.at(-1);

			// For "Bob Smith Jr." and similar names, return "Smith" not "Jr."
			// Eventually should probably unify this with the code in tools/names.js
			const suffixes = ["Jr", "Jr.", "Sr", "Sr."];

			if (
				parts.length > 2 &&
				(suffixes.includes(lastName) || lastName === lastName.toUpperCase())
			) {
				lastName = parts[parts.length - 2];
			}

			return `${lastName} ${parts[0]}`;
		}

		if (sortType === "currency") {
			if (sortVal === null || sortVal === "") {
				return -Infinity;
			}

			// Keep in sync with helpers.formatCurrency
			let factor;
			if (sortVal.endsWith("Q")) {
				factor = 1e15;
			} else if (sortVal.endsWith("T")) {
				factor = 1e12;
			} else if (sortVal.endsWith("B")) {
				factor = 1e9;
			} else if (sortVal.endsWith("M")) {
				factor = 1e6;
			} else if (sortVal.endsWith("k")) {
				factor = 1e3;
			} else {
				factor = 1;
			}

			// Drop $ and parseFloat will just keep the numeric part at the beginning of the string
			const parsedNumber = parseFloat(sortVal.replace("$", ""));

			if (!exportCSV) {
				// This gets called by filter functions, which expect it to be in millions
				factor /= 1e6;
			}

			const number = parsedNumber * factor;
			if (factor > 1) {
				// Get rid of floating point errors if we're multiplying by a large number
				return Math.round(number);
			}

			return number;
		}

		if (sortType === "record") {
			if (sortVal === null) {
				return -Infinity;
			}

			let [won, lost, otl, tied] = sortVal.split("-").map(num => parseInt(num));

			// Technically, if only one of "tied" or "otl" is present, we can't distinguish. Assume it's tied, in that case.
			if (typeof otl === "number" && typeof tied !== "number") {
				tied = otl;
				otl = 0;
			}

			if (typeof otl !== "number") {
				otl = 0;
			}
			if (typeof tied !== "number") {
				tied = 0;
			}

			if (won + lost + otl + tied > 0) {
				// Sort by wins, winp
				return won + (won + 0.5 * tied) / (won + lost + otl + tied);
			}

			return 0;
		}

		return sortVal;
	} catch (err) {
		console.error(
			`getSortVal error on value "${String(value)}" and sortType "${String(
				sortType,
			)}"`,
			err,
		);
		return null;
	}
};

export default getSortVal;
