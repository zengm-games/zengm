// @flow

import classNames from "classnames";
import orderBy from "lodash/orderBy";
import PropTypes from "prop-types";
import * as React from "react";
import textContent from "react-addons-text-content";
import { HelpPopover } from ".";
import { helpers } from "../util";
import clickable from "../wrappers/clickable";
import type { SortOrder, SortType } from "../../common/types";

const FilterHeader = ({ cols, filters, handleFilterUpdate }) => {
    return (
        <tr>
            {cols.map((col, i) => {
                const filter = filters[i] === undefined ? "" : filters[i];

                return (
                    <th key={i}>
                        <input
                            onChange={event => handleFilterUpdate(event, i)}
                            style={{
                                border: "1px solid #ccc",
                                fontWeight: "normal",
                                fontSize: "12px",
                                width: "100%",
                            }}
                            type="text"
                            value={filter}
                        />
                    </th>
                );
            })}
        </tr>
    );
};

FilterHeader.propTypes = {
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
        }),
    ).isRequired,
    filters: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleFilterUpdate: PropTypes.func.isRequired,
};

const Header = ({
    cols,
    enableFilters,
    filters,
    handleColClick,
    handleFilterUpdate,
    sortBys,
    superCols,
}) => {
    return (
        <thead>
            {superCols ? (
                <tr>
                    {superCols.map(({ colspan, desc, title }, i) => {
                        return (
                            <th
                                key={i}
                                colSpan={colspan}
                                style={{ textAlign: "center" }}
                                title={desc}
                            >
                                {title}
                            </th>
                        );
                    })}
                </tr>
            ) : null}
            <tr>
                {cols.map(({ desc, sortSequence, title, width }, i) => {
                    let className;
                    if (sortSequence && sortSequence.length === 0) {
                        className = null;
                    } else {
                        className = "sorting";
                        for (const sortBy of sortBys) {
                            if (sortBy[0] === i) {
                                className =
                                    sortBy[1] === "asc"
                                        ? "sorting_asc"
                                        : "sorting_desc";
                                break;
                            }
                        }
                    }
                    return (
                        <th
                            className={className}
                            key={i}
                            onClick={event => handleColClick(event, i)}
                            title={desc}
                            width={width}
                        >
                            {title}
                        </th>
                    );
                })}
            </tr>
            {enableFilters ? (
                <FilterHeader
                    cols={cols}
                    filters={filters}
                    handleFilterUpdate={handleFilterUpdate}
                />
            ) : null}
        </thead>
    );
};

Header.propTypes = {
    cols: PropTypes.arrayOf(
        PropTypes.shape({
            desc: PropTypes.string,
            sortSequence: PropTypes.arrayOf(PropTypes.string),
            title: PropTypes.string.isRequired,
            width: PropTypes.string,
        }),
    ).isRequired,
    enableFilters: PropTypes.bool.isRequired,
    filters: PropTypes.arrayOf(PropTypes.string).isRequired,
    handleColClick: PropTypes.func.isRequired,
    handleFilterUpdate: PropTypes.func.isRequired,
    sortBys: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        ),
    ).isRequired,
    superCols: PropTypes.arrayOf(
        PropTypes.shape({
            colspan: PropTypes.number.isRequired,
            desc: PropTypes.string,
            title: PropTypes.string.isRequired,
        }),
    ),
};

const Row = clickable(({ clicked, row, toggleClicked }) => {
    return (
        <tr
            className={classNames(row.classNames, { warning: clicked })}
            onClick={toggleClicked}
        >
            {row.data.map((value = null, i) => {
                // Value is either the value, or an object containing the value as a property
                if (value !== null && value.hasOwnProperty("value")) {
                    return (
                        <td className={classNames(value.classNames)} key={i}>
                            {value.value}
                        </td>
                    );
                }
                return <td key={i}>{value}</td>;
            })}
        </tr>
    );
});

Row.propTypes = {
    row: PropTypes.shape({
        classNames: PropTypes.object,
        data: PropTypes.array.isRequired,
    }).isRequired,
};

const getSearchVal = val => {
    try {
        let sortVal;
        if (React.isValidElement(val)) {
            sortVal = textContent(val);
        } else {
            sortVal = val;
        }

        if (sortVal !== undefined && sortVal !== null && sortVal.toString) {
            return sortVal.toString().toLowerCase();
        }
        return "";
    } catch (err) {
        console.error(`getSearchVal error on val "${val}"`, err);
        return "";
    }
};

const getSortVal = (value = null, sortType) => {
    try {
        let val;
        let sortVal;

        // Get the right 'value'.
        if (value !== null && value.hasOwnProperty("value")) {
            val = value.value;
        } else {
            val = value;
        }

        if (React.isValidElement(val)) {
            sortVal = textContent(val);
        } else {
            sortVal = val;
        }

        if (sortType === "number") {
            if (sortVal === null) {
                return -Infinity;
            }
            if (typeof sortVal !== "number") {
                return parseFloat(sortVal);
            }
            return val;
        }
        if (sortType === "lastTen") {
            if (sortVal === null) {
                return null;
            }
            return parseInt(sortVal.split("-")[0], 10);
        }
        if (sortType === "draftPick") {
            if (sortVal === null) {
                return null;
            }
            const [round, pick] = sortVal.split("-");

            // This assumes no league has more than a million teams lol
            return parseInt(round, 10) * 1000000 + parseInt(pick, 10);
        }
        if (sortType === "name") {
            if (sortVal === null) {
                return null;
            }
            const parts = sortVal.split(" (")[0].split(" ");

            const lastName = parts[parts.length - 1];

            // For "Bob Smith Jr." and similar names, return "Smith" not "Jr."
            // Eventually should probably unify this with the code in tools/names.js
            const suffixes = ["Jr", "Jr.", "Sr", "Sr."];
            if (
                parts.length > 2 &&
                (suffixes.includes(lastName) ||
                    lastName === lastName.toUpperCase())
            ) {
                return parts[parts.length - 2];
            }

            return lastName;
        }
        if (sortType === "currency") {
            if (sortVal === null) {
                return -Infinity;
            }
            // Drop $ and parseFloat will just keep the numeric part at the beginning of the string
            if (sortVal.includes("B")) {
                return parseFloat(sortVal.replace("$", "")) * 1000;
            }
            return parseFloat(sortVal.replace("$", ""));
        }
        return sortVal;
    } catch (err) {
        console.error(
            `getSortVal error on val "${String(value)}" and sortType "${String(
                sortType,
            )}"`,
            err,
        );
        return null;
    }
};

const Info = ({ end, numRows, numRowsUnfiltered, start }) => {
    const filteredText =
        numRows !== numRowsUnfiltered
            ? ` (filtered from ${numRowsUnfiltered})`
            : null;

    return (
        <div className="dataTables_info hidden-xs">
            {start} to {end} of {numRows}
            {filteredText}
        </div>
    );
};

Info.propTypes = {
    end: PropTypes.number.isRequired,
    numRows: PropTypes.number.isRequired,
    numRowsUnfiltered: PropTypes.number.isRequired,
    start: PropTypes.number.isRequired,
};

const Paging = ({ currentPage, numRows, onClick, perPage }) => {
    const showPrev = currentPage > 1;
    const showNext = numRows > currentPage * perPage;

    const numPages = Math.ceil(numRows / perPage);
    let firstShownPage = currentPage <= 3 ? 1 : currentPage - 2;
    while (firstShownPage > 1 && numPages - firstShownPage < 4) {
        firstShownPage -= 1;
    }
    let lastShownPage = firstShownPage + 4;
    if (lastShownPage > numPages) {
        lastShownPage = numPages;
    }

    const numberedPages = [];
    for (let i = firstShownPage; i <= lastShownPage; i++) {
        numberedPages.push(
            <li key={i} className={i === currentPage ? "active" : ""}>
                <a onClick={() => onClick(i)}>{i}</a>
            </li>,
        );
    }

    return (
        <div className="dataTables_paginate paging_bootstrap">
            <ul className="pagination">
                <li className={classNames("prev", { disabled: !showPrev })}>
                    <a onClick={() => showPrev && onClick(currentPage - 1)}>
                        ← Prev
                    </a>
                </li>
                {numberedPages}
                <li className={classNames("next", { disabled: !showNext })}>
                    <a onClick={() => showNext && onClick(currentPage + 1)}>
                        Next →
                    </a>
                </li>
            </ul>
        </div>
    );
};

Paging.propTypes = {
    currentPage: PropTypes.number.isRequired,
    numRows: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    perPage: PropTypes.number.isRequired,
};

type SortBy = [number, SortOrder];

type Props = {
    className?: string,
    cols: {
        desc?: string,
        sortSequence?: SortOrder[],
        sortType?: SortType,
        title: string,
        width?: string,
    }[],
    defaultSort: SortBy,
    footer?: any[],
    name: string,
    pagination?: boolean,
    rows: any[],
    superCols?: {
        colspan: number,
        desc?: string,
        title: string,
    }[],
    addFilters?: (string | void)[],
};

type State = {
    currentPage: number,
    enableFilters: boolean,
    filters: string[],
    prevName: string | void,
    perPage: number,
    searchText: string,
    sortBys: SortBy[],
};

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
    sortBys = sortBys.filter((sortBy: SortBy) => sortBy[0] < props.cols.length);
    if (sortBys.length === 0) {
        sortBys = [props.defaultSort];
    }

    const defaultFilters: string[] = props.cols.map(() => "");
    let filters = localStorage.getItem(`DataTableFilters:${props.name}`);
    if (filters === null || filters === undefined) {
        filters = defaultFilters;
    } else {
        try {
            filters = JSON.parse(filters);

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
    // Repeat for Flow
    if (
        filters === null ||
        filters === undefined ||
        typeof filters === "string"
    ) {
        filters = defaultFilters;
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

class DataTable extends React.Component<Props, State> {
    handleColClick: Function;

    handleEnableFilters: Function;

    handleFilterUpdate: Function;

    handlePaging: Function;

    handlePerPage: Function;

    handleSearch: Function;

    constructor(props: Props) {
        super(props);

        // https://github.com/facebook/react/issues/12523#issuecomment-378282856
        this.state = {
            currentPage: 0,
            enableFilters: false,
            filters: [],
            prevName: undefined,
            perPage: 10,
            searchText: "",
            sortBys: [],
        };

        this.handleColClick = this.handleColClick.bind(this);
        this.handleEnableFilters = this.handleEnableFilters.bind(this);
        this.handleFilterUpdate = this.handleFilterUpdate.bind(this);
        this.handlePaging = this.handlePaging.bind(this);
        this.handlePerPage = this.handlePerPage.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    handleColClick(event: SyntheticKeyboardEvent<>, i: number) {
        const col = this.props.cols[i];

        // Ignore click on unsortable column
        if (col.sortSequence && col.sortSequence.length === 0) {
            return;
        }

        let found = false;
        let sortBys = helpers.deepCopy(this.state.sortBys); // eslint-disable-line react/no-access-state-in-setstate

        const nextOrder = (col2, sortBy) => {
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
                sortBys.push([
                    i,
                    col.sortSequence ? col.sortSequence[0] : "asc",
                ]);
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

        localStorage.setItem(
            `DataTableSort:${this.props.name}`,
            JSON.stringify(sortBys),
        );

        this.setState({
            currentPage: 1,
            sortBys,
        });
    }

    handleEnableFilters() {
        // Remove filter cache if hiding, add filter cache if displaying
        if (this.state.enableFilters) {
            localStorage.removeItem(`DataTableFilters:${this.props.name}`);
        } else {
            localStorage.setItem(
                `DataTableFilters:${this.props.name}`,
                JSON.stringify(this.state.filters),
            );
        }

        this.setState(prevState => ({
            enableFilters: !prevState.enableFilters,
        }));
    }

    handleFilterUpdate(
        event: SyntheticInputEvent<HTMLInputElement>,
        i: number,
    ) {
        const filters = helpers.deepCopy(this.state.filters); // eslint-disable-line react/no-access-state-in-setstate
        filters[i] = event.currentTarget.value;
        this.setState({
            filters,
        });

        localStorage.setItem(
            `DataTableFilters:${this.props.name}`,
            JSON.stringify(filters),
        );
    }

    handlePaging(newPage: number) {
        if (newPage !== this.state.currentPage) {
            this.setState({ currentPage: newPage });
        }
    }

    handlePerPage(event: SyntheticInputEvent<HTMLSelectElement>) {
        const perPage = parseInt(event.currentTarget.value, 10);
        if (!Number.isNaN(perPage) && perPage !== this.state.perPage) {
            localStorage.setItem("perPage", String(perPage));
            this.setState({
                currentPage: 1,
                perPage,
            });
        }
    }

    handleSearch(event: SyntheticInputEvent<HTMLInputElement>) {
        this.setState({
            currentPage: 1,
            searchText: event.currentTarget.value.toLowerCase(),
        });
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        const updatedState = {};

        // If name changes, it means this is a whole new table and it has a different state (example: Player Stats switching between regular and advanced stats)
        if (nextProps.name !== prevState.prevName) {
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
                if (nextProps.addFilters[i] !== undefined) {
                    filters[i] = nextProps.addFilters[i];
                    changed = true;
                } else if (!prevState.enableFilters) {
                    // If there is a saved but hidden filter, remove it
                    filters[i] = "";
                }
            }
        }
        if (changed) {
            localStorage.setItem(
                `DataTableFilters:${nextProps.name}`,
                JSON.stringify(filters),
            );
            Object.assign(updatedState, {
                enableFilters: true,
                filters,
            });
        }

        return updatedState;
    }

    render() {
        const {
            className,
            cols,
            footer,
            pagination,
            rows,
            superCols,
        } = this.props;

        const filters = this.state.enableFilters
            ? this.state.filters.map((filter, i) => {
                  if (
                      cols[i].sortType === "number" ||
                      cols[i].sortType === "currency"
                  ) {
                      let number = filter.replace(/[^0-9.<>]/g, "");
                      let direction;
                      if (
                          number[0] === ">" ||
                          number[0] === "<" ||
                          number[0] === "="
                      ) {
                          direction = number[0];
                          number = number.slice(1); // Remove first char
                      }
                      number = parseFloat(number);

                      return {
                          direction,
                          original: filter,
                          number,
                      };
                  }

                  return filter.toLowerCase();
              })
            : [];

        const skipFiltering =
            this.state.searchText === "" && !this.state.enableFilters;

        const rowsFiltered = skipFiltering
            ? rows
            : rows.filter(row => {
                  // Search
                  if (this.state.searchText !== "") {
                      let found = false;
                      for (let i = 0; i < row.data.length; i++) {
                          if (
                              getSearchVal(row.data[i]).includes(
                                  this.state.searchText,
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
                  if (this.state.enableFilters) {
                      for (let i = 0; i < row.data.length; i++) {
                          const filter = filters[i];

                          if (typeof filter === "string") {
                              if (filter === "") {
                                  continue;
                              }

                              if (!getSearchVal(row.data[i]).includes(filter)) {
                                  return false;
                              }
                          } else {
                              if (Number.isNaN(filter.number)) {
                                  continue;
                              }

                              const numericVal = parseFloat(
                                  getSortVal(row.data[i], cols[i].sortType),
                              );
                              if (Number.isNaN(numericVal)) {
                                  continue;
                              }

                              if (
                                  filter.direction === ">" &&
                                  numericVal < filter.number
                              ) {
                                  return false;
                              }
                              if (
                                  filter.direction === "<" &&
                                  numericVal > filter.number
                              ) {
                                  return false;
                              }
                              if (
                                  filter.direction === "=" &&
                                  numericVal !== filter.number
                              ) {
                                  return false;
                              }
                              if (
                                  filter.direction === undefined &&
                                  !getSearchVal(row.data[i]).includes(
                                      filter.original,
                                  )
                              ) {
                                  return false;
                              }
                          }
                      }
                  }

                  return true;
              });

        const start = 1 + (this.state.currentPage - 1) * this.state.perPage;
        let end = start + this.state.perPage - 1;
        if (end > rowsFiltered.length) {
            end = rowsFiltered.length;
        }

        let sortedRows = orderBy(
            rowsFiltered,
            this.state.sortBys.map(sortBy => row => {
                return getSortVal(
                    row.data[sortBy[0]],
                    cols[sortBy[0]].sortType,
                );
            }),
            this.state.sortBys.map(sortBy => sortBy[1]),
        );

        if (pagination) {
            sortedRows = sortedRows.slice(start - 1, end);
        }

        let aboveTable = null;
        let belowTable = null;
        if (pagination) {
            aboveTable = (
                <div>
                    <div className="dataTables_length">
                        <label>
                            <select
                                className="form-control input-sm"
                                onChange={this.handlePerPage}
                                style={{ width: "75px" }}
                                value={this.state.perPage}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>{" "}
                            per page
                        </label>
                    </div>
                    <div className="dataTables_filter">
                        <HelpPopover
                            placement="bottom"
                            style={{ marginRight: "6px" }}
                            title="Filtering"
                        >
                            <p>
                                The main search box looks in all columns, but
                                you can filter on the values in specific columns
                                by clicking the "Filter" button{" "}
                                <span className="glyphicon glyphicon-filter" />{" "}
                                and entering text below the column headers.
                            </p>
                            <p>
                                For numeric columns, you can enter "&gt;50" to
                                show values greater than or equal to 50,
                                "&lt;50" for the opposite, and "=50" for values
                                exactly equal to 50.
                            </p>
                        </HelpPopover>
                        <a
                            className={classNames("btn btn-light-bordered", {
                                active: this.state.enableFilters,
                            })}
                            onClick={this.handleEnableFilters}
                            style={{ marginRight: "6px" }}
                            title="Filter"
                        >
                            <span className="glyphicon glyphicon-filter" />
                        </a>
                        <label>
                            <input
                                className="form-control input-sm"
                                onChange={this.handleSearch}
                                placeholder="Search"
                                style={{ width: "200px" }}
                                type="search"
                            />
                        </label>
                    </div>
                </div>
            );

            belowTable = (
                <div>
                    <Info
                        end={end}
                        numRows={rowsFiltered.length}
                        numRowsUnfiltered={rows.length}
                        start={start}
                    />
                    <Paging
                        currentPage={this.state.currentPage}
                        numRows={rowsFiltered.length}
                        onClick={this.handlePaging}
                        perPage={this.state.perPage}
                    />
                </div>
            );
        }

        // Table footer
        let tfoot = null;
        if (footer) {
            let footers;

            if (Array.isArray(footer[0])) {
                // There are multiple footers
                footers = footer;
            } else {
                // There's only one footer
                footers = [footer];
            }

            tfoot = (
                <tfoot>
                    {footers.map((row, i) => (
                        <tr key={i}>
                            {row.map((value, j) => {
                                if (
                                    value !== null &&
                                    value.hasOwnProperty("value")
                                ) {
                                    return (
                                        <th
                                            className={classNames(
                                                value.classNames,
                                            )}
                                            key={j}
                                        >
                                            {value.value}
                                        </th>
                                    );
                                }

                                return <th key={j}>{value}</th>;
                            })}
                        </tr>
                    ))}
                </tfoot>
            );
        }

        let classes = "table table-striped table-bordered table-sm table-hover";
        if (className !== undefined) {
            classes += ` ${className}`;
        }

        return (
            <div className="table-responsive">
                {aboveTable}
                <table className={classes}>
                    <Header
                        cols={cols}
                        enableFilters={this.state.enableFilters}
                        filters={this.state.filters}
                        handleColClick={this.handleColClick}
                        handleFilterUpdate={this.handleFilterUpdate}
                        sortBys={this.state.sortBys}
                        superCols={superCols}
                    />
                    <tbody>
                        {sortedRows.map(row => (
                            <Row key={row.key} row={row} />
                        ))}
                    </tbody>
                    {tfoot}
                </table>
                {belowTable}
            </div>
        );
    }
}

DataTable.propTypes = {
    className: PropTypes.string,
    cols: PropTypes.array.isRequired,
    defaultSort: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ).isRequired,
    footer: PropTypes.array,
    name: PropTypes.string.isRequired,
    pagination: PropTypes.bool,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    superCols: PropTypes.array,
};

export default DataTable;
