// @flow

import PropTypes from "prop-types";
import React from "react";
import posRatings from "../../common/posRatings";
import { getCols, helpers } from "../../../deion/ui/util";

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
        keyStats: string,
    } | void,
};

const RatingsStats = ({ ratings, stats }: Props) => {
    let ratingsBlock;
    if (ratings) {
        const extraRatings = posRatings(ratings.pos);
        const cols = getCols(...extraRatings.map(rating => `rating:${rating}`));

        ratingsBlock = (
            <div className="row">
                <div className="col-4">
                    <div className="font-weight-bold mb-1">Ratings</div>
                    <span className={helpers.colorRating(ratings.ovr)}>
                        <span title="Overall">Ovr</span>: {ratings.ovr}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.pot)}>
                        <span title="Potential">Pot</span>:{" "}
                        {Math.round(ratings.pot)}
                    </span>
                </div>
                <div className="col-4 mt-1">
                    <br />
                    <span className={helpers.colorRating(ratings.hgt)}>
                        <span title="Height">Hgt</span>: {ratings.hgt}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.stre)}>
                        <span title="Strength">Str</span>: {ratings.stre}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.spd)}>
                        <span title="Speed">Spd</span>: {ratings.spd}
                    </span>
                    <br />
                    <span className={helpers.colorRating(ratings.endu)}>
                        <span title="Endurance">End</span>: {ratings.endu}
                    </span>
                </div>
                <div className="col-4 mt-1">
                    {extraRatings.map((rating, i) => (
                        <React.Fragment key={rating}>
                            <br />
                            <span
                                className={helpers.colorRating(ratings[rating])}
                            >
                                <span title={cols[i].desc}>
                                    {cols[i].title}
                                </span>
                                : {ratings[rating]}
                            </span>
                        </React.Fragment>
                    ))}
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
                </div>
            </div>
        );
    }

    let statsBlock;
    if (stats && stats.keyStats !== "") {
        statsBlock = (
            <div
                style={{
                    whiteSpace: "normal",
                }}
            >
                <div className="font-weight-bold mb-1">Stats</div>
                {stats.keyStats}
            </div>
        );
    } else {
        statsBlock = null;
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
