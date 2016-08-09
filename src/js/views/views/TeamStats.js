const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, JumpTo, NewWindowLink} = require('../components/index');

const TeamStats = ({season, teams = []}) => {
    if (season === undefined) {
        bbgmViewReact.title('Team Stats');
    } else {
        bbgmViewReact.title(`Team Stats - ${season}`);
    }

    const superCols = [{
        title: '',
        colspan: 4,
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
        colspan: 9,
    }];

    const cols = getCols('Team', 'GP', 'W', 'L', 'M', 'A', '%', 'M', 'A', '%', 'M', 'A', '%', 'Off', 'Def', 'Tot', 'Ast', 'TO', 'Stl', 'Blk', 'BA', 'PF', 'Pts', 'OPts', 'Diff');

    const rows = teams.map(t => {
        return {
            key: t.tid,
            data: [
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.abbrev}</a>,
                t.gp,
                t.won,
                t.lost,
                helpers.round(t.fg, 1),
                helpers.round(t.fga, 1),
                helpers.round(t.fgp, 1),
                helpers.round(t.tp, 1),
                helpers.round(t.tpa, 1),
                helpers.round(t.tpp, 1),
                helpers.round(t.ft, 1),
                helpers.round(t.fta, 1),
                helpers.round(t.ftp, 1),
                helpers.round(t.orb, 1),
                helpers.round(t.drb, 1),
                helpers.round(t.trb, 1),
                helpers.round(t.ast, 1),
                helpers.round(t.tov, 1),
                helpers.round(t.stl, 1),
                helpers.round(t.blk, 1),
                helpers.round(t.ba, 1),
                helpers.round(t.pf, 1),
                helpers.round(t.pts, 1),
                helpers.round(t.oppPts, 1),
                <span className={t.diff > 0 ? 'text-success' : 'text-danger'}>{helpers.round(t.diff, 1)}</span>,
            ],
            classNames: {
                info: t.tid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="team_stats" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Team Stats <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['team_shot_locations', season])}>Shot Locations</a> | <a href={helpers.leagueUrl(['team_stat_dists', season])}>Stat Distributions</a></p>

        <DataTable
            cols={cols}
            defaultSort={[2, 'desc']}
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

module.exports = TeamStats;
