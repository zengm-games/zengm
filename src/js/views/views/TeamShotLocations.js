const React = require('react');
const g = require('../../globals');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, Dropdown, NewWindowLink} = require('../components');

const TeamShotLocations = ({season, teams}) => {
    bbgmViewReact.title(`Team Shot Locations - ${season}`);

    const superCols = [{
        title: '',
        colspan: 4,
    }, {
        title: 'At Rim',
        colspan: 3,
    }, {
        title: 'Low Post',
        colspan: 3,
    }, {
        title: 'Mid-Range',
        colspan: 3,
    }, {
        title: '3PT',
        desc: 'Three-Pointers',
        colspan: 3,
    }];

    const cols = getCols('Team', 'GP', 'W', 'L', 'M', 'A', '%', 'M', 'A', '%', 'M', 'A', '%', 'M', 'A', '%');

    const rows = teams.map(t => {
        return {
            key: t.tid,
            data: [
                <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.abbrev}</a>,
                t.gp,
                t.won,
                t.lost,
                helpers.round(t.fgAtRim, 1),
                helpers.round(t.fgaAtRim, 1),
                helpers.round(t.fgpAtRim, 1),
                helpers.round(t.fgLowPost, 1),
                helpers.round(t.fgaLowPost, 1),
                helpers.round(t.fgpLowPost, 1),
                helpers.round(t.fgMidRange, 1),
                helpers.round(t.fgaMidRange, 1),
                helpers.round(t.fgpMidRange, 1),
                helpers.round(t.tp, 1),
                helpers.round(t.tpa, 1),
                helpers.round(t.tpp, 1),
            ],
            classNames: {
                info: t.tid === g.userTid,
            },
        };
    });

    return <div>
        <Dropdown view="team_shot_locations" fields={["seasons"]} values={[season]} />
        <h1>Team Shot Locations <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['team_stats', season])}>Main Stats</a> | <a href={helpers.leagueUrl(['team_stat_dists', season])}>Stat Distributions</a></p>

        <DataTable
            cols={cols}
            defaultSort={[2, 'desc']}
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

module.exports = TeamShotLocations;
