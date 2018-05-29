// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { Dropdown, JumpTo, NewWindowLink, PlayoffMatchup } from "../components";
import { setTitle } from "../util";

const Playoffs = ({
    confNames,
    finalMatchups,
    matchups,
    numPlayoffRounds,
    season,
    series,
    userTid,
}: {
    confNames: string[],
    finalMatchups: boolean,
    matchups: {
        matchup: [number, number],
        rowspan: number,
    }[][],
    numPlayoffRounds: number,
    season: number,
    series: {
        cid: number,
        seed: number,
        tid: number,
        winp: number,
        won?: number,
    },
    userTid: number,
}) => {
    setTitle(`Playoffs - ${season}`);

    return (
        <div>
            <Dropdown view="playoffs" fields={["seasons"]} values={[season]} />
            <JumpTo season={season} />
            <h1>
                Playoffs <NewWindowLink />
            </h1>

            {!finalMatchups ? (
                <p>
                    This is what the playoff matchups would be if the season
                    ended right now.
                </p>
            ) : null}

            {confNames.length === 2 ? (
                <h3 className="hidden-xs">
                    {confNames[1]}{" "}
                    <span className="pull-right">{confNames[0]}</span>
                </h3>
            ) : null}

            <div className="table-responsive">
                <table className="table-condensed" width="100%">
                    <tbody>
                        {matchups.map((row, i) => (
                            <tr key={i}>
                                {row.map((m, j) => {
                                    return (
                                        <td
                                            key={j}
                                            rowSpan={m.rowspan}
                                            width={`${100 /
                                                (numPlayoffRounds * 2 - 1)}%`}
                                        >
                                            <PlayoffMatchup
                                                season={season}
                                                series={
                                                    series[m.matchup[0]][
                                                        m.matchup[1]
                                                    ]
                                                }
                                                userTid={userTid}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Playoffs.propTypes = {
    confNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    finalMatchups: PropTypes.bool.isRequired,
    matchups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    numPlayoffRounds: PropTypes.number.isRequired,
    season: PropTypes.number.isRequired,
    series: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
    userTid: PropTypes.number.isRequired,
};

export default Playoffs;
