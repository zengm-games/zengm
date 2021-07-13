import { safeLocalStorage } from "../../util";
import type { Props, State, SortBy } from ".";
import SettingsCache from "./SettingsCache";

const loadStateFromCache = ({
	cols,
	disableSettingsCache,
	defaultSort,
	name,
}: Pick<
	Props,
	"cols" | "disableSettingsCache" | "defaultSort" | "name"
>): State => {
	const settingsCache = new SettingsCache(name, !!disableSettingsCache);

	// @ts-ignore
	let perPage = parseInt(safeLocalStorage.getItem("perPage"), 10);

	if (Number.isNaN(perPage)) {
		perPage = 10;
	}

	const sortBysFromStorage = settingsCache.get("DataTableSort");
	let sortBys: SortBy[];

	if (sortBysFromStorage === undefined) {
		sortBys = [defaultSort];
	} else {
		sortBys = sortBysFromStorage;
	}

	// Don't let sortBy reference invalid col
	sortBys = sortBys.filter(sortBy => sortBy[0] < cols.length);

	if (sortBys.length === 0) {
		sortBys = [defaultSort];
	}

	const defaultFilters: string[] = cols.map(() => "");
	const filtersFromStorage = settingsCache.get("DataTableFilters");
	let filters;

	if (filtersFromStorage === undefined) {
		filters = defaultFilters;
	} else {
		try {
			filters = filtersFromStorage;

			// Confirm valid filters
			if (!Array.isArray(filters) || filters.length !== cols.length) {
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
		colOrder = cols.map((col, i) => ({
			colIndex: i,
		}));
	}
	if (colOrder.length < cols.length) {
		// Add cols
		for (let i = 0; i < cols.length; i++) {
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
		prevName: name,
		searchText: "",
		showSelectColumnsModal: false,
		sortBys,
		settingsCache,
	};
};

export default loadStateFromCache;
