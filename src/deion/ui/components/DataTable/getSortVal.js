// @flow

import React from "react";
import textContent from "react-addons-text-content";
import type { SortType } from "../../../common/types";

const getSortVal = (value: any = null, sortType: SortType | void) => {
    try {
        let val;
        let sortVal;

        // Get the right 'value'.
        if (value !== null && value.hasOwnProperty("value")) {
            val = value.value;
        } else {
            val = value;
        }

        if (React.isValidElement(val)) {
            sortVal = textContent(val);
        } else {
            sortVal = val;
        }

        if (sortType === "number") {
            if (sortVal === null) {
                return -Infinity;
            }
            if (typeof sortVal === "string") {
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
            return parseInt(sortVal.split("-")[0], 10);
        }
        if (sortType === "draftPick") {
            if (sortVal === null) {
                return null;
            }
            const [round, pick] = sortVal.split("-");

            // This assumes no league has more than a million teams lol
            return parseInt(round, 10) * 1000000 + parseInt(pick, 10);
        }
        if (sortType === "name") {
            if (sortVal === null) {
                return null;
            }
            const parts = sortVal.split(" (")[0].split(" ");

            const lastName = parts[parts.length - 1];

            // For "Bob Smith Jr." and similar names, return "Smith" not "Jr."
            // Eventually should probably unify this with the code in tools/names.js
            const suffixes = ["Jr", "Jr.", "Sr", "Sr."];
            if (
                parts.length > 2 &&
                (suffixes.includes(lastName) ||
                    lastName === lastName.toUpperCase())
            ) {
                return parts[parts.length - 2];
            }

            return lastName;
        }
        if (sortType === "currency") {
            if (sortVal === null || sortVal === "") {
                return -Infinity;
            }
            // Drop $ and parseFloat will just keep the numeric part at the beginning of the string
            if (sortVal.includes("B")) {
                return parseFloat(sortVal.replace("$", "")) * 1000;
            }
            return parseFloat(sortVal.replace("$", ""));
        }
        if (sortType === "record") {
            if (sortVal === null) {
                return -Infinity;
            }

            let [won, lost, tied] = sortVal
                .split("-")
                .map(num => parseInt(num, 10));

            if (typeof tied !== "number") {
                tied = 0;
            }

            if (won + lost + tied > 0) {
                // Sort by wins, winp
                return won + (won + 0.5 * tied) / (won + lost + tied);
            }

            return 0;
        }
        return sortVal;
    } catch (err) {
        console.error(
            `getSortVal error on value "${String(
                value,
            )}" and sortType "${String(sortType)}"`,
            err,
        );
        return null;
    }
};

export default getSortVal;
