// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import WatchBlock from "./WatchBlock";
import { helpers, overrides, toWorker } from "../util";

type Props = {
    pid: number,
    watch?: boolean,
};

type State = {
    name: string | void,
    popoverOpen: boolean,
    ratings: {
        pos: string,
        ovr: number,
        pot: number,
        hgt: number,
        stre: number,
        spd: number,
        endu: number,
        [key: string]: number,
    } | void,
    stats: {
        [key: string]: number,
    } | void,
    pid: number,
    loadDataStarted: boolean,
};

let count = 0;

class RatingsStatsPopover extends React.Component<Props, State> {
    count: number;

    loadData: () => Promise<void>;

    toggle: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            name: undefined,
            ratings: undefined,
            stats: undefined,
            popoverOpen: false,
            pid: props.pid,
            loadDataStarted: false,
        };

        this.loadData = this.loadData.bind(this);
        this.toggle = this.toggle.bind(this);

        this.count = count;
        count += 1;
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (prevState.pid !== nextProps.pid) {
            return {
                pid: nextProps.pid,
                loadDataStarted: false,
            };
        }

        return null;
    }

    async loadData() {
        const p = await toWorker("ratingsStatsPopoverInfo", this.props.pid);

        this.setState({
            name: p.name,
            ratings: p.ratings,
            stats: p.stats,
        });
    }

    toggle() {
        this.setState(state => {
            if (!state.popoverOpen && !state.loadDataStarted) {
                this.loadData();
            }

            return {
                loadDataStarted: true,
                popoverOpen: !state.popoverOpen,
            };
        });
    }

    render() {
        const { name, ratings, stats } = this.state;

        let nameBlock;
        if (name) {
            // Explicit boolean check is for Firefox 57 and older
            nameBlock = (
                <p className="mb-2">
                    <a href={helpers.leagueUrl(["player", this.props.pid])}>
                        <b>{name}</b>
                    </a>
                    {ratings !== undefined ? `, ${ratings.pos}` : null}
                    {typeof this.props.watch === "boolean" ? (
                        <WatchBlock
                            pid={this.props.pid}
                            watch={this.props.watch}
                        />
                    ) : null}
                </p>
            );
        } else {
            nameBlock = <p className="mb-2" />;
        }

        return (
            <>
                <span
                    className={classNames("glyphicon glyphicon-stats watch", {
                        "watch-active": this.props.watch === true, // Explicit true check is for Firefox 57 and older
                    })}
                    id={`ratings-pop-${this.count}`}
                    onClick={this.toggle}
                    data-no-row-highlight="true"
                    title="View ratings and stats"
                />
                <Popover
                    placement="right"
                    isOpen={this.state.popoverOpen}
                    target={`ratings-pop-${this.count}`}
                    toggle={this.toggle}
                >
                    <PopoverBody>
                        <div
                            className="text-nowrap"
                            style={{
                                minWidth: 250,
                                minHeight: 225,
                            }}
                        >
                            {nameBlock}
                            <overrides.components.RatingsStats
                                ratings={ratings}
                                stats={stats}
                            />
                        </div>
                    </PopoverBody>
                </Popover>
            </>
        );
    }
}

RatingsStatsPopover.propTypes = {
    pid: PropTypes.number.isRequired,
    watch: PropTypes.bool,
};

export default RatingsStatsPopover;
