const React = require('react');

const WatchBlock = ({pid, watch}) => {
    if (watch) {
        return <span className="glyphicon glyphicon-flag watch watch-active" title="Remove from Watch List" data-pid={pid}></span>;
    }

    return <span className="glyphicon glyphicon-flag watch" title="Add to Watch List" data-pid={pid}></span>;
};
WatchBlock.propTypes = {
    pid: React.PropTypes.number.isRequired,
    watch: React.PropTypes.bool.isRequired,
};

module.exports = WatchBlock;
