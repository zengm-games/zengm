const classNames = require('classnames');
const orderBy = require('lodash.orderby');
const React = require('react');
const textContent = require('react-addons-text-content');
const clickable = require('../wrappers/clickable');

const Header = ({cols, handleColClick, sortBy}) => {
    return <thead>
        <tr>
            {cols.map(({title, desc, width}, i) => {
                let className = 'sorting';
                if (sortBy[0] === i) {
                    className = sortBy[1] === 'asc' ? 'sorting_asc' : 'sorting_desc';
                }
                return <th
                    className={className}
                    key={i}
                    onClick={() => handleColClick(i)}
                    title={desc}
                    width={width}>{title}
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

    if (sortType === 'number' && typeof sortVal !== 'number') {
        return parseFloat(sortVal);
    }
    if (sortType === 'lastTen') {
        return parseInt(sortVal.split('-')[0], 10);
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
        let order;
        if (this.state.sortBy[0] !== i) {
            order = this.props.cols[i].sortSequence ? this.props.cols[i].sortSequence[0] : 'asc';
        } else {
            order = this.state.sortBy[1] === 'asc' ? 'desc' : 'asc';
        }
        this.setState({
            sortBy: [i, order],
        });
    }

    render() {
        const {cols, rows} = this.props;

        const sortedRows = orderBy(rows, [row => {
            return getSortVal(row.data[this.state.sortBy[0]], cols[this.state.sortBy[0]].sortType);
        }], [this.state.sortBy[1]]);

        return <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-hover">
                <Header
                    cols={cols}
                    handleColClick={this.handleColClick}
                    sortBy={this.state.sortBy}
                />
                <tbody>
                    {sortedRows.map(row => <Row key={row.key} row={row} />)}
                </tbody>
            </table>
        </div>;
    }
}

module.exports = DataTable;
