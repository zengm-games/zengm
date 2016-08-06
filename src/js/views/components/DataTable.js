const classNames = require('classnames');
const orderBy = require('lodash.orderby');
const React = require('react');
const textContent = require('react-addons-text-content');
const g = require('../../globals');
const clickable = require('../wrappers/clickable');

const Header = ({cols, handleColClick, sortBy, superCols}) => {
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
                let className = 'sorting';
                if (sortBy[0] === i) {
                    className = sortBy[1] === 'asc' ? 'sorting_asc' : 'sorting_desc';
                }
                if (sortSequence && sortSequence.length === 0) {
                    className = null;
                }
                return <th
                    className={className}
                    key={i}
                    onClick={() => handleColClick(i)}
                    title={desc}
                    width={width}
                >
                    {title}
                </th>;
            })}
        </tr>
    </thead>;
};

const Row = clickable(({clicked, row, toggleClicked}) => {
    return <tr className={classNames(row.classNames, {warning: clicked})} onClick={toggleClicked}>
        {row.data.map((value, i) => <td key={i}>{value}</td>)}
    </tr>;
});

const getSortVal = (val, sortType) => {
    let sortVal;
    if (React.isValidElement(val)) {
        sortVal = textContent(val);
    } else {
        sortVal = val;
    }

    if (sortType === 'number') {
        if (val === null) {
            return -Infinity;
        } else if (typeof sortVal !== 'number') {
            return parseFloat(sortVal);
        }
        return val;
    }
    if (sortType === 'lastTen') {
        return parseInt(sortVal.split('-')[0], 10);
    }
    if (sortType === 'draftPick') {
        const [round, pick] = sortVal.split('-');
        return parseInt(round, 10) * g.numTeams + parseInt(pick, 10);
    }
    if (sortType === 'name') {
        const parts = sortVal.split(' ');
        return parts[parts.length - 1];
    }
    if (sortType === 'currency') {
        // Drop $ and parseFloat will just keep the numeric part at the beginning of the string
        return parseFloat(sortVal.replace('$', ''));
    }
    return sortVal;
};

const Info = ({currentPage, numRows, numRowsUnfiltered, perPage}) => {
    const start = 1 + (currentPage - 1) * perPage;
    let end = start + perPage - 1;
    if (end > numRows) { end = numRows; }

    const filteredText = numRows !== numRowsUnfiltered ? ` (filtered from ${numRowsUnfiltered})` : null

    return <div className="dataTables_info hidden-xs">{start} to {end} of {numRows}{filteredText}</div>;
};

const Paging = ({currentPage, numRows, onClick, perPage}) => {
    const showPrev = currentPage > 1;
    const showNext = numRows > (currentPage * perPage);

    return <div className="dataTables_paginate paging_bootstrap">
        <ul className="pagination">
            <li className={classNames('prev', {disabled: !showPrev})}>
                <a href="#" data-no-davis="true" onClick={() => onClick(currentPage - 1)}>← Prev</a>
            </li>
            <li className="active">
                <a href="#" data-no-davis="true" onClick={() => onClick(currentPage)}>1</a>
            </li>
            <li className={classNames('next', {disabled: !showNext})}>
                <a href="#" data-no-davis="true" onClick={() => onClick(currentPage + 1)}>Next →</a>
            </li>
        </ul>
    </div>;
};

class DataTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sortBy: this.props.defaultSort,
            perPage: 10,
            currentPage: 1,
            searchText: '',
        };

        this.handleColClick = this.handleColClick.bind(this);
        this.handlePaging = this.handlePaging.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    handleColClick(i) {
        const col = this.props.cols[i];

        // Ignore click on unsortable column
        if (col.sortSequence && col.sortSequence.length === 0) {
            return;
        }

        let order;
        if (this.state.sortBy[0] !== i) {
            order = col.sortSequence ? col.sortSequence[0] : 'asc';
        } else {
            order = this.state.sortBy[1] === 'asc' ? 'desc' : 'asc';
        }
        this.setState({
            sortBy: [i, order],
        });
    }

    handlePaging(newPage) {
console.log('new page', newPage);
    }

    handleSearch(event) {
        this.setState({
            searchText: event.target.value.toLowerCase(),
        });
    }

    render() {
        const {cols, pagination, rows, superCols} = this.props;

        const rowsFiltered = this.state.searchText === '' ? rows : rows.filter(row => {
            for (let i = 0; i < row.data.length; i++) {
                if (String(getSortVal(row.data[i], cols[i].sortType)).toLowerCase().includes(this.state.searchText)) {
                    return true;
                }
            }

            return false;
        });

        const sortedRows = orderBy(rowsFiltered, [row => {
            return getSortVal(row.data[this.state.sortBy[0]], cols[this.state.sortBy[0]].sortType);
        }], [this.state.sortBy[1]]);

        let aboveTable = null;
        let belowTable = null;
        if (pagination) {
            aboveTable = <div>
                <div className="dataTables_length">
                    <label>
                        <select className="form-control input-sm" style={{width: '75px'}} value={this.state.perPage}>
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
                    currentPage={this.state.currentPage}
                    numRows={rowsFiltered.length}
                    numRowsUnfiltered={rows.length}
                    perPage={this.state.perPage}
                />
                <Paging
                    currentPage={this.state.currentPage}
                    numRows={rowsFiltered.length}
                    onClick={this.handlePaging}
                    perPage={this.state.perPage}
                />
            </div>;
        }

        return <div className="table-responsive">
            {aboveTable}
            <table className="table table-striped table-bordered table-condensed table-hover">
                <Header
                    cols={cols}
                    handleColClick={this.handleColClick}
                    sortBy={this.state.sortBy}
                    superCols={superCols}
                />
                <tbody>
                    {sortedRows.map(row => <Row key={row.key} row={row} />)}
                </tbody>
            </table>
            {belowTable}
        </div>;
    }
}

module.exports = DataTable;
