// @flow

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

    const defaultFilters: string[] = props.cols.map(() => "");
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
                    if (typeof filter !== "string") {
                        filters = defaultFilters;
                        break;
                    }
                }
            }
        } catch (err) {
            filters = defaultFilters;
        }
    }

    return {
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
