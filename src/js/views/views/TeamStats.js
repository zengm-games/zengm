const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, JumpTo, NewWindowLink} = require('../components/index');

const TeamStats = ({season, stats, teams = []}) => {
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
        const statTypeColumns = ['fg', 'fga', 'fgp', 'tp', 'tpa', 'tpp', 'ft', 'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts', 'oppPts'];

        // Create the cells for this row.
        const data = [
            <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.abbrev}</a>,
            t.gp, t.won, t.lost
        ];

        for (const column of statTypeColumns) {
            data.push(helpers.round(t[column], 1));
        }

        data.push(<span className={t.diff > 0 ? 'text-success' : 'text-danger'}>{helpers.round(t.diff, 1)}</span>);

        // This is our team.
        if (g.userTid === t.tid) {
            return {
                key: t.tid,
                data,
            };
        } else {
            return {
                key: t.tid,
                data,
            };
        }
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
