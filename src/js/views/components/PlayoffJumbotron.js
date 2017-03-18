// @flow
import React from 'react';
import g from '../../globals';
import * as helpers from '../../util/helpers';

const PlayoffJumbotron = ({season, playoffRound, west, east}) => {
    return <div className="jumbotron text-center">
        <h2>{season} {playoffRound}</h2>
        <div className="row">
            <div className="col-xs-5">
                <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[west.tid], season])}>
                    <img className={east.won === 4 && "losing-team"} src={west.imgURL} height="80" alt="" />
                </a>
                <h3 className={g.userTid === west.tid && "bg-info"}>{g.teamRegionsCache[west.tid]} {g.teamNamesCache[west.tid]} ({west.seed})</h3>
                <h1>{west.won}</h1>
            </div>
            <div className="col-xs-2">
                <h1>VS</h1>
            </div>
            <div className="col-xs-5">
                <a href={helpers.leagueUrl(["roster", g.teamAbbrevsCache[east.tid], season])}>
                    <img className={west.won === 4 && "losing-team"} src={east.imgURL} height="80" alt="" />
                </a>
                <h3 className={g.userTid === east.tid && "bg-info"}>{g.teamRegionsCache[east.tid]} {g.teamNamesCache[east.tid]} ({east.seed}) </h3>
                <h1>{east.won}</h1>
            </div>
        </div>
    </div>;
};
PlayoffJumbotron.propTypes = {
    season: React.PropTypes.number,
    playoffRound: React.PropTypes.any,
    east: React.PropTypes.object,
    west: React.PropTypes.object,
};

export default PlayoffJumbotron;
