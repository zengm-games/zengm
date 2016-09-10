const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, JumpTo, NewWindowLink, PlayerNameLabels} = require('../components');

const PlayerStats = ({abbrev, players, playoffs, season, statType}) => {
    const label = season !== undefined && season !== null ? season : 'Career Totals';
    bbgmViewReact.title(`Player Stats - ${label}`);

    const superCols = [{
        title: '',
        colspan: 6,
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
        colspan: 10,
    }];

    const cols = getCols('Name', 'Pos', 'Team', 'GP', 'GS', 'Min', 'M', 'A', '%', 'M', 'A', '%', 'M', 'A', '%', 'Off', 'Def', 'Tot', 'Ast', 'TO', 'Stl', 'Blk', 'BA', 'PF', 'Pts', '+/-', 'PER', 'EWA');

    // Number of decimals for many stats
    const d = statType === "totals" ? 0 : 1;

    const rows = players.map(p => {
        let pos;
        if (p.ratings.constructor === Array) {
            pos = p.ratings[p.ratings.length - 1].pos;
        } else if (p.ratings.pos) {
            pos = p.ratings.pos;
        } else {
            pos = "?";
        }

        // HACKS to show right stats, info
        let actualAbbrev;
        let actualTid;
        if (season === null) {
            p.stats = p.careerStats;
            actualAbbrev = helpers.getAbbrev(p.tid);
            actualTid = p.tid;
            if (playoffs === "playoffs") {
                p.stats = p.careerStatsPlayoffs;
            }
        } else {
            actualAbbrev = p.stats.abbrev;
            actualTid = p.stats.tid;
            if (playoffs === "playoffs") {
                p.stats = p.statsPlayoffs;
            }
        }

        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >{p.name}</PlayerNameLabels>,
                pos,
                <a href={helpers.leagueUrl(["roster", actualAbbrev, season])}>{actualAbbrev}</a>,
                p.stats.gp,
                p.stats.gs,
                helpers.round(p.stats.min, d),
                helpers.round(p.stats.fg, d),
                helpers.round(p.stats.fga, d),
                helpers.round(p.stats.fgp, 1),
                helpers.round(p.stats.tp, d),
                helpers.round(p.stats.tpa, d),
                helpers.round(p.stats.tpp, 1),
                helpers.round(p.stats.ft, d),
                helpers.round(p.stats.fta, d),
                helpers.round(p.stats.ftp, 1),
                helpers.round(p.stats.orb, d),
                helpers.round(p.stats.drb, d),
                helpers.round(p.stats.trb, d),
                helpers.round(p.stats.ast, d),
                helpers.round(p.stats.tov, d),
                helpers.round(p.stats.stl, d),
                helpers.round(p.stats.blk, d),
                helpers.round(p.stats.ba, d),
                helpers.round(p.stats.pf, d),
                helpers.round(p.stats.pts, d),
                helpers.plusMinus(p.stats.pm, d),
                helpers.round(p.stats.per, 1),
                helpers.round(p.stats.ewa, 1),
            ],
            classNames: {
                danger: p.hof,
                info: actualTid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="player_stats" fields={["teamsAndAllWatch", "seasonsAndCareer", "statTypes", "playoffs"]} values={[abbrev, season === null ? 'career' : season, statType, playoffs]} />
        <JumpTo season={season} />
        <h1>Player Stats <NewWindowLink /></h1>
        <p>More: <a href={helpers.leagueUrl(['player_shot_locations', season])}>Shot Locations</a> | <a href={helpers.leagueUrl(['player_stat_dists', season])}>Stat Distributions</a></p>

        <p>Players on your team are <span className="text-info">highlighted in blue</span>. Players in the Hall of Fame are <span className="text-danger">highlighted in red</span>. Only players averaging more than 5 minutes per game are shown.</p>

        <DataTable
            cols={cols}
            defaultSort={[27, 'desc']}
            rows={rows}
            pagination
            superCols={superCols}
        />
    </div>;
};

PlayerStats.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    playoffs: React.PropTypes.oneOf(['playoffs', 'regular_season']).isRequired,
    season: React.PropTypes.oneOfType([
        React.PropTypes.number,
        React.PropTypes.string,
    ]).isRequired,
    statType: React.PropTypes.oneOf(['per_36', 'per_game', 'totals']).isRequired,
};

module.exports = PlayerStats;
