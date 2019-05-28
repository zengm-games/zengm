// @flow

import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../util";

const RecordAndPlayoffs = ({
    abbrev,
    lost,
    numConfs,
    numPlayoffRounds,
    option,
    playoffRoundsWon,
    season,
    style,
    tied,
    won,
}: {
    abbrev: string,
    lost: number,
    numConfs?: number,
    numPlayoffRounds?: number,
    option?: "noSeason",
    playoffRoundsWon?: number,
    season: number,
    style: { [key: string]: string },
    tied?: number,
    won: number,
}) => {
    const seasonText =
        option !== "noSeason" ? (
            <span>
                <a href={helpers.leagueUrl(["roster", abbrev, season])}>
                    {season}
                </a>
                :{" "}
            </span>
        ) : null;

    let record = `${won}-${lost}`;
    if (typeof tied === "number" && !Number.isNaN(tied)) {
        record += `-${tied}`;
    }
    const recordText = (
        <a href={helpers.leagueUrl(["standings", season])}>{record}</a>
    );

    const extraText =
        numConfs !== undefined &&
        numPlayoffRounds !== undefined &&
        playoffRoundsWon !== undefined &&
        playoffRoundsWon >= 0 ? (
            <span>
                ,{" "}
                <a href={helpers.leagueUrl(["playoffs", season])}>
                    {helpers
                        .roundsWonText(
                            playoffRoundsWon,
                            numPlayoffRounds,
                            numConfs,
                        )
                        .toLowerCase()}
                </a>
            </span>
        ) : null;

    return (
        <span style={style}>
            {seasonText}
            {recordText}
            {extraText}
        </span>
    );
};

RecordAndPlayoffs.propTypes = {
    abbrev: PropTypes.string.isRequired,
    lost: PropTypes.number.isRequired,
    numConfs: PropTypes.number,
    numPlayoffRounds: PropTypes.number,
    option: PropTypes.oneOf(["noSeason"]),
    playoffRoundsWon: PropTypes.number,
    season: PropTypes.number.isRequired,
    style: PropTypes.object,
    tied: PropTypes.number,
    won: PropTypes.number.isRequired,
};

export default RecordAndPlayoffs;
