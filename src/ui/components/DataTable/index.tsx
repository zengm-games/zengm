import classNames from "classnames";
import { csvFormatRows } from "d3-dsv";
import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import React, { SyntheticEvent, MouseEvent, ReactNode } from "react";
import Controls from "./Controls";
import CustomizeColumns from "./CustomizeColumns";
import Footer from "./Footer";
import Header from "./Header";
import Info from "./Info";
import Row from "./Row";
import Pagination from "./Pagination";
import PerPage from "./PerPage";
import SettingsCache from "./SettingsCache";
import createFilterFunction from "./createFilterFunction";
import getSearchVal from "./getSearchVal";
import getSortVal from "./getSortVal";
import loadStateFromCache from "./loadStateFromCache";
import ResponsiveTableWrapper from "../ResponsiveTableWrapper";
import { downloadFile, helpers, safeLocalStorage } from "../../util";
import type { SortOrder, SortType } from "../../../common/types";
// eslint-disable-next-line import/no-unresolved
import type { ClassValue } from "classnames/types";
import arrayMove from "array-move";

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
	rows: {
		key: number | string;
		data: (
			| ReactNode
			| {
					classNames?: ClassValue;
					value: ReactNode;
					searchValue?: string;
					sortValue?: string | number;
			  }
		)[];
		classNames?: ClassValue;
	}[];
	small?: boolean;
	superCols?: SuperCol[];
	addFilters?: (string | undefined)[];
};

type State = {
	colOrder: {
		colIndex: number;
		hidden?: boolean;
	}[];
	currentPage: number;
	enableFilters: boolean;
	filters: string[];
	prevName?: string;
	perPage: number;
	searchText: string;
	showSelectColumnsModal: boolean;
	sortBys: SortBy[];
};

class DataTable extends React.Component<Props, State> {
	settingsCache: SettingsCache;

	constructor(props: Props) {
		super(props); // https://github.com/facebook/react/issues/12523#issuecomment-378282856

		this.state = {
			colOrder: [],
			currentPage: 0,
			enableFilters: false,
			filters: [],
			perPage: 10,
			searchText: "",
			showSelectColumnsModal: false,
			sortBys: [],
		};
		this.handleColClick = this.handleColClick.bind(this);
		this.handleExportCSV = this.handleExportCSV.bind(this);
		this.handleResetTable = this.handleResetTable.bind(this);
		this.handleToggleFilters = this.handleToggleFilters.bind(this);
		this.handleFilterUpdate = this.handleFilterUpdate.bind(this);
		this.handlePagination = this.handlePagination.bind(this);
		this.handlePerPage = this.handlePerPage.bind(this);
		this.handleSearch = this.handleSearch.bind(this);
		this.handleSelectColumns = this.handleSelectColumns.bind(this);
		this.settingsCache = new SettingsCache(
			props.name,
			!!props.disableSettingsCache,
		);
	}

	handleColClick(event: MouseEvent, i: number) {
		const col = this.props.cols[i]; // Ignore click on unsortable column

		if (col.sortSequence && col.sortSequence.length === 0) {
			return;
		}

		let found = false;
		let sortBys = helpers.deepCopy(this.state.sortBys); // eslint-disable-line react/no-access-state-in-setstate

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

		this.settingsCache.set("DataTableSort", sortBys);
		this.setState({
			currentPage: 1,
			sortBys,
		});
	}

	handleExportCSV() {
		const colOrderFiltered = this.state.colOrder.filter(
			({ hidden, colIndex }) => !hidden && this.props.cols[colIndex],
		);
		const columns = colOrderFiltered.map(
			({ colIndex }) => this.props.cols[colIndex].title,
		);
		const rows = this.processRows().map(row =>
			row.data.map(val => getSearchVal(val, false)),
		);
		const output = csvFormatRows([columns, ...rows]);
		downloadFile(`${this.props.name}.csv`, output, "text/csv");
	}

	handleResetTable() {
		this.settingsCache.clear("DataTableColOrder");
		this.settingsCache.clear("DataTableFilters");
		this.settingsCache.clear("DataTableSort");

		this.setState(loadStateFromCache(this.props));
	}

	handleSelectColumns() {
		this.setState({
			showSelectColumnsModal: true,
		});
	}

	handleToggleFilters() {
		// Remove filter cache if hiding, add filter cache if displaying
		if (this.state.enableFilters) {
			this.settingsCache.clear("DataTableFilters");
		} else {
			this.settingsCache.set("DataTableFilters", this.state.filters);
		}

		this.setState(prevState => ({
			enableFilters: !prevState.enableFilters,
		}));
	}

	handleFilterUpdate(event: SyntheticEvent<HTMLInputElement>, i: number) {
		const filters = helpers.deepCopy(this.state.filters); // eslint-disable-line react/no-access-state-in-setstate

		filters[i] = event.currentTarget.value;
		this.setState({
			currentPage: 1,
			filters,
		});
		this.settingsCache.set("DataTableFilters", filters);
	}

	handlePagination(newPage: number) {
		if (newPage !== this.state.currentPage) {
			this.setState({
				currentPage: newPage,
			});
		}
	}

	handlePerPage(event: SyntheticEvent<HTMLSelectElement>) {
		const perPage = parseInt(event.currentTarget.value, 10);

		if (!Number.isNaN(perPage) && perPage !== this.state.perPage) {
			safeLocalStorage.setItem("perPage", String(perPage));
			this.setState({
				currentPage: 1,
				perPage,
			});
		}
	}

	handleSearch(event: SyntheticEvent<HTMLInputElement>) {
		this.setState({
			currentPage: 1,
			searchText: event.currentTarget.value,
		});
	}

	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		const updatedState = {};

		// If name changes, it means this is a whole new table and it has a different state (example: Player Stats switching between regular and advanced stats).
		// If colOrder does not match cols, need to run reconciliation code in loadStateFromCache (example: current vs past seasons in League Finances).
		if (
			nextProps.name !== prevState.prevName ||
			nextProps.cols.length > prevState.colOrder.length
		) {
			Object.assign(updatedState, loadStateFromCache(nextProps));
		}

		// If addFilters is passed and contains a value (only after initial render, for now - if that needs to change, add similar code to constructor), merge with prevState.filters and enable filters
		const filters = helpers.deepCopy(prevState.filters);
		let changed = false;

		if (
			nextProps.addFilters !== undefined &&
			nextProps.addFilters.length === prevState.filters.length
		) {
			for (let i = 0; i < nextProps.addFilters.length; i++) {
				const filter = nextProps.addFilters[i];
				if (filter !== undefined) {
					filters[i] = filter;
					changed = true;
				} else if (!prevState.enableFilters) {
					// If there is a saved but hidden filter, remove it
					filters[i] = "";
				}
			}
		}

		if (changed) {
			const settingsCache = new SettingsCache(
				nextProps.name,
				!!nextProps.disableSettingsCache,
			);
			settingsCache.set("DataTableFilters", filters);
			Object.assign(updatedState, {
				enableFilters: true,
				filters,
			});
		}

		return updatedState;
	}

	processRows() {
		const filterFunctions = this.state.enableFilters
			? this.state.filters.map((filter, i) =>
					createFilterFunction(
						filter,
						this.props.cols[i] ? this.props.cols[i].sortType : undefined,
						this.props.cols[i] ? this.props.cols[i].searchType : undefined,
					),
			  )
			: [];
		const skipFiltering =
			this.state.searchText === "" && !this.state.enableFilters;
		const searchText = this.state.searchText.toLowerCase();
		const rowsFiltered = skipFiltering
			? this.props.rows
			: this.props.rows.filter(row => {
					// Search
					if (this.state.searchText !== "") {
						let found = false;

						for (let i = 0; i < row.data.length; i++) {
							if (this.props.cols[i].noSearch) {
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
					if (this.state.enableFilters) {
						for (let i = 0; i < row.data.length; i++) {
							if (this.props.cols[i].noSearch) {
								continue;
							}

							if (filterFunctions[i](row.data[i]) === false) {
								return false;
							}
						}
					}

					return true;
			  });

		const rowsOrdered = orderBy(
			rowsFiltered,
			this.state.sortBys.map(sortBy => row => {
				let i = sortBy[0];

				if (
					typeof i !== "number" ||
					i >= row.data.length ||
					i >= this.props.cols.length
				) {
					i = 0;
				}

				return getSortVal(row.data[i], this.props.cols[i].sortType);
			}),
			this.state.sortBys.map(sortBy => sortBy[1]),
		);

		const colOrderFiltered = this.state.colOrder.filter(
			({ hidden, colIndex }) => !hidden && this.props.cols[colIndex],
		);

		return rowsOrdered.map(row => {
			return {
				...row,
				data: colOrderFiltered.map(({ colIndex }) => row.data[colIndex]),
			};
		});
	}

	render() {
		const {
			bordered,
			className,
			cols,
			footer,
			hideAllControls,
			nonfluid,
			pagination,
			rows,
			small,
			superCols,
		} = this.props;
		let processedRows = this.processRows();
		const numRowsFiltered = processedRows.length;
		const start = 1 + (this.state.currentPage - 1) * this.state.perPage;
		let end = start + this.state.perPage - 1;

		if (end > processedRows.length) {
			end = processedRows.length;
		}

		if (pagination) {
			processedRows = processedRows.slice(start - 1, end);
		}

		const colOrderFiltered = this.state.colOrder.filter(
			({ hidden, colIndex }) => !hidden && cols[colIndex],
		);

		return (
			<>
				<CustomizeColumns
					cols={cols}
					colOrder={this.state.colOrder}
					hasSuperCols={!!superCols}
					show={this.state.showSelectColumnsModal}
					onHide={() => {
						this.setState({
							showSelectColumnsModal: false,
						});
					}}
					onReset={() => {
						const newOrder = cols.map((col, i) => ({
							colIndex: i,
						}));
						this.setState({
							colOrder: newOrder,
						});
						this.settingsCache.set("DataTableColOrder", newOrder);
					}}
					onSortEnd={({ oldIndex, newIndex }) => {
						const newOrder = arrayMove(this.state.colOrder, oldIndex, newIndex);
						this.setState({
							colOrder: newOrder,
						});
						this.settingsCache.set("DataTableColOrder", newOrder);
					}}
					onToggleHidden={(i: number) => () => {
						const newOrder = [...this.state.colOrder];
						if (newOrder[i]) {
							newOrder[i] = {
								...newOrder[i],
							};
							if (newOrder[i].hidden) {
								delete newOrder[i].hidden;
							} else {
								newOrder[i].hidden = true;
							}
							this.setState({
								colOrder: newOrder,
							});
							this.settingsCache.set("DataTableColOrder", newOrder);
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
							<PerPage
								onChange={this.handlePerPage}
								value={this.state.perPage}
							/>
						) : null}
						<Controls
							enableFilters={this.state.enableFilters}
							hideAllControls={hideAllControls}
							name={this.props.name}
							onExportCSV={this.handleExportCSV}
							onResetTable={this.handleResetTable}
							onSearch={this.handleSearch}
							onSelectColumns={this.handleSelectColumns}
							onToggleFilters={this.handleToggleFilters}
							searchText={this.state.searchText}
						/>
						{nonfluid ? <div className="clearFix" /> : null}
					</>
					<ResponsiveTableWrapper
						className={pagination ? "fix-margin-pagination" : null}
						nonfluid={nonfluid}
					>
						<table
							className={classNames("table table-striped table-hover", {
								"table-bordered": bordered !== false,
								"table-sm": small !== false,
							})}
						>
							<Header
								colOrder={colOrderFiltered}
								cols={cols}
								enableFilters={this.state.enableFilters}
								filters={this.state.filters}
								handleColClick={this.handleColClick}
								handleFilterUpdate={this.handleFilterUpdate}
								sortBys={this.state.sortBys}
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
									currentPage={this.state.currentPage}
									numRows={numRowsFiltered}
									onClick={this.handlePagination}
									perPage={this.state.perPage}
								/>
							) : null}
						</>
					) : null}
				</div>
			</>
		);
	}
}

// @ts-ignore
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
