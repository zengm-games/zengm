// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import Popover from "reactstrap/lib/Popover";
import PopoverBody from "reactstrap/lib/PopoverBody";
import WatchBlock from "../../../deion/ui/components/WatchBlock";
import { helpers, toWorker } from "../../../deion/ui/util";

const colorRating = (rating: number) => {
    const classes = ["table-danger", "table-warning", null, "table-success"];
    const cutoffs = [30, 45, 60, Infinity];

    const ind = cutoffs.findIndex(cutoff => rating < cutoff);
    return classes[ind];
};

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
        jmp: number,
        endu: number,
        ins: number,
        dnk: number,
        ft: number,
        fg: number,
        tp: number,
        oiq: number,
        diq: number,
        drb: number,
        pss: number,
        reb: number,
    } | void,
    stats: {
        pts: number,
        trb: number,
        ast: number,
        blk: number,
        stl: number,
        tov: number,
        min: number,
        per: number,
        ewa: number,
    } | void,
};

class RatingsStatsPopover extends React.Component<Props, State> {
    loadData: () => Promise<void>;

    toggle: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            name: undefined,
            ratings: undefined,
            stats: undefined,
            popoverOpen: false,
        };

        this.loadData = this.loadData.bind(this);
        this.toggle = this.toggle.bind(this);
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
            if (!state.popoverOpen) {
                this.loadData();
            }

            return {
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

        let ratingsBlock;
        if (ratings) {
            ratingsBlock = (
                <div className="row">
                    <div className="col-4">
                        <b>Ratings</b>
                        <br />
                        <span className={colorRating(ratings.hgt)}>
                            Hgt: {ratings.hgt}
                        </span>
                        <br />
                        <span className={colorRating(ratings.stre)}>
                            Str: {ratings.stre}
                        </span>
                        <br />
                        <span className={colorRating(ratings.spd)}>
                            Spd: {ratings.spd}
                        </span>
                        <br />
                        <span className={colorRating(ratings.jmp)}>
                            Jmp: {ratings.jmp}
                        </span>
                        <br />
                        <span className={colorRating(ratings.endu)}>
                            End: {ratings.endu}
                        </span>
                    </div>
                    <div className="col-4">
                        <span className={colorRating(ratings.ovr)}>
                            Ovr: {ratings.ovr}
                        </span>
                        <br />
                        <span className={colorRating(ratings.ins)}>
                            Ins: {ratings.ins}
                        </span>
                        <br />
                        <span className={colorRating(ratings.dnk)}>
                            Dnk: {ratings.dnk}
                        </span>
                        <br />
                        <span className={colorRating(ratings.ft)}>
                            Ft: {ratings.ft}
                        </span>
                        <br />
                        <span className={colorRating(ratings.fg)}>
                            2Pt: {ratings.fg}
                        </span>
                        <br />
                        <span className={colorRating(ratings.tp)}>
                            3Pt: {ratings.tp}
                        </span>
                    </div>
                    <div className="col-4">
                        <span className={colorRating(ratings.pot)}>
                            Pot: {Math.round(ratings.pot)}
                        </span>
                        <br />
                        <span className={colorRating(ratings.oiq)}>
                            oIQ: {ratings.oiq}
                        </span>
                        <br />
                        <span className={colorRating(ratings.diq)}>
                            dIQ: {ratings.diq}
                        </span>
                        <br />
                        <span className={colorRating(ratings.drb)}>
                            Drb: {ratings.drb}
                        </span>
                        <br />
                        <span className={colorRating(ratings.pss)}>
                            Pss: {ratings.pss}
                        </span>
                        <br />
                        <span className={colorRating(ratings.reb)}>
                            Reb: {ratings.reb}
                        </span>
                    </div>
                </div>
            );
        } else {
            ratingsBlock = (
                <div className="row">
                    <div className="col-12">
                        <b>Ratings</b>
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                    </div>
                </div>
            );
        }

        let statsBlock;
        if (stats) {
            statsBlock = (
                <div className="row mt-2">
                    <div className="col-4">
                        <b>Stats</b>
                        <br />
                        PTS: {stats.pts.toFixed(1)}
                        <br />
                        TRB: {stats.trb.toFixed(1)}
                        <br />
                        AST: {stats.ast.toFixed(1)}
                    </div>
                    <div className="col-4">
                        <br />
                        BLK: {stats.blk.toFixed(1)}
                        <br />
                        STL: {stats.stl.toFixed(1)}
                        <br />
                        TO: {stats.tov.toFixed(1)}
                    </div>
                    <div className="col-4">
                        <br />
                        MP: {stats.min.toFixed(1)}
                        <br />
                        PER: {stats.per.toFixed(1)}
                        <br />
                        EWA: {stats.ewa.toFixed(1)}
                    </div>
                </div>
            );
        } else {
            statsBlock = (
                <div className="row mt-2">
                    <div className="col-12">
                        <b>Stats</b>
                        <br />
                        <br />
                        <br />
                        <br />
                    </div>
                </div>
            );
        }

        return (
            <>
                <span
                    className={classNames("glyphicon glyphicon-stats watch", {
                        "watch-active": this.props.watch === true, // Explicit true check is for Firefox 57 and older
                    })}
                    id={`ratings-pop-${this.props.pid}`}
                    onClick={this.toggle}
                    data-no-row-highlight="true"
                    title="View ratings and stats"
                />
                <Popover
                    placement="right"
                    isOpen={this.state.popoverOpen}
                    target={`ratings-pop-${this.props.pid}`}
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
                            {ratingsBlock}
                            {statsBlock}
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
