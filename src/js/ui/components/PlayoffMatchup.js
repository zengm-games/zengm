// @flow

import React from 'react';
import {g, helpers} from '../../common';

type SeriesTeam = {
    seed: number,
    tid: number,
    won?: number,
};

const PlayoffMatchup = ({season, series}: {
    season: number,
    series?: {
        away: SeriesTeam,
        home: SeriesTeam,
    },
}) => {
    if (series === undefined || series.home === undefined || series.home.tid === undefined) {
        return null;
    }

    const homeWon = series.home.hasOwnProperty("won") && series.home.won === 4;
    const awayWon = series.away.hasOwnProperty("won") && series.away.won === 4;

    return <div>
        <span className={series.home.tid === g.userTid ? 'bg-info' : ''} style={{fontWeight: homeWon ? 'bold' : 'normal'}}>
            {series.home.seed}. <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.home.tid], season])}>{g.teamRegionsCache[series.home.tid]}</a>
            {series.home.hasOwnProperty("won") ? <span> {series.home.won}</span> : null }
        </span>
        <br />

        <span className={series.away.tid === g.userTid ? 'bg-info' : ''} style={{fontWeight: awayWon ? 'bold' : 'normal'}}>
            {series.away.seed}. <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.away.tid], season])}>{g.teamRegionsCache[series.away.tid]}</a>
            {series.away.hasOwnProperty("won") ? <span> {series.away.won}</span> : null }
        </span>
    </div>;
};

PlayoffMatchup.propTypes = {
    season: React.PropTypes.number.isRequired,
    series: React.PropTypes.shape({
        away: React.PropTypes.shape({
            seed: React.PropTypes.number.isRequired,
            tid: React.PropTypes.number.isRequired,
            won: React.PropTypes.number,
        }),
        home: React.PropTypes.shape({
            seed: React.PropTypes.number.isRequired,
            tid: React.PropTypes.number.isRequired,
            won: React.PropTypes.number,
        }),
    }),
};

export default PlayoffMatchup;
