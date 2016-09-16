import classNames from 'classnames';
import orderBy from 'lodash.orderby';
import React from 'react';
import textContent from 'react-addons-text-content';
import g from '../../globals';
import * as helpers from '../../util/helpers';
import clickable from '../wrappers/clickable';

const Header = ({cols, handleColClick, sortBys, superCols}) => {
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
    </thead>;
};

Header.propTypes = {
    cols: React.PropTypes.arrayOf(React.PropTypes.shape({
        desc: React.PropTypes.string,
        sortSequence: React.PropTypes.arrayOf(React.PropTypes.string),
        title: React.PropTypes.string.isRequired,
        width: React.PropTypes.string,
    })).isRequired,
    handleColClick: React.PropTypes.func.isRequired,
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

Row.propTypes = {
    row: React.PropTypes.shape({
        classNames: React.PropTypes.object,
        data: React.PropTypes.array.isRequired,
    }).isRequired,
};

const getSearchVal = val => {
    let sortVal;
    if (React.isValidElement(val)) {
        sortVal = textContent(val);
    } else {
        sortVal = val;
    }

    if (sortVal.toString) {
        return sortVal.toString().toLowerCase();
    }
    return null;
};

const getSortVal = (value = null, sortType) => {
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
        return parseFloat(sortVal.replace('$', ''));
    }
    return sortVal;
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
            <a data-no-davis="true" onClick={() => onClick(i)}>{i}</a>
        </li>);
    }

    return <div className="dataTables_paginate paging_bootstrap">
        <ul className="pagination">
            <li className={classNames('prev', {disabled: !showPrev})}>
                <a data-no-davis="true" onClick={() => showPrev && onClick(currentPage - 1)}>← Prev</a>
            </li>
            {numberedPages}
            <li className={classNames('next', {disabled: !showNext})}>
                <a data-no-davis="true" onClick={() => showNext && onClick(currentPage + 1)}>Next →</a>
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

class DataTable extends React.Component {
    constructor(props) {
        super(props);

        let perPage = parseInt(localStorage.perPage, 10);
        if (isNaN(perPage)) {
            perPage = 10;
        }

        this.state = {
            sortBys: [this.props.defaultSort],
            perPage,
            currentPage: 1,
            searchText: '',
        };

        this.handleColClick = this.handleColClick.bind(this);
        this.handlePaging = this.handlePaging.bind(this);
        this.handlePerPage = this.handlePerPage.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    handleColClick(event, i) {
        const col = this.props.cols[i];

        // Ignore click on unsortable column
        if (col.sortSequence && col.sortSequence.length === 0) {
            return;
        }

        let found = false;
        let sortBys = helpers.deepCopy(this.state.sortBys);

        const nextOrder = (col2, sortBy) => {
            if (col2.sortSequence) {
                // Move up to next entry in sortSequence
                let j = col2.sortSequence.indexOf(sortBy[1]) + 1;
                if (j >= col2.sortSequence.length) {
                    j = 0;
                }
                return col2.sortSequence[j];
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

        this.setState({
            currentPage: 1,
            sortBys,
        });
    }

    handlePaging(newPage) {
        if (newPage !== this.state.currentPage) {
            this.setState({currentPage: newPage});
        }
    }

    handlePerPage(event) {
        const perPage = parseInt(event.target.value, 10);
        if (!isNaN(perPage) && perPage !== this.state.perPage) {
            localStorage.perPage = perPage;
            this.setState({
                currentPage: 1,
                perPage,
            });
        }
    }

    handleSearch(event) {
        this.setState({
            currentPage: 1,
            searchText: event.target.value.toLowerCase(),
        });
    }

    render() {
        const {cols, footer, pagination, rows, superCols} = this.props;

        const rowsFiltered = this.state.searchText === '' ? rows : rows.filter(row => {
            for (let i = 0; i < row.data.length; i++) {
                if (getSearchVal(row.data[i]).includes(this.state.searchText)) {
                    return true;
                }
            }

            return false;
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
                    handleColClick={this.handleColClick}
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
    pagination: React.PropTypes.bool,
    rows: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    superCols: React.PropTypes.array,
};

export default DataTable;
