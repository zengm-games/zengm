// @flow

import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../util";

type InputTeam = {
    abbrev: string,
    region: string,
    seasonAttrs?: { lost: number, won: number }, // Record only displayed when this is defined
};

const UpcomingGame = ({ teams }: { teams: [InputTeam, InputTeam] }) => {
    return (
        <li className="list-group-item schedule-row">
            <div>
                <a href={helpers.leagueUrl(["roster", teams[0].abbrev])}>
                    {teams[0].region}
                </a>
                {teams[0].seasonAttrs ? (
                    <span className="schedule-extra">
                        {" "}
                        ({teams[0].seasonAttrs.won}-{teams[0].seasonAttrs.lost})
                    </span>
                ) : null}
                <span className="schedule-at"> @ </span>
                <a href={helpers.leagueUrl(["roster", teams[1].abbrev])}>
                    {teams[1].region}
                </a>
                {teams[1].seasonAttrs ? (
                    <span className="schedule-extra">
                        {" "}
                        ({teams[1].seasonAttrs.won}-{teams[1].seasonAttrs.lost})
                    </span>
                ) : null}
            </div>
        </li>
    );
};

UpcomingGame.propTypes = {
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            abbrev: PropTypes.string.isRequired,
            region: PropTypes.string.isRequired,
            seasonAttrs: PropTypes.shape({
                lost: PropTypes.number.isRequired,
                won: PropTypes.number.isRequired,
            }),
        }),
    ),
};

export default UpcomingGame;
