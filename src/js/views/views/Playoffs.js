// @flow

import React from 'react';
import g from '../../globals';
import * as helpers from '../../util/helpers';
import bbgmViewReact from '../../util/bbgmViewReact';
import {Dropdown, JumpTo, NewWindowLink, PlayoffMatchup, PlayoffJumbotron} from '../components';

const Playoffs = ({confNames, finalMatchups, matchups, numPlayoffRounds, season, series}: {
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
}) => {
    bbgmViewReact.title(`Playoffs - ${season}`);

    const displayChampions = () => {
        if (series.length === 4 && series[3].length > 0) {
            const finals = series[3][0];
            let winnerImg = null;
            let winnerTid = null;

            if (finals.away.won === 4) {
                winnerImg = finals.away.imgURL;
                winnerTid = finals.away.tid;
            }
            if (finals.home.won === 4) {
                winnerImg = finals.home.imgURL;
                winnerTid = finals.home.tid;
            }

            if (winnerImg) {
                return <div className="jumbotron text-center">
                    <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[winnerTid], season])}>
                        <img height="80" src={winnerImg} alt="" />
                    </a>
                    <h2 className={g.userTid === winnerTid && "bg-info"}>{g.teamRegionsCache[winnerTid]} {g.teamNamesCache[winnerTid]}</h2>
                    <h1>{season} Champions</h1>
                </div>;
            }


            if (finals.away.imgURL && finals.home.imgURL) {
                let west = finals.home;
                let east = finals.away;
                if (finals.home.cid === 0) {
                    west = finals.away;
                    east = finals.home;
                }
                return <PlayoffJumbotron season={season} playoffRound="Finals" west={west} east={east} />;
            }
        }
    };

    const displayUserTeam = () => {
        // Display current series for user team, hide if finals and if the user team is out.

        let currentSeries = null;
        let currentRound = null;

        if (series.length === 4 && series[3].length > 0) {
            return; // Do not show this for finals.
        }

        for (const [index, playoffRound] of [...series].reverse().entries()) {
            if (index === 0) {
                continue;
            }
            for (const playoffSeries of playoffRound) {
                if (g.userTid === playoffSeries.home.tid || g.userTid === playoffSeries.away.tid) {
                    currentSeries = playoffSeries;
                    currentRound = index;
                    break;
                }
            }
            if (currentSeries) {
                break;
            }
        }

        if (currentSeries && currentSeries.home.imgURL && currentSeries.away.imgURL) {
            const west = currentSeries.home;
            const east = currentSeries.away;

            const playoffRoundNames = {
                1: "Conference Finals",
                2: "2nd Round",
                3: "1st Round",
            };

            return <PlayoffJumbotron season={season} playoffRound={playoffRoundNames[currentRound]} west={west} east={east} />;
        }
    };

    return <div>
        <Dropdown view="playoffs" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Playoffs <NewWindowLink /></h1>

        {!finalMatchups ? <p>This is what the playoff matchups would be if the season ended right now.</p> : null}

        {confNames.length === 2 ? <h3 className="hidden-xs">{confNames[1]} <span className="pull-right">{confNames[0]}</span></h3> : null}

        {finalMatchups && displayUserTeam()}
        {finalMatchups && displayChampions()}

        <div className="table-responsive">
            <table className="table-condensed" width="100%">
                <tbody>
                    {matchups.map((row, i) => <tr key={i}>
                        {row.map((m, j) => {
                            return <td key={j} rowSpan={m.rowspan} width={`${100 / (numPlayoffRounds * 2 - 1)}%`}>
                                <PlayoffMatchup
                                    season={season}
                                    series={series[m.matchup[0]][m.matchup[1]]}
                                />
                            </td>;
                        })}
                    </tr>)}
                </tbody>
            </table>
        </div>
    </div>;
};

Playoffs.propTypes = {
    confNames: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    finalMatchups: React.PropTypes.bool.isRequired,
    matchups: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.object)).isRequired,
    numPlayoffRounds: React.PropTypes.number.isRequired,
    season: React.PropTypes.number.isRequired,
    series: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.object)).isRequired,
};

export default Playoffs;
