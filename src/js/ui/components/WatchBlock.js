// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { realtimeUpdate, toWorker } from "../util";

type Props = {
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
        // This assumes that the view is listening for playerMovement or watchList, otherwise it'll send the same old (wrong) prop
        if (nextProps.watch !== this.state.watch) {
console.log('componentWillReceiveProps setstate', nextProps.watch);
            this.setState({
                watch: nextProps.watch,
            });
        }
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return (
            this.props.pid !== nextProps.pid ||
            this.state.watch !== nextState.watch
        );
    }

    async handleClick(e: SyntheticEvent<>) {
        e.preventDefault();

        const watch = !this.state.watch;
console.log('handleClick setstate', watch);
        this.setState({
            watch,
        });

        await toWorker("updatePlayerWatch", this.props.pid, watch);
        realtimeUpdate(["playerMovement", "watchList"]);
    }

    render() {
        // For Firefox's Object.watch
        if (typeof this.props.watch === "function") {
            return null;
        }

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
    pid: PropTypes.number.isRequired,
    watch: PropTypes.bool.isRequired,
};

export default WatchBlock;
