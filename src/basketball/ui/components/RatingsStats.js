// @flow

import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../../deion/ui/util";

type Props = {
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
};

const RatingsStats = ({ ratings, stats }: Props) => {
    let ratingsBlock;
    if (ratings) {
        ratingsBlock = (
            <div className="row">
                <div className="col-4">
                    <b>Ratings</b>
                    <br />
                    <span className={helpers.colorRating(ratings.hgt)}>
                        Hgt: {ratings.hgt}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.stre)}>
                        Str: {ratings.stre}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.spd)}>
                        Spd: {ratings.spd}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.jmp)}>
                        Jmp: {ratings.jmp}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.endu)}>
                        End: {ratings.endu}
                    </span>
                </div>
                <div className="col-4">
                    <span className={helpers.colorRating(ratings.ovr)}>
                        Ovr: {ratings.ovr}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.ins)}>
                        Ins: {ratings.ins}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.dnk)}>
                        Dnk: {ratings.dnk}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.ft)}>
                        Ft: {ratings.ft}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.fg)}>
                        2Pt: {ratings.fg}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.tp)}>
                        3Pt: {ratings.tp}
                    </span>
                </div>
                <div className="col-4">
                    <span className={helpers.colorRating(ratings.pot)}>
                        Pot: {Math.round(ratings.pot)}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.oiq)}>
                        oIQ: {ratings.oiq}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.diq)}>
                        dIQ: {ratings.diq}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.drb)}>
                        Drb: {ratings.drb}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.pss)}>
                        Pss: {ratings.pss}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.reb)}>
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
            {ratingsBlock}
            {statsBlock}
        </>
    );
};

RatingsStats.propTypes = {
    ratings: PropTypes.object,
    stats: PropTypes.object,
};

export default RatingsStats;
