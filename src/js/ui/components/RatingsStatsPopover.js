// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Popover from "react-bootstrap/lib/Popover";
import { helpers } from "../../common";
import WatchBlock from "./WatchBlock";
import { toWorker } from "../util";

const colorRating = (rating: number) => {
    const classes = ["text-danger", "text-warning", null, "text-success"];
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
    ratings: {
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
    loadData: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            name: undefined,
            ratings: undefined,
            stats: undefined,
        };

        this.loadData = this.loadData.bind(this);
    }

    async loadData() {
        const p = await toWorker("ratingsStatsPopoverInfo", this.props.pid);

        this.setState({
            name: p.name,
            ratings: p.ratings,
            stats: p.stats,
        });
    }

    render() {
        const { name, ratings, stats } = this.state;

        let nameBlock;
        if (name) {
            nameBlock = (
                <p>
                    <a href={helpers.leagueUrl(["player", this.props.pid])}>
                        <b>{name}</b>
                    </a>
                    {this.props.watch !== undefined ? (
                        <WatchBlock
                            pid={this.props.pid}
                            watch={this.props.watch}
                        />
                    ) : null}
                </p>
            );
        } else {
            nameBlock = <p />;
        }

        let ratingsBlock;
        if (ratings) {
            ratingsBlock = (
                <div className="row">
                    <div className="col-xs-4">
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
                    <div className="col-xs-4">
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
                    <div className="col-xs-4">
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
                    <div className="col-xs-12">
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
                <div className="row" style={{ marginTop: "1em" }}>
                    <div className="col-xs-4">
                        <b>Stats</b>
                        <br />
                        Pts: {stats.pts.toFixed(1)}
                        <br />
                        Reb: {stats.trb.toFixed(1)}
                        <br />
                        Ast: {stats.ast.toFixed(1)}
                    </div>
                    <div className="col-xs-4">
                        <br />
                        Blk: {stats.blk.toFixed(1)}
                        <br />
                        Stl: {stats.stl.toFixed(1)}
                        <br />
                        TO: {stats.tov.toFixed(1)}
                    </div>
                    <div className="col-xs-4">
                        <br />
                        Min: {stats.min.toFixed(1)}
                        <br />
                        PER: {stats.per.toFixed(1)}
                        <br />
                        EWA: {stats.ewa.toFixed(1)}
                    </div>
                </div>
            );
        } else {
            statsBlock = (
                <div className="row" style={{ marginTop: "1em" }}>
                    <div className="col-xs-12">
                        <b>Stats</b>
                        <br />
                        <br />
                        <br />
                        <br />
                    </div>
                </div>
            );
        }

        const popoverPlayerRatings = (
            <Popover id={`ratings-pop-${this.props.pid}`}>
                <div style={{ minWidth: "250px", whiteSpace: "nowrap" }}>
                    {nameBlock}
                    {ratingsBlock}
                    {statsBlock}
                </div>
            </Popover>
        );

        return (
            <OverlayTrigger
                onEnter={this.loadData}
                overlay={popoverPlayerRatings}
                placement="bottom"
                rootClose
                trigger="click"
            >
                <span
                    className={classNames("glyphicon glyphicon-stats watch", {
                        "watch-active": this.props.watch,
                    })}
                    data-no-row-highlight="true"
                    title="View ratings and stats"
                />
            </OverlayTrigger>
        );
    }
}

RatingsStatsPopover.propTypes = {
    pid: PropTypes.number.isRequired,
    watch: PropTypes.bool,
};

export default RatingsStatsPopover;
