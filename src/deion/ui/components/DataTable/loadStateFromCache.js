// @flow

import getSearchVal from "./getSearchVal";
import { overrides } from "../../util";
import type { Props, SortBy } from ".";

const loadStateFromCache = (props: Props) => {
    let perPage = parseInt(localStorage.getItem("perPage"), 10);
    if (Number.isNaN(perPage)) {
        perPage = 10;
    }

    const sortBysJSON = localStorage.getItem(`DataTableSort:${props.name}`);
    let sortBys: SortBy[];
    if (sortBysJSON === null || sortBysJSON === undefined) {
        sortBys = [props.defaultSort];
    } else {
        try {
            sortBys = JSON.parse(sortBysJSON);
        } catch (err) {
            sortBys = [props.defaultSort];
        }
    }

    // Don't let sortBy reference invalid col
    // $FlowFixMe
    sortBys = sortBys.filter(sortBy => sortBy[0] < props.cols.length);
    if (sortBys.length === 0) {
        sortBys = [props.defaultSort];
    }

    let allPositions;
    let posInd;
    const defaultFilters: string[] = props.cols.map((col, i) => {
        if (col.title !== "Pos") {
            return "";
        }

        // Special case stuff for position filter
        posInd = i;
        allPositions = new Set();
        for (const row of props.rows) {
            const val = getSearchVal(row.data[i], false);
            allPositions.add(val);
        }
        allPositions = overrides.constants.POSITIONS.filter(pos =>
            allPositions.has(pos),
        ).concat(
            Array.from(allPositions).filter(
                pos => !overrides.constants.POSITIONS.includes(pos),
            ),
        );
        return allPositions;
    });
    const filtersFromStorage = localStorage.getItem(
        `DataTableFilters:${props.name}`,
    );

    let filters;
    if (!filtersFromStorage) {
        filters = defaultFilters;
    } else {
        try {
            filters = JSON.parse(filtersFromStorage);

            // Confirm valid filters
            if (
                !Array.isArray(filters) ||
                filters.length !== props.cols.length
            ) {
                filters = defaultFilters;
            } else {
                for (const filter of filters) {
                    if (typeof filter !== "string" && !Array.isArray(filter)) {
                        filters = defaultFilters;
                        break;
                    }
                }
            }
        } catch (err) {
            filters = defaultFilters;
        }
    }

    // If using default, overwrite with default positions. If using saved filters with a text search (legacy), overwrite with default positions.
    if (posInd !== undefined) {
        if (filters === defaultFilters || !Array.isArray(filters[posInd])) {
            filters[posInd] = allPositions;
        }
    }

    return {
        allPositions,
        currentPage: 1,
        enableFilters: filters !== defaultFilters,
        filters,
        perPage,
        prevName: props.name,
        searchText: "",
        sortBys,
    };
};

export default loadStateFromCache;
