// @flow

import classNames from "classnames";
import PropTypes from "prop-types";
import * as React from "react";
import { helpers } from "../util";

const CompletedGame = ({
    abbrev,
    displayAbbrevs,
    gid,
    overtime,
    score,
    season,
    teams,
    won,
}: {
    abbrev: string,
    displayAbbrevs: boolean | void,
    gid: number,
    overtime: string,
    score: string,
    season: number,
    teams: [
        { abbrev: string, region: string },
        { abbrev: string, region: string },
    ],
    won: boolean,
}) => {
    const classes = classNames("list-group-item", "schedule-row", {
        "list-group-item-success": won,
        "list-group-item-danger": !won,
    });
    return (
        <li className={classes}>
            <div className="schedule-results">
                <div className="schedule-wl">{won ? "W" : "L"}</div>
                <div className="schedule-score">
                    <a
                        href={helpers.leagueUrl([
                            "game_log",
                            abbrev,
                            season,
                            gid,
                        ])}
                    >
                        {score}
                        {overtime}
                    </a>
                </div>
            </div>
            <a href={helpers.leagueUrl(["roster", teams[0].abbrev])}>
                {displayAbbrevs ? teams[0].abbrev : teams[0].region}
            </a>
            <span className="schedule-at"> @ </span>
            <a href={helpers.leagueUrl(["roster", teams[1].abbrev])}>
                {displayAbbrevs ? teams[1].abbrev : teams[1].region}
            </a>
        </li>
    );
};

CompletedGame.propTypes = {
    abbrev: PropTypes.string.isRequired,
    displayAbbrevs: PropTypes.bool,
    gid: PropTypes.number.isRequired,
    overtime: PropTypes.string.isRequired,
    score: PropTypes.string.isRequired,
    season: PropTypes.number.isRequired,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
        }),
    ),
    won: PropTypes.bool.isRequired,
};

export default CompletedGame;
