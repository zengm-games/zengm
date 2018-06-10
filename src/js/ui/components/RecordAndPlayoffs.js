// @flow

import PropTypes from "prop-types";
import * as React from "react";
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
    won: number,
}) => {
    const seasonText =
        option !== "noSeason" ? (
            <span>
                <a href={helpers.leagueUrl(["roster", abbrev, season])}>
                    {season}
                </a>:{" "}
            </span>
        ) : null;
    const recordText = (
        <a href={helpers.leagueUrl(["standings", season])}>
            {won}-{lost}
        </a>
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
    won: PropTypes.number.isRequired,
};

export default RecordAndPlayoffs;
