import classNames from "classnames";
import { csvFormatRows } from "d3-dsv";
import orderBy from "lodash-es/orderBy";
import {
	SyntheticEvent,
	MouseEvent,
	ReactNode,
	useState,
	useEffect,
	useCallback,
} from "react";
import Controls from "./Controls";
import CustomizeColumns from "./CustomizeColumns";
import Footer from "./Footer";
import Header from "./Header";
import Info from "./Info";
import Row from "./Row";
import Pagination from "./Pagination";
import PerPage from "./PerPage";
import createFilterFunction from "./createFilterFunction";
import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";
import loadStateFromCache from "./loadStateFromCache";
import ResponsiveTableWrapper from "../ResponsiveTableWrapper";
import { downloadFile, helpers, safeLocalStorage } from "../../util";
import type { SortOrder, SortType } from "../../../common/types";
import type { Argument } from "classnames";
import { arrayMoveImmutable } from "array-move";
import type SettingsCache from "./SettingsCache";
import updateSortBys from "./updateSortBys";

export type SortBy = [number, SortOrder];

export type Col = {
	classNames?: any;
	desc?: string;
	noSearch?: boolean;
	sortSequence?: SortOrder[];
	sortType?: SortType;
	searchType?: SortType;
	title: string;
	width?: string;
};

export type SuperCol = {
	colspan: number;
	desc?: string;
	title: string | ReactNode;
};

export type DataTableRow = {
	key: number | string;
	data: (
		| ReactNode
		| {
				classNames?: Argument;
				value: ReactNode;
				searchValue?: string;
				sortValue?: string | number;
		  }
	)[];
	classNames?: Argument;
};

export type Props = {
	className?: string;
	clickable?: boolean;
	cols: Col[];
	defaultSort: SortBy;
	disableSettingsCache?: boolean;
	footer?: any[];
	hideAllControls?: boolean;
	name: string;
	nonfluid?: boolean;
	pagination?: boolean;
	rankCol?: number;
	rows: DataTableRow[];
	small?: boolean;
	striped?: boolean;
	superCols?: SuperCol[];
	addFilters?: (string | undefined)[];
};

export type State = {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	currentPage: number;
	enableFilters: boolean;
	filters: string[];
	prevName: string;
	perPage: number;
	searchText: string;
	showSelectColumnsModal: boolean;
	sortBys: SortBy[];
	settingsCache: SettingsCache;
};

const DataTable = ({
	className,
	clickable = true,
	cols,
	defaultSort,
	disableSettingsCache,
	footer,
	hideAllControls,
	name,
	nonfluid,
	pagination,
	rankCol,
	rows,
	small,
	striped,
	superCols,
	addFilters,
}: Props) => {
	const [state, setState] = useState<State>(() =>
		loadStateFromCache({
			cols,
			defaultSort,
			disableSettingsCache,
			name,
		}),
	);

	const setStatePartial = useCallback((newState: Partial<State>) => {
		setState(state2 => ({
			...state2,
			...newState,
		}));
	}, []);

	const processRows = () => {
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
		const searchText = state.searchText.toLowerCase();
		const rowsFiltered = skipFiltering
			? rows
			: rows.filter(row => {
					// Search
					if (state.searchText !== "") {
						let found = false;

						for (let i = 0; i < row.data.length; i++) {
							if (cols[i].noSearch) {
								continue;
							}

							if (getSearchVal(row.data[i]).includes(searchText)) {
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
							if (cols[i].noSearch) {
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

		const rowsOrdered = orderBy(
			rowsFiltered,
			state.sortBys.map(sortBy => row => {
				let i = sortBy[0];

				if (typeof i !== "number" || i >= row.data.length || i >= cols.length) {
					i = 0;
				}

				return getSortVal(row.data[i], cols[i].sortType);
			}),
			state.sortBys.map(sortBy => sortBy[1]),
		);

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

	const handleColClick = (event: MouseEvent, i: number) => {
		const sortBys = updateSortBys({
			cols,
			event,
			i,
			prevSortBys: state.sortBys, // eslint-disable-line react/no-access-state-in-setstate
		});

		state.settingsCache.set("DataTableSort", sortBys);
		setStatePartial({
			currentPage: 1,
			sortBys,
		});
	};

	const handleExportCSV = () => {
		const colOrderFiltered = state.colOrder.filter(
			({ hidden, colIndex }) => !hidden && cols[colIndex],
		);
		const columns = colOrderFiltered.map(({ colIndex }) => cols[colIndex]);
		const colNames = columns.map(col => col.title);
		const rows = processRows().map(row =>
			row.data.map((val, i) => {
				const sortType = columns[i].sortType;
				if (sortType === "currency" || sortType === "number") {
					return getSortVal(val, sortType, true);
				}
				return getSearchVal(val, false);
			}),
		);
		const output = csvFormatRows([colNames, ...rows]);
		downloadFile(`${name}.csv`, output, "text/csv");
	};

	const handleResetTable = () => {
		state.settingsCache.clear("DataTableColOrder");
		state.settingsCache.clear("DataTableFilters");
		state.settingsCache.clear("DataTableSort");

		setState(
			loadStateFromCache({
				cols,
				defaultSort,
				disableSettingsCache,
				name,
			}),
		);
	};

	const handleSelectColumns = () => {
		setStatePartial({
			showSelectColumnsModal: true,
		});
	};

	const handleToggleFilters = () => {
		// Remove filter cache if hiding, add filter cache if displaying
		if (state.enableFilters) {
			state.settingsCache.clear("DataTableFilters");
		} else {
			state.settingsCache.set("DataTableFilters", state.filters);
		}

		setState(prevState => ({
			...prevState,
			enableFilters: !prevState.enableFilters,
		}));
	};

	const handleFilterUpdate = (
		event: SyntheticEvent<HTMLInputElement>,
		i: number,
	) => {
		const filters = helpers.deepCopy(state.filters); // eslint-disable-line react/no-access-state-in-setstate

		filters[i] = event.currentTarget.value;
		setStatePartial({
			currentPage: 1,
			filters,
		});
		state.settingsCache.set("DataTableFilters", filters);
	};

	const handlePagination = (newPage: number) => {
		if (newPage !== state.currentPage) {
			setStatePartial({
				currentPage: newPage,
			});
		}
	};

	const handlePerPage = (event: SyntheticEvent<HTMLSelectElement>) => {
		const perPage = parseInt(event.currentTarget.value);

		if (!Number.isNaN(perPage) && perPage !== state.perPage) {
			safeLocalStorage.setItem("perPage", String(perPage));
			setStatePartial({
				currentPage: 1,
				perPage,
			});
		}
	};

	const handleSearch = (event: SyntheticEvent<HTMLInputElement>) => {
		setStatePartial({
			currentPage: 1,
			searchText: event.currentTarget.value,
		});
	};

	// If name changes, it means this is a whole new table and it has a different state (example: Player Stats switching between regular and advanced stats).
	// If colOrder does not match cols, need to run reconciliation code in loadStateFromCache (example: current vs past seasons in League Finances).
	if (name !== state.prevName || cols.length > state.colOrder.length) {
		setState(
			loadStateFromCache({
				cols,
				defaultSort,
				disableSettingsCache,
				name,
			}),
		);
	}

	useEffect(() => {
		if (
			addFilters !== undefined &&
			addFilters.length === state.filters.length
		) {
			// If addFilters is passed and contains a value, merge with prevState.filters and enable filters
			const filters = helpers.deepCopy(state.filters);
			let changed = false;

			for (let i = 0; i < addFilters.length; i++) {
				const filter = addFilters[i];
				if (filter !== undefined) {
					filters[i] = filter;
					changed = true;
				} else if (!state.enableFilters) {
					// If there is a saved but hidden filter, remove it
					filters[i] = "";
				}
			}

			if (changed) {
				state.settingsCache.set("DataTableFilters", filters);
				setStatePartial({
					enableFilters: true,
					filters,
				});
			}
		}
	}, [
		addFilters,
		setStatePartial,
		state.enableFilters,
		state.filters,
		state.settingsCache,
	]);

	let processedRows = processRows();
	const numRowsFiltered = processedRows.length;
	const start = 1 + (state.currentPage - 1) * state.perPage;
	let end = start + state.perPage - 1;

	if (end > processedRows.length) {
		end = processedRows.length;
	}

	if (pagination) {
		processedRows = processedRows.slice(start - 1, end);
	}

	const colOrderFiltered = state.colOrder.filter(
		({ hidden, colIndex }) => !hidden && cols[colIndex],
	);

	const highlightCols = state.sortBys
		.map(sortBy => sortBy[0])
		.map(i =>
			colOrderFiltered.findIndex(({ colIndex }) => {
				if (colIndex !== i) {
					return false;
				}

				// Make sure sortSequence is not an empty array - same code is in Header
				const sortSequence = cols[colIndex].sortSequence;
				if (sortSequence && sortSequence.length === 0) {
					return false;
				}

				return true;
			}),
		);

	return (
		<>
			<CustomizeColumns
				cols={cols}
				colOrder={state.colOrder}
				hasSuperCols={!!superCols}
				show={state.showSelectColumnsModal}
				onHide={() => {
					setStatePartial({
						showSelectColumnsModal: false,
					});
				}}
				onReset={() => {
					const newOrder = cols.map((col, i) => ({
						colIndex: i,
					}));
					setStatePartial({
						colOrder: newOrder,
					});
					state.settingsCache.set("DataTableColOrder", newOrder);
				}}
				onSortEnd={({ oldIndex, newIndex }) => {
					const newOrder = arrayMoveImmutable(
						state.colOrder,
						oldIndex,
						newIndex,
					);
					setStatePartial({
						colOrder: newOrder,
					});
					state.settingsCache.set("DataTableColOrder", newOrder);
				}}
				onToggleHidden={(i: number) => () => {
					const newOrder = [...state.colOrder];
					if (newOrder[i]) {
						newOrder[i] = {
							...newOrder[i],
						};
						if (newOrder[i].hidden) {
							delete newOrder[i].hidden;
						} else {
							newOrder[i].hidden = true;
						}
						setStatePartial({
							colOrder: newOrder,
						});
						state.settingsCache.set("DataTableColOrder", newOrder);
					}
				}}
			/>
			<div
				className={classNames(className, {
					"table-nonfluid-wrapper": nonfluid,
				})}
			>
				<>
					{pagination && !hideAllControls ? (
						<PerPage onChange={handlePerPage} value={state.perPage} />
					) : null}
					<Controls
						enableFilters={state.enableFilters}
						hideAllControls={hideAllControls}
						name={name}
						onExportCSV={handleExportCSV}
						onResetTable={handleResetTable}
						onSearch={handleSearch}
						onSelectColumns={handleSelectColumns}
						onToggleFilters={handleToggleFilters}
						searchText={state.searchText}
					/>
					{nonfluid ? <div className="clearFix" /> : null}
				</>
				<ResponsiveTableWrapper
					className={pagination ? "fix-margin-pagination" : null}
					nonfluid={nonfluid}
				>
					<table
						className={classNames("table table-hover", {
							"table-sm": small !== false,
							"table-striped": striped !== false,
						})}
					>
						<Header
							colOrder={colOrderFiltered}
							cols={cols}
							enableFilters={state.enableFilters}
							filters={state.filters}
							handleColClick={handleColClick}
							handleFilterUpdate={handleFilterUpdate}
							sortBys={state.sortBys}
							superCols={superCols}
						/>
						<tbody>
							{processedRows.map(row => (
								<Row
									key={row.key}
									row={row}
									clickable={clickable}
									highlightCols={highlightCols}
								/>
							))}
						</tbody>
						<Footer
							colOrder={colOrderFiltered}
							footer={footer}
							highlightCols={highlightCols}
						/>
					</table>
				</ResponsiveTableWrapper>
				{!hideAllControls ? (
					<>
						{nonfluid && pagination ? <div className="clearFix" /> : null}
						{pagination ? (
							<Info
								end={end}
								numRows={numRowsFiltered}
								numRowsUnfiltered={rows.length}
								start={start}
							/>
						) : null}
						{pagination ? (
							<Pagination
								currentPage={state.currentPage}
								numRows={numRowsFiltered}
								onClick={handlePagination}
								perPage={state.perPage}
							/>
						) : null}
					</>
				) : null}
			</div>
		</>
	);
};

export default DataTable;
