import classNames from "classnames";
import { csvFormatRows } from "d3-dsv";
import orderBy from "lodash-es/orderBy";
import PropTypes from "prop-types";
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
	bordered?: boolean;
	className?: string;
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
	bordered,
	className,
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
		const col = cols[i]; // Ignore click on unsortable column

		if (col.sortSequence && col.sortSequence.length === 0) {
			return;
		}

		let found = false;
		let sortBys = helpers.deepCopy(state.sortBys); // eslint-disable-line react/no-access-state-in-setstate

		const nextOrder = (col2: Col, sortBy: SortBy) => {
			const sortSequence = col2.sortSequence;

			if (sortSequence) {
				// Move up to next entry in sortSequence
				let j = sortSequence.indexOf(sortBy[1]) + 1;

				if (j >= sortSequence.length) {
					j = 0;
				}

				return sortSequence[j];
			}

			// Default asc/desc toggle
			return sortBy[1] === "asc" ? "desc" : "asc";
		};

		// If this column is already in sortBys and shift is pressed, update
		if (event.shiftKey) {
			for (const sortBy of sortBys) {
				if (sortBy[0] === i) {
					sortBy[1] = nextOrder(col, sortBy);
					found = true;
					break;
				}
			}

			// If this column is not in sortBys and shift is pressed, append
			if (!found) {
				sortBys.push([i, col.sortSequence ? col.sortSequence[0] : "asc"]);
				found = true;
			}
		}

		// If this column is the only one in sortBys, update order
		if (!found && sortBys.length === 1 && sortBys[0][0] === i) {
			sortBys[0][1] = nextOrder(col, sortBys[0]);
			found = true;
		}

		// Otherwise, reset to sorting only by this column, default order
		if (!found) {
			sortBys = [[i, col.sortSequence ? col.sortSequence[0] : "asc"]];
		}

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
		const columns = colOrderFiltered.map(
			({ colIndex }) => cols[colIndex].title,
		);
		const rows = processRows().map(row =>
			row.data.map(val => getSearchVal(val, false)),
		);
		const output = csvFormatRows([columns, ...rows]);
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
		const perPage = parseInt(event.currentTarget.value, 10);

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
							"table-bordered": bordered !== false,
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
								<Row key={row.key} row={row} />
							))}
						</tbody>
						<Footer colOrder={colOrderFiltered} footer={footer} />
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

DataTable.propTypes = {
	bordered: PropTypes.bool,
	className: PropTypes.string,
	cols: PropTypes.array.isRequired,
	defaultSort: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	).isRequired,
	disableSettingsCache: PropTypes.bool,
	footer: PropTypes.array,
	name: PropTypes.string.isRequired,
	nonfluid: PropTypes.bool,
	hideAllControls: PropTypes.bool,
	pagination: PropTypes.bool,
	rows: PropTypes.arrayOf(PropTypes.object).isRequired,
	small: PropTypes.bool,
	superCols: PropTypes.array,
};

export default DataTable;
