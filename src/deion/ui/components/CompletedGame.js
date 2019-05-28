// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../util";

const CompletedGame = ({
    abbrev,
    displayAbbrevs,
    gid,
    overtime,
    result,
    score,
    season,
    teams,
}: {
    abbrev: string,
    displayAbbrevs: boolean | void,
    gid: number,
    overtime: string,
    result: "W" | "L" | "T",
    score: string,
    season: number,
    teams: [
        { abbrev: string, region: string },
        { abbrev: string, region: string },
    ],
}) => {
    const classes = classNames("list-group-item", "schedule-row", {
        "list-group-item-success": result === "W",
        "list-group-item-danger": result === "L",
        "list-group-item-warning": result === "T",
    });
    return (
        <li className={classes}>
            <div className="schedule-wl">{result}</div>
            <div className="schedule-score">
                <a href={helpers.leagueUrl(["game_log", abbrev, season, gid])}>
                    {score}
                    {overtime}
                </a>
            </div>
            <div>
                <a href={helpers.leagueUrl(["roster", teams[0].abbrev])}>
                    {displayAbbrevs ? teams[0].abbrev : teams[0].region}
                </a>
                <span className="schedule-at"> @ </span>
                <a href={helpers.leagueUrl(["roster", teams[1].abbrev])}>
                    {displayAbbrevs ? teams[1].abbrev : teams[1].region}
                </a>
            </div>
        </li>
    );
};

CompletedGame.propTypes = {
    abbrev: PropTypes.string.isRequired,
    displayAbbrevs: PropTypes.bool,
    gid: PropTypes.number.isRequired,
    overtime: PropTypes.string.isRequired,
    result: PropTypes.oneOf(["W", "L", "T"]).isRequired,
    score: PropTypes.string.isRequired,
    season: PropTypes.number.isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
        }),
    ),
};

export default CompletedGame;
