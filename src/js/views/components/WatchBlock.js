const React = require('react');

const WatchBlock = ({pid, watch}) => {
    // For Firefox's Object.watch
    if (typeof watch === 'function') {
        return null;
    }

    if (watch) {
        return <span className="glyphicon glyphicon-flag watch watch-active" title="Remove from Watch List" data-pid={pid}></span>;
    }

    return <span className="glyphicon glyphicon-flag watch" title="Add to Watch List" data-pid={pid}></span>;
};
WatchBlock.propTypes = {
    pid: React.PropTypes.number.isRequired,
    watch: React.PropTypes.oneOfType([
        React.PropTypes.bool,
        React.PropTypes.func, // For Firefox's Object.watch
    ]).isRequired,
};

module.exports = WatchBlock;
