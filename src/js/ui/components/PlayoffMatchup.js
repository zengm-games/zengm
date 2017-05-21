// @flow

import PropTypes from 'prop-types';
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
    season: PropTypes.number.isRequired,
    series: PropTypes.shape({
        away: PropTypes.shape({
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
        home: PropTypes.shape({
            seed: PropTypes.number.isRequired,
            tid: PropTypes.number.isRequired,
            won: PropTypes.number,
        }),
    }),
};

export default PlayoffMatchup;
