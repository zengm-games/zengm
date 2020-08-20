import { safeLocalStorage } from "../../util";
import type { Props, SortBy } from ".";
import SettingsCache from "./SettingsCache";

const loadStateFromCache = (props: Props) => {
	const settingsCache = new SettingsCache(
		props.name,
		!!props.disableSettingsCache,
	);

	// @ts-ignore
	let perPage = parseInt(safeLocalStorage.getItem("perPage"), 10);

	if (Number.isNaN(perPage)) {
		perPage = 10;
	}

	const sortBysFromStorage = settingsCache.get("DataTableSort");
	let sortBys: SortBy[];

	if (sortBysFromStorage === undefined) {
		sortBys = [props.defaultSort];
	} else {
		sortBys = sortBysFromStorage;
	}

	// Don't let sortBy reference invalid col
	sortBys = sortBys.filter(sortBy => sortBy[0] < props.cols.length);

	if (sortBys.length === 0) {
		sortBys = [props.defaultSort];
	}

	const defaultFilters: string[] = props.cols.map(() => "");
	const filtersFromStorage = settingsCache.get("DataTableFilters");
	let filters;

	if (filtersFromStorage === undefined) {
		filters = defaultFilters;
	} else {
		try {
			filters = filtersFromStorage;

			// Confirm valid filters
			if (!Array.isArray(filters) || filters.length !== props.cols.length) {
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

	let colOrder = settingsCache.get("DataTableColOrder");
	if (!colOrder) {
		colOrder = props.cols.map((col, i) => ({
			colIndex: i,
		}));
	}
	if (colOrder.length < props.cols.length) {
		// Add cols
		for (let i = 0; i < props.cols.length; i++) {
			if (!colOrder.some((x: any) => x && x.colIndex === i)) {
				colOrder.push({
					colIndex: i,
				});
			}
		}
	}
	// If too many cols... who cares, will get filtered out

	return {
		colOrder,
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
