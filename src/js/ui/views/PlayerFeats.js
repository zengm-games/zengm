import React from 'react';
import {g} from '../../common';
import {getCols, setTitle} from '../util';
import * as helpers from '../../util/helpers';
import {DataTable, Dropdown, NewWindowLink, PlayerNameLabels} from '../components';

const PlayerFeats = ({abbrev, feats, playoffs, season}) => {
    setTitle('Statistical Feats');

    const superCols = [{
        title: '',
        colspan: 5,
    }, {
        title: 'FG',
        desc: 'Field Goals',
        colspan: 3,
    }, {
        title: '3PT',
        desc: 'Three-Pointers',
        colspan: 3,
    }, {
        title: 'FT',
        desc: 'Free Throws',
        colspan: 3,
    }, {
        title: 'Reb',
        desc: 'Rebounds',
        colspan: 3,
    }, {
        title: '',
        colspan: 11,
    }];

    const cols = getCols('Name', 'Pos', 'Team', 'GS', 'Min', 'M', 'A', '%', 'M', 'A', '%', 'M', 'A', '%', 'Off', 'Def', 'Tot', 'Ast', 'TO', 'Stl', 'Blk', 'PF', 'Pts', 'GmSc', 'Opp', 'Result', 'Season');

    const rows = feats.map(p => {
        const rowAbbrev = g.teamAbbrevsCache[p.tid];
        const oppAbbrev = g.teamAbbrevsCache[p.oppTid];

        return {
            key: p.fid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    watch={p.watch}
                >{p.name}</PlayerNameLabels>,
                p.pos,
                <a href={helpers.leagueUrl(["roster", rowAbbrev, p.season])}>{rowAbbrev}</a>,
                p.stats.gs,
                p.stats.min.toFixed(1),
                p.stats.fg,
                p.stats.fga,
                p.stats.fgp.toFixed(1),
                p.stats.tp,
                p.stats.tpa,
                p.stats.tpp.toFixed(1),
                p.stats.ft,
                p.stats.fta,
                p.stats.ftp.toFixed(1),
                p.stats.orb,
                p.stats.drb,
                p.stats.trb,
                p.stats.ast,
                p.stats.tov,
                p.stats.stl,
                p.stats.blk,
                p.stats.pf,
                p.stats.pts,
                helpers.gameScore(p.stats),
                <a href={helpers.leagueUrl(["roster", oppAbbrev, p.season])}>{oppAbbrev}</a>,
                <a href={helpers.leagueUrl(["game_log", rowAbbrev, p.season, p.gid])}>{p.won ? 'W' : 'L'} {p.score}</a>,
                p.season,
            ],
            classNames: {
                info: p.pid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="player_feats" fields={["teamsAndAll", "seasonsAndAll", "playoffs"]} values={[abbrev, season, playoffs]} />
        <h1>Statistical Feats <NewWindowLink /></h1>

        <p>All games where a player got a triple double, a 5x5, 50 points, 25 rebounds, 20 assists, 10 steals, 10 blocks, or 10 threes are listed here (if you change game length in God Mode, the cuttoffs are scaled). Statistical feats from your players are <span className="text-info">highlighted in blue</span>.</p>

        <DataTable
            cols={cols}
            defaultSort={[23, 'desc']}
            name="PlayerFeats"
            rows={rows}
            pagination
            superCols={superCols}
        />
    </div>;
};

PlayerFeats.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    feats: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    playoffs: React.PropTypes.oneOf(['playoffs', 'regularSeason']).isRequired,
    season: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]).isRequired,
};

export default PlayerFeats;
