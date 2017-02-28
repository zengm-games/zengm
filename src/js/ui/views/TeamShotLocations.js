import React from 'react';
import {g} from '../../common';
import {getCols, setTitle} from '../util';
import * as helpers from '../../util/helpers';
import {DataTable, Dropdown, NewWindowLink} from '../components';

const TeamShotLocations = ({season, teams}) => {
    setTitle(`Team Shot Locations - ${season}`);

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
                t.stats.gp,
                t.seasonAttrs.won,
                t.seasonAttrs.lost,
                t.stats.fgAtRim.toFixed(1),
                t.stats.fgaAtRim.toFixed(1),
                t.stats.fgpAtRim.toFixed(1),
                t.stats.fgLowPost.toFixed(1),
                t.stats.fgaLowPost.toFixed(1),
                t.stats.fgpLowPost.toFixed(1),
                t.stats.fgMidRange.toFixed(1),
                t.stats.fgaMidRange.toFixed(1),
                t.stats.fgpMidRange.toFixed(1),
                t.stats.tp.toFixed(1),
                t.stats.tpa.toFixed(1),
                t.stats.tpp.toFixed(1),
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
            name="TeamShotLocations"
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

TeamShotLocations.propTypes = {
    season: React.PropTypes.number.isRequired,
    teams: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default TeamShotLocations;
