import type { Argument } from "classnames";
import classNames from "classnames";
import { csvFormatRows } from "d3-dsv";
import orderBy from "lodash-es/orderBy";
import PropTypes from "prop-types";
import {
	MouseEvent,
	ReactNode,
	SyntheticEvent,
	useCallback,
	useEffect,
	useState,
} from "react";
import Controls from "./Controls";
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
import {
	downloadFile,
	helpers,
	realtimeUpdate,
	safeLocalStorage,
	toWorker,
} from "../../util";
import type { SortOrder, SortType } from "../../../common/types";
import type SettingsCache from "./SettingsCache";
import updateSortBys from "./updateSortBys";
import { arrayMove } from "react-sortable-hoc";
import CustomizeColumns from "./CustomizeColumns";
import type { TableConfig } from "../../util/TableConfig";

export type SortBy = [string, SortOrder];

export type Col = {
	key: string;
	title: string;
	classNames?: any;
	desc?: string;
	noSearch?: boolean;
	sortSequence?: SortOrder[];
	sortType?: SortType;
	searchType?: SortType;
	width?: string;
};

export type LegacyCol = Partial<Col>;

export type SuperCol = {
	colspan: number;
	desc?: string;
	title: string | ReactNode;
};

export type DataTableRow = {
	key: number | string;
	data: {
		[key: string]:
			| ReactNode
			| {
					classNames?: Argument;
					value: ReactNode;
					searchValue?: string;
					sortValue?: string | number;
			  };
	};
	classNames?: Argument;
};

export type LegacyDataTableRow = {
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
	clickable?: boolean;
	cols: Col[];
	config: TableConfig;
	defaultSort?: SortBy;
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
	addFilters?: Filter[];
};

export type LegacyProps = Omit<Props, "cols" | "rows" | "config"> & {
	cols: LegacyCol[];
	rows: LegacyDataTableRow[];
};

export type Filter = {
	col: string;
	value: string;
};

export type State = {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	cols: Col[];
	rows: DataTableRow[];
	currentPage: number;
	enableFilters: boolean;
	filters: Filter[];
	prevName: string;
	perPage: number;
	searchText: string;
	showSelectColumnsModal: boolean;
	sortBys: SortBy[];
	settingsCache: SettingsCache;
};

const DataTable = (props: Props | LegacyProps) => {
	const {
		bordered,
		className,
		defaultSort,
		disableSettingsCache,
		footer,
		hideAllControls,
		name,
		nonfluid,
		pagination,
		small,
		striped,
		superCols,
		addFilters,
	} = props;

	const enableCustomizeColumns: boolean = "config" in props && !superCols;

	// Convert LegacyCols to Cols for backwards compatability
	const cols: Col[] =
		"config" in props
			? props.cols
			: props.cols.map((col, i) => ({
					title: "",
					...col,
					key: `col${i + 1}`,
			  }));

	// Convert LegacyDataTableRows to DataTableRows for backwards compatability
	// @ts-ignore
	const rows: DataTableRow[] =
		props.rows.length && Array.isArray(props.rows[0].data)
			? props.rows.map(
					(row): DataTableRow => ({
						...row,
						data: Array.isArray(row.data)
							? Object.fromEntries(
									row.data.map((value, i) => [`col${i + 1}`, value]),
							  )
							: {},
					}),
			  )
			: props.rows;

	const [state, setState] = useState<State>(() => ({
		...loadStateFromCache({
			cols,
			defaultSort,
			disableSettingsCache: false,
			name,
		}),
		rows,
	}));

	useEffect(() => {
		if ("config" in props) {
			setStatePartial({ cols });
			processedRows = processRows();
		}
	}, [cols]);

	const setStatePartial = useCallback((newState: Partial<State>) => {
		setState(state2 => ({
			...state2,
			...newState,
		}));
	}, []);

	const processRows = (): DataTableRow[] => {
		const filterFunctions: [string, (value: any) => boolean][] =
			state.enableFilters
				? state.filters.map(filter => {
						const col = state.cols.find(f => filter.col === f.key);
						return [
							filter.col,
							createFilterFunction(
								filter.value || "",
								col?.sortType,
								col?.searchType,
							),
						];
				  })
				: [];
		const skipFiltering = state.searchText === "" && !state.enableFilters;
		const searchText = state.searchText.toLowerCase();
		const rowsFiltered = skipFiltering
			? rows
			: rows.filter(row => {
					// Search
					if (state.searchText !== "") {
						let found = false;

						for (const col of state.cols) {
							if (col.noSearch) {
								continue;
							}

							if (
								row.data[col.key ?? ""] &&
								getSearchVal(row.data[col.key ?? ""]).includes(searchText)
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
						for (const [key, filterFunction] of filterFunctions) {
							const col = state.cols.find(c => c.key === key);
							if (!col || col.noSearch) {
								continue;
							}

							if (!filterFunction(row.data[key])) {
								return false;
							}
						}
					}

					return true;
			  });

		const rowsOrdered = orderBy(
			rowsFiltered,
			state.sortBys.map(sortBy => row => {
				const key = sortBy[0];
				const col = state.cols.find(c => c.key === key);
				if (key in row.data) return getSortVal(row.data[key], col?.sortType);
			}),
			state.sortBys.map(sortBy => sortBy[1]),
		);

		return rowsOrdered;
	};

	const handleReorder = async (oldIndex: number, newIndex: number) => {
		const nextCols = arrayMove(state.cols, oldIndex, newIndex);
		setStatePartial({
			cols: nextCols,
		});
		if ("config" in props) {
			await toWorker("main", "updateColumns", {
				columns: nextCols.map(c => c.key),
				key: props.config.tableName,
			});
			await realtimeUpdate(["customizeTable"]);
		}
	};

	const handleColClick = (event: MouseEvent, colKey: string) => {
		const sortBys = updateSortBys({
			cols,
			event,
			colKey,
			prevSortBys: state.sortBys, // eslint-disable-line react/no-access-state-in-setstate
		});

		state.settingsCache.set("DataTableSort", sortBys);
		setStatePartial({
			currentPage: 1,
			sortBys,
		});
	};

	const handleExportCSV = () => {
		const colNames = cols.map(col => col.title);
		const rows = processRows().map(row =>
			cols.map(col => {
				const key: string = col.key || "";
				const val = row.data[key] ?? null;
				const sortType = col.sortType;
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
		colKey: string,
	) => {
		const filters = helpers.deepCopy(state.filters); // eslint-disable-line react/no-access-state-in-setstate
		const filterIndex = filters.findIndex(f => colKey === f.col);

		if (filterIndex !== -1)
			filters[filterIndex].value = event.currentTarget.value;
		else
			filters.push({
				col: colKey,
				value: event.currentTarget.value,
			});

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
	if (name !== state.prevName || state.cols.length > state.colOrder.length) {
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
		if (addFilters !== undefined) {
			// If addFilters is passed and contains a value, merge with prevState.filters and enable filters
			const filters = helpers.deepCopy(state.filters);
			let changed = false;

			for (let i = 0; i < addFilters.length; i++) {
				const { col, value } = addFilters[i];
				const filterIndex = filters.findIndex(f => col === f.col);

				if (filterIndex !== -1) {
					if (filters[filterIndex].value != value) {
						changed = true;
						filters[filterIndex].value = value;
					}
				} else {
					changed = true;
					filters.push({
						col: col,
						value: value,
					});
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

	const highlightCols = state.sortBys.map(sortBy => sortBy[0]);

	return (
		<>
			{"config" in props ? (
				<CustomizeColumns
					config={props.config}
					show={state.showSelectColumnsModal}
					onHide={() => {
						setStatePartial({
							showSelectColumnsModal: false,
						});
					}}
					onSave={async () => {
						await realtimeUpdate(["customizeTable"]);
					}}
				/>
			) : null}
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
						enableCustomizeColumns={enableCustomizeColumns}
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
							cols={state.cols}
							enableFilters={state.enableFilters}
							filters={state.filters}
							handleReorder={handleReorder}
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
									cols={state.cols}
									highlightCols={highlightCols}
								/>
							))}
						</tbody>
						<Footer
							footer={footer}
							cols={state.cols}
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

DataTable.propTypes = {
	bordered: PropTypes.bool,
	className: PropTypes.string,
	defaultSort: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	),
	disableSettingsCache: PropTypes.bool,
	footer: PropTypes.array,
	name: PropTypes.string.isRequired,
	nonfluid: PropTypes.bool,
	hideAllControls: PropTypes.bool,
	pagination: PropTypes.bool,
	rows: PropTypes.array.isRequired,
	small: PropTypes.bool,
	superCols: PropTypes.array,
};

export default DataTable;
