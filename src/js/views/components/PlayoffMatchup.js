// @flow

import React from 'react';
import g from '../../globals';
import * as helpers from '../../util/helpers';

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

    const homeImg = `${awayWon && "losing-team" || ""}`;
    const awayImg = `${homeWon && "losing-team" || ""}`;

    return <div>
        {series.home.imgURL && series.away.imgURL &&
            <span>
                <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.home.tid], season])}>
                    <div className="playoff-matchup-logo">
                        <img className={homeImg} src={series.home.imgURL} alt="" />
                    </div>
                </a> vs <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.away.tid], season])}>
                    <div className="playoff-matchup-logo">
                        <img className={awayImg} src={series.away.imgURL} alt="" />
                    </div>
                </a>
                <br />
            </span>}

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
