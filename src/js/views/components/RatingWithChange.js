const classNames = require('classnames');
const React = require('react');

const RatingWithChange = ({change, children}) => {
    return <span>
        {children}
        {
            change !== 0
        ?
            <span className={classNames({'text-success': change > 0, 'text-danger': change < 0})}> ({change > 0 ? '+' : null}{change})</span>
        :
            null
        }
    </span>;
};
RatingWithChange.propTypes = {
    change: React.PropTypes.number.isRequired,
    children: React.PropTypes.number.isRequired,
};

module.exports = RatingWithChange;
