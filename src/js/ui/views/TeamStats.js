import React from 'react';
import _ from 'underscore';
import {g, helpers} from '../../common';
import {getCols, setTitle} from '../util';
import {DataTable, Dropdown, JumpTo, NewWindowLink} from '../components';

const TeamStats = ({season, stats, teams}) => {
    setTitle(`Team Stats - ${season}`);

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

    const teamCount = teams.length;
    const rows = teams.map((t) => {
        const statTypeColumns = ['fg', 'fga', 'fgp', 'tp', 'tpa', 'tpp', 'ft', 'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts', 'oppPts', 'diff'];
        const otherStatColumns = ['won', 'lost'];

        // Create the cells for this row.
        const data = {
            abbrev: <a href={helpers.leagueUrl(["roster", t.abbrev, season])}>{t.abbrev}</a>,
            gp: t.stats.gp,
            won: t.seasonAttrs.won,
            lost: t.seasonAttrs.lost,
        };

        for (const statType of statTypeColumns) {
            const value = t.stats.hasOwnProperty(statType) ? t.stats[statType] : t.seasonAttrs[statType];
            data[statType] = value.toFixed(1);
        }

        data.diff = <span className={t.stats.diff > 0 ? 'text-success' : 'text-danger'}>{t.stats.diff.toFixed(1)}</span>;

        // This is our team.
        if (g.userTid === t.tid) {
            // Color stat values accordingly.
            for (const [statType, value] of _.pairs(data)) {
                if (!statTypeColumns.includes(statType) && !otherStatColumns.includes(statType)) {
                    continue;
                }

                // Determine our team's percentile for this stat type. Closer to the start is better.
                const statTypeValue = t.stats.hasOwnProperty(statType) ? t.stats[statType] : t.seasonAttrs[statType];
                const percentile = 1 - (stats[statType].indexOf(statTypeValue) / (teamCount - 1));

                let className;
                if (percentile >= 2 / 3) {
                    className = 'success';
                } else if (percentile >= 1 / 3) {
                    className = 'warning';
                } else {
                    className = 'danger';
                }

                data[statType] = {
                    classNames: className,
                    value,
                };
            }

            return {
                key: t.tid,
                data: _.values(data),
            };
        }

        return {
            key: t.tid,
            data: _.values(data),
        };
    });

    function legendSquare(className) {
        const styles = {
            bottom: '-2.5px',
            display: 'inline-block',
            height: '15px',
            margin: '0 2.5px 0 10px',
            position: 'relative',
            width: '15px',
        };

        return <span className={`bg-${className}`} style={styles} />;
    }

    return <div>
        <Dropdown view="team_stats" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Team Stats <NewWindowLink /></h1>

        <div className="row">
            <div className="col-sm-4">
                More: <a href={helpers.leagueUrl(['team_shot_locations', season])}>Shot Locations</a> | <a href={helpers.leagueUrl(['team_stat_dists', season])}>Stat Distributions</a>
            </div>
            <div className="col-sm-8 text-right">
                <p>For a statistical category, among all teams, your team is in the...</p>

                <p>
                    {legendSquare('success')} <strong>Top third</strong>
                    {legendSquare('warning')} <strong>Middle third</strong>
                    {legendSquare('danger')} <strong>Bottom third</strong>
                </p>
            </div>
        </div>

        <DataTable
            cols={cols}
            defaultSort={[2, 'desc']}
            name="TeamStats"
            rows={rows}
            superCols={superCols}
        />
    </div>;
};

TeamStats.propTypes = {
    season: React.PropTypes.number.isRequired,
    stats: React.PropTypes.object.isRequired,
    teams: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
};

export default TeamStats;
