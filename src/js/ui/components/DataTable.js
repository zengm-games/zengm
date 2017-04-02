// @flow

import classNames from 'classnames';
import orderBy from 'lodash.orderby';
import React from 'react';
import textContent from 'react-addons-text-content';
import {g, helpers} from '../../common';
import {HelpPopover} from '../components';
import clickable from '../wrappers/clickable';
import type {SortOrder, SortType} from '../../common/types';

const FilterHeader = ({cols, filters, handleFilterUpdate}) => {
    return <tr>
        {cols.map(({title}, i) => {
            const filter = filters[i] === undefined ? '' : filters[i];

            return <th key={i}>
                <input
                    onChange={event => handleFilterUpdate(event, i)}
                    style={{border: '1px solid #ccc', fontWeight: 'normal', fontSize: '12px', width: '100%'}}
                    type="text"
                    value={filter}
                />
            </th>;
        })}
    </tr>;
};

FilterHeader.propTypes = {
    cols: React.PropTypes.arrayOf(React.PropTypes.shape({
        title: React.PropTypes.string.isRequired,
    })).isRequired,
    filters: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    handleFilterUpdate: React.PropTypes.func.isRequired,
};

const Header = ({cols, enableFilters, filters, handleColClick, handleFilterUpdate, sortBys, superCols}) => {
    return <thead>
        {superCols ? <tr>
            {superCols.map(({colspan, desc, title}, i) => {
                return <th
                    key={i}
                    colSpan={colspan}
                    style={{textAlign: 'center'}}
                    title={desc}
                >
                    {title}
                </th>;
            })}
        </tr> : null}
        <tr>
            {cols.map(({desc, sortSequence, title, width}, i) => {
                let className;
                if (sortSequence && sortSequence.length === 0) {
                    className = null;
                } else {
                    className = 'sorting';
                    for (const sortBy of sortBys) {
                        if (sortBy[0] === i) {
                            className = sortBy[1] === 'asc' ? 'sorting_asc' : 'sorting_desc';
                            break;
                        }
                    }
                }
                return <th
                    className={className}
                    key={i}
                    onClick={event => handleColClick(event, i)}
                    title={desc}
                    width={width}
                >
                    {title}
                </th>;
            })}
        </tr>
        {enableFilters ? <FilterHeader cols={cols} filters={filters} handleFilterUpdate={handleFilterUpdate} /> : null}
    </thead>;
};

Header.propTypes = {
    cols: React.PropTypes.arrayOf(React.PropTypes.shape({
        desc: React.PropTypes.string,
        sortSequence: React.PropTypes.arrayOf(React.PropTypes.string),
        title: React.PropTypes.string.isRequired,
        width: React.PropTypes.string,
    })).isRequired,
    enableFilters: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    handleColClick: React.PropTypes.func.isRequired,
    handleFilterUpdate: React.PropTypes.func.isRequired,
    sortBys: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]))).isRequired,
    superCols: React.PropTypes.arrayOf(React.PropTypes.shape({
        colspan: React.PropTypes.number.isRequired,
        desc: React.PropTypes.string,
        title: React.PropTypes.string.isRequired,
    })),
};

const Row = clickable(({clicked, row, toggleClicked}) => {
    return <tr className={classNames(row.classNames, {warning: clicked})} onClick={toggleClicked}>
        {row.data.map((value = null, i) => {
            // Value is either the value, or an object containing the value as a property
            if (value !== null && value.hasOwnProperty('value')) {
                return <td className={classNames(value.classNames)} key={i}>{value.value}</td>;
            }
            return <td key={i}>{value}</td>;
        })}
    </tr>;
});

/*Row.propTypes = {
    row: React.PropTypes.shape({
        classNames: React.PropTypes.object,
        data: React.PropTypes.array.isRequired,
    }).isRequired,
};*/

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
        return '';
    } catch (err) {
        console.error(`getSearchVal error on val "${val}"`, err);
        return '';
    }
};

const getSortVal = (value = null, sortType) => {
    try {
        let val;
        let sortVal;

        // Get the right 'value'.
        if (value !== null && value.hasOwnProperty('value')) {
            val = value.value;
        } else {
            val = value;
        }

        if (React.isValidElement(val)) {
            sortVal = textContent(val);
        } else {
            sortVal = val;
        }

        if (sortType === 'number') {
            if (sortVal === null) {
                return -Infinity;
            } else if (typeof sortVal !== 'number') {
                return parseFloat(sortVal);
            }
            return val;
        }
        if (sortType === 'lastTen') {
            if (sortVal === null) {
                return null;
            }
            return parseInt(sortVal.split('-')[0], 10);
        }
        if (sortType === 'draftPick') {
            if (sortVal === null) {
                return null;
            }
            const [round, pick] = sortVal.split('-');
            return parseInt(round, 10) * g.numTeams + parseInt(pick, 10);
        }
        if (sortType === 'name') {
            if (sortVal === null) {
                return null;
            }
            const parts = sortVal.split(' (')[0].split(' ');
            return parts[parts.length - 1];
        }
        if (sortType === 'currency') {
            if (sortVal === null) {
                return -Infinity;
            }
            // Drop $ and parseFloat will just keep the numeric part at the beginning of the string
            if (sortVal.includes('B')) {
                return parseFloat(sortVal.replace('$', '')) * 1000;
            }
            return parseFloat(sortVal.replace('$', ''));
        }
        return sortVal;
    } catch (err) {
        console.error(`getSortVal error on val "${String(value)}" and sortType "${String(sortType)}"`, err);
        return null;
    }
};

const Info = ({end, numRows, numRowsUnfiltered, start}) => {
    const filteredText = numRows !== numRowsUnfiltered ? ` (filtered from ${numRowsUnfiltered})` : null;

    return <div className="dataTables_info hidden-xs">{start} to {end} of {numRows}{filteredText}</div>;
};

Info.propTypes = {
    end: React.PropTypes.number.isRequired,
    numRows: React.PropTypes.number.isRequired,
    numRowsUnfiltered: React.PropTypes.number.isRequired,
    start: React.PropTypes.number.isRequired,
};

const Paging = ({currentPage, numRows, onClick, perPage}) => {
    const showPrev = currentPage > 1;
    const showNext = numRows > (currentPage * perPage);

    const numPages = Math.ceil(numRows / perPage);
    let firstShownPage = currentPage <= 3 ? 1 : currentPage - 2;
    while (firstShownPage > 1 && (numPages - firstShownPage < 4)) {
        firstShownPage -= 1;
    }
    let lastShownPage = firstShownPage + 4;
    if (lastShownPage > numPages) {
        lastShownPage = numPages;
    }

    const numberedPages = [];
    for (let i = firstShownPage; i <= lastShownPage; i++) {
        numberedPages.push(<li key={i} className={i === currentPage ? 'active' : ''}>
            <a onClick={() => onClick(i)}>{i}</a>
        </li>);
    }

    return <div className="dataTables_paginate paging_bootstrap">
        <ul className="pagination">
            <li className={classNames('prev', {disabled: !showPrev})}>
                <a onClick={() => showPrev && onClick(currentPage - 1)}>← Prev</a>
            </li>
            {numberedPages}
            <li className={classNames('next', {disabled: !showNext})}>
                <a onClick={() => showNext && onClick(currentPage + 1)}>Next →</a>
            </li>
        </ul>
    </div>;
};

Paging.propTypes = {
    currentPage: React.PropTypes.number.isRequired,
    numRows: React.PropTypes.number.isRequired,
    onClick: React.PropTypes.func.isRequired,
    perPage: React.PropTypes.number.isRequired,
};

type SortBy = [number, SortOrder];

type Props = {
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
};

type State = {
    currentPage: number,
    enableFilters: boolean,
    filters: string[],
    perPage: number,
    searchText: string,
    sortBys: SortBy[],
};

class DataTable extends React.Component {
    props: Props;
    state: State;
    handleColClick: Function;
    handleEnableFilters: Function;
    handleFilterUpdate: Function;
    handlePaging: Function;
    handlePerPage: Function;
    handleSearch: Function;
    sortCacheKey: string;

    constructor(props: Props) {
        super(props);

        let perPage = parseInt(localStorage.getItem('perPage'), 10);
        if (isNaN(perPage)) {
            perPage = 10;
        }

        this.sortCacheKey = `DataTableSort:${this.props.name}`;
        let sortBys = localStorage.getItem(this.sortCacheKey);
        if (sortBys === null || sortBys === undefined) {
            sortBys = [this.props.defaultSort];
        } else {
            sortBys = JSON.parse(sortBys);
        }

        this.state = {
            currentPage: 1,
            enableFilters: false,
            filters: props.cols.map(() => ''),
            perPage,
            searchText: '',
            sortBys,
        };

        this.handleColClick = this.handleColClick.bind(this);
        this.handleEnableFilters = this.handleEnableFilters.bind(this);
        this.handleFilterUpdate = this.handleFilterUpdate.bind(this);
        this.handlePaging = this.handlePaging.bind(this);
        this.handlePerPage = this.handlePerPage.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    handleColClick(event: SyntheticKeyboardEvent, i: number) {
        const col = this.props.cols[i];

        // Ignore click on unsortable column
        if (col.sortSequence && col.sortSequence.length === 0) {
            return;
        }

        let found = false;
        let sortBys = helpers.deepCopy(this.state.sortBys);

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
            return sortBy[1] === 'asc' ? 'desc' : 'asc';
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
                sortBys.push([i, col.sortSequence ? col.sortSequence[0] : 'asc']);
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
            sortBys = [[i, col.sortSequence ? col.sortSequence[0] : 'asc']];
        }

        // Save this sort for this table, so it can be used as default next time
        localStorage.setItem(this.sortCacheKey, JSON.stringify(sortBys));

        this.setState({
            currentPage: 1,
            sortBys,
        });
    }

    handleEnableFilters() {
        this.setState({
            enableFilters: !this.state.enableFilters,
        });
    }

    handleFilterUpdate(event: SyntheticInputEvent, i: number) {
        const filters = this.state.filters.slice();
        filters[i] = event.target.value;
        this.setState({
            filters,
        });
    }

    handlePaging(newPage: number) {
        if (newPage !== this.state.currentPage) {
            this.setState({currentPage: newPage});
        }
    }

    handlePerPage(event: SyntheticInputEvent) {
        const perPage = parseInt(event.target.value, 10);
        if (!isNaN(perPage) && perPage !== this.state.perPage) {
            localStorage.setItem('perPage', String(perPage));
            this.setState({
                currentPage: 1,
                perPage,
            });
        }
    }

    handleSearch(event: SyntheticInputEvent) {
        this.setState({
            currentPage: 1,
            searchText: event.target.value.toLowerCase(),
        });
    }

    render() {
        const {cols, footer, pagination, rows, superCols} = this.props;

        const filters = this.state.enableFilters ? this.state.filters.map((filter, i) => {
            if (cols[i].sortType === 'number' || cols[i].sortType === 'currency') {
                let number = filter.replace(/[^0-9.<>]/g, '');
                let direction;
                if (number[0] === '>' || number[0] === '<' || number[0] === '=') {
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
        }) : [];

        const skipFiltering = this.state.searchText === '' && !this.state.enableFilters;

        const rowsFiltered = skipFiltering ? rows : rows.filter(row => {
            // Search
            if (this.state.searchText !== '') {
                let found = false;
                for (let i = 0; i < row.data.length; i++) {
                    if (getSearchVal(row.data[i]).includes(this.state.searchText)) {
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

                    if (typeof filter === 'string') {
                        if (filter === '') {
                            continue;
                        }

                        if (!getSearchVal(row.data[i]).includes(filter)) {
                            return false;
                        }
                    } else {
                        if (Number.isNaN(filter.number)) {
                            continue;
                        }

                        const numericVal = parseFloat(getSortVal(row.data[i], cols[i].sortType));
                        if (isNaN(numericVal)) {
                            continue;
                        }

                        if (filter.direction === '>' && numericVal < filter.number) {
                            return false;
                        } else if (filter.direction === '<' && numericVal > filter.number) {
                            return false;
                        } else if (filter.direction === '=' && numericVal !== filter.number) {
                            return false;
                        } else if (filter.direction === undefined && !getSearchVal(row.data[i]).includes(filter.original)) {
                            return false;
                        }
                    }
                }
            }

            return true;
        });

        const start = 1 + (this.state.currentPage - 1) * this.state.perPage;
        let end = start + this.state.perPage - 1;
        if (end > rowsFiltered.length) { end = rowsFiltered.length; }

        let sortedRows = orderBy(rowsFiltered, this.state.sortBys.map(sortBy => row => {
            return getSortVal(row.data[sortBy[0]], cols[sortBy[0]].sortType);
        }), this.state.sortBys.map(sortBy => sortBy[1]));

        if (pagination) {
            sortedRows = sortedRows.slice(start - 1, end);
        }

        let aboveTable = null;
        let belowTable = null;
        if (pagination) {
            aboveTable = <div>
                <div className="dataTables_length">
                    <label>
                        <select
                            className="form-control input-sm"
                            onChange={this.handlePerPage}
                            style={{width: '75px'}}
                            value={this.state.perPage}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select> per page
                    </label>
                </div>
                <div className="dataTables_filter">
                    <HelpPopover placement="bottom" style={{marginRight: '6px'}} title="Filtering">
                        <p>The main search box looks in all columns, but you can filter on the values in specific columns by clicking the "Filter" button <span className="glyphicon glyphicon-filter" /> and entering text below the column headers.</p>
                        <p>For numeric columns, you can enter "&gt;50" to show values greater than or equal to 50, "&lt;50" for the opposite, and "=50" for values exactly equal to 50.</p>
                    </HelpPopover>
                    <a
                        className={classNames('btn btn-default', {active: this.state.enableFilters})}
                        onClick={this.handleEnableFilters}
                        style={{marginRight: '6px'}}
                        title="Filter"
                    >
                        <span className="glyphicon glyphicon-filter" />
                    </a>
                    <label>
                        <input
                            className="form-control input-sm"
                            onChange={this.handleSearch}
                            placeholder="Search"
                            style={{width: '200px'}}
                            type="search"
                        />
                    </label>
                </div>
            </div>;

            belowTable = <div>
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
            </div>;
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

            tfoot = <tfoot>
                {footers.map((row, i) => <tr key={i}>
                    {row.map((value, j) => {
                        if (value !== null && value.hasOwnProperty('value')) {
                            return <th className={classNames(value.classNames)} key={j}>{value.value}</th>;
                        }

                        return <th key={j}>{value}</th>;
                    })}
                </tr>)}
            </tfoot>;
        }

        return <div className="table-responsive">
            {aboveTable}
            <table className="table table-striped table-bordered table-condensed table-hover">
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
                    {sortedRows.map(row => <Row key={row.key} row={row} />)}
                </tbody>
                {tfoot}
            </table>
            {belowTable}
        </div>;
    }
}

DataTable.propTypes = {
    cols: React.PropTypes.array.isRequired,
    defaultSort: React.PropTypes.arrayOf(React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ])).isRequired,
    footer: React.PropTypes.array,
    name: React.PropTypes.string.isRequired,
    pagination: React.PropTypes.bool,
    rows: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    superCols: React.PropTypes.array,
};

export default DataTable;
