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

class DataTable extends React.Component {
    constructor(props) {
        super(props);
        this.handleColClick = this.handleColClick.bind(this);

        this.state = {
            sortBy: this.props.defaultSort,
        };
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

    render() {
        const {cols, rows, superCols} = this.props;

        const sortedRows = orderBy(rows, [row => {
            return getSortVal(row.data[this.state.sortBy[0]], cols[this.state.sortBy[0]].sortType);
        }], [this.state.sortBy[1]]);

        return <div className="table-responsive">
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
        </div>;
    }
}

module.exports = DataTable;
