import React from 'react';
import g from '../../globals';
import * as ui from '../../ui';
import * as league from '../../core/league';

class WatchBlock extends React.Component {
    constructor(props) {
        super(props);

        // Keep in state so it can update instantly on click, rather than waiting for round trip
        this.state = {
            watch: props.watch,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        // This assumes that the view is listening for playerMovement or watchList, otherwise it'll send the same old (wrong) prop
        if (nextProps.watch !== this.state.watch) {
            this.setState({
                watch: nextProps.watch,
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.pid !== nextProps.pid || this.state.watch !== nextState.watch;
    }

    async handleClick(e) {
        e.preventDefault();

        const watch = !this.state.watch;
        this.setState({
            watch,
        });

        await g.dbl.tx("players", "readwrite", async tx => {
            const p = await tx.players.get(this.props.pid);
            p.watch = watch;
            await tx.players.put(p);
        });

        league.updateLastDbChange();
        ui.realtimeUpdate(["playerMovement", "watchList"]);
    }

    render() {
        // For Firefox's Object.watch
        if (typeof this.props.watch === 'function') {
            return null;
        }

        if (this.state.watch) {
            return <a className="glyphicon glyphicon-flag watch watch-active" onClick={this.handleClick} title="Remove from Watch List" />;
        }

        return <a className="glyphicon glyphicon-flag watch" onClick={this.handleClick} title="Add to Watch List" />;
    }
}

WatchBlock.propTypes = {
    pid: React.PropTypes.number.isRequired,
    watch: React.PropTypes.oneOfType([
        React.PropTypes.bool,
        React.PropTypes.func, // For Firefox's Object.watch
    ]).isRequired,
};

export default WatchBlock;
