// @flow

import PropTypes from "prop-types";
import React from "react";
import { toWorker } from "../util";

type Props = {
    pid: number,
    watch: boolean,
};

type State = {
    watch: boolean,
};

class WatchBlock extends React.Component<Props, State> {
    handleClick: (SyntheticEvent<>) => void;

    constructor(props: Props) {
        super(props);

        // Keep in state so it can update instantly on click, rather than waiting for round trip
        this.state = {
            watch: props.watch,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        // This assumes that the view is listening for playerMovement or watchList, otherwise it'll send the same old (wrong) prop
        if (nextProps.watch !== prevState.watch) {
            return {
                watch: nextProps.watch,
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return (
            this.props.pid !== nextProps.pid ||
            this.state.watch !== nextState.watch
        );
    }

    async handleClick(e: SyntheticEvent<>) {
        e.preventDefault();

        // This means is not responsive to global state, just local state. That should be fine. Fix eventually.
        this.setState(prevState => ({ watch: !prevState.watch }));

        await toWorker("updatePlayerWatch", this.props.pid, !this.state.watch);
    }

    render() {
        if (this.state.watch) {
            return (
                <span
                    className="glyphicon glyphicon-flag watch watch-active"
                    onClick={this.handleClick}
                    title="Remove from Watch List"
                />
            );
        }

        return (
            <span
                className="glyphicon glyphicon-flag watch"
                onClick={this.handleClick}
                title="Add to Watch List"
            />
        );
    }
}

WatchBlock.propTypes = {
    pid: PropTypes.number.isRequired,
    watch: PropTypes.bool.isRequired,
};

export default WatchBlock;
