import React from 'react';
import {g} from '../../common';
import {getCols, setTitle} from '../util';
import * as helpers from '../../util/helpers';
import {DataTable, NewWindowLink} from '../components';

const PowerRankings = ({teams}) => {
    setTitle('Power Rankings');

    const cols = getCols('O', 'P', 'T', 'Team', 'W', 'L', 'L10', 'Diff');
    cols[3].width = '100%';

    const rows = teams.map(t => {
        const performanceRank = t.stats.gp > 0 ? t.performanceRank : "-";

        return {
            key: t.tid,
            data: [
                t.overallRank,
                performanceRank,
                t.talentRank,
                <a href={helpers.leagueUrl(["roster", t.abbrev])}>{t.region} {t.name}</a>,
                t.seasonAttrs.won,
                t.seasonAttrs.lost,
                t.seasonAttrs.lastTen,
                <span className={t.stats.diff > 0 ? 'text-success' : 'text-danger'}>{t.stats.diff.toFixed(1)}</span>,
            ],
            classNames: {
                info: t.tid === g.userTid,
            },
        };
    });

    return <div>
        <h1>Power Rankings <NewWindowLink /></h1>

        <p>The "Performance" rating is based on point differential and recent team performance. The "Talent" rating is based on player ratings and stats. The "Overall" rating is a combination of the two.</p>

        <DataTable
            cols={cols}
            defaultSort={[0, 'asc']}
            name="PowerRankings"
            rows={rows}
        />
    </div>;
};

PowerRankings.propTypes = {
    teams: React.PropTypes.arrayOf(React.PropTypes.shape({
        abbrev: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        overallRank: React.PropTypes.number.isRequired,
        performanceRank: React.PropTypes.number.isRequired,
        region: React.PropTypes.string.isRequired,
        tid: React.PropTypes.number.isRequired,
        seasonAttrs: React.PropTypes.shape({
            lastTen: React.PropTypes.string.isRequired,
            lost: React.PropTypes.number.isRequired,
            won: React.PropTypes.number.isRequired,
        }),
        stats: React.PropTypes.shape({
            diff: React.PropTypes.number.isRequired,
        }),
    })).isRequired,
};

export default PowerRankings;
