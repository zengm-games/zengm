import { safeLocalStorage } from "../../util/index.ts";
import type { Props, SortBy, StickyCols } from "./index.tsx";
import SettingsCache from "./SettingsCache.ts";

export type State = {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	currentPage: number;
	enableFilters: boolean;
	filters: string[];
	hideAllControls: boolean;
	prevName: string;
	perPage: number;
	searchText: string;
	showSelectColumnsModal: boolean;
	sortBys: SortBy[] | undefined;
	stickyCols: StickyCols;
	settingsCache: SettingsCache;
};

export type LoadStateFromCacheProps = Pick<
	Props,
	"cols" | "disableSettingsCache" | "defaultSort" | "defaultStickyCols" | "name"
> &
	Pick<State, "hideAllControls">;

const loadStateFromCache = ({
	cols,
	disableSettingsCache,
	defaultSort,
	defaultStickyCols,
	hideAllControls,
	name,
}: LoadStateFromCacheProps): State => {
	const settingsCache = new SettingsCache(name, !!disableSettingsCache);

	// @ts-expect-error
	let perPage = Number.parseInt(safeLocalStorage.getItem("perPage"));

	if (Number.isNaN(perPage)) {
		perPage = 10;
	}

	const sortBysFromStorage = settingsCache.get("DataTableSort");
	let sortBys: SortBy[] | undefined;

	if (defaultSort !== "disableSort") {
		if (sortBysFromStorage === undefined) {
			sortBys = [defaultSort];
		} else {
			sortBys = sortBysFromStorage as SortBy[];
		}

		// Don't let sortBy reference invalid col
		sortBys = sortBys.filter((sortBy) => sortBy[0] < cols.length);

		if (sortBys.length === 0) {
			sortBys = [defaultSort];
		}
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
		} catch {
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

	const stickyCols =
		settingsCache.get("DataTableStickyCols") ?? defaultStickyCols;

	return {
		colOrder,
		currentPage: 1,
		enableFilters: !hideAllControls && filters !== defaultFilters,
		filters,
		hideAllControls, // So we can know if this changes and reset state
		perPage,
		prevName: name,
		searchText: "",
		showSelectColumnsModal: false,
		sortBys,
		stickyCols,
		settingsCache,
	};
};

export default loadStateFromCache;
