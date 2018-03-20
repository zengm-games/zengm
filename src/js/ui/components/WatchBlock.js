// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { toWorker } from "../util";

type Props = {
    onUpdatePlayerWatch: Function | void,
    pid: number,
    watch: boolean,
};

type State = {
    watch: boolean,
};

class WatchBlock extends React.Component<Props, State> {
    handleClick: Event => void;

    constructor(props: Props) {
        super(props);

        // Keep in state so it can update instantly on click, rather than waiting for round trip
        this.state = {
            watch: props.watch,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentWillReceiveProps(nextProps: Props) {
        // This assumes that the parent is correctly getting values from the database, not passing in cached ones
        if (nextProps.watch !== this.state.watch) {
            this.setState({
                watch: nextProps.watch,
            });
        }
    }

    async handleClick(e: SyntheticEvent<>) {
        e.preventDefault();

        // This means is not responsive to global state, just local state. That should be fine. Fix eventually.
        const watch = !this.state.watch;
        this.setState({
            watch,
        });

        await toWorker("updatePlayerWatch", this.props.pid, watch);
        if (this.props.onUpdatePlayerWatch) {
            this.props.onUpdatePlayerWatch();
        }
    }

    render() {
        if (this.state.watch) {
            return (
                <a
                    className="glyphicon glyphicon-flag watch watch-active"
                    onClick={this.handleClick}
                    title="Remove from Watch List"
                />
            );
        }

        return (
            <a
                className="glyphicon glyphicon-flag watch"
                onClick={this.handleClick}
                title="Add to Watch List"
            />
        );
    }
}

WatchBlock.propTypes = {
    onUpdatePlayerWatch: PropTypes.func,
    pid: PropTypes.number.isRequired,
    watch: PropTypes.bool.isRequired,
};

export default WatchBlock;
