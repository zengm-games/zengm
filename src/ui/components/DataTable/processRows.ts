import type { DataTableRow, Props } from ".";
import { normalizeIntl } from "../../../common/normalizeIntl";
import { orderBy } from "../../../common/utils";
import createFilterFunction from "./createFilterFunction";
import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";
import type { State } from "./loadStateFromCache";

export const processRows = ({
	cols,
	rankCol,
	rows,
	state,
}: {
	state: State;
} & Pick<Props, "cols" | "rankCol" | "rows">) => {
	const filterFunctions = state.enableFilters
		? state.filters.map((filter, i) =>
				createFilterFunction(
					filter,
					cols[i] ? cols[i].sortType : undefined,
					cols[i] ? cols[i].searchType : undefined,
				),
			)
		: [];
	const skipFiltering = state.searchText === "" && !state.enableFilters;
	const searchText = normalizeIntl(state.searchText);
	const rowsFiltered = skipFiltering
		? rows
		: rows.filter(row => {
				// Search
				if (state.searchText !== "") {
					let found = false;

					for (let i = 0; i < row.data.length; i++) {
						// cols[i] might be undefined if number of columns in a table changed
						if (cols[i]?.noSearch) {
							continue;
						}

						if (
							normalizeIntl(getSearchVal(row.data[i], false)).includes(
								searchText,
							)
						) {
							found = true;
							break;
						}
					}

					if (!found) {
						return false;
					}
				}

				// Filter
				if (state.enableFilters) {
					for (let i = 0; i < row.data.length; i++) {
						// cols[i] might be undefined if number of columns in a table changed
						if (cols[i]?.noSearch) {
							continue;
						}

						if (
							filterFunctions[i] &&
							filterFunctions[i](row.data[i]) === false
						) {
							return false;
						}
					}
				}

				return true;
			});

	let rowsOrdered;
	if (state.sortBys === undefined) {
		rowsOrdered = rowsFiltered;
	} else {
		const sortKeys = state.sortBys.map(sortBy => (row: DataTableRow) => {
			let i = sortBy[0];

			if (typeof i !== "number" || i >= row.data.length || i >= cols.length) {
				i = 0;
			}

			return getSortVal(row.data[i], cols[i].sortType);
		});

		rowsOrdered = orderBy(
			rowsFiltered,
			sortKeys,
			state.sortBys.map(sortBy => sortBy[1]),
		);
	}

	const colOrderFiltered = state.colOrder.filter(
		({ hidden, colIndex }) => !hidden && cols[colIndex],
	);

	return rowsOrdered.map((row, i) => {
		return {
			...row,
			data: colOrderFiltered.map(({ colIndex }) =>
				colIndex === rankCol ? i + 1 : row.data[colIndex],
			),
		};
	});
};
